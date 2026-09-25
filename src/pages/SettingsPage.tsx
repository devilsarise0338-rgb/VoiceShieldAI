import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Sliders,
  Database,
  Radio,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Server,
  Key,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { backendConfig, updateBackendConfig, resetToDemoSeed, isSupabaseConnected } = useData();

  const [demoMode, setDemoMode] = useState(backendConfig.demoMode);
  const [selectedModel, setSelectedModel] = useState(backendConfig.selectedModel);
  const [spoofThreshold, setSpoofThreshold] = useState(backendConfig.spoofThreshold || 75);
  const [similarityThreshold, setSimilarityThreshold] = useState(backendConfig.speakerSimilarityThreshold || 80);
  const [apiUrl, setApiUrl] = useState(backendConfig.aiBackendRestUrl || backendConfig.backendUrl);
  const [wsUrl, setWsUrl] = useState(backendConfig.aiBackendWsUrl || backendConfig.backendWsUrl);
  const [savedNotification, setSavedNotification] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const restUrl = new URL(apiUrl.trim());
      if (!['http:', 'https:'].includes(restUrl.protocol)) {
        throw new Error('REST URL must start with http:// or https://.');
      }
      const socketUrl = new URL(wsUrl.trim());
      if (!['ws:', 'wss:'].includes(socketUrl.protocol)) {
        throw new Error('WebSocket URL must start with ws:// or wss://.');
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Enter valid backend URLs.');
      return;
    }
    updateBackendConfig({
      demoMode,
      selectedModel: 'AASIST / ASVspoof2019-LA',
      spoofThreshold,
      speakerSimilarityThreshold: similarityThreshold,
      aiBackendRestUrl: apiUrl,
      aiBackendWsUrl: wsUrl,
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const handleResetData = () => {
    if (confirm('Reset application to baseline SIH26104 demo dataset? All test alerts and speaker profiles will be refreshed.')) {
      resetToDemoSeed();
      alert('Demo dataset has been restored to factory baseline.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            System & AI Engine Configuration
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Tune acoustic anomaly thresholds, configure AI inference backends, and manage database connection states.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
          <span>Reset Demo Dataset</span>
        </button>
      </div>

      {savedNotification && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>System configuration parameters saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Section 1: AI Model & Inference */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Cpu className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              AI Inference & Anti-Spoofing Architecture
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Active Detection Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="AASIST / ASVspoof2019-LA">AASIST / ASVspoof2019-LA (CPU)</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Real uploaded-audio anti-spoofing. Long clips are windowed on CPU.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Execution Mode
              </label>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                <div>
                  <span className="text-xs text-slate-200 block font-medium">Demo Simulation Mode</span>
                  <span className="text-[11px] text-slate-400">When enabled, upload results are explicitly marked SIMULATED</span>
                </div>
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                FastAPI / PyTorch REST Endpoint
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Live Sliding Window WebSocket Endpoint
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8000/ws/v1/live-detection"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Sensitivity Sliders */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Sliders className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Sensitivity & Escalation Thresholds
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Spoof Detection Alert Threshold:</span>
                <span className="text-rose-400 font-semibold font-mono">{spoofThreshold}% probability</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                step="5"
                value={spoofThreshold}
                onChange={(e) => setSpoofThreshold(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <p className="text-xs text-slate-400">
                Interactions exceeding this threshold trigger high-priority alerts and step-up challenge verification.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Speaker Biometric Match Minimum:</span>
                <span className="text-blue-400 font-semibold font-mono">{similarityThreshold}% match</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <p className="text-xs text-slate-400">
                Reserved for a future speaker-verification model; AASIST does not calculate speaker similarity.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Supabase & Database State */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Database className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Supabase Storage & Row Level Security
            </h3>
          </div>

          <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800/80 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Supabase Connection:</span>
              <span className={isSupabaseConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {isSupabaseConnected ? 'Configured (not a connectivity test)' : 'Local Persistence Mode'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Row Level Security (RLS):</span>
              <span className="text-slate-300 font-medium">Defined in Supabase schema (not live-verified here)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Storage Buckets:</span>
              <span className="text-slate-300 font-mono text-[11px]">voice-reference-audio, analysis-audio, reports (schema only)</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
        >
          <Save className="h-4 w-4" />
          <span>Apply Configuration Changes</span>
        </button>
      </form>
    </div>
  );
};
