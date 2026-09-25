import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileAudio,
  CheckCircle,
  AlertTriangle,
  Play,
  Download,
  FolderSearch,
  Sparkles,
  Info,
  Clock,
  HardDrive,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { aiDetectionService } from '../services/aiDetectionService';
import { AudioPlayerBar } from '../components/common/AudioPlayerBar';
import { RiskBadge } from '../components/common/RiskBadge';
import { AudioAnalysis } from '../types';

export const AudioAnalysisPage: React.FC = () => {
  const { speakerProfiles, addAnalysis, createInvestigation, backendConfig } = useData();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetSpeakerId, setTargetSpeakerId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // NOTE: bundled "sample" buttons used to create fake byte buffers and then force
  // predetermined verdicts. They were removed so this screen can never display a
  // simulated result while claiming the real pipeline ran.

  const handleFileSelect = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setAnalysisError('The selected file is larger than 25 MB. Choose a smaller recording.');
      return;
    }
    setAnalysisError(null);
    setSelectedFile(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
  };

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const runFileAnalysis = async (fileToAnalyze: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setAnalysisProgress(20);
    setAnalysisStep('Uploading audio and running AASIST CPU inference...');

    const progressTimer = window.setInterval(() => {
      setAnalysisProgress((current) => Math.min(90, current + 4));
    }, 700);

    try {
      const targetSpeaker = speakerProfiles.find((s) => s.id === targetSpeakerId);
      const result = await aiDetectionService.analyzeAudioFile(
        fileToAnalyze,
        targetSpeakerId || undefined,
        targetSpeaker?.display_name
      );
      setAnalysisResult(result);
      await addAnalysis(result);
      setAnalysisProgress(100);
      setAnalysisStep('AASIST analysis completed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audio analysis failed unexpectedly.';
      setAnalysisError(message);
      setAnalysisStep('Analysis stopped.');
    } finally {
      window.clearInterval(progressTimer);
      setIsAnalyzing(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) return;
    runFileAnalysis(selectedFile);
  };

  const handleCreateInvestigation = async () => {
    if (!analysisResult) return;
    await createInvestigation({
      user_id: 'usr_current',
      title: `Forensic Audio Case: ${analysisResult.file_name}`,
      description: `Uploaded audio sample analyzed with ${analysisResult.spoof_risk_score}% spoof probability. ${analysisResult.explanation}`,
      priority: analysisResult.risk_level === 'critical' ? 'urgent' : 'high',
      status: 'open',
      assigned_to: 'Forensics Incident Desk',
      target_individual: analysisResult.speaker_name ?? undefined,
    });
    navigate('/investigations');
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Forensic Audio File Analysis
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Upload recorded voice interactions for AASIST anti-spoofing inference. This endpoint detects likely synthetic speech; it does not verify a speaker's identity.
        </p>
      </div>

      {/* Main Grid: Upload & Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Dropzone and Sample Bank (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Drag & Drop File Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-200">
              Drag & drop audio recording here
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Supports WAV, MP3, M4A, FLAC, and OGG (up to 25 MB; first 30 seconds analyzed)
            </p>

            <div className="mt-4 flex items-center gap-2">
              <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm">
                <span>Browse Local Files</span>
                <input
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 border border-slate-700 text-xs text-blue-300">
                <FileAudio className="h-4 w-4 text-blue-400" />
                <span>Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-blue-200">Real inference only</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Demo samples and forced verdicts have been removed. Every file selected here is sent to
                  <span className="font-mono text-blue-300"> POST /api/v1/analyses</span> and scored by AASIST.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters & Execution (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800/80 pb-2.5 mb-4">
              Analysis Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Claimed Identity
                </label>
                <select
                  value={targetSpeakerId}
                  onChange={(e) => setTargetSpeakerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Generic Anti-Spoofing (No Profile) --</option>
                  {speakerProfiles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name} ({s.department || 'Enrolled'})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Optional context only. AASIST performs anti-spoofing; it does not perform speaker verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Anti-Spoofing Architecture
                </label>
                <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Engine:</span>
                    <span className="text-blue-400 font-medium">AASIST / ASVspoof2019-LA (CPU)</span>
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-slate-400">Input:</span>
                    <span className="text-slate-300">16 kHz mono, 64,600-sample windows</span>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              {analysisError && (
                <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200">
                  <strong className="block font-semibold">Analysis failed</strong>
                  <span className="mt-1 block">{analysisError}</span>
                </div>
              )}

              {isAnalyzing && (
                <div role="status" aria-live="polite" className="rounded-lg bg-slate-950 p-3 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-400 font-medium">Analyzing audio...</span>
                    <span className="text-blue-400 font-mono">{analysisProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{analysisStep}</p>
                </div>
              )}

              <button
                onClick={handleStartAnalysis}
                disabled={!selectedFile || isAnalyzing}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition shadow-sm ${
                  !selectedFile || isAnalyzing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-950'
                }`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                    Running AASIST inference...
                  </span>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    <span>Run Forensic Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Results Section */}
      {analysisResult && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm space-y-6">
          {/* SIMULATED vs REAL banner — GOAL step 4 */}
          {analysisResult.is_demo ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
              SIMULATED RESULT — heuristic demo, not AASIST. Set VITE_ENABLE_DEMO_MODE=false for real inference.
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-center justify-between">
              <span>REAL RESULT - {analysisResult.model_version} • CPU • {analysisResult.processing_time_ms ? `${analysisResult.processing_time_ms} ms` : ""} {analysisResult.num_windows ? `• ${analysisResult.num_windows} window(s)` : ""}</span>
              <span className="text-[11px] text-emerald-400/70">{analysisResult.spoof_probability_max ? `max window ${analysisResult.spoof_probability_max}%` : ""}</span>
            </div>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">
                Verdict & Acoustic Report
              </span>
              <h3 className="text-lg font-semibold text-white mt-0.5">
                {analysisResult.file_name}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <RiskBadge
                level={analysisResult.risk_level}
                resultLabel={analysisResult.result_label}
                size="lg"
              />
              <button
                onClick={handleCreateInvestigation}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-500 transition shadow-sm"
              >
                Open Incident Case →
              </button>
            </div>
          </div>

          {/* Audio Player Bar */}
          <AudioPlayerBar
            audioUrl={audioUrl || undefined}
            title={analysisResult.file_name}
            duration={analysisResult.duration_seconds}
          />

          {/* Score Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Spoof / Cloning Probability</span>
              <p
                className={`mt-1 text-2xl font-bold font-mono ${
                  analysisResult.spoof_risk_score > 70
                    ? 'text-rose-400'
                    : analysisResult.spoof_risk_score > 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {analysisResult.spoof_risk_score}%
              </p>
              <span className="text-[11px] text-slate-500">Confidence: {analysisResult.model_confidence}%</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Authenticity Confidence</span>
              <p className="mt-1 text-2xl font-bold font-mono text-blue-400">{analysisResult.authenticity_score}%</p>
              <span className="text-[11px] text-slate-500">Human acoustic profile</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Speaker Profile Match</span>
              <p
                className={`mt-1 text-2xl font-bold font-mono ${
                  (analysisResult.speaker_similarity_score ?? 0) > 75 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {analysisResult.speaker_similarity_score != null
                  ? `${analysisResult.speaker_similarity_score}%`
                  : 'N/A'}
              </p>
              <span className="text-[11px] text-slate-500">
                {analysisResult.speaker_name ? `Target: ${analysisResult.speaker_name}` : 'No target profile'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Model Verification</span>
              <p className="mt-1 text-base font-semibold text-slate-200 truncate">{analysisResult.model_version}</p>
              <span className="text-[11px] text-amber-400 font-medium">Thresholds are uncalibrated</span>
            </div>
          </div>

          {/* Spectral Artifacts Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Spectral Anti-Spoofing Diagnostics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisResult.spectral_artifacts?.map((art, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-slate-200 text-xs">{art.name}</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        art.status === 'anomaly_detected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {art.score}% {art.status === 'anomaly_detected' ? 'Anomalous' : 'Organic'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{art.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Model Diagnostic Explanation */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">
              Forensic Synthesis Diagnostic
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
