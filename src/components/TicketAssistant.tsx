/**
 * Ticket Assistant & Live Agent Console
 * IT Helpdesk RAG + Agent Architecture
 *
 * Primary interactive workplace for IT support engineers:
 * 1. Scenario Queue: Curated library of real-world enterprise test tickets across categories.
 * 2. Lifecycle Management: Real-time ticket state tracking ('Pending', 'Resolved', 'Escalated')
 *    with manual triage cycling and automated pipeline status transitions.
 * 3. Execution Pipeline: Submits queries through the HelpdeskOrchestrator to trigger
 *    PII redaction, classification, vector retrieval, policy routing, and answer synthesis.
 * 4. Dual View Visualizer: Live confidence gauge, pipeline stage trace, and cited sources.
 */

import React, { useState } from 'react';
import { SAMPLE_QUICK_TICKETS } from '../data/demoTickets';
import { PipelineConfig, TicketResolution, TicketLifecycleState, Action, SampleQuickTicket } from '../types';
import { defaultOrchestrator } from '../engine/orchestrator';
import { PipelineTrace } from './PipelineTrace';
import { ResultPanel } from './ResultPanel';
import { DecisionConfidenceCard } from './DecisionConfidenceCard';
import { TicketStatusBadge } from './TicketStatusBadge';
import {
  Play,
  Sparkles,
  Database,
  RotateCcw,
  Globe,
  Headphones,
  CheckCircle2,
  Flame,
  AlertTriangle,
  ArrowRight,
  Shield,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface TicketAssistantProps {
  /** Active pipeline configuration (thresholds, generation model, web grounding) */
  config: PipelineConfig;
  /** State updater to adjust pipeline configuration */
  setConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
}

export const TicketAssistant: React.FC<TicketAssistantProps> = ({ config, setConfig }) => {
  // Input query and active selection state
  const [query, setQuery] = useState('');
  const [selectedSample, setSelectedSample] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Filters for scenario category and ticket lifecycle
  const [scenarioFilter, setScenarioFilter] = useState<'all' | 'resolve' | 'hazard' | 'escalate'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketLifecycleState>('all');

  // Execution state & stage progression indicators
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [result, setResult] = useState<TicketResolution | null>(null);

  // Lifecycle state tracker dictionary mapping ticket IDs to 'Pending' | 'Resolved' | 'Escalated'
  const [ticketLifecycles, setTicketLifecycles] = useState<Record<string, TicketLifecycleState>>(() => {
    const initial: Record<string, TicketLifecycleState> = {};
    SAMPLE_QUICK_TICKETS.forEach((item) => {
      initial[item.id] = 'Pending';
    });
    // Seed initial realistic states for demonstration
    initial['SCN-01'] = 'Resolved';
    initial['SCN-09'] = 'Escalated';
    return initial;
  });

  /**
   * Loads a test scenario ticket into the interactive query editor
   */
  const handleSelectSample = (item: SampleQuickTicket) => {
    setActiveTicketId(item.id);
    setSelectedSample(item.text);
    setQuery(item.text);
  };

  /**
   * Updates the lifecycle status for a given ticket ID (e.g. from manual badge clicks)
   */
  const handleUpdateStatus = (ticketId: string, newStatus: TicketLifecycleState) => {
    setTicketLifecycles((prev) => ({
      ...prev,
      [ticketId]: newStatus,
    }));
  };

  // Determine current lifecycle state of active ticket
  const currentStatus: TicketLifecycleState =
    (activeTicketId && ticketLifecycles[activeTicketId]) || 'Pending';

  /**
   * Dispatches the ticket query through the end-to-end agentic pipeline
   */
  const handleRun = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setLoadingStep('Sanitizing query & running Classifier...');

    try {
      // Micro-stepped visual progress feedback for stage transitions
      setTimeout(() => setLoadingStep('Querying Vector Index & Computing Cosine Similarities...'), 150);
      setTimeout(() => setLoadingStep('Evaluating Decision Router & Synthesizing Answer...'), 350);

      // Execute full orchestrator run
      const res = await defaultOrchestrator.handleTicket(query, config);
      setResult(res);

      // Automatically sync lifecycle state from policy routing outcome:
      // AUTO_RESOLVE marks as 'Resolved', whereas human escalations or hazards mark as 'Escalated'
      const isAutoResolved = res.action === Action.AUTO_RESOLVE && !res.requires_human;
      const newStatus: TicketLifecycleState = isAutoResolved ? 'Resolved' : 'Escalated';

      const targetKey = activeTicketId || 'CUST-01';
      setTicketLifecycles((prev) => ({
        ...prev,
        [targetKey]: newStatus,
      }));
    } catch (err) {
      console.error('Orchestration error:', err);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleReset = () => {
    setQuery('');
    setSelectedSample('');
    setActiveTicketId(null);
    setResult(null);
  };

  // Filtered sample tickets
  const filteredSamples = SAMPLE_QUICK_TICKETS.filter((item) => {
    const itemStatus = ticketLifecycles[item.id] || 'Pending';

    // Status filter
    if (statusFilter !== 'all' && itemStatus !== statusFilter) {
      return false;
    }

    // Scenario filter
    if (scenarioFilter === 'resolve') {
      return item.scenarioType === 'resolve';
    }
    if (scenarioFilter === 'hazard') {
      return item.scenarioType === 'hazard';
    }
    if (scenarioFilter === 'escalate') {
      return item.scenarioType === 'hazard' || item.scenarioType === 'urgency' || item.scenarioType === 'low_conf';
    }
    return true;
  });

  // Calculate lifecycle counts
  const pendingCount = Object.values(ticketLifecycles).filter((s) => s === 'Pending').length;
  const resolvedCount = Object.values(ticketLifecycles).filter((s) => s === 'Resolved').length;
  const escalatedCount = Object.values(ticketLifecycles).filter((s) => s === 'Escalated').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ticket-assistant-view">
      {/* Left Column: Input and Sample Tickets */}
      <div className="lg:col-span-5 space-y-5">
        {/* Sample tickets selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Test Scenarios & Ticket Queue
              </span>
              <span className="text-[11px] text-slate-400">
                Track lifecycle state per ticket (click badge to toggle)
              </span>
            </div>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {filteredSamples.length} / {SAMPLE_QUICK_TICKETS.length}
            </span>
          </div>

          {/* Lifecycle State Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> State:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors text-[11px] font-mono font-medium ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({SAMPLE_QUICK_TICKETS.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className={`px-2 py-0.5 rounded-md transition-colors text-[11px] font-mono font-medium inline-flex items-center gap-1 ${
                statusFilter === 'Pending'
                  ? 'bg-slate-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-2.5 h-2.5" />
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Resolved')}
              className={`px-2 py-0.5 rounded-md transition-colors text-[11px] font-mono font-medium inline-flex items-center gap-1 ${
                statusFilter === 'Resolved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              Resolved ({resolvedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Escalated')}
              className={`px-2 py-0.5 rounded-md transition-colors text-[11px] font-mono font-medium inline-flex items-center gap-1 ${
                statusFilter === 'Escalated'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowUpRight className="w-2.5 h-2.5" />
              Escalated ({escalatedCount})
            </button>
          </div>

          {/* Scenario category filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Domains' },
              { id: 'resolve', label: 'Resolvable' },
              { id: 'hazard', label: 'Hazards' },
              { id: 'escalate', label: 'Escalations' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setScenarioFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs font-medium ${
                  scenarioFilter === f.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Samples list with Status Badge next to each ticket */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1" id="tickets-queue-list">
            {filteredSamples.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 italic font-mono">
                No tickets found matching the active filter.
              </div>
            ) : (
              filteredSamples.map((item) => {
                const status = ticketLifecycles[item.id] || 'Pending';
                const isSelected = selectedSample === item.text || activeTicketId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs transition-all border font-sans ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    {/* Ticket Title & ID */}
                    <button
                      type="button"
                      onClick={() => handleSelectSample(item)}
                      className="flex-1 text-left min-w-0 flex items-center gap-2 cursor-pointer"
                      title={`${item.id}: ${item.text}`}
                    >
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                        {item.id}
                      </span>
                      <span
                        className={`truncate font-medium ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>

                    {/* Lifecycle Status Badge Next to Each Ticket */}
                    <div className="shrink-0 flex items-center">
                      <TicketStatusBadge
                        status={status}
                        size="sm"
                        interactive={true}
                        onStatusChange={(newStatus) => handleUpdateStatus(item.id, newStatus)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRun} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <label
                htmlFor="ticket-query-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Ticket Query & Details
              </label>

              {/* Active Ticket Status Badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">State:</span>
                <TicketStatusBadge
                  status={currentStatus}
                  size="sm"
                  interactive={true}
                  onStatusChange={(newStatus) => {
                    const idToUpdate = activeTicketId || 'CUST-01';
                    handleUpdateStatus(idToUpdate, newStatus);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    enableWebSearch: !prev.enableWebSearch,
                    generationMode: !prev.enableWebSearch ? 'gemini' : prev.generationMode,
                  }))
                }
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                  config.enableWebSearch
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
                title="Enable live Google Search Grounding for internet vendor documentation"
              >
                <Globe className="w-3 h-3" />
                <span>{config.enableWebSearch ? 'Web Search: ON' : 'Web Search'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    generationMode: prev.generationMode === 'gemini' ? 'extractive' : 'gemini',
                  }))
                }
                className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 transition-colors"
                title="Toggle Extractive vs. Gemini Generation"
              >
                {config.generationMode === 'gemini' ? (
                  <>
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Gemini</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3 h-3" />
                    <span>Extractive</span>
                  </>
                )}
              </button>

              {query && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors p-1"
                  title="Clear input"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <textarea
            id="ticket-query-input"
            rows={4}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // If query changed and doesn't match selectedSample, switch to custom ticket
              if (e.target.value !== selectedSample) {
                setActiveTicketId('CUST-01');
              }
            }}
            placeholder="e.g. My Mac battery drains in 30 minutes, or Zoom says screen recording permissions needed, or BitLocker recovery prompt on startup..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans transition-all resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Auto-Resolve Bar:{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {(config.autoResolveThreshold * 100).toFixed(0)}%
              </span>
            </div>

            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              id="submit-ticket-btn"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute Pipeline</span>
                </>
              )}
            </button>
          </div>

          {loading && loadingStep && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg text-xs font-mono text-blue-700 dark:text-blue-300 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
              <span>{loadingStep}</span>
            </div>
          )}
        </form>
      </div>

      {/* Right Column: Execution Output & Pipeline Trace */}
      <div className="lg:col-span-7">
        {result ? (
          <div className="space-y-5">
            <DecisionConfidenceCard
              result={result}
              config={config}
              status={currentStatus}
              onStatusChange={(newStatus) => {
                const targetKey = activeTicketId || 'CUST-01';
                handleUpdateStatus(targetKey, newStatus);
              }}
            />
            <PipelineTrace result={result} />
            <ResultPanel
              result={result}
              status={currentStatus}
              onStatusChange={(newStatus) => {
                const targetKey = activeTicketId || 'CUST-01';
                handleUpdateStatus(targetKey, newStatus);
              }}
            />
          </div>
        ) : (
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-white/40 dark:bg-slate-900/40">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Ticket Orchestration Ready
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-sans mb-5">
              Submit an enterprise support request or choose a pre-configured test scenario on the left. The agent will classify the domain, retrieve grounded documentation, consult live web vendors, and determine the safety threshold.
            </p>

            {/* Stage badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-lg text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                1. Classification
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                2. Vector RAG
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                3. Web Grounding
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                4. Policy Router
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

