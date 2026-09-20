import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FileAudio,
  Radio,
  Calendar,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { AudioAnalysis } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const HistoryPage: React.FC = () => {
  const { analyses, deleteAnalysis } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AudioAnalysis | null>(null);

  const filteredAnalyses = analyses.filter((item) => {
    if (sourceFilter !== 'all' && item.source_type !== sourceFilter) return false;
    if (riskFilter !== 'all' && item.risk_level !== riskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchFile = item.file_name?.toLowerCase().includes(q);
      const matchSpeaker = item.speaker_name?.toLowerCase().includes(q);
      if (!matchId && !matchFile && !matchSpeaker) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Analysis_ID', 'Timestamp', 'Source_Type', 'Speaker_Name', 'Result_Label', 'Risk_Level', 'Spoof_Score', 'Authenticity_Score', 'Model_Confidence'];
    const rows = filteredAnalyses.map((a) => [
      a.id,
      a.created_at,
      a.source_type,
      a.speaker_name || 'N/A',
      a.result_label,
      a.risk_level,
      `${a.spoof_risk_score}%`,
      `${a.authenticity_score}%`,
      `${a.model_confidence}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VoiceShield_Audit_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Detection Audit History
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Immutable forensic audit trail of all live voice intercepts and uploaded file evaluations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm"
        >
          <Download className="h-4 w-4 text-blue-400" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by analysis ID, file, or speaker..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="live_stream">Live Stream</option>
            <option value="file_upload">File Upload</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Risk Tiers</option>
            <option value="safe">Safe / Authentic</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredAnalyses.length} of {analyses.length} audit records
        </span>
      </div>

      {/* Audit Table */}
      {filteredAnalyses.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Detection Audits Found"
          description="No historical voice analyses match your current filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSourceFilter('all');
            setRiskFilter('all');
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800/80 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Analysis ID</th>
                  <th className="py-3 px-4">Date / Timestamp</th>
                  <th className="py-3 px-4">Source Type</th>
                  <th className="py-3 px-4">Target Identity</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Spoof Probability</th>
                  <th className="py-3 px-4">Authenticity</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAnalyses.map((ana) => (
                  <tr key={ana.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-blue-400">{ana.id}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(ana.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 capitalize">
                        {ana.source_type === 'live_stream' ? (
                          <Radio className="h-3.5 w-3.5 text-blue-400" />
                        ) : (
                          <FileAudio className="h-3.5 w-3.5 text-indigo-400" />
                        )}
                        {ana.source_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {ana.speaker_name || <span className="text-slate-500 italic">None specified</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={ana.risk_level} resultLabel={ana.result_label} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
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
                    <td className="py-3.5 px-4 font-mono text-blue-400 font-semibold">{ana.authenticity_score}%</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {ana.duration_seconds ? `${ana.duration_seconds}s` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAnalysis(ana)}
                          className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition"
                          title="Inspect full acoustic analysis"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAnalysis(ana.id)}
                          className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:border-rose-500 hover:text-rose-400 transition"
                          title="Delete audit entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forensic Audit Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div>
                <span className="text-[11px] text-blue-400 font-medium uppercase tracking-wider">
                  Forensic Audit Record
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5 font-mono">{selectedAnalysis.id}</h3>
              </div>
              <RiskBadge level={selectedAnalysis.risk_level} resultLabel={selectedAnalysis.result_label} />
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">File / Stream</span>
                  <span className="text-slate-200 font-medium truncate block mt-0.5">{selectedAnalysis.file_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Speaker Profile</span>
                  <span className="text-slate-200 font-medium block mt-0.5">{selectedAnalysis.speaker_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Spoof Risk</span>
                  <span className="text-rose-400 font-bold text-sm font-mono mt-0.5 block">{selectedAnalysis.spoof_risk_score}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Authenticity</span>
                  <span className="text-blue-400 font-bold text-sm font-mono mt-0.5 block">{selectedAnalysis.authenticity_score}%</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Diagnostic Explanation</span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  {selectedAnalysis.explanation}
                </p>
              </div>

              {selectedAnalysis.spectral_artifacts && (
                <div>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">Acoustic Cues</span>
                  <div className="space-y-1.5">
                    {selectedAnalysis.spectral_artifacts.map((art, idx) => (
                      <div key={idx} className="flex justify-between items-center rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/80">
                        <span className="text-slate-300">{art.name}</span>
                        <span className={`font-mono text-xs font-medium ${art.status === 'anomaly_detected' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {art.score}% ({art.status === 'anomaly_detected' ? 'Anomaly' : 'Normal'})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-800/80 pt-3">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
