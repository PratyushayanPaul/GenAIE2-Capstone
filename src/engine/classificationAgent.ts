/**
 * Phase 4a: Classification Agent
 * 1. Nearest-centroid category prediction over TF-IDF vectors
 * 2. Rule-based auditable urgency classification
 */

import { TfidfEmbedder, defaultEmbedder } from './embedder';
import { Category, ClassificationResult, Urgency } from '../types';

export const HIGH_URGENCY_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'production', 'down', 'outage',
  'cannot work', "can't work", 'blocked', 'critical', 'security breach',
  'smoke', 'smell', 'hot', 'spark', 'fire', 'data loss', 'lost all',
];

export const LOW_URGENCY_KEYWORDS = [
  'question', 'wondering', 'when convenient', 'no rush', 'just curious',
];

export class ClassificationAgent {
  private embedder: TfidfEmbedder;

  constructor(embedder: TfidfEmbedder = defaultEmbedder) {
    this.embedder = embedder;
  }

  public classifyCategory(text: string): { category: Category; confidence: number } {
    const queryVec = this.embedder.embed(text);
    const centroids = this.embedder.getCategoryCentroids();

    let bestCategory: Category = 'Hardware';
    let bestSim = -1;

    for (const [category, centroidVec] of centroids.entries()) {
      const sim = this.embedder.dotProduct(queryVec, centroidVec);
      if (sim > bestSim) {
        bestSim = sim;
        bestCategory = category;
      }
    }

    return {
      category: bestCategory,
      confidence: Math.max(0, Math.min(1, Number(bestSim.toFixed(4)))),
    };
  }

  public classifyUrgency(text: string): { urgency: Urgency; matchedKeywords: string[] } {
    const lower = text.toLowerCase();

    const matchedHigh = HIGH_URGENCY_KEYWORDS.filter((kw) => lower.includes(kw));
    if (matchedHigh.length > 0) {
      return { urgency: 'High', matchedKeywords: matchedHigh };
    }

    const matchedLow = LOW_URGENCY_KEYWORDS.filter((kw) => lower.includes(kw));
    if (matchedLow.length > 0) {
      return { urgency: 'Low', matchedKeywords: matchedLow };
    }

    return { urgency: 'Medium', matchedKeywords: [] };
  }

  public classify(text: string): ClassificationResult {
    const { category, confidence } = this.classifyCategory(text);
    const { urgency, matchedKeywords } = this.classifyUrgency(text);

    return {
      category,
      category_confidence: confidence,
      urgency,
      matched_urgency_keywords: matchedKeywords,
    };
  }
}

export const defaultClassifier = new ClassificationAgent();
