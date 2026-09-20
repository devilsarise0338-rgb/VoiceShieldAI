import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  Radio,
  FileAudio,
  Users,
  AlertTriangle,
  FolderSearch,
  Cpu,
  Lock,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ChevronDown,
  Activity,
  Database,
  Play,
  Volume2,
  PhoneCall,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, loginAsDemoAnalyst } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedTab, setSelectedTab] = useState<'realtime' | 'biometric' | 'forensic'>('realtime');

  const handleTryDemo = () => {
    loginAsDemoAnalyst();
    navigate('/live-detection');
  };

  const handleExplorePlatform = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      loginAsDemoAnalyst();
      navigate('/dashboard');
    }
  };

  const faqs = [
    {
      q: 'How does VoiceShield AI differentiate cloned voices from organic human speech?',
      a: 'VoiceShield AI analyzes acoustic micro-properties including Linear Predictive Coding (LPC) vocal tract resonance, phase continuity between phonemes, and fundamental pitch frequency (F0) micro-tremors. Neural vocoders (such as HiFi-GAN, DiffWave, and neural TTS) introduce subtle mathematical artifacts and phase discontinuities that biological human vocal folds do not produce.',
    },
    {
      q: 'Can VoiceShield AI detect zero-shot voice cloning tools in real time?',
      a: 'Yes. VoiceShield AI inspects streaming audio chunks in sliding 250ms windows. It monitors spectral centroid anomalies, unnatural high-frequency energy roll-offs, and compares phonetic articulation timing against enrolled speaker baseline profiles.',
    },
    {
      q: 'Is AI voice detection 100% deterministic?',
      a: 'No. Responsible cybersecurity principles dictate that all AI biometric classifications are probabilistic (expressed as confidence percentages and risk tiers). VoiceShield AI explicitly tags predictions with confidence intervals and incorporates human-in-the-loop step-up challenge workflows for high-risk calls.',
    },
    {
      q: 'How are enrolled reference voiceprints stored and secured?',
      a: 'Voice recordings and biometric embeddings are stored strictly in private, encrypted Supabase Storage buckets governed by Row Level Security (RLS). Embeddings are salted, hashed, and isolated per organization. Raw audio is never transmitted to public third-party APIs without user consent.',
    },
    {
      q: 'What backend inference models does the architecture support?',
      a: 'The frontend architecture includes a dedicated REST and WebSocket abstraction layer ready to interface with high-performance Python/PyTorch inference servers running RawNet3, WavLM, CQCC (Constant Q Cepstral Coefficients), and LFCC anti-spoofing pipelines.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">VoiceShield</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                AI
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-blue-400 transition">How It Works</a>
            <a href="#capabilities" className="hover:text-blue-400 transition">Capabilities</a>
            <a href="#live-analysis" className="hover:text-blue-400 transition">Live Detection</a>
            <a href="#speaker-verification" className="hover:text-blue-400 transition">Biometric Vault</a>
            <a href="#technology" className="hover:text-blue-400 transition">Architecture</a>
            <a href="#faq" className="hover:text-blue-400 transition">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="rounded-lg border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition"
                >
                  Sign In
                </NavLink>
                <button
                  onClick={handleTryDemo}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm shadow-blue-900/30"
                >
                  Try Interactive Demo
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.14),rgba(9,13,22,0))]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-300 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Smart India Hackathon 2026 • Problem Statement SIH26104</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
              Real-time voice anti-spoofing & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">identity verification</span>
            </h1>

            <p className="mt-6 text-base text-slate-300 sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Detect synthetic voice clones, AI-generated speech, and social engineering attacks in sub-300ms windows. Protect executive calls, finance approvals, and customer contact centers.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleExplorePlatform}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition shadow-md shadow-blue-900/30"
              >
                <span>Launch Security Console</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleTryDemo}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-6 py-3 text-sm font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-850 transition"
              >
                <Radio className="h-4 w-4 text-emerald-400" />
                <span>Test Live Mic Detector</span>
              </button>

              <NavLink
                to="/login"
                className="rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition"
              >
                Sign In
              </NavLink>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Real-time 48 kHz Web Audio DSP
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Dual-Factor Biometric Verification
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Enterprise Supabase RLS Storage
              </span>
            </div>
          </div>

          {/* Interactive Hero Telemetry Card */}
          <div className="mt-14 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-md max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-slate-200">Executive Hotline Stream #041</span>
                <span className="text-xs text-slate-400">• Caller claimed: "Chief Technology Officer"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 text-xs font-medium">
                  Synthetic Clone Detected (94.2% confidence)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-medium text-slate-300">Spectral Analysis & Phoneme Continuity</span>
                  <span className="font-mono text-[11px] text-blue-400">48,000 Hz Audio Stream</span>
                </div>

                {/* Visual animated audio bars */}
                <div className="h-28 flex items-end gap-1.5 bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/60">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const h = Math.sin(idx * 0.45) * 32 + 48 + ((idx % 4) * 8);
                    const isAnomaly = idx >= 17 && idx <= 24;
                    return (
                      <div
                        key={idx}
                        className={`w-full rounded-t transition-all duration-300 ${
                          isAnomaly ? 'bg-rose-500' : 'bg-blue-500/70'
                        }`}
                        style={{ height: `${Math.min(94, h)}%` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>0.00s</span>
                  <span className="text-rose-400 font-medium">Artifact: Vocoder high-frequency roll-off & flat F0 inflection</span>
                  <span>1.25s</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400">Biometric Profile Match</span>
                  <h4 className="mt-1 text-sm font-semibold text-slate-200">Dr. Rajeshwari Sundaram</h4>
                  <p className="text-xs text-slate-400">VP Information Security</p>
                </div>

                <div className="space-y-3 my-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Voiceprint Similarity</span>
                      <span className="text-rose-400 font-semibold">18.4% (Mismatch)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[18%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Cloning Probability</span>
                      <span className="text-rose-400 font-semibold">94.2%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[94%]" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTryDemo}
                  className="w-full rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
                >
                  Inspect Live Signal →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How VoiceShield AI Works */}
      <section id="how-it-works" className="py-20 border-b border-slate-800/80 bg-[#0b0f19]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Detection Workflow
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Multi-Layer Acoustic Inspection
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Every incoming audio frame passes through our client DSP visualizers and AI inference pipeline within milliseconds.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 font-semibold text-sm border border-blue-500/20">
                1
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-200">Audio Ingestion</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Ingests live microphone streams or lossless audio files (WAV, MP3, FLAC) via the Web Audio API at 48 kHz.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 font-semibold text-sm border border-blue-500/20">
                2
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-200">Acoustic Feature Analysis</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Extracts pitch micro-tremors, LPC vocal tract resonance, phase coherence, and spectral centroid dynamics.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 font-semibold text-sm border border-blue-500/20">
                3
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-200">Anti-Spoof Scoring</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Detects neural vocoder artifacts (HiFi-GAN, diffusion synthesis) and calculates a probabilistic clone score.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 font-semibold text-sm border border-blue-500/20">
                4
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-200">Incident Triage & Challenge</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Matches against enrolled voiceprints and triggers step-up verification challenges for suspicious transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities */}
      <section id="capabilities" className="py-20 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Platform Modules
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Enterprise Voice Defense Suite
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Engineered to prevent financial wire fraud, identity impersonation, and social engineering breaches.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Real-Time Stream Interception</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Continuously analyzes live microphone feeds or phone audio in 250ms chunks with active DSP frequency visualizers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Speaker Biometric Vault</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Securely enroll authorized personnel voiceprints with encrypted Supabase Storage and audit verification history.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Incident Alerts & Escalation</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Instant severity triage (Safe, Low, Medium, High, Critical) with automatic case creation and notification center.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FolderSearch className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Forensic Investigation Center</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Structured workspaces for security analysts with evidence timelines, investigator notes, and status management.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileAudio className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Forensic Audio File Analysis</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Drag-and-drop file inspection with scrubbable waveform player, spectral density mapping, and printable reports.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Step-Up Security Challenge</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Dynamic challenge-response prompts requesting vocal repetition of unpredictable passphrase tokens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real-Time Voice Analysis Showcase */}
      <section id="live-analysis" className="py-20 border-b border-slate-800/80 bg-[#0b0f19]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Real-Time Voice Analysis
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Sub-Second Anomaly Classification
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                During high-stakes telephone approvals, milliseconds matter. VoiceShield AI processes audio through an active Web Audio DSP pipeline, inspecting for vocoder jitter, phase incoherence, and synthetic pitch smoothing.
              </p>

              <div className="mt-6 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Sliding Window Verification</h4>
                    <p className="text-slate-400 mt-0.5">Detects voice clones spliced mid-call even if initial greetings were human.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Live Waveform & FFT Spectrogram</h4>
                    <p className="text-slate-400 mt-0.5">HTML5 canvas visualizers rendering exact frequency distributions and energy peaks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Hardware Microphone Selection</h4>
                    <p className="text-slate-400 mt-0.5">Flexible input switching with real-time decibel level metering and gain tracking.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleTryDemo}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
                >
                  Try Live Microphone Stream →
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <span className="text-xs font-semibold text-slate-200">Acoustic Feature Diagnostic</span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] px-2.5 py-0.5 border border-emerald-500/20 font-medium">
                  Analysis Active
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800/60">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Phase Continuity Anomaly</span>
                    <span className="text-rose-400 font-semibold">89% (High)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 w-[89%]" />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800/60">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Pitch Inflection (F0) Flatness</span>
                    <span className="text-rose-400 font-semibold">92% (Synthetic Pattern)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 w-[92%]" />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800/60">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Spectral Centroid Stability</span>
                    <span className="text-amber-400 font-semibold">64% (Suspicious)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[64%]" />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-950/60 p-3.5 border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
                <span className="text-rose-400 font-medium">Diagnostic Summary: </span>
                Acoustic spectrum reveals mathematical artifacts consistent with neural vocoders. Biological vocal cord micro-tremor is absent in sustained vowel segments.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Speaker Verification & Biometric Vault */}
      <section id="speaker-verification" className="py-20 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-200">Enrolled Executive Voiceprints</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">3 Profiles Active</span>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 text-xs">Col. Vikramaditya Rathore</span>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-0.5 border border-emerald-500/20 font-medium">
                      Enrolled (48 kHz)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Strategic Operations • 28 verifications</p>
                </div>

                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 text-xs">Ananya Sen</span>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-0.5 border border-emerald-500/20 font-medium">
                      Enrolled (44.1 kHz)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Financial Comptroller • 15 verifications</p>
                </div>

                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 text-xs">Dr. S. K. Nambiar</span>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-0.5 border border-emerald-500/20 font-medium">
                      Enrolled (48 kHz)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Infrastructure Lead • 7 verifications</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Biometric Assurance
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Speaker Profiles & Reference Vault
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Preventing voice impersonation requires validating speech not just against general AI models, but against the claimed individual's verified voice baseline. VoiceShield AI creates enrolled reference prints with calibrated samples.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <p className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  Dual-Factor Verification: Identity match plus synthesizer anomaly check.
                </p>
                <p className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  Lossless audio enrollment via browser microphone or high-fidelity file upload.
                </p>
                <p className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  Historical audit logs tracking verification scores over time.
                </p>
              </div>

              <div className="mt-8">
                <NavLink
                  to="/speaker-profiles"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700/80 px-5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                >
                  <span>Manage Biometric Vault</span>
                  <ChevronRight className="h-4 w-4" />
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. System Architecture */}
      <section id="technology" className="py-20 border-b border-slate-800/80 bg-[#0b0f19]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              System Architecture
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Built for SIH26104 Compliance
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Decoupled, enterprise architecture designed for high-throughput AI inference and persistent security audits.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">AI Model Backend Adapter</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Interfaces with FastAPI, PyTorch, and RawNet3 inference servers. Supports streaming WebSockets (/ws/v1/live-detection) and REST endpoints.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Supabase RLS & Encrypted Storage</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                PostgreSQL schema with strict Row Level Security ensuring multi-tenant isolation. Private encrypted storage buckets for voice biometrics.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-200">Client-Side Web Audio DSP</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Hardware-accelerated audio capture with AnalyserNode, FFT frequency rendering, and sliding-window audio buffer processors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Privacy & Responsible AI */}
      <section className="py-16 border-b border-slate-800/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Privacy, Ethics & Model Explainability</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Probabilistic Classifications:</strong> Machine learning detection models produce probabilistic confidence estimates. They are intended as diagnostic aids for cybersecurity analysts and are corroborated with multi-factor verification.
              </p>
              <p>
                <strong className="text-white">Biometric Protection:</strong> Voice data constitutes sensitive biological telemetry. VoiceShield AI enforces private storage buckets, short-lived signed URLs, and complete deletion controls for all enrolled speaker profiles.
              </p>
              <p>
                <strong className="text-white">Zero Third-Party Model Training:</strong> Audio samples are never routed to commercial public APIs or advertising networks. All audio processing remains within designated sovereign infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="py-20 border-b border-slate-800/80 bg-[#0b0f19]/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Questions & Answers
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 transition overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-slate-200 hover:text-blue-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      activeFaq === i ? 'rotate-180 text-blue-400' : 'text-slate-500'
                    }`}
                  />
                </button>
                {activeFaq === i && (
                  <div className="border-t border-slate-800/80 p-4 pt-3 text-xs text-slate-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="py-12 bg-[#090d16] text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800/80 pb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-white">VoiceShield AI</span>
              <span className="text-slate-500">|</span>
              <span className="text-[11px] text-slate-400">Smart India Hackathon 2026</span>
            </div>

            <div className="flex flex-wrap gap-6 text-slate-400 text-xs">
              <NavLink to="/dashboard" className="hover:text-blue-400 transition">Dashboard</NavLink>
              <NavLink to="/live-detection" className="hover:text-blue-400 transition">Live Detection</NavLink>
              <NavLink to="/audio-analysis" className="hover:text-blue-400 transition">Audio Analysis</NavLink>
              <NavLink to="/speaker-profiles" className="hover:text-blue-400 transition">Speaker Vault</NavLink>
              <NavLink to="/help" className="hover:text-blue-400 transition">Documentation</NavLink>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 VoiceShield AI. Problem Statement SIH26104. All rights reserved.</p>
            <p>Smart India Hackathon 2026 • AI Voice Security</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
