import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  FolderSearch,
  Filter,
  Search,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ImpersonationAlert, AlertSeverity, AlertStatus } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const AlertsPage: React.FC = () => {
  const { alerts, updateAlertStatus, createInvestigation } = useData();
  const navigate = useNavigate();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<ImpersonationAlert | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = alert.title.toLowerCase().includes(q);
      const matchDesc = alert.description.toLowerCase().includes(q);
      const matchCaller = alert.caller_number?.toLowerCase().includes(q);
      const matchTarget = alert.target_individual?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCaller && !matchTarget) return false;
    }
    return true;
  });

  const handleEscalateToInvestigation = async (alert: ImpersonationAlert) => {
    await updateAlertStatus(alert.id, 'investigating');
    await createInvestigation({
      user_id: 'usr_current',
      title: `Investigation: ${alert.title}`,
      description: `Escalated from threat alert ${alert.id}. ${alert.description}`,
      priority: alert.severity === 'critical' ? 'urgent' : 'high',
      status: 'open',
      assigned_to: 'Tier-2 Incident Response',
      detected_caller: alert.caller_number,
      target_individual: alert.target_individual || alert.target_identity,
    });
    setSelectedAlert(null);
    navigate('/investigations');
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700/80';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Impersonation Threat Alerts
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Prioritized alert queue for suspicious voice interactions, failed biometric validations, and acoustic anomalies.
        </p>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts by title or target..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </span>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Matching Threat Alerts"
          description="There are currently no alerts matching your active filter criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setSeverityFilter('all');
            setStatusFilter('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              onClick={() => setSelectedAlert(alt)}
              className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 transition hover:border-blue-500/40 hover:bg-slate-850/60 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/60 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize border ${getSeverityBadge(
                      alt.severity
                    )}`}
                  >
                    {alt.severity}
                  </span>
                  <span className="font-mono text-xs text-blue-400 font-medium">{alt.id}</span>
                  {alt.status === 'new' && (
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {new Date(alt.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 capitalize border border-slate-700/60">
                    {alt.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm group-hover:text-blue-400 transition">
                    {alt.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">{alt.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase">Spoof Risk</span>
                    <span
                      className={`text-sm font-semibold font-mono ${
                        (alt.spoof_score ?? alt.spoof_probability) > 70 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {alt.spoof_score ?? alt.spoof_probability}%
                    </span>
                  </div>

                  <span className="rounded-lg border border-slate-800 bg-slate-800/50 p-2 text-slate-400 group-hover:border-blue-500/40 group-hover:text-blue-400 transition">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize border ${getSeverityBadge(
                    selectedAlert.severity
                  )}`}
                >
                  {selectedAlert.severity} Priority
                </span>
                <h3 className="text-base font-semibold text-white mt-2">{selectedAlert.title}</h3>
              </div>
              <span className="font-mono text-xs text-slate-400">{selectedAlert.id}</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Detected Caller:</span>
                  <span className="text-slate-200 font-semibold">{selectedAlert.caller_number || 'Unknown Trunk'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Target Impersonated:</span>
                  <span className="text-rose-400 font-semibold">{selectedAlert.target_individual || 'High-Value Target'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Spoof Probability:</span>
                  <span className="text-rose-400 font-bold font-mono text-sm">
                    {selectedAlert.spoof_score ?? selectedAlert.spoof_probability}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Current Status:</span>
                  <span className="text-blue-400 font-medium capitalize">{selectedAlert.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Incident Description</span>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {selectedAlert.description}
                </p>
              </div>

              {selectedAlert.anomaly_tags && (
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Anomaly Telemetry Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAlert.anomaly_tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] text-rose-300 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4">
              <div className="flex items-center gap-2">
                {selectedAlert.status !== 'acknowledged' && (
                  <button
                    onClick={() => {
                      updateAlertStatus(selectedAlert.id, 'acknowledged');
                      setSelectedAlert(null);
                    }}
                    className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                  >
                    Acknowledge
                  </button>
                )}
                {selectedAlert.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      updateAlertStatus(selectedAlert.id, 'resolved');
                      setSelectedAlert(null);
                    }}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
                  >
                    Resolve
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-900 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleEscalateToInvestigation(selectedAlert)}
                  className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-500 shadow-sm transition"
                >
                  Open Investigation →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
