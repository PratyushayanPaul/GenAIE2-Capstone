import React, { useState } from 'react';
import { SAMPLE_QUICK_TICKETS } from '../data/demoTickets';
import { PipelineConfig, TicketResolution } from '../types';
import { defaultOrchestrator } from '../engine/orchestrator';
import { PipelineTrace } from './PipelineTrace';
import { ResultPanel } from './ResultPanel';
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
} from 'lucide-react';

interface TicketAssistantProps {
  config: PipelineConfig;
  setConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
}

export const TicketAssistant: React.FC<TicketAssistantProps> = ({ config, setConfig }) => {
  const [query, setQuery] = useState('');
  const [selectedSample, setSelectedSample] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState<'all' | 'resolve' | 'hazard' | 'escalate'>('all');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [result, setResult] = useState<TicketResolution | null>(null);

  const handleSelectSample = (text: string) => {
    setSelectedSample(text);
    setQuery(text);
  };

  const handleRun = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setLoadingStep('Sanitizing query & running Classifier...');

    try {
      setTimeout(() => setLoadingStep('Querying Vector Index & Computing Cosine Similarities...'), 150);
      setTimeout(() => setLoadingStep('Evaluating Decision Router & Synthesizing Answer...'), 350);

      const res = await defaultOrchestrator.handleTicket(query, config);
      setResult(res);
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
    setResult(null);
  };

  // Filtered sample tickets
  const filteredSamples = SAMPLE_QUICK_TICKETS.filter((item) => {
    if (scenarioFilter === 'resolve') {
      return (
        item.label.toLowerCase().includes('password') ||
        item.label.toLowerCase().includes('vpn') ||
        item.label.toLowerCase().includes('screen') ||
        item.label.toLowerCase().includes('excel') ||
        item.label.toLowerCase().includes('wifi')
      );
    }
    if (scenarioFilter === 'hazard') {
      return (
        item.label.toLowerCase().includes('smoke') ||
        item.label.toLowerCase().includes('burning') ||
        item.label.toLowerCase().includes('urgent')
      );
    }
    if (scenarioFilter === 'escalate') {
      return (
        item.label.toLowerCase().includes('meaning') ||
        item.label.toLowerCase().includes('smoke') ||
        item.label.toLowerCase().includes('vpn down')
      );
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ticket-assistant-view">
      {/* Left Column: Input and Sample Tickets */}
      <div className="lg:col-span-5 space-y-5">
        {/* Sample tickets selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Test Scenarios
            </span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {filteredSamples.length} available
            </span>
          </div>

          {/* Scenario quick filters */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Cases' },
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

          {/* Samples list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredSamples.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(item.text)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all truncate block font-sans ${
                  selectedSample === item.text
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-medium'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80'
                }`}
                title={item.text}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRun} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="ticket-query-input"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Ticket Query & Details
            </label>
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
            onChange={(e) => setQuery(e.target.value)}
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
            <PipelineTrace result={result} />
            <ResultPanel result={result} />
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
