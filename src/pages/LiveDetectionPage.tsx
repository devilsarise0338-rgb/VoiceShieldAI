import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Radio,
  Sliders,
  Volume2,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { liveDetectionWs, LiveDetectionEventPayload } from '../services/websocketService';
import { useData } from '../context/DataContext';
import { AudioWaveformVisualizer } from '../components/common/AudioWaveformVisualizer';
import { SpectrogramCanvas } from '../components/common/SpectrogramCanvas';
import { RiskBadge } from '../components/common/RiskBadge';
import { AudioAnalysis, RiskLevel } from '../types';

export const LiveDetectionPage: React.FC = () => {
  const {
    isRecording,
    permissionStatus,
    audioLevel,
    devices,
    selectedDeviceId,
    recordedBlob,
    analyserNode,
    startRecording,
    stopRecording,
    setSelectedDeviceId,
    errorMessage,
  } = useAudioAnalyzer();

  const { speakerProfiles, addAnalysis, createInvestigation, backendConfig } = useData();
  const navigate = useNavigate();

  // Selected speaker profile to match against (optional)
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('spk_01');
  const [isPaused, setIsPaused] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Live telemetry state
  const [liveRisk, setLiveRisk] = useState<RiskLevel>('safe');
  const [authenticityScore, setAuthenticityScore] = useState<number>(96);
  const [spoofRiskScore, setSpoofRiskScore] = useState<number>(4);
  const [speakerSimilarityScore, setSpeakerSimilarityScore] = useState<number>(94);
  const [modelConfidence, setModelConfidence] = useState<number>(96.5);
  const [explanation, setExplanation] = useState<string>(
    'Real-time acoustic telemetry listening. Natural vocal tract phase coherence maintained.'
  );
  const [latestAnomaly, setLatestAnomaly] = useState<string | null>(null);

  // Emergency Verification Challenge modal state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeStep, setChallengeStep] = useState<'prompt' | 'evaluating' | 'failed' | 'passed'>('prompt');
  const [challengePhrase] = useState('ECHO TACTICAL FALCON 4-9-2 VERIFY');
  const [investigationNotes, setInvestigationNotes] = useState('');

  // Selected speaker metadata
  const selectedSpeaker = speakerProfiles.find((s) => s.id === selectedSpeakerId);

  // Duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Hook up WebSocket live detection stream
  useEffect(() => {
    const unsubscribeUpdate = liveDetectionWs.onAnalysisUpdate((payload: LiveDetectionEventPayload) => {
      if (!isPaused && isRecording) {
        setAuthenticityScore(payload.authenticityScore);
        setSpoofRiskScore(payload.spoofRiskScore);
        if (payload.speakerSimilarityScore !== undefined) {
          setSpeakerSimilarityScore(payload.speakerSimilarityScore);
        }
        setLiveRisk(payload.riskLevel);
        setModelConfidence(payload.confidence);
        setExplanation(payload.explanation);
        if (payload.anomaly) {
          setLatestAnomaly(payload.anomaly);
        }
      }
    });

    return () => {
      unsubscribeUpdate();
    };
  }, [isPaused, isRecording]);

  const handleStartMonitoring = async () => {
    const success = await startRecording(selectedDeviceId);
    if (success) {
      liveDetectionWs.connect(selectedSpeakerId);
      setDurationSeconds(0);
      setLiveRisk('safe');
      setAuthenticityScore(96);
      setSpoofRiskScore(4);
      setLatestAnomaly(null);
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleStopMonitoring = () => {
    const blob = stopRecording();
    liveDetectionWs.disconnect();

    // If an interaction was recorded, save analysis into data context
    if (durationSeconds > 2) {
      const isSuspicious = spoofRiskScore > 50;
      const newAnalysis: AudioAnalysis = {
        id: 'ana_' + Math.random().toString(36).substring(2, 9),
        user_id: 'usr_current',
        speaker_profile_id: selectedSpeakerId,
        speaker_name: selectedSpeaker?.display_name,
        source_type: 'live_stream',
        file_name: `live_stream_${new Date().toISOString().substring(11, 19).replace(/:/g, '-')}.raw`,
        duration_seconds: durationSeconds,
        status: 'completed',
        result_label: isSuspicious ? 'synthetic_clone' : 'authentic',
        risk_level: liveRisk,
        authenticity_score: authenticityScore,
        spoof_risk_score: spoofRiskScore,
        speaker_similarity_score: speakerSimilarityScore,
        model_confidence: modelConfidence,
        model_version: backendConfig.selectedModel,
        spectral_artifacts: [
          {
            name: 'Linear Predictive Coding (LPC)',
            score: isSuspicious ? 88 : 10,
            status: isSuspicious ? 'anomaly_detected' : 'normal',
            description: isSuspicious
              ? 'Vocoder phase jitter detected.'
              : 'Natural biological resonance maintained.',
          },
          {
            name: 'Pitch Inflection (F0)',
            score: isSuspicious ? 91 : 7,
            status: isSuspicious ? 'anomaly_detected' : 'normal',
            description: isSuspicious
              ? 'Artificial prosodic flattening.'
              : 'Organic human micro-tremor verified.',
          },
        ],
        explanation,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        is_demo: backendConfig.demoMode,
      };

      addAnalysis(newAnalysis);
    }
  };

  const handleSimulateAttack = () => {
    if (!isRecording) {
      handleStartMonitoring().then(() => {
        setTimeout(() => {
          liveDetectionWs.simulateSuspiciousInjection();
        }, 800);
      });
    } else {
      liveDetectionWs.simulateSuspiciousInjection();
    }
  };

  const handleTriggerChallenge = () => {
    setIsChallengeModalOpen(true);
    setChallengeStep('prompt');
  };

  const handleCreateEmergencyInvestigation = async () => {
    const inv = await createInvestigation({
      user_id: 'usr_current',
      title: `Emergency Impersonation Intercept: ${selectedSpeaker?.display_name || 'Live Intercept'}`,
      description: `Real-time call intercepted with ${spoofRiskScore}% spoof probability. Neural vocoder anomaly flagged. ${
        investigationNotes || 'Operator marked call as critical threat.'
      }`,
      priority: 'urgent',
      status: 'open',
      assigned_to: 'Incident Response Unit',
      detected_caller: 'Encrypted Stream Trunk',
      target_individual: selectedSpeaker?.display_name,
    });

    handleStopMonitoring();
    setIsChallengeModalOpen(false);
    navigate('/investigations');
  };

  const formatSec = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Title & Status Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Live Stream Voice Interceptor
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                isRecording
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/80'
              }`}
            >
              {isRecording ? (isPaused ? 'Stream Paused' : 'Monitoring Active') : 'Standby'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time sliding window — <span className="text-amber-400 font-semibold">SIMULATED</span> scores (WebSocket produces heuristic demo data, not AASIST). Use the Upload page for real AASIST inference.
          </p>
        </div>

        {/* Attack Simulator & Emergency Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateAttack}
            className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
            title="Inject simulated neural vocoder deepfake attack into stream"
          >
            <Zap className="h-4 w-4 text-rose-400" />
            <span>Simulate Cloned Attack</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ======================================================== */}
        {/* LEFT PANEL: Input Control & Audio Telemetry (3 Cols)   */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
              <span className="text-xs font-semibold text-slate-200">
                Input Controller
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {permissionStatus === 'granted' ? 'Mic Ready' : 'Permission Required'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!isRecording ? (
                <button
                  onClick={handleStartMonitoring}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 transition"
                >
                  <Mic className="h-4 w-4" />
                  <span>Start Live Monitoring</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePauseToggle}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-750"
                  >
                    {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={handleStopMonitoring}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2.5 text-xs font-medium text-white hover:bg-rose-500 shadow-sm"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop & Save</span>
                  </button>
                </div>
              )}
            </div>

            {errorMessage && (
              <p className="mt-2 text-[11px] text-rose-400 font-mono">⚠️ {errorMessage}</p>
            )}

            {/* Target Enrolled Identity Selector */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Target Speaker Profile
              </label>
              <select
                value={selectedSpeakerId}
                onChange={(e) => setSelectedSpeakerId(e.target.value)}
                disabled={isRecording}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 font-sans focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- General Speech (No Specific Identity) --</option>
                {speakerProfiles.map((spk) => (
                  <option key={spk.id} value={spk.id}>
                    {spk.display_name} ({spk.department || 'Enrolled'})
                  </option>
                ))}
              </select>
              {selectedSpeaker && (
                <div className="mt-2 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Enrolled Rate:</span>
                    <span className="text-slate-200 font-medium">{selectedSpeaker.sample_rate_hz} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voiceprint ID:</span>
                    <span className="text-blue-400 font-mono truncate max-w-[130px]">{selectedSpeaker.voiceprint_hash}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hardware Input Selector */}
            {devices.length > 0 && (
              <div className="mt-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Microphone Hardware
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={isRecording}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-slate-300 truncate focus:border-blue-500 focus:outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Audio Device ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Duration & Audio Input RMS Level */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Duration
                </span>
                <span className="text-white font-semibold font-mono text-sm">{formatSec(durationSeconds)}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-slate-400" /> Audio Input RMS Level
                  </span>
                  <span className="text-blue-400 font-semibold font-mono">{audioLevel}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full transition-all duration-75 ${
                      audioLevel > 75 ? 'bg-rose-500' : audioLevel > 40 ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, audioLevel)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Model Status Card */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs space-y-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Inference Engine Telemetry
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Model:</span>
              <span className="text-blue-400 font-medium">{backendConfig.selectedModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sliding Window:</span>
              <span className="text-slate-200">250ms chunks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Processing Mode:</span>
              <span className={backendConfig.demoMode ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                {backendConfig.demoMode ? 'Simulated DSP' : 'PyTorch WebSocket'}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER PANEL: Live Waveform & Spectrogram (5 Cols)      */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Radio className={`h-4 w-4 ${isRecording ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold text-slate-200">
                  Live Acoustic Waveform & FFT
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {isRecording ? 'Streaming Real-Time' : 'Stream Standby'}
              </span>
            </div>

            {/* Canvas Oscilloscope Waveform */}
            <AudioWaveformVisualizer
              analyserNode={analyserNode}
              isActive={isRecording && !isPaused}
              color={liveRisk === 'critical' ? 'rose' : liveRisk === 'high' ? 'amber' : 'cyan'}
              height={140}
              label={selectedSpeaker?.display_name ? `Target: ${selectedSpeaker.display_name}` : 'Input Audio Stream'}
            />

            {/* Canvas Spectrogram Frequency Bars */}
            <div className="mt-4">
              <SpectrogramCanvas
                analyserNode={analyserNode}
                isActive={isRecording && !isPaused}
                height={100}
              />
            </div>

            {/* Spectral Cues & Anomalies Bar */}
            <div className="mt-4 rounded-xl bg-slate-950/80 p-3.5 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">Acoustic Integrity Monitor:</span>
                <span
                  className={`font-semibold ${
                    liveRisk === 'critical'
                      ? 'text-rose-400'
                      : liveRisk === 'high'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {liveRisk === 'critical' ? 'Critical Artifact Flagged' : 'Natural Phonation Coherent'}
                </span>
              </div>

              {latestAnomaly ? (
                <div className="rounded-lg bg-rose-500/10 p-2.5 border border-rose-500/20 text-xs text-rose-300">
                  <span className="font-semibold">⚠️ Anomaly Intercepted:</span> {latestAnomaly}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No neural vocoder signatures detected. Phonation resonance and F0 pitch micro-tremor consistent with biological vocal folds.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: Threat Assessment & Emergency Action (4 Cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-xs font-semibold text-slate-200">
                Threat Classification
              </span>
              <RiskBadge level={liveRisk} size="sm" />
            </div>

            {/* Score Indicators */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Cloning / Spoof Probability</span>
                  <span
                    className={`font-bold text-sm ${
                      spoofRiskScore > 70
                        ? 'text-rose-400'
                        : spoofRiskScore > 30
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {spoofRiskScore}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full transition-all duration-300 ${
                      spoofRiskScore > 70 ? 'bg-rose-500' : spoofRiskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${spoofRiskScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Human Authenticity Score</span>
                  <span className="text-blue-400 font-bold text-sm">{authenticityScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${authenticityScore}%` }} />
                </div>
              </div>

              {selectedSpeaker && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Enrolled Speaker Match</span>
                    <span
                      className={`font-bold text-sm ${
                        speakerSimilarityScore > 75 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {speakerSimilarityScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        speakerSimilarityScore > 75 ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${speakerSimilarityScore}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Model Confidence:</span>
                  <span className="text-blue-400 font-medium">{modelConfidence}%</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Diagnostic Latency:</span>
                  <span className="text-slate-300 font-medium">180ms</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80 text-xs text-slate-300">
                <span className="text-[11px] text-blue-400 font-semibold block mb-1">
                  Model Diagnostic Explanation:
                </span>
                <p className="leading-relaxed text-xs">{explanation}</p>
              </div>
            </div>

            {/* Emergency Verification Workflow Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold mb-2">
                Emergency Verification Protocols
              </span>

              <button
                onClick={handleTriggerChallenge}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 py-2.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
              >
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Trigger Step-Up Challenge</span>
              </button>

              <button
                onClick={handleCreateEmergencyInvestigation}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 py-2.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
              >
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>Escalate to Investigation Case</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Challenge Verification Modal */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Lock className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Dynamic Biometric Challenge Protocol</h3>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                Step-Up Auth
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Instruct the suspected caller to immediately read the one-time generated challenge phrase aloud.
                Voice cloning latencies and speech synthesis vocoders fail unpredictable zero-shot phonetic combinations.
              </p>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
                <span className="text-[10px] uppercase text-blue-400 tracking-wider block mb-1 font-semibold">
                  One-Time Challenge Passphrase
                </span>
                <span className="font-mono text-base font-semibold text-white tracking-widest">
                  "{challengePhrase}"
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Analyst Observation & Notes
                </label>
                <textarea
                  rows={3}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Caller paused for 3.8 seconds; synthetic artifact heard during phrase transition..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setIsChallengeModalOpen(false)}
                className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-850 transition"
              >
                Dismiss
              </button>
              <button
                onClick={handleCreateEmergencyInvestigation}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-500 shadow-sm"
              >
                Confirm Failed Challenge & Quarantine →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
