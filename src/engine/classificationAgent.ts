/**
 * Classification Agent
 * IT Helpdesk RAG + Agent Architecture
 *
 * Implements dual-pipeline classification:
 * 1. Categorical Domain Prediction: Computes query TF-IDF vector and performs
 *    nearest-centroid cosine similarity against pre-computed category centroids.
 * 2. Urgency & Impact Detection: Auditable keyword-matching scanner to categorize
 *    High vs. Low vs. Medium ticket urgency.
 */

import { TfidfEmbedder, defaultEmbedder } from './embedder';
import { Category, ClassificationResult, Urgency } from '../types';

/**
 * Keyword signals indicating production outages, business blocks, or safety hazards
 */
export const HIGH_URGENCY_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'production', 'down', 'outage',
  'cannot work', "can't work", 'blocked', 'critical', 'security breach',
  'smoke', 'smell', 'hot', 'spark', 'fire', 'data loss', 'lost all',
];

/**
 * Keyword signals indicating informational inquiries with relaxed SLAs
 */
export const LOW_URGENCY_KEYWORDS = [
  'question', 'wondering', 'when convenient', 'no rush', 'just curious',
];

export class ClassificationAgent {
  private embedder: TfidfEmbedder;

  constructor(embedder: TfidfEmbedder = defaultEmbedder) {
    this.embedder = embedder;
  }

  /**
   * Predicts ticket category by measuring the dot product between the query vector
   * and the normalized centroid vector for each domain class.
   *
   * @param text - Cleaned and sanitized ticket prompt
   * @returns Best matching category and numerical similarity confidence [0, 1]
   */
  public classifyCategory(text: string): { category: Category; confidence: number } {
    const queryVec = this.embedder.embed(text);
    const centroids = this.embedder.getCategoryCentroids();

    let bestCategory: Category = 'Hardware';
    let bestSim = -1;

    // Evaluate dot product against each category centroid
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

  /**
   * Evaluates text for urgency indicators using deterministic substring matching.
   *
   * @param text - Ticket query text
   * @returns Urgency level ('High' | 'Medium' | 'Low') and list of matched keyword tokens
   */
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

    // Default SLA when no explicit signals are found
    return { urgency: 'Medium', matchedKeywords: [] };
  }

  /**
   * Combined entry point executing category prediction and urgency assessment.
   */
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

