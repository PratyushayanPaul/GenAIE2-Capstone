import React, { useState, useEffect } from 'react';
import { PipelineConfig, Action } from '../types';
import { SAMPLE_QUICK_TICKETS } from '../data/demoTickets';
import { defaultOrchestrator } from '../engine/orchestrator';
import { Sliders, RotateCcw, ShieldCheck, Flame, AlertTriangle, Sparkles, Cpu, CheckCircle2 } from 'lucide-react';

interface ThresholdTunerProps {
  config: PipelineConfig;
  setConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
}

export const ThresholdTuner: React.FC<ThresholdTunerProps> = ({ config, setConfig }) => {
  const [simResults, setSimResults] = useState<
    Array<{ text: string; action: Action; confidence: number; category: string; urgency: string }>
  >([]);

  useEffect(() => {
    let active = true;
    const runSim = async () => {
      const results = [];
      for (const item of SAMPLE_QUICK_TICKETS) {
        const res = await defaultOrchestrator.handleTicket(item.text, config);
        results.push({
          text: item.text,
          action: res.action,
          confidence: res.retrieval_confidence,
          category: res.category,
          urgency: res.urgency,
        });
      }
      if (active) setSimResults(results);
    };
    runSim();
    return () => {
      active = false;
    };
  }, [config.autoResolveThreshold, config.highUrgencyThreshold, config.topK]);

  const resetDefaults = () => {
    setConfig({
      autoResolveThreshold: 0.15,
      highUrgencyThreshold: 0.30,
      generationMode: 'gemini',
      topK: 3,
      enableWebSearch: true,
    });
  };

  const autoCount = simResults.filter((r) => r.action === Action.AUTO_RESOLVE).length;
  const escCount = simResults.length - autoCount;

  return (
    <div className="space-y-6" id="threshold-tuning-view">
      {/* Configuration Sliders Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">
                Routing Policy Thresholds & Orchestration Parameters
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrate autonomous deflection vs human escalation criteria in real-time
              </p>
            </div>
          </div>
          <button
            onClick={resetDefaults}
            className="text-xs font-mono text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Threshold 1: Auto-Resolve Confidence */}
          <div className="space-y-2 p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                1. Auto-Resolve Confidence Bar
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm">
                {(config.autoResolveThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={config.autoResolveThreshold}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  autoResolveThreshold: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Tickets with top semantic similarity below this bar are escalated to prevent hallucinated
              or irrelevant advice (<code className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-medium">ESCALATE_LOW_CONFIDENCE</code>).
            </p>
          </div>

          {/* Threshold 2: High Urgency Strict Bar */}
          <div className="space-y-2 p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                2. High-Urgency Strict Bar
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">
                {(config.highUrgencyThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.60"
              step="0.01"
              value={config.highUrgencyThreshold}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  highUrgencyThreshold: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Tickets flagged with high business urgency require a higher confidence threshold to
              auto-resolve, ensuring critical issues receive human confirmation (<code className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-medium">ESCALATE_HIGH_URGENCY</code>).
            </p>
          </div>

          {/* Setting 3: Top-K Retrieval Chunks */}
          <div className="space-y-2 p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                3. Retrieval Top-K Sources
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-mono font-bold text-sm">
                {config.topK} Chunks
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={config.topK}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  topK: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Number of nearest neighbor chunks fetched from the vector index to formulate resolutions.
            </p>
          </div>

          {/* Setting 4: Generation Engine */}
          <div className="space-y-2 p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block font-sans">
              4. Response Generation Engine
            </span>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, generationMode: 'extractive' }))}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  config.generationMode === 'extractive'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
                }`}
              >
                Extractive Template
              </button>
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, generationMode: 'gemini' }))}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  config.generationMode === 'gemini'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
                }`}
              >
                Gemini 3.8 Flash
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              {config.generationMode === 'gemini'
                ? 'Synthesizes natural, context-grounded replies with live web verification.'
                : 'Pulls the direct resolution string extracted from the top-matching KB document.'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Simulation Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Live Calibration Simulation on Test Scenarios
          </span>
          <div className="flex items-center gap-3 text-xs font-sans">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Auto-resolve: {autoCount}
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Escalated: {escCount}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg">
          {simResults.map((item, idx) => {
            const isAuto = item.action === Action.AUTO_RESOLVE;
            const isSafety = item.action === Action.ESCALATE_SAFETY;

            return (
              <div
                key={idx}
                className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-slate-900 dark:text-slate-100 font-sans font-medium truncate">
                    {item.text}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Category: {item.category} · Urgency: {item.urgency}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-medium">
                    sim: {(item.confidence * 100).toFixed(0)}%
                  </span>
                  <span
                    className={`font-mono text-[11px] px-2.5 py-1 rounded-md border inline-flex items-center gap-1 font-medium ${
                      isAuto
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : isSafety
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {isAuto && <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    {isSafety && <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                    {!isAuto && !isSafety && <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                    {item.action}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
