/**
 * Phase 2b: TF-IDF Embedder with L2 normalization
 * Faithfully mirrors sklearn TfidfVectorizer(max_features=2000, ngram_range=(1,2), stop_words='english')
 */

import { STOP_WORDS } from './textUtils';
import { PRECOMPUTED_CHUNKS } from '../data/kbData';
import { Category, KbChunk } from '../types';

export class TfidfEmbedder {
  private vocabulary: Map<string, number> = new Map();
  private idf: number[] = [];
  private chunkEmbeddings: number[][] = [];
  private chunks: KbChunk[] = [];
  private categoryCentroids: Map<Category, number[]> = new Map();

  constructor() {
    this.fitAndIndex(PRECOMPUTED_CHUNKS);
  }

  private tokenize(text: string): string[] {
    const clean = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const rawWords = clean.split(' ').filter((w) => w.length > 1 && !STOP_WORDS.has(w));
    const tokens: string[] = [];

    // unigrams
    for (let i = 0; i < rawWords.length; i++) {
      tokens.push(rawWords[i]);
    }

    // bigrams
    for (let i = 0; i < rawWords.length - 1; i++) {
      tokens.push(`${rawWords[i]} ${rawWords[i + 1]}`);
    }

    return tokens;
  }

  public fitAndIndex(chunks: KbChunk[]) {
    this.chunks = chunks;
    const docCount = chunks.length;
    const docFrequencies: Map<string, number> = new Map();

    // 1. Collect document frequencies
    const docTokensList = chunks.map((chunk) => {
      const tokens = this.tokenize(chunk.text);
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        docFrequencies.set(token, (docFrequencies.get(token) || 0) + 1);
      }
      return tokens;
    });

    // 2. Select top features (up to 2000) sorted by frequency
    const sortedFeatures = Array.from(docFrequencies.entries())
      .filter(([_, df]) => df >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2000);

    this.vocabulary.clear();
    sortedFeatures.forEach(([term], index) => {
      this.vocabulary.set(term, index);
    });

    // 3. Compute smooth IDF: ln((1 + N) / (1 + df)) + 1
    this.idf = new Array(this.vocabulary.size);
    for (const [term, idx] of this.vocabulary.entries()) {
      const df = docFrequencies.get(term) || 1;
      this.idf[idx] = Math.log((1 + docCount) / (1 + df)) + 1.0;
    }

    // 4. Compute chunk embeddings
    this.chunkEmbeddings = docTokensList.map((tokens) => this.embedTokens(tokens));

    // 5. Compute Category Centroids for nearest-centroid classification (Phase 4a)
    const categoryGroups = new Map<Category, number[][]>();
    for (let i = 0; i < chunks.length; i++) {
      const cat = chunks[i].category;
      if (!categoryGroups.has(cat)) {
        categoryGroups.set(cat, []);
      }
      categoryGroups.get(cat)!.push(this.chunkEmbeddings[i]);
    }

    this.categoryCentroids.clear();
    for (const [cat, vectors] of categoryGroups.entries()) {
      const dim = this.vocabulary.size;
      const sumVec = new Array(dim).fill(0);
      for (const vec of vectors) {
        for (let d = 0; d < dim; d++) {
          sumVec[d] += vec[d];
        }
      }
      // Average and L2 normalize
      const n = vectors.length;
      for (let d = 0; d < dim; d++) {
        sumVec[d] /= n;
      }
      this.categoryCentroids.set(cat, this.normalizeL2(sumVec));
    }
  }

  private embedTokens(tokens: string[]): number[] {
    const dim = this.vocabulary.size;
    const tf = new Array(dim).fill(0);

    for (const token of tokens) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        tf[idx] += 1;
      }
    }

    const tfidf = new Array(dim);
    for (let i = 0; i < dim; i++) {
      // Sublinear tf scaling: (1 + ln(tf)) * idf if tf > 0
      tfidf[i] = tf[i] > 0 ? (1 + Math.log(tf[i])) * this.idf[i] : 0;
    }

    return this.normalizeL2(tfidf);
  }

  public embed(text: string): number[] {
    const tokens = this.tokenize(text);
    return this.embedTokens(tokens);
  }

  public normalizeL2(vec: number[]): number[] {
    let sumSq = 0;
    for (let i = 0; i < vec.length; i++) {
      sumSq += vec[i] * vec[i];
    }
    const norm = Math.sqrt(sumSq);
    if (norm === 0) return vec.slice();
    return vec.map((v) => v / norm);
  }

  public dotProduct(v1: number[], v2: number[]): number {
    let dot = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
    }
    return dot;
  }

  public getChunks(): KbChunk[] {
    return this.chunks;
  }

  public getChunkEmbeddings(): number[][] {
    return this.chunkEmbeddings;
  }

  public getCategoryCentroids(): Map<Category, number[]> {
    return this.categoryCentroids;
  }

  public getVocabSize(): number {
    return this.vocabulary.size;
  }
}

export const defaultEmbedder = new TfidfEmbedder();
