/**
 * Agent Orchestrator: Central Pipeline Coordinator
 * IT Helpdesk RAG + Agent Architecture
 *
 * Sequence of Execution:
 * 1. PII Sanitization & Text Normalization -> Redacts passwords, tokens, emails, IPs.
 * 2. Instant Local Safety & Entity Extraction -> Intercepts fire/battery risks before API calls.
 * 3. Step 1 (Classification Agent) -> Nearest-centroid domain prediction & urgency heuristic.
 * 4. Step 2 (Retrieval Agent) -> Hybrid TF-IDF vector + domain keyword boost search.
 * 5. Step 4 (Decision Policy Agent) -> Evaluates confidence vs. configurable thresholds.
 * 6. Step 3 (Response Generation) -> Grounded Gemini 2.5/3 synthesis or extractive template fallback.
 * 7. Trace Compilation -> Aggregates telemetry, sources, and audit rationale for the UI.
 */

import { ClassificationAgent, defaultClassifier } from './classificationAgent';
import { DecisionAgent, defaultDecisionAgent } from './decisionAgent';
import { Retriever, defaultRetriever } from './retriever';
import { generateTemplateAnswer, generateAiAnswer } from './responseGenerator';
import { cleanText, redactPii } from './textUtils';
import { extractEntitiesAndSafety } from './entityExtractor';
import { PipelineConfig, TicketResolution, Action } from '../types';

export class HelpdeskOrchestrator {
  private classifier: ClassificationAgent;
  private retriever: Retriever;
  private decisionAgent: DecisionAgent;

  constructor(
    classifier: ClassificationAgent = defaultClassifier,
    retriever: Retriever = defaultRetriever,
    decisionAgent: DecisionAgent = defaultDecisionAgent
  ) {
    this.classifier = classifier;
    this.retriever = retriever;
    this.decisionAgent = decisionAgent;
  }

