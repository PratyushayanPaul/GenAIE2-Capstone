/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ConsoleHeader } from './components/ConsoleHeader';
import { TicketAssistant } from './components/TicketAssistant';
import { KpiDashboard } from './components/KpiDashboard';
import { KnowledgeBaseExplorer } from './components/KnowledgeBaseExplorer';
import { ThresholdTuner } from './components/ThresholdTuner';
import { PipelineConfig } from './types';
import { RAW_KB_DOCUMENTS } from './data/kbData';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Layers, Activity, GitBranch, ShieldCheck } from 'lucide-react';

function AppContent() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('assistant');
  const [kbCount, setKbCount] = useState<number>(RAW_KB_DOCUMENTS.length);
  const [config, setConfig] = useState<PipelineConfig>({
    autoResolveThreshold: 0.15,
    highUrgencyThreshold: 0.30,
    generationMode: 'gemini',
    topK: 3,
    enableWebSearch: true,
  });

  useEffect(() => {
    fetch('/api/kb')
      .then((res) => res.json())
      .then((data) => {
        if (data.documents && Array.isArray(data.documents)) {
          setKbCount(data.documents.length);
        }
      })
      .catch(() => {});
  }, [activeTab]);

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#0B0F17] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200'
          : 'bg-slate-50 text-slate-900 selection:bg-blue-500/20 selection:text-blue-700'
      }`}
    >
      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* Console Header with Navigation */}
        <ConsoleHeader
          kbCount={kbCount}
          config={config}
          setConfig={setConfig}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setActiveTab('tuning')}
        />

        {/* Tab Content */}
        <main className="transition-opacity duration-200 mt-6" id="main-console-content">
          {activeTab === 'assistant' && (
            <TicketAssistant config={config} setConfig={setConfig} />
          )}

          {activeTab === 'kpis' && <KpiDashboard />}

          {activeTab === 'kb' && <KnowledgeBaseExplorer />}

          {activeTab === 'tuning' && (
            <ThresholdTuner config={config} setConfig={setConfig} />
          )}
        </main>
      </div>

      {/* Console Operations Footer */}
      <footer
        className={`border-t py-4 px-6 text-xs font-mono transition-colors ${
          theme === 'dark'
            ? 'border-slate-800/80 bg-[#0B0F17] text-slate-400'
            : 'border-slate-200/90 bg-white/60 text-slate-500'
        }`}
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Pipeline:
            </span>
            <span>
              Classifier → Vector Retrieval (Cosine TF-IDF) → Google Grounding & GenAI → Decision Router
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] shrink-0">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{kbCount} Articles Indexed</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safety Override Active</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
