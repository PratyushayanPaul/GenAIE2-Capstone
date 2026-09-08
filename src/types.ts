/**
 * IT Helpdesk RAG + Agent Types
 */

export type Category =
  | 'Hardware'
  | 'Network'
  | 'Software'
  | 'Account & Access'
  | 'Productivity'
  | 'Facility'
  | 'Others';

export type Urgency = 'High' | 'Medium' | 'Low';

export enum Action {
  AUTO_RESOLVE = 'AUTO_RESOLVE',
  ESCALATE_LOW_CONFIDENCE = 'ESCALATE_LOW_CONFIDENCE',
  ESCALATE_SAFETY = 'ESCALATE_SAFETY',
  ESCALATE_HIGH_URGENCY = 'ESCALATE_HIGH_URGENCY',
}

export interface KbDocument {
  kb_id: string;
  category: Category;
  issue: string;
  question: string;
  resolution: string;
  tags: string[];
  source_url?: string;
  is_web_researched?: boolean;
  date_added?: string;
}

export interface KbChunk {
  chunk_id: string;
  kb_id: string;
  category: Category;
  issue: string;
  tags: string;
  chunk_index: number;
  text: string;
}

export interface RetrievedChunk {
  chunk_id: string;
  kb_id: string;
  category: Category;
  issue: string;
  text: string;
  similarity: number; // 0..1
}

export interface ClassificationResult {
  category: Category;
  category_confidence: number;
  urgency: Urgency;
  matched_urgency_keywords: string[];
}

export interface Decision {
  action: Action;
  reason: string;
  requires_human: boolean;
}

export interface RagResponse {
  query: string;
  answer: string;
  sources: RetrievedChunk[];
  confidence: number;
  used_llm: boolean;
}

export interface TicketResolution {
  ticket_id: string;
  query: string;
  timestamp: string;
  category: Category;
  category_confidence: number;
  urgency: Urgency;
  answer: string;
  sources: RetrievedChunk[];
  retrieval_confidence: number;
  action: Action;
  reason: string;
  requires_human: boolean;
  processing_time_ms: number;
  used_llm?: boolean;
  extracted_entities?: {
    device?: string;
    os?: string;
    application?: string;
    issue_type?: string;
  };
  safety_hazard?: boolean;
  rate_limited?: boolean;
  fallback_note?: string;
  web_grounded?: boolean;
  web_sources?: Array<{ title: string; uri: string }>;
  search_queries?: string[];
}

export interface DemoTicket {
  ticket_id: string;
  title: string;
  query: string;
  category: Category;
  ground_truth_category?: Category;
  source: 'loopback' | 'kaggle';
  priority?: string;
  status?: string;
}

export interface KpiSummary {
  total_tickets_processed: number;
  action_breakdown: Record<Action, number>;
  auto_resolve_rate: number;
  escalation_rate: number;
  category_distribution: Record<string, number>;
  urgency_distribution: Record<string, number>;
  avg_confidence: number;
  avg_processing_time_ms: number;
  classification_validation: {
    n_labeled_samples: number;
    overall_accuracy: number;
    per_category_accuracy: Record<string, number>;
  };
  business_impact_estimate: {
    assumption: string;
    tickets_auto_resolved: number;
    estimated_minutes_saved: number;
    estimated_hours_saved: number;
  };
}

export interface PipelineConfig {
  autoResolveThreshold: number; // default 0.15
  highUrgencyThreshold: number; // default 0.30
  generationMode: 'extractive' | 'gemini';
  topK: number; // default 3
  enableWebSearch?: boolean; // When true or when local match is low, search internet with Gemini Google Search grounding
}

export interface SampleQuickTicket {
  id: string;
  label: string;
  text: string;
  category: Category;
  scenarioType: 'resolve' | 'hazard' | 'urgency' | 'low_conf';
  expected: Action;
  badge: string;
  description: string;
}
