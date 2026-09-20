import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Activity,
  FileAudio,
  TrendingUp,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Eye,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { AudioAnalysis } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { analyses, alerts, speakerProfiles, backendConfig, resetToDemoSeed } = useData();
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState<AudioAnalysis | null>(null);

  // Derived metrics from actual data
  const totalAnalyses = analyses.length;
  const suspiciousDetections = analyses.filter(
    (a) => a.risk_level === 'high' || a.risk_level === 'critical' || a.result_label === 'synthetic_clone'
  ).length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const verifiedSafeCount = analyses.filter((a) => a.risk_level === 'safe' || a.result_label === 'authentic').length;
  const verificationSuccessRate = totalAnalyses > 0 ? ((verifiedSafeCount / totalAnalyses) * 100).toFixed(1) : '100.0';

  // Chart data: Trend over time
  const timelineData = [
    { time: '08:00', authentic: 12, spoof: 1 },
    { time: '10:00', authentic: 19, spoof: 3 },
    { time: '12:00', authentic: 24, spoof: 2 },
    { time: '14:00', authentic: 32, spoof: 5 },
    { time: '16:00', authentic: 28, spoof: 4 },
    { time: '18:00', authentic: 35, spoof: 2 },
    { time: 'Now', authentic: verifiedSafeCount, spoof: suspiciousDetections },
  ];

  // Chart data: Risk Distribution
  const riskDistribution = [
    { name: 'Authentic / Safe', value: verifiedSafeCount || 1, color: '#10b981' },
    {
      name: 'High / Critical Spoof',
      value: suspiciousDetections || 1,
      color: '#f43f5e',
    },
    {
      name: 'Medium / Under Review',
      value: analyses.filter((a) => a.risk_level === 'medium').length || 1,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Good morning, {user?.full_name || 'Security Analyst'}
            </h2>
            {backendConfig.demoMode && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                Simulated Telemetry
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time voice authenticity telemetry, synthetic artifact anomalies, and impersonation triage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/live-detection')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 transition"
          >
            <Radio className="h-4 w-4 text-white" />
            <span>Launch Live Detection</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Voice Analyses"
          value={totalAnalyses}
          subtitle="Live streams & audio uploads"
          icon={Activity}
          iconColor="text-blue-400"
          badge="24h Window"
        />

        <StatCard
          title="Suspicious Detections"
          value={suspiciousDetections}
          subtitle="Acoustic anomaly flags"
          change={suspiciousDetections > 0 ? `+${suspiciousDetections} flagged` : 'Zero threats'}
          changeType={suspiciousDetections > 0 ? 'negative' : 'positive'}
          icon={AlertOctagon}
          iconColor="text-rose-400"
        />

        <StatCard
          title="Critical Alerts"
          value={criticalAlerts}
          subtitle="Step-up challenges triggered"
          icon={AlertTriangle}
          iconColor="text-amber-400"
        />

        <StatCard
          title="Authenticity Rate"
          value={`${verificationSuccessRate}%`}
          subtitle="Biometric baseline match"
          change="+1.4% consistency"
          changeType="positive"
          icon={ShieldCheck}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Detection Activity Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Detection Telemetry Trend
              </h3>
              <p className="text-[11px] text-slate-400">Authentic vs Spoof stream classifications</p>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Engine: RawNet3 Multi-band</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSpoof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e2e8f0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="authentic"
                  name="Authentic Human"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAuth)"
                />
                <Area
                  type="monotone"
                  dataKey="spoof"
                  name="Cloned / Synthetic"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSpoof)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="border-b border-slate-800/80 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Risk Profile Distribution
            </h3>
            <p className="text-[11px] text-slate-400">Classified voice interaction volume</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#090d16" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {riskDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-medium text-slate-400">{item.value} calls</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 p-4 sm:px-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Recent Voice Interception & Analysis Activity
            </h3>
            <p className="text-[11px] text-slate-400">Live stream detections and uploaded audio evaluations</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
          >
            View all audit logs →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 sm:px-6">Analysis ID</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Source Type</th>
                <th className="py-3 px-4">Claimed Identity</th>
                <th className="py-3 px-4">Authenticity</th>
                <th className="py-3 px-4">Spoof Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analyses.slice(0, 5).map((ana) => (
                <tr key={ana.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] font-medium text-blue-400">{ana.id}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(ana.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-slate-300 capitalize">
                      {ana.source_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">{ana.speaker_name || 'Unclaimed / Unknown'}</td>
                  <td className="py-3.5 px-4">
                    <RiskBadge level={ana.risk_level} resultLabel={ana.result_label} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    <span
                      className={
                        ana.spoof_risk_score > 70
                          ? 'text-rose-400'
                          : ana.spoof_risk_score > 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {ana.spoof_risk_score}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 capitalize">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {ana.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedAnalysis(ana)}
                      className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition"
                      title="Inspect acoustic anomalies"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Detail Modal Drawer */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <span className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider">
                  Acoustic Forensic Record
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">{selectedAnalysis.id}</h3>
              </div>
              <RiskBadge level={selectedAnalysis.risk_level} resultLabel={selectedAnalysis.result_label} />
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">Source Type</span>
                  <span className="text-slate-200 font-medium capitalize">{selectedAnalysis.source_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Claimed Speaker</span>
                  <span className="text-slate-200 font-medium">{selectedAnalysis.speaker_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Spoof Probability</span>
                  <span className="text-rose-400 font-bold text-sm">{selectedAnalysis.spoof_risk_score}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Model Confidence</span>
                  <span className="text-blue-400 font-bold text-sm">{selectedAnalysis.model_confidence}%</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-200 mb-2">
                  Acoustic Artifacts Breakdown
                </h4>
                <div className="space-y-2">
                  {selectedAnalysis.spectral_artifacts?.map((art, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-200">{art.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            art.status === 'anomaly_detected'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {art.score}% {art.status === 'anomaly_detected' ? 'Anomaly' : 'Normal'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{art.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80">
                <span className="text-[11px] text-blue-400 font-semibold block mb-1">
                  Model Diagnostic Explanation
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">{selectedAnalysis.explanation}</p>
              </div>

              <p className="text-[11px] text-slate-500">
                * Note: Model detections are probabilistic inferences and should be verified alongside multi-factor identity challenges.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-850 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedAnalysis(null);
                  navigate('/investigations');
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
              >
                Open Incident Case →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
