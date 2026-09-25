import React from 'react';
import { Activity, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { RiskBadge } from '../components/common/RiskBadge';

export const DashboardPage = () => {
  const { analyses, isSupabaseConnected } = useData();
  const highRisk = analyses.filter((a) => a.result_label === 'synthetic_clone' || a.result_label === 'suspicious').length;
  const authentic = analyses.filter((a) => a.result_label === 'authentic').length;
  const averageLatency = analyses.length
    ? Math.round(analyses.reduce((sum, a) => sum + (a.processing_time_ms ?? 0), 0) / analyses.length)
    : 0;

  const cards = [
    { label: 'Real analyses', value: analyses.length, icon: Activity, color: 'text-blue-400' },
    { label: 'Likely synthetic', value: highRisk, icon: ShieldAlert, color: 'text-rose-400' },
    { label: 'Authentic results', value: authentic, icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'Average CPU latency', value: `${averageLatency} ms`, icon: Clock, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold text-foreground">Real Analysis Dashboard</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Values come from completed analyses in this browser session{isSupabaseConnected ? ' and Supabase when authenticated' : ''}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`mt-3 text-2xl font-semibold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Real Results</h2>
        </div>
        {analyses.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No analyses yet. Upload a real audio file from Analyze.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {analyses.slice(0, 8).map((analysis) => (
              <div key={analysis.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{analysis.file_name || 'Unnamed audio'}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleString()} · {analysis.processing_time_ms ?? 0} ms
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-foreground">{analysis.spoof_risk_score}% spoof risk</span>
                  <RiskBadge level={analysis.risk_level} resultLabel={analysis.result_label} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
