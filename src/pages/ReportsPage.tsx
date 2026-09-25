import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  Lock,
  Layers,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/common/RiskBadge';

export const ReportsPage: React.FC = () => {
  const { analyses, alerts, investigations, backendConfig } = useData();
  const { user } = useAuth();

  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(analyses[0]?.id || '');
  const selectedAnalysis = analyses.find((a) => a.id === selectedAnalysisId) || analyses[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!selectedAnalysis) return;
    const dossier = {
      dossier_type: 'VOICESHIELD_AI_FORENSIC_SECURITY_DOSSIER',
      problem_statement: 'SIH26104',
      generated_at: new Date().toISOString(),
      certified_by: user?.full_name || 'SOC Forensic Analyst',
      analysis_record: selectedAnalysis,
      system_telemetry: {
        model: backendConfig.selectedModel,
        confidence: selectedAnalysis.model_confidence,
        risk_level: selectedAnalysis.risk_level,
        spectral_metrics: selectedAnalysis.spectral_artifacts,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `VoiceShield_Forensic_Report_${selectedAnalysis.id}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Forensic Security Reports
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Generate and export verified forensic dossiers and incident summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm"
          >
            <Download className="h-4 w-4 text-blue-400" />
            <span>Export JSON Dossier</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Selector Toolbar (Hidden during print) */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 print:hidden">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-300 font-medium">Select Audit Case:</label>
          <select
            value={selectedAnalysisId}
            onChange={(e) => setSelectedAnalysisId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            {analyses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} • {a.file_name} ({a.result_label})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-medium text-blue-400">
          Status: Ready for Certification
        </span>
      </div>

      {/* Printable Report Document Card */}
      {selectedAnalysis && (
        <div className="rounded-2xl border border-slate-800/90 bg-[#0c1220] p-8 shadow-xl text-slate-100 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:text-black print:bg-white space-y-6">
          {/* Official Document Letterhead */}
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-6 print:border-black">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 print:bg-slate-100 print:text-black">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white print:text-black uppercase">
                  VoiceShield AI Forensic Dossier
                </h1>
                <p className="text-xs text-slate-400 print:text-slate-600">
                  SIH26104 • AI Voice Cloning Impersonation Detection Certification
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 print:text-slate-600">
              <p className="font-semibold text-white print:text-black font-mono">DOSSIER #{selectedAnalysis.id}</p>
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Classification: Confidential / Cyber Defense</p>
            </div>
          </div>

          {/* Executive Verdict Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 print:border-slate-300 print:bg-slate-50">
              <span className="text-xs text-slate-400 print:text-slate-600 uppercase tracking-wider block font-medium">Forensic Verdict</span>
              <p
                className={`mt-1 text-base font-semibold capitalize ${
                  selectedAnalysis.result_label === 'synthetic_clone'
                    ? 'text-rose-400 print:text-rose-700'
                    : 'text-emerald-400 print:text-emerald-700'
                }`}
              >
                {selectedAnalysis.result_label.replace('_', ' ')}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Risk Tier: {selectedAnalysis.risk_level.toUpperCase()}</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 print:border-slate-300 print:bg-slate-50">
              <span className="text-xs text-slate-400 print:text-slate-600 uppercase tracking-wider block font-medium">Spoof Probability</span>
              <p className="mt-1 text-2xl font-bold font-mono text-rose-400 print:text-rose-700">
                {selectedAnalysis.spoof_risk_score}%
              </p>
              <span className="text-[11px] text-slate-500">Model Confidence: {selectedAnalysis.model_confidence}%</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 print:border-slate-300 print:bg-slate-50">
              <span className="text-xs text-slate-400 print:text-slate-600 uppercase tracking-wider block font-medium">Speaker Identity Match</span>
              <p className="mt-1 text-2xl font-bold font-mono text-blue-400 print:text-blue-800">
                {selectedAnalysis.speaker_similarity_score != null
                  ? `${selectedAnalysis.speaker_similarity_score}%`
                  : 'N/A'}
              </p>
              <span className="text-[11px] text-slate-500">
                Target: {selectedAnalysis.speaker_name || 'Generic Anti-Spoof'}
              </span>
            </div>
          </div>

          {/* Diagnostic Narrative */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 print:border-slate-300 print:bg-slate-50 space-y-2">
            <h4 className="text-xs font-semibold text-blue-400 print:text-black uppercase tracking-wider">
              1. Acoustic Forensics Narrative
            </h4>
            <p className="text-xs text-slate-300 print:text-slate-800 leading-relaxed">
              {selectedAnalysis.explanation}
            </p>
          </div>

          {/* Spectral Telemetry Breakdown Table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 print:text-black uppercase tracking-wider mb-3">
              2. Spectral Micro-Feature Decomposition
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800/80 bg-slate-900/60 print:bg-slate-200 print:border-slate-300 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Feature Component</th>
                    <th className="p-3">Artifact Status</th>
                    <th className="p-3">Anomaly Metric</th>
                    <th className="p-3">Diagnostic Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {selectedAnalysis.spectral_artifacts?.map((art, i) => (
                    <tr key={i} className="print:text-black hover:bg-slate-900/20">
                      <td className="p-3 font-medium text-slate-200">{art.name}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            art.status === 'anomaly_detected'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 print:bg-rose-100 print:text-rose-800'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 print:bg-emerald-100 print:text-emerald-800'
                          }`}
                        >
                          {art.status === 'anomaly_detected' ? 'Anomaly Detected' : 'Organic'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{art.score}%</td>
                      <td className="p-3 text-slate-400 print:text-slate-700">{art.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forensic Attestation Signature Box */}
          <div className="mt-8 border-t border-slate-800/80 print:border-black pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <p className="text-slate-400 print:text-slate-600 uppercase text-[11px] font-medium">Certifying Analyst</p>
              <p className="font-semibold text-white print:text-black mt-1">
                {user?.full_name || 'Senior Cyber Defense Officer'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">Badge ID: SOC-2026-SIH</p>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 print:border-black print:bg-transparent text-center">
              <span className="font-semibold text-blue-400 print:text-black block text-xs uppercase tracking-wider">
                Authenticity Certification Seal
              </span>
              <span className="text-[10px] text-slate-400 print:text-slate-600 block mt-0.5">
                VoiceShield AI Cryptographic Verifier
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
