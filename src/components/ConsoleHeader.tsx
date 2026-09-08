import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Cpu,
  Sun,
  Moon,
  Bot,
  BarChart3,
  BookOpen,
  Globe,
  Headphones,
} from 'lucide-react';
import { PipelineConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ConsoleHeaderProps {
  kbCount: number;
  config: PipelineConfig;
  setConfig?: React.Dispatch<React.SetStateAction<PipelineConfig>>;
  onOpenSettings?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  kbCount,
  config,
  setConfig,
  onOpenSettings,
  activeTab,
  setActiveTab,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasGeminiKey(Boolean(data.hasGeminiKey));
        if (data.hasGeminiKey && setConfig) {
          setConfig((prev) => ({ ...prev, generationMode: 'gemini' }));
        }
      })
      .catch(() => setHasGeminiKey(false));
  }, [setConfig]);

  const tabs = [
    { id: 'assistant', label: 'Ticket Assistant', icon: Bot },
    { id: 'kpis', label: 'KPI Dashboard', icon: BarChart3 },
    { id: 'kb', label: `Knowledge Base (${kbCount})`, icon: BookOpen },
    { id: 'tuning', label: 'Thresholds & Audit', icon: Sliders },
  ];

  return (
    <header className="border-b pb-5 transition-colors border-slate-200 dark:border-slate-800" id="console-header">
      {/* Top row: Brand & Global Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                IT Helpdesk Console
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60 font-mono">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Full-Stack Agentic RAG · Hybrid Vector Index · Google Web Grounding · Automated Routing
            </p>
          </div>
        </div>

        {/* Status badges & Action controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* KB status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">KB:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{kbCount} docs</span>
          </div>

          {/* Gemini API Key Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors shadow-2xs ${
              hasGeminiKey
                ? 'bg-blue-50/80 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-300'
                : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
            title={
              hasGeminiKey
                ? 'Google Gemini API Active with Google Search Grounding'
                : 'Extractive RAG Mode'
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {hasGeminiKey === null
                ? 'Checking...'
                : hasGeminiKey
                ? 'Gemini 3.8'
                : 'Extractive'}
            </span>
            {hasGeminiKey && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
          </div>

          {/* Mode Switcher Button */}
          {setConfig && (
            <button
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  generationMode: prev.generationMode === 'gemini' ? 'extractive' : 'gemini',
                }))
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              title="Toggle generation engine"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{config.generationMode === 'gemini' ? 'LLM' : 'Template'}</span>
            </button>
          )}

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              title="Tune Decision Thresholds"
              aria-label="Tune Decision Thresholds"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="flex items-center gap-1.5 mt-5 p-1 bg-slate-200/60 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 w-fit" aria-label="Console Navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
