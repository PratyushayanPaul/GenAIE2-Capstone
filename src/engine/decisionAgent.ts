/**
 * Decision Policy Agent
 * IT Helpdesk RAG + Agent Architecture
 *
 * Implements deterministic policy evaluation based on:
 * 1. Physical safety hazards (strict zero-tolerance override)
 * 2. Vector retrieval similarity vs. minimum auto-resolution bar
 * 3. High-urgency threshold gating (stricter confidence required for urgent tickets)
 * 4. Human escalation vs. autonomous resolution routing
 */

import { Action, ClassificationResult, Decision } from '../types';

/**
 * High-risk physical keywords that prompt automatic safety escalation
 */
export const SAFETY_KEYWORDS = new Set(['smoke', 'spark', 'fire', 'smell', 'hot']);

/**
 * Configurable thresholds for policy decisions
 */
export interface DecisionConfig {
  /** Baseline confidence threshold required for auto-resolve (default: 0.15 / 15%) */
  autoResolveThreshold: number;
  /** Stricter confidence bar required when urgency is High (default: 0.30 / 30%) */
  highUrgencyThreshold: number;
}

export class DecisionAgent {
  private config: DecisionConfig;

  constructor(config: Partial<DecisionConfig> = {}) {
    this.config = {
      autoResolveThreshold: config.autoResolveThreshold ?? 0.15,
      highUrgencyThreshold: config.highUrgencyThreshold ?? 0.30,
    };
  }

  /**
   * Updates threshold configuration dynamically (e.g. from UI sliders)
   */
  public setConfig(config: Partial<DecisionConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Retrieves a copy of the current policy thresholds
   */
  public getConfig(): DecisionConfig {
    return { ...this.config };
  }

  /**
   * Evaluates a ticket's retrieval confidence and classification against routing policy rules.
   *
   * Policy Priority Order:
   * Rule 1: Physical Safety Hazard -> ESCALATE_SAFETY (Forces immediate dispatch, blocks AI resolution)
   * Rule 2: Low Confidence -> ESCALATE_LOW_CONFIDENCE (Similarity below base threshold)
   * Rule 3: High Urgency Gate -> ESCALATE_HIGH_URGENCY (High urgency but below strict urgency threshold)
   * Rule 4: Auto-Resolve Approved -> AUTO_RESOLVE (Clear grounded match without violations)
   *
   * @param retrievalConfidence - Top-1 similarity score [0, 1]
   * @param classification - Predicted category, urgency, and matched keywords
   * @returns Action outcome with human-readable audit reason
   */
  public decide(retrievalConfidence: number, classification: ClassificationResult): Decision {
    const matchedSafety = classification.matched_urgency_keywords.filter((kw) =>
      SAFETY_KEYWORDS.has(kw.toLowerCase())
    );

    // Rule 1: Safety override
    // Hardware risks (smoke, sparks, burning odor, hot charger) must always be routed to human personnel
    if (classification.urgency === 'High' && matchedSafety.length > 0) {
      return {
        action: Action.ESCALATE_SAFETY,
        reason: `Safety-relevant keyword(s) detected: [${matchedSafety.join(', ')}]. Always route to a human regardless of answer confidence.`,
        requires_human: true,
      };
    }

    // Rule 2: Low confidence
    // If knowledge-base chunk match similarity is lower than the minimum bar, route to human queue
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
    // High-urgency outages or executive blockers demand higher grounded certainty before automated delivery
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
    // Passed all safety and confidence bars; autonomous answer can be safely released
    return {
      action: Action.AUTO_RESOLVE,
      reason: `Confidence ${(retrievalConfidence * 100).toFixed(1)}% is sufficient and no safety/urgency override triggered.`,
      requires_human: false,
    };
  }
}

export const defaultDecisionAgent = new DecisionAgent();