  /**
   * Orchestrates the complete processing cycle for an incoming IT support ticket.
   *
   * @param rawQuery - Unsanitized user prompt or ticket text
   * @param config - Optional overrides for confidence thresholds, generation mode, and top-K
   * @returns Detailed TicketResolution containing classification, sources, action, and answer
   */
  public async handleTicket(
    rawQuery: string,
    config?: Partial<PipelineConfig>
  ): Promise<TicketResolution> {
    const startTime = performance.now();

    // Stage 0: PII Sanitization & Normalization
    // Strip leading/trailing noise and mask sensitive tokens (SSNs, secrets, API keys)
    const query = redactPii(cleanText(rawQuery));

    // Dynamic Threshold Synchronization
    // Update the decision agent policy thresholds if customized in the UI
    if (config?.autoResolveThreshold !== undefined || config?.highUrgencyThreshold !== undefined) {
      this.decisionAgent.setConfig({
        autoResolveThreshold: config.autoResolveThreshold,
        highUrgencyThreshold: config.highUrgencyThreshold,
      });
    }

    const topK = config?.topK ?? 3;

    // Stage 0b: Sub-Millisecond Safety & Hardware Hazard Check
    // Evaluates regex patterns for swollen batteries, smoke, electrical sparks, and fires.
    // This runs completely client-side to ensure deterministic safety without quota delays.
    const localAnalysis = extractEntitiesAndSafety(query);
    const extractedEntities = localAnalysis.entities;
    const safetyHazard = localAnalysis.safety_hazard;

    // Step 1: Classification Agent
    // Calculates TF-IDF query embedding, determines nearest centroid category,
    // and checks keyword dictionaries for urgency signals.
    const classification = this.classifier.classify(query);

    // Step 2: Precision Retrieval Agent
    // Performs hybrid vector search across pre-computed KB chunks, blending cosine
    // similarity with domain boost terms (e.g. 'BitLocker', '802.1x', 'CrowdStrike').
    const sources = this.retriever.retrieve(query, topK);
    const retrievalConfidence = sources.length > 0 ? sources[0].similarity : 0.0;

    // Step 4 (Preliminary Logic): Decision Agent Policy Evaluation
    // Evaluates retrieval confidence against the auto-resolve threshold and urgency rules.
    let decision = this.decisionAgent.decide(retrievalConfidence, classification);

    // Hard Safety Override:
    // Any physical danger instantly forces ESCALATE_SAFETY and demands human physical dispatch,
    // overriding high vector similarity to avoid providing hazardous DIY instructions.
    if (safetyHazard) {
      decision = {
        action: Action.ESCALATE_SAFETY,
        reason: `Physical Safety Alert: ${localAnalysis.hazard_reason || 'Risk detected in ticket text. Escalate immediately to local facilities or IT depot.'}`,
        requires_human: true,
      };
    }

    // Step 3: Response Synthesis & Grounding
    let answerText = '';
    let usedLlm = false;
    let rateLimited = false;
    let fallbackNote: string | undefined;
    let webGrounded = false;
    let webSources: Array<{ title: string; uri: string }> = [];
    let searchQueries: string[] = [];

    // Live Web Research Qualification:
    // If local KB confidence is low, and web search is enabled, the agent can query Google Search
    // grounding via Gemini to discover newly documented vendor bugs or release notes.
    // Note: Physical hazards and high-urgency outages are strictly prevented from web resolution.
    const canAttemptWebResolution =
      !safetyHazard &&
      decision.action === Action.ESCALATE_LOW_CONFIDENCE &&
      (Boolean(config?.enableWebSearch) || config?.generationMode === 'gemini');

    if (decision.requires_human && !canAttemptWebResolution) {
      // Policy Gate: Withhold automated resolution when human escalation is required
      answerText = safetyHazard
        ? 'Resolution withheld — CRITICAL SAFETY HAZARD. Routed immediately to facility / depot team for physical inspection.'
        : 'Resolution withheld — Ticket has been escalated to a human IT technician per enterprise routing policy.';
    } else {
      // Generate grounded resolution either via Gemini API or local template extraction
      if (config?.generationMode === 'gemini' || canAttemptWebResolution) {
        const gen = await generateAiAnswer(
          query,
          sources,
          classification.category,
          classification.urgency,
          canAttemptWebResolution
        );
        answerText = gen.answer;
        usedLlm = gen.used_llm;
        rateLimited = Boolean(gen.rate_limited);
        fallbackNote = gen.fallback_note;
        webGrounded = Boolean(gen.web_grounded);
        webSources = gen.web_sources || [];
        searchQueries = gen.search_queries || [];

        // If live web search succeeded in grounding a low-confidence ticket with trusted vendor sources,
        // promote the action to AUTO_RESOLVE with citation audit details.
        if (webGrounded && !safetyHazard && decision.action === Action.ESCALATE_LOW_CONFIDENCE) {
          decision = {
            action: Action.AUTO_RESOLVE,
            reason: `Grounded Resolution Found via Live Internet Search (${webSources.length} vendor sources cited)`,
            requires_human: false,
          };
        } else if (decision.requires_human) {
          answerText = 'Resolution withheld — Ticket escalated to human technician per enterprise routing policy.';
        }
      } else {
        // Deterministic template extraction from top retrieved KB chunk
        const gen = generateTemplateAnswer(query, sources);
        answerText = gen.answer;
        usedLlm = false;
      }
    }

    // Telemetry and Tracking Metadata
    const elapsedMs = Math.round((performance.now() - startTime) * 10) / 10;
    const ticketId = Math.random().toString(36).substring(2, 10).toUpperCase();

    return {
      ticket_id: ticketId,
      query: rawQuery,
      timestamp: new Date().toISOString(),
      category: classification.category,
      category_confidence: classification.category_confidence,
      urgency: classification.urgency,
      answer: answerText,
      sources,
      retrieval_confidence: retrievalConfidence,
      action: decision.action,
      reason: decision.reason,
      requires_human: decision.requires_human,
      processing_time_ms: elapsedMs,
      used_llm: usedLlm,
      extracted_entities: extractedEntities,
      safety_hazard: safetyHazard,
      rate_limited: rateLimited,
      fallback_note: fallbackNote,
      web_grounded: webGrounded,
      web_sources: webSources,
      search_queries: searchQueries,
    };
  }
}

export const defaultOrchestrator = new HelpdeskOrchestrator();

