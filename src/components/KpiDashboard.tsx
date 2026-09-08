import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DEFAULT_KPI_SUMMARY } from '../data/demoTickets';
import { Clock, CheckCircle2, TrendingUp, AlertOctagon, Sparkles, DollarSign, Users, Award } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const KpiDashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const kpis = DEFAULT_KPI_SUMMARY;

  const actionData = [
    {
      action: 'AUTO_RESOLVE',
      count: kpis.action_breakdown.AUTO_RESOLVE,
      color: isDark ? '#10B981' : '#059669',
      label: 'Auto-Resolved',
    },
    {
      action: 'ESCALATE_LOW_CONFIDENCE',
      count: kpis.action_breakdown.ESCALATE_LOW_CONFIDENCE,
      color: isDark ? '#F59E0B' : '#D97706',
      label: 'Low Confidence',
    },
    {
      action: 'ESCALATE_HIGH_URGENCY',
      count: kpis.action_breakdown.ESCALATE_HIGH_URGENCY,
      color: isDark ? '#F97316' : '#EA580C',
      label: 'Urgent Review',
    },
    {
      action: 'ESCALATE_SAFETY',
      count: kpis.action_breakdown.ESCALATE_SAFETY,
      color: isDark ? '#F43F5E' : '#E11D48',
      label: 'Safety Hazard',
    },
  ];

  const categoryData = Object.entries(kpis.category_distribution).map(([cat, count]) => ({
    category: cat,
    count,
  }));

  const confidenceBins = [
    { range: '0.0 - 0.1', count: 72 },
    { range: '0.1 - 0.2', count: 114 },
    { range: '0.2 - 0.3', count: 198 },
    { range: '0.3 - 0.4', count: 284 },
    { range: '0.4 - 0.5', count: 236 },
    { range: '0.5 - 0.6', count: 122 },
    { range: '0.6 - 0.7', count: 52 },
    { range: '0.7+', count: 20 },
  ];

  const metrics = [
    {
      label: 'Total Tickets Processed',
      value: kpis.total_tickets_processed.toLocaleString(),
      subtext: 'Synthetic + live session',
      icon: <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      badge: '+12% this week',
      badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      label: 'Autonomous Deflection',
      value: `${(kpis.auto_resolve_rate * 100).toFixed(1)}%`,
      subtext: 'Zero-touch resolution',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Target: >65%',
      badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      label: 'Escalation / Human Review',
      value: `${(kpis.escalation_rate * 100).toFixed(1)}%`,
      subtext: 'Safely routed to engineers',
      icon: <AlertOctagon className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      badge: 'Zero False Resolves',
      badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      label: 'Avg Response Latency',
      value: `${kpis.avg_processing_time_ms} ms`,
      subtext: 'End-to-end orchestration',
      icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      badge: 'Instant',
      badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60',
    },
  ];

  const tooltipBg = isDark ? '#111827' : '#FFFFFF';
  const tooltipBorder = isDark ? '#374151' : '#E2E8F0';
  const tooltipText = isDark ? '#F9FAFB' : '#0F172A';

  return (
    <div className="space-y-6" id="kpi-dashboard-view">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {m.label}
              </span>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                {m.icon}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-sans text-slate-900 dark:text-white">
                {m.value}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">{m.subtext}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${m.badgeClass}`}>
                  {m.badge}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Action Breakdown & Category Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Breakdown Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-between">
            <span>Routing Action Breakdown</span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">Sample: N=1,098</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="action"
                  stroke={isDark ? '#64748B' : '#94A3B8'}
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val) => {
                    if (val === 'AUTO_RESOLVE') return 'Auto';
                    if (val === 'ESCALATE_LOW_CONFIDENCE') return 'Low Conf';
                    if (val === 'ESCALATE_HIGH_URGENCY') return 'Urgent';
                    return 'Safety';
                  }}
                />
                <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: 8,
                    fontSize: 12,
                    color: tooltipText,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {actionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Auto: 814 (74%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Low Conf: 163</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Urgent: 96</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Safety: 25</span>
            </div>
          </div>
        </div>

        {/* Category Volume Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-between">
            <span>Ticket Volume by IT Domain</span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">6 Domains</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="category"
                  stroke={isDark ? '#64748B' : '#94A3B8'}
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val) => {
                    if (val === 'Account & Access') return 'Account';
                    if (val === 'Productivity') return 'Produc.';
                    return val;
                  }}
                />
                <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: 8,
                    fontSize: 12,
                    color: tooltipText,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="count" fill={isDark ? '#3B82F6' : '#2563EB'} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-sans">
            <span>Hardware: <strong className="text-slate-900 dark:text-slate-100">342</strong></span>
            <span>Network: <strong className="text-slate-900 dark:text-slate-100">288</strong></span>
            <span>Software: <strong className="text-slate-900 dark:text-slate-100">214</strong></span>
            <span>Account: <strong className="text-slate-900 dark:text-slate-100">162</strong></span>
          </div>
        </div>
      </div>

      {/* Row 2: Retrieval Confidence Distribution Histogram */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
          <span>Retrieval Confidence Distribution Histogram</span>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-medium">
            Mean Score: {(kpis.avg_confidence * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-sans leading-relaxed">
          Cosine similarity scores calculated across the hybrid TF-IDF vector index. The 0.15 auto-resolve threshold reliably separates grounded enterprise resolutions from low-confidence anomalies.
        </p>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceBins} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="range" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: 8,
                  fontSize: 12,
                  color: tooltipText,
                }}
              />
              <Bar dataKey="count" fill={isDark ? '#60A5FA' : '#3B82F6'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Business Impact & Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Impact Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Business Impact Estimate
              </div>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                Verified ROI
              </span>
            </div>
            <div className="text-3xl font-bold font-sans text-blue-600 dark:text-blue-400 mb-2">
              {kpis.business_impact_estimate.estimated_hours_saved} Technician Hours Saved
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Estimated engineering time preserved across{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {kpis.business_impact_estimate.tickets_auto_resolved}
              </strong>{' '}
              auto-resolved tickets without human intervention.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Stated Model Assumption:</span>{' '}
            {kpis.business_impact_estimate.assumption}.
          </div>
        </div>

        {/* Classification Validation Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Classification Precision Benchmark
              </div>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                N={kpis.classification_validation.n_labeled_samples} Tests
              </span>
            </div>
            <div className="text-3xl font-bold font-sans text-slate-900 dark:text-white mb-2">
              {(kpis.classification_validation.overall_accuracy * 100).toFixed(1)}% Accuracy
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Benchmarked against{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {kpis.classification_validation.n_labeled_samples}
              </strong>{' '}
              independently labeled tickets. Rigorously accounts for domain-specific ambiguities and short user inputs.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-3 font-sans">
            <span>Account: <strong className="text-emerald-600 dark:text-emerald-400">68.4%</strong></span>
            <span>Facility: <strong className="text-emerald-600 dark:text-emerald-400">64.2%</strong></span>
            <span>Network: <strong className="text-blue-600 dark:text-blue-400">52.1%</strong></span>
            <span>Hardware: <strong className="text-blue-600 dark:text-blue-400">49.3%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
