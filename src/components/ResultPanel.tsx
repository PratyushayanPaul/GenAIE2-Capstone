import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Action, TicketResolution } from '../types';
import {
  ChevronDown,
  ChevronUp,
  UserCheck,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Copy,
  Check,
  Terminal,
  Mail,
  FileText,
  Sparkles,
  Loader2,
  Lock,
  Globe,
  ExternalLink,
  Database,
  BookmarkPlus,
  CheckCircle2,
} from 'lucide-react';
import { redactPii } from '../engine/textUtils';

interface ResultPanelProps {
  result: TicketResolution;
}

const ACTION_CONFIG: Record<
  Action,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  [Action.AUTO_RESOLVE]: {
    label: 'Auto-Resolved',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: <UserCheck className="w-4 h-4" />,
  },
  [Action.ESCALATE_LOW_CONFIDENCE]: {
    label: 'Escalated · Low Confidence',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  [Action.ESCALATE_HIGH_URGENCY]: {
    label: 'Escalated · High Urgency Sign-off',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  [Action.ESCALATE_SAFETY]: {
    label: 'Escalated · Safety Hazard',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: <Flame className="w-4 h-4" />,
  },
};

export const ResultPanel: React.FC<ResultPanelProps> = ({ result }) => {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPiiRedaction, setShowPiiRedaction] = useState(false);

  // Ingest state
  const [ingesting, setIngesting] = useState(false);
  const [ingested, setIngested] = useState(false);

  // Copilot state
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotOutput, setCopilotOutput] = useState<string | null>(null);
  const [copilotType, setCopilotType] = useState<string | null>(null);
  const [copilotCopied, setCopilotCopied] = useState(false);

  const actionMeta = ACTION_CONFIG[result.action] || {
    label: result.action,
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: null,
  };

  const copyAnswer = () => {
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIngestIntoKb = async () => {
    if (ingesting || ingested || !result.answer) return;
    setIngesting(true);

    try {
      const res = await fetch('/api/kb/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            category: result.category,
            issue: result.query.slice(0, 70),
            question: result.query,
            resolution: result.answer,
            tags: [result.category.toLowerCase(), 'ticket-ingested', result.web_grounded ? 'web-grounded' : 'internal'],
            source_url: result.web_sources?.[0]?.uri || '',
            is_web_researched: Boolean(result.web_grounded),
          },
        }),
      });

      if (res.ok) {
        setIngested(true);
        setTimeout(() => setIngested(false), 4000);
      }
    } catch {
      // ignore
    } finally {
      setIngesting(false);
    }
  };

  const runCopilotAction = async (promptType: 'commands' | 'customer_reply' | 'escalation_note') => {
    setCopilotLoading(true);
    setCopilotType(promptType);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_query: result.query,
          resolution: result.answer,
          category: result.category,
          urgency: result.urgency,
          prompt_type: promptType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCopilotOutput(data.output);
      }
    } catch {
      // ignore
    } finally {
      setCopilotLoading(false);
    }
  };

  const copyCopilot = () => {
    if (!copilotOutput) return;
    navigator.clipboard.writeText(copilotOutput);
    setCopilotCopied(true);
    setTimeout(() => setCopilotCopied(false), 2000);
  };

  const piiRedacted = redactPii(result.query);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Primary Result Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        {/* Header: Action Badge & Confidence */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${actionMeta.badgeClass}`}
            >
              {actionMeta.icon}
              <span>{actionMeta.label}</span>
            </span>

            {result.web_grounded && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-md font-medium">
                <Globe className="w-3 h-3" />
                Web Grounded
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>
              Latency: <strong className="text-slate-900 dark:text-slate-100">{result.processing_time_ms}ms</strong>
            </span>
            <span>
              Confidence:{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                {Math.round(result.retrieval_confidence * 100)}%
              </strong>
            </span>
          </div>
        </div>

        {/* Confidence Progress Meter */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
            <span>Retrieval Confidence vs Auto-Resolve Bar</span>
            <span>{Math.round(result.retrieval_confidence * 100)}% / 15% threshold</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                result.retrieval_confidence >= 0.15
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, result.retrieval_confidence * 100))}%` }}
            />
          </div>
        </div>

        {/* Reason / Escalation note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
          <strong className="font-semibold text-slate-900 dark:text-slate-100">Decision policy: </strong>
          {result.reason}
        </div>

        {/* Proposed Resolution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Proposed Resolution
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleIngestIntoKb}
                disabled={ingesting || ingested}
                className="text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60 transition-colors shadow-2xs"
                title="Save resolution to Knowledge Base"
              >
                {ingested ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Saved to KB!</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{ingesting ? 'Saving...' : 'Save to KB'}</span>
                  </>
                )}
              </button>

              <button
                onClick={copyAnswer}
                className="text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed p-4 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 font-sans whitespace-pre-line">
            {result.answer}
          </div>

          {/* Web Citations Bar */}
          {result.web_sources && result.web_sources.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1.5 font-semibold">
                <Globe className="w-3.5 h-3.5" />
                Live Vendor Citations:
              </span>
              {result.web_sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono text-[11px] shadow-2xs"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span>{s.title || s.uri}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Technician Copilot Quick Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Technician Copilot Actions
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              One-click synthesis
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => runCopilotAction('commands')}
              disabled={copilotLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors disabled:opacity-50 shadow-2xs"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Generate CLI / PowerShell</span>
            </button>

            <button
              onClick={() => runCopilotAction('customer_reply')}
              disabled={copilotLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors disabled:opacity-50 shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Draft Employee Reply</span>
            </button>

            <button
              onClick={() => runCopilotAction('escalation_note')}
              disabled={copilotLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors disabled:opacity-50 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Write Handover Note</span>
            </button>
          </div>

          {/* Copilot loading spinner */}
          {copilotLoading && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg text-xs font-mono text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Synthesizing {copilotType?.replace('_', ' ')}...</span>
            </div>
          )}

          {/* Copilot Result Box */}
          {copilotOutput && !copilotLoading && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Synthesized Output ({copilotType?.replace('_', ' ')})
                </span>
                <button
                  onClick={copyCopilot}
                  className="text-xs font-mono text-slate-500 hover:text-blue-600 flex items-center gap-1"
                >
                  {copilotCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copilotCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">
                {copilotOutput}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Internal Knowledge Sources Drawer */}
      {result.sources.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <button
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="w-full flex items-center justify-between p-4 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                Retrieved Internal Knowledge Chunks ({result.sources.length})
              </span>
            </span>
            {sourcesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {sourcesOpen && (
            <div className="p-4 pt-0 space-y-2.5 border-t border-slate-100 dark:border-slate-800">
              {result.sources.map((src, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {src.kb_id} · {src.issue}
                    </span>
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      Sim: {Math.round(src.similarity * 100)}%
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {src.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PII Sanitization Preview Toggle */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <button
          onClick={() => setShowPiiRedaction(!showPiiRedaction)}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{showPiiRedaction ? 'Hide PII Audit' : 'Inspect PII Sanitization'}</span>
        </button>
        <span className="text-[11px] font-mono">
          Email / IP / Phone Redaction: Active
        </span>
      </div>

      {showPiiRedaction && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono space-y-1.5 shadow-xs">
          <div className="text-slate-500 dark:text-slate-400">Sanitized Query (Protected):</div>
          <div className="text-slate-800 dark:text-slate-200 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200/80 dark:border-slate-700">
            {piiRedacted}
          </div>
          {piiRedacted.includes('[') && (
            <div className="text-amber-600 dark:text-amber-400 pt-1 text-[11px] font-sans">
              * Sensitive identifiers detected and scrubbed before vector embedding.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
