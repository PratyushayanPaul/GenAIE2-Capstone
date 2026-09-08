/**
 * Phase 4c: Agent Orchestrator
 * IT Helpdesk RAG + Agent Capstone Project
 *
 * Sequence:
 * New ticket -> Classification agent -> Retrieval agent -> Response generation
 *            -> Decision agent -> (Auto-resolve | Escalate to human)
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

  public async handleTicket(
    rawQuery: string,
    config?: Partial<PipelineConfig>
  ): Promise<TicketResolution> {
    const startTime = performance.now();
    const query = redactPii(cleanText(rawQuery));

    // Configure decision thresholds if provided
    if (config?.autoResolveThreshold !== undefined || config?.highUrgencyThreshold !== undefined) {
      this.decisionAgent.setConfig({
        autoResolveThreshold: config.autoResolveThreshold,
        highUrgencyThreshold: config.highUrgencyThreshold,
      });
    }

    const topK = config?.topK ?? 3;

    // Instant Local Safety & Entity Extraction (Zero-quota, sub-millisecond)
    const localAnalysis = extractEntitiesAndSafety(query);
    const extractedEntities = localAnalysis.entities;
    const safetyHazard = localAnalysis.safety_hazard;

    // Step 1: Classification Agent
    const classification = this.classifier.classify(query);

    // Step 2: Retrieval Agent
    const sources = this.retriever.retrieve(query, topK);
    const retrievalConfidence = sources.length > 0 ? sources[0].similarity : 0.0;

    // Step 4 (Logic): Decision Agent
    let decision = this.decisionAgent.decide(retrievalConfidence, classification);

    // Enforce safety hazard escalation if detected
    if (safetyHazard) {
      decision = {
        action: Action.ESCALATE_SAFETY,
        reason: `Physical Safety Alert: ${localAnalysis.hazard_reason || 'Risk detected in ticket text. Escalate immediately to local facilities or IT depot.'}`,
        requires_human: true,
      };
    }

    // Step 3: Response Generation
    let answerText = '';
    let usedLlm = false;
    let rateLimited = false;
    let fallbackNote: string | undefined;
    let webGrounded = false;
    let webSources: Array<{ title: string; uri: string }> = [];
    let searchQueries: string[] = [];

    // Check if live internet search grounding is requested or beneficial
    const shouldEnableWebSearch = Boolean(config?.enableWebSearch) || (retrievalConfidence < 0.18 && !safetyHazard && config?.generationMode === 'gemini');

    if (decision.requires_human && !shouldEnableWebSearch) {
      answerText = safetyHazard
        ? 'Draft suppressed — CRITICAL SAFETY HAZARD. Routed immediately to local facility / depot team for physical inspection.'
        : 'Draft suppressed — ticket has been routed to a human IT technician since automated confidence was too low or the issue requires physical/in-person judgment.';
    } else {
      if (config?.generationMode === 'gemini' || shouldEnableWebSearch) {
        const gen = await generateAiAnswer(
          query,
          sources,
          classification.category,
          classification.urgency,
          shouldEnableWebSearch
        );
        answerText = gen.answer;
        usedLlm = gen.used_llm;
        rateLimited = Boolean(gen.rate_limited);
        fallbackNote = gen.fallback_note;
        webGrounded = Boolean(gen.web_grounded);
        webSources = gen.web_sources || [];
        searchQueries = gen.search_queries || [];

        // If live web search found a grounded resolution and it wasn't a safety hazard,
        // we can provide the resolution with verified web citations
        if (webGrounded && !safetyHazard && decision.requires_human) {
          decision = {
            action: Action.AUTO_RESOLVE,
            reason: `Grounded Resolution Found via Live Internet Search (${webSources.length} web sources cited)`,
            requires_human: false,
          };
        }
      } else {
        const gen = generateTemplateAnswer(query, sources);
        answerText = gen.answer;
        usedLlm = false;
      }
    }

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
