/**
 * Decision Confidence Card Component
 * IT Helpdesk RAG + Agent Architecture
 *
 * Renders an executive audit card communicating:
 * 1. Final Action Verdict (Auto-Resolve, Escalate Safety, Escalate Low Confidence, Escalate High Urgency)
 * 2. Visual Confidence Progress Bar relative to configurable auto-resolve threshold
 * 3. Human Intervention Requirement indicator
 * 4. Grounded retrieval stats and audit reasoning
 */

import React from 'react';
import { motion } from 'motion/react';
import { Action, PipelineConfig, TicketResolution, TicketLifecycleState } from '../types';
import { TicketStatusBadge } from './TicketStatusBadge';
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Gauge,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface DecisionConfidenceCardProps {
  /** Execution output from orchestrator */
  result: TicketResolution;
  /** Active pipeline configuration thresholds */
  config: PipelineConfig;
  /** Current lifecycle status badge state */
  status?: TicketLifecycleState;
  /** Callback to update ticket lifecycle status */
  onStatusChange?: (newStatus: TicketLifecycleState) => void;
}

export const DecisionConfidenceCard: React.FC<DecisionConfidenceCardProps> = ({
  result,
  config,
  status,
  onStatusChange,
}) => {
  const isSafety = result.action === Action.ESCALATE_SAFETY || result.safety_hazard;
  const isHighUrgency = result.action === Action.ESCALATE_HIGH_URGENCY;
  const isLowConfidence = result.action === Action.ESCALATE_LOW_CONFIDENCE;
  const isAutoResolve = result.action === Action.AUTO_RESOLVE;

  // Determine the primary confidence score for the routed decision
  let confidenceScore = result.retrieval_confidence;
  let thresholdPct = Math.round(config.autoResolveThreshold * 100);
  let confidencePct = Math.min(100, Math.max(0, Math.round(confidenceScore * 100)));
  let scoreDescription = '';

  if (isSafety) {
    // Safety hazard is a deterministic 100% certainty safety override
    confidencePct = 100;
    thresholdPct = 0;
    scoreDescription = 'Zero-tolerance safety override (100% routing confidence)';
  } else if (isHighUrgency) {
    thresholdPct = Math.round(config.highUrgencyThreshold * 100);
    scoreDescription = `Below high-urgency threshold (${thresholdPct}%) required for automated resolution`;
  } else if (isLowConfidence) {
    scoreDescription = `Below minimum auto-resolve threshold (${thresholdPct}%)`;
  } else {
    scoreDescription = `Exceeds minimum auto-resolve threshold (${thresholdPct}%)`;
  }

  // Visual theming based on routed decision
  const theme = isAutoResolve
    ? {
        border: 'border-emerald-200/90 dark:border-emerald-900/60',
        bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
        barColor: 'bg-emerald-500',
        barGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',

        textColor: 'text-emerald-700 dark:text-emerald-400',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        actionTitle: 'Auto-Resolve Approved',
      }
    : isSafety
    ? {
        border: 'border-rose-200/90 dark:border-rose-900/60',
        bg: 'bg-rose-50/40 dark:bg-rose-950/20',
        badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800',
        barColor: 'bg-rose-500',
        barGlow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
        textColor: 'text-rose-700 dark:text-rose-400',
        icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        actionTitle: 'Escalated: Physical Safety Hazard',
      }
    : isHighUrgency
    ? {
        border: 'border-amber-200/90 dark:border-amber-900/60',
        bg: 'bg-amber-50/40 dark:bg-amber-950/20',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        barColor: 'bg-amber-500',
        barGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
        textColor: 'text-amber-700 dark:text-amber-400',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        actionTitle: 'Escalated: High Urgency Gate',
      }
    : {
        border: 'border-amber-200/90 dark:border-amber-900/60',
        bg: 'bg-amber-50/40 dark:bg-amber-950/20',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        barColor: 'bg-amber-500',
        barGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
        textColor: 'text-amber-700 dark:text-amber-400',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        actionTitle: 'Escalated: Low Confidence',
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border ${theme.border} ${theme.bg} p-4 shadow-xs space-y-3`}
      id="decision-confidence-visualization"
    >
      {/* Header Row: Title and Routed Decision Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Routed Decision Confidence
            </span>
            <div className="flex items-center gap-1.5 font-sans font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {theme.icon}
              <span>{theme.actionTitle}</span>
            </div>
          </div>
        </div>

        {/* Big Score Readout & Lifecycle Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {status && (
            <TicketStatusBadge
              status={status}
              size="md"
              interactive={Boolean(onStatusChange)}
              onStatusChange={onStatusChange}
            />
          )}
          <div className="flex items-baseline gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-400 uppercase">AI Score</span>
            <span className={`text-base font-mono font-bold ${theme.textColor}`}>
              {confidencePct}%
            </span>
          </div>
        </div>
      </div>

      {/* Small Progress Bar Container */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Confidence Level</span>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {isSafety ? (
              <span className="font-semibold text-rose-600 dark:text-rose-400">Hazard Override</span>
            ) : (
              <>
                Policy Threshold:{' '}
                <strong className="text-slate-700 dark:text-slate-200 font-bold">{thresholdPct}%</strong>
              </>
            )}
          </span>
        </div>

        {/* Small Progress Bar Track */}
        <div
          className="relative w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner"
          role="progressbar"
          aria-valuenow={confidencePct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Animated fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidencePct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${theme.barColor} ${theme.barGlow}`}
          />

          {/* Policy threshold marker tick (when not safety override) */}
          {!isSafety && thresholdPct > 0 && thresholdPct < 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10 opacity-70"
              style={{ left: `${thresholdPct}%` }}
              title={`Policy threshold mark at ${thresholdPct}%`}
            />
          )}
        </div>

        {/* Scale labels under progress bar */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
          <span>0%</span>
          {!isSafety && (
            <span
              className="font-medium text-slate-600 dark:text-slate-400 -ml-2"
              style={{ marginLeft: `${Math.max(0, thresholdPct - 6)}%` }}
            >
              ▲ {thresholdPct}% Bar
            </span>
          )}
          <span>100%</span>
        </div>
      </div>

      {/* Decision Rationale & Sub-metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Grounded Match</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {Math.round(result.retrieval_confidence * 100)}% similarity
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Intent Match</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {Math.round(result.category_confidence * 100)}% ({result.category})
          </span>
        </div>

        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Policy Verdict</span>
          <span className={`font-mono font-semibold truncate block ${theme.textColor}`}>
            {isAutoResolve ? 'Passed' : isSafety ? 'Hazard Escalate' : 'Escalated'}
          </span>
        </div>
      </div>

      {/* Bottom explanation text */}
      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed pt-0.5 flex items-start gap-1.5">
        <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">Policy Note:</span>
        <span>{result.reason}</span>
      </div>
    </motion.div>
  );
};
