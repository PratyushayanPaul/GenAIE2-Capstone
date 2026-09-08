/**
 * Phase 3b: Generation
 * Extractive template generation + Server-side Gemini AI generation
 */

import { RetrievedChunk } from '../types';

export interface GenerationOutput {
  answer: string;
  sources: RetrievedChunk[];
  used_llm: boolean;
  rate_limited?: boolean;
  fallback_note?: string;
  web_grounded?: boolean;
  web_sources?: Array<{ title: string; uri: string }>;
  search_queries?: string[];
}

export function generateTemplateAnswer(
  _query: string,
  contextChunks: RetrievedChunk[]
): GenerationOutput {
  if (!contextChunks || contextChunks.length === 0 || contextChunks[0].similarity < 0.05) {
    return {
      answer:
        "I couldn't find a confident match in the knowledge base for this issue. Escalating to a human IT technician.",
      sources: [],
      used_llm: false,
    };
  }

  const top = contextChunks[0];
  let answerPart = top.text;
  if (top.text.includes('A:')) {
    const parts = top.text.split('A:');
    answerPart = parts[parts.length - 1].trim();
  }

  return {
    answer: `Based on our knowledge base (${top.issue}): ${answerPart}`,
    sources: contextChunks,
    used_llm: false,
  };
}

export async function generateAiAnswer(
  query: string,
  contextChunks: RetrievedChunk[],
  category?: string,
  urgency?: string,
  enableWebSearch?: boolean
): Promise<GenerationOutput> {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, contextChunks, category, urgency, enableWebSearch }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.answer) {
        return {
          answer: data.answer,
          sources: contextChunks,
          used_llm: Boolean(data.used_llm),
          rate_limited: Boolean(data.rate_limited),
          fallback_note: data.fallback_note,
          web_grounded: Boolean(data.web_grounded),
          web_sources: data.web_sources || [],
          search_queries: data.search_queries || [],
        };
      }
    }
  } catch {
    // Network or server endpoint error -> fall back to template generator
  }

  // Graceful fallback
  return generateTemplateAnswer(query, contextChunks);
}
