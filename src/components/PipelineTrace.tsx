import React from 'react';
import { motion } from 'motion/react';
import { TicketResolution } from '../types';
import { ShieldAlert, Search, Sparkles, CheckCircle2, Globe, ExternalLink, Tag, Cpu, ShieldCheck } from 'lucide-react';

interface PipelineTraceProps {
  result: TicketResolution;
}

export const PipelineTrace: React.FC<PipelineTraceProps> = ({ result }) => {
  const urgencyBadge =
    result.urgency === 'High'
      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
      : result.urgency === 'Low'
      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900';

  const steps = [
    {
      num: '1',
      title: 'Intent & Domain Classification',
      icon: <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="text-xs space-y-1.5 font-sans">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 dark:text-slate-400">Category:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{result.category}</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400">Urgency:</span>
            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${urgencyBadge}`}>
              {result.urgency}
            </span>
            <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
              ({Math.round(result.category_confidence * 100)}% match)
            </span>
          </div>

          {result.extracted_entities && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
              {result.extracted_entities.device && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                  Device: {result.extracted_entities.device}
                </span>
              )}
              {result.extracted_entities.os && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                  OS: {result.extracted_entities.os}
                </span>
              )}
              {result.extracted_entities.application && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                  App: {result.extracted_entities.application}
                </span>
              )}
              {result.extracted_entities.issue_type && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                  Type: {result.extracted_entities.issue_type}
                </span>
              )}
            </div>
          )}

          {result.safety_hazard && (
            <div className="text-xs font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mt-1 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Safety Hazard Flagged: Physical danger, heat, smoke, or electrical risk.</span>
            </div>
          )}
        </div>
      ),
    },
    {
      num: '2',
      title: 'Vector Knowledge Retrieval',
      icon: <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="text-xs font-sans">
          <span className="text-slate-700 dark:text-slate-300">
            {result.sources.length} internal source(s) matched &nbsp;·&nbsp;
          </span>
          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
            top similarity {Math.round(result.retrieval_confidence * 100)}%
          </span>
          {result.sources.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              [{result.sources[0].issue}]
            </span>
          )}
        </div>
      ),
    },
    ...(result.web_grounded || (result.web_sources && result.web_sources.length > 0)
      ? [
          {
            num: '2b',
            title: 'Live Internet Search Grounding',
            icon: <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
            content: (
              <div className="text-xs space-y-2 font-sans">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900 font-medium">
                    <Globe className="w-3 h-3" />
                    Google Search Grounding Connected
                  </span>
                </div>

                {result.search_queries && result.search_queries.length > 0 && (
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="text-slate-700 dark:text-slate-300">Queries:</span>{' '}
                    {result.search_queries.map((q, i) => (
                      <span key={i} className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded mr-1 mb-1 text-slate-700 dark:text-slate-300">
                        "{q}"
                      </span>
                    ))}
                  </div>
                )}

                {result.web_sources && result.web_sources.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Verified Citations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.web_sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>{src.title || src.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      num: '3',
      title: 'Resolution Synthesis',
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="text-xs font-sans">
          {!result.requires_human ? (
            <span className="text-slate-700 dark:text-slate-300">
              Answer synthesized from retrieved context{' '}
              {result.web_grounded ? (
                <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">(Live Web Search + Gemini Flash)</span>
              ) : result.used_llm ? (
                <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">(Gemini 3.8 Flash)</span>
              ) : result.rate_limited ? (
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  (Extractive Fallback)
                </span>
              ) : (
                <span className="font-mono text-slate-500 dark:text-slate-400">(Extractive)</span>
              )}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 italic">
              Automated draft held — routed to support engineer below confidence bar / hazard override
            </span>
          )}
        </div>
      ),
    },
    {
      num: '4',
      title: 'Routing Policy Engine',
      icon: result.requires_human ? (
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      ),
      content: (
        <div className="text-xs font-sans space-y-2 text-slate-700 dark:text-slate-300">
          <div>{result.reason}</div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-slate-400">Decision Confidence:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {result.safety_hazard ? '100% (Safety Override)' : `${Math.round(result.retrieval_confidence * 100)}%`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.action === 'AUTO_RESOLVE'
                    ? 'bg-emerald-500'
                    : result.safety_hazard
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
                style={{
                  width: `${
                    result.safety_hazard
                      ? 100
                      : Math.min(100, Math.max(0, Math.round(result.retrieval_confidence * 100)))
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs"
    >
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
          Pipeline Execution Trace
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          {result.processing_time_ms}ms
        </span>
      </div>

      <div className="space-y-0 relative border-l-2 border-slate-200 dark:border-slate-800 ml-2 pl-4">
        {steps.map((step, idx) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.2 }}
            className="relative pb-4 last:pb-1"
          >
            {/* Step node dot on vertical axis */}
            <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-400" />

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {step.num} · {step.title}
              </span>
            </div>
            {step.content}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
