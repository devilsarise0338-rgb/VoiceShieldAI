import React, { useState } from 'react';
import {
  HelpCircle,
  Shield,
  FileCode,
  Cpu,
  Terminal,
  Database,
  Lock,
  Layers,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const HelpDocumentationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'acoustics' | 'architecture' | 'api'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            SIH26104 Problem Specifications & Architecture
          </h2>
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
            Smart India Hackathon 2026
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Official engineering documentation, scientific background, and deployment guidelines for the VoiceShield AI defense platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-medium transition border-b-2 -mb-px ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Problem Overview
        </button>
        <button
          onClick={() => setActiveTab('acoustics')}
          className={`px-4 py-2.5 font-medium transition border-b-2 -mb-px ${
            activeTab === 'acoustics'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Acoustic Anti-Spoofing Science
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 font-medium transition border-b-2 -mb-px ${
            activeTab === 'architecture'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          System Architecture
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2.5 font-medium transition border-b-2 -mb-px ${
            activeTab === 'api'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          WebSocket & REST API Spec
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 max-w-4xl text-xs text-slate-300 leading-relaxed font-sans">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Problem Statement: SIH26104
            </h3>
            <p className="font-semibold text-slate-200 text-sm">
              AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks.
            </p>
            <p>
              Recent breakthroughs in diffusion models and neural text-to-speech (TTS) vocoders (e.g. ElevenLabs, XTTS, HiFi-GAN, VITS) have made zero-shot voice cloning accessible with less than 3 seconds of reference audio. This enables malicious actors to perform targeted social engineering, financial wire authorization fraud, and executive impersonation against critical defense commands.
            </p>
            <p>
              VoiceShield AI addresses this critical challenge by providing a dual-engine architecture:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300 text-xs">
              <li><strong>Real-Time Stream Verification:</strong> Continuous sliding window inspection with sub-300ms anomaly classification.</li>
              <li><strong>Speaker Biometric Vault:</strong> Cosine similarity comparisons against calibrated enrollment voiceprints.</li>
              <li><strong>Emergency Interrogation Playbook:</strong> Dynamic step-up challenge phrases that force zero-shot speech synthesis to reveal phase and latency defects.</li>
              <li><strong>Forensic Dossier Certification:</strong> Court-admissible spectral reports and chain-of-custody tracking.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Acoustics Science */}
      {activeTab === 'acoustics' && (
        <div className="space-y-6 max-w-4xl text-xs text-slate-300 leading-relaxed">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Acoustic Signatures of Neural Speech Synthesis
            </h3>

            <div className="space-y-3">
              <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                  1. Phase Incoherence & Linear Predictive Coding (LPC)
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Human vocal production relies on biological vocal fold vibration filtered through the vocal tract (glottal pulse excitation). Neural vocoders estimate spectrogram magnitudes and reconstruct phase algorithmically, producing subtle phase discontinuities at high sampling rates (&gt;16 kHz).
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                  2. Fundamental Frequency (F0) Micro-Tremor
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Organic human speech continuously exhibits micro-variations (jitter and shimmer) caused by involuntary laryngeal muscle micro-contractions. Synthetic text-to-speech models often output unnaturally smooth or flat pitch contours across vowels.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                  3. Constant-Q Cepstral Coefficients (CQCC)
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Unlike traditional MFCCs which use linearly spaced filters at high frequencies, CQCC uses geometrically spaced frequency bins that resolve subtle synthetic harmonics in the 4 kHz to 8 kHz spectrum.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Architecture */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 max-w-4xl text-xs text-slate-300 leading-relaxed">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              End-to-End Technology Stack
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80">
                <span className="text-blue-400 font-semibold block mb-2 uppercase tracking-wider text-[11px]">Frontend Client Layer</span>
                <ul className="space-y-1.5 text-slate-300">
                  <li>• React 18 + TypeScript + Vite</li>
                  <li>• Web Audio API (AnalyserNode, FFT 256)</li>
                  <li>• HTML5 Canvas Oscilloscope & Spectrogram</li>
                  <li>• Tailwind CSS Modern SaaS Theme</li>
                  <li>• Recharts Telemetry Visualizers</li>
                </ul>
              </div>

              <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80">
                <span className="text-emerald-400 font-semibold block mb-2 uppercase tracking-wider text-[11px]">Persistence & Security Layer</span>
                <ul className="space-y-1.5 text-slate-300">
                  <li>• Supabase PostgreSQL Database</li>
                  <li>• Row Level Security (RLS) Enforced</li>
                  <li>• Private Encrypted Storage Buckets</li>
                  <li>• Supabase Auth with Role-Based Access</li>
                </ul>
              </div>

              <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80 md:col-span-2">
                <span className="text-amber-400 font-semibold block mb-2 uppercase tracking-wider text-[11px]">AI Inference Backend (FastAPI / PyTorch)</span>
                <p className="text-slate-400 mb-2 leading-relaxed">
                  The client architecture interfaces via REST and WebSocket streaming to a dedicated Python inference worker:
                </p>
                <div className="rounded-lg bg-slate-900/80 p-3 text-slate-300 font-mono text-[11px] border border-slate-800">
                  Client Browser (Web Audio) ──[PCM 250ms chunks]──&gt; WebSocket (/ws/v1/live-detection) ──&gt; RawNet3 Engine ──&gt; Real-Time Anomaly Score
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: API Spec */}
      {activeTab === 'api' && (
        <div className="space-y-6 max-w-4xl text-xs text-slate-300 leading-relaxed font-mono">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400 font-sans">
              WebSocket Protocol Specification (/ws/v1/live-detection)
            </h3>

            <p className="text-slate-400 text-xs font-sans">
              Connect to stream binary audio PCM chunks and receive real-time classification events.
            </p>

            <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80">
              <span className="text-slate-500 block mb-2 font-sans text-xs">// Inbound Binary Message: 16-bit PCM Audio Chunk (250ms at 16kHz or 48kHz)</span>
              <pre className="text-blue-300 text-[11px] overflow-x-auto">
{`// Client sends raw binary ArrayBuffer / Blob over WebSocket connection:
socket.send(pcmChunkArrayBuffer);`}
              </pre>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80">
              <span className="text-slate-500 block mb-2 font-sans text-xs">// Outbound Event Payload (JSON returned to client):</span>
              <pre className="text-emerald-300 text-[11px] overflow-x-auto">
{`{
  "event": "ANALYSIS_UPDATE",
  "data": {
    "timestamp": "2026-09-20T12:00:00.000Z",
    "riskLevel": "critical",
    "authenticityScore": 8.4,
    "spoofRiskScore": 91.6,
    "speakerSimilarityScore": 22.1,
    "confidence": 98.2,
    "anomaly": "HiFi-GAN neural vocoder phase discontinuity in phoneme transition",
    "explanation": "High-frequency energy cutoff and absence of biological vocal tract inertia."
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
