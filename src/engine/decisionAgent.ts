/**
 * Phase 4b: Decision Agent
 * Determines action (AUTO_RESOLVE vs. ESCALATE) based on safety, confidence, and urgency
 */

import { Action, ClassificationResult, Decision } from '../types';

export const SAFETY_KEYWORDS = new Set(['smoke', 'spark', 'fire', 'smell', 'hot']);

export interface DecisionConfig {
  autoResolveThreshold: number; // default 0.15
  highUrgencyThreshold: number; // default 0.30
}

export class DecisionAgent {
  private config: DecisionConfig;

  constructor(config: Partial<DecisionConfig> = {}) {
    this.config = {
      autoResolveThreshold: config.autoResolveThreshold ?? 0.15,
      highUrgencyThreshold: config.highUrgencyThreshold ?? 0.30,
    };
  }

  public setConfig(config: Partial<DecisionConfig>) {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): DecisionConfig {
    return { ...this.config };
  }

  public decide(retrievalConfidence: number, classification: ClassificationResult): Decision {
    const matchedSafety = classification.matched_urgency_keywords.filter((kw) =>
      SAFETY_KEYWORDS.has(kw.toLowerCase())
    );

    // Rule 1: Safety override
    if (classification.urgency === 'High' && matchedSafety.length > 0) {
      return {
        action: Action.ESCALATE_SAFETY,
        reason: `Safety-relevant keyword(s) detected: [${matchedSafety.join(', ')}]. Always route to a human regardless of answer confidence.`,
        requires_human: true,
      };
    }

    // Rule 2: Low confidence
    if (retrievalConfidence < this.config.autoResolveThreshold) {
      return {
        action: Action.ESCALATE_LOW_CONFIDENCE,
        reason: `Retrieval confidence ${(retrievalConfidence * 100).toFixed(1)}% is below threshold ${(
          this.config.autoResolveThreshold * 100
        ).toFixed(1)}%.`,
        requires_human: true,
      };
    }

    // Rule 3: High urgency stricter bar
    if (classification.urgency === 'High' && retrievalConfidence < this.config.highUrgencyThreshold) {
      return {
        action: Action.ESCALATE_HIGH_URGENCY,
        reason: `Urgency is High but confidence ${(retrievalConfidence * 100).toFixed(1)}% is below the stricter bar (${(
          this.config.highUrgencyThreshold * 100
        ).toFixed(1)}%) required for urgent auto-resolution.`,
        requires_human: true,
      };
    }

    // Rule 4: Auto-resolve
    return {
      action: Action.AUTO_RESOLVE,
      reason: `Confidence ${(retrievalConfidence * 100).toFixed(1)}% is sufficient and no safety/urgency override triggered.`,
      requires_human: false,
    };
  }
}

export const defaultDecisionAgent = new DecisionAgent();
