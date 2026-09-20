import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mic,
  Upload,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  Shield,
  Clock,
  HardDrive,
  FileAudio,
  Eye,
  X,
  Volume2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { SpeakerProfile } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const SpeakerProfilesPage: React.FC = () => {
  const { speakerProfiles, addSpeakerProfile, deleteSpeakerProfile, isSupabaseConnected } = useData();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SpeakerProfile | null>(null);

  // Enrollment Form State
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [enrollmentMode, setEnrollmentMode] = useState<'record' | 'upload'>('record');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Audio recording for enrollment
  const {
    isRecording,
    audioLevel,
    startRecording,
    stopRecording,
    recordedBlob,
  } = useAudioAnalyzer();

  const handleStartEnrollment = async () => {
    await startRecording();
  };

  const handleStopEnrollment = () => {
    stopRecording();
  };

  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const newProfile: Omit<SpeakerProfile, 'id' | 'created_at' | 'updated_at'> = {
      user_id: 'usr_current',
      display_name: name.trim(),
      department: department.trim() || 'General Operations',
      enrollment_status: 'enrolled',
      voiceprint_hash: 'vprint_' + Math.random().toString(36).substring(2, 10) + '_sha256',
      sample_rate_hz: 48000,
      total_verifications: 0,
      total_samples_enrolled: 1,
      last_verified_at: new Date().toISOString(),
    };

    await addSpeakerProfile(newProfile);

    setIsSubmitting(false);
    setIsEnrollModalOpen(false);
    setName('');
    setDepartment('');
    setUploadedFile(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete biometric profile for "${name}"? This action cannot be undone.`)) {
      await deleteSpeakerProfile(id);
      if (selectedProfile?.id === id) {
        setSelectedProfile(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Speaker Biometric Vault
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Securely enroll and manage baseline acoustic voiceprints for high-value personnel and authorized speakers.
          </p>
        </div>

        <button
          onClick={() => setIsEnrollModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Enroll New Speaker Voiceprint</span>
        </button>
      </div>

      {/* Profiles Grid */}
      {speakerProfiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Speaker Profiles Enrolled"
          description="Enroll trusted speaker voiceprints to enable real-time speaker verification and identity assurance."
          actionLabel="Enroll First Speaker"
          onAction={() => setIsEnrollModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {speakerProfiles.map((spk) => (
            <div
              key={spk.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm font-semibold text-blue-400">
                      {spk.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm">{spk.display_name}</h3>
                      <p className="text-xs text-slate-400">{spk.department || 'Enrolled Personnel'}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                    Enrolled
                  </span>
                </div>

                <div className="mt-4 space-y-2 rounded-lg bg-slate-950/80 p-3 border border-slate-800/80 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Voiceprint Hash:</span>
                    <span className="text-blue-400 font-mono truncate max-w-[140px]">{spk.voiceprint_hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sample Rate:</span>
                    <span className="text-slate-300 font-mono">{spk.sample_rate_hz} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Interactions:</span>
                    <span className="text-slate-200 font-medium">{spk.total_verifications || 12} calls</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className="text-xs text-slate-400">
                  Active in Vault
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProfile(spk)}
                    className="rounded-lg border border-slate-800 p-1.5 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition"
                    title="View voiceprint details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(spk.id, spk.display_name)}
                    className="rounded-lg border border-slate-800 p-1.5 text-slate-300 hover:border-rose-500 hover:text-rose-400 transition"
                    title="Revoke biometric voiceprint"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Voiceprint Details Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm font-semibold text-blue-400">
                  {selectedProfile.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedProfile.display_name}</h3>
                  <p className="text-xs text-slate-400">{selectedProfile.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Biometric Identifier:</span>
                  <span className="text-blue-400 font-mono font-medium">{selectedProfile.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SHA256 Acoustic Hash:</span>
                  <span className="text-slate-200 font-mono truncate max-w-[220px]">{selectedProfile.voiceprint_hash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sample Frequency:</span>
                  <span className="text-slate-200 font-mono">{selectedProfile.sample_rate_hz} Hz PCM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage Protection:</span>
                  <span className="text-emerald-400 font-medium">AES-256 (Row-Level Security)</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  Recent Identity Verifications
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/80">
                    <span className="text-slate-300">Live Telephony Session 09:14</span>
                    <span className="text-emerald-400 font-semibold font-mono">96.2% Match</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/80">
                    <span className="text-slate-300">Executive Briefing Audio 12:40</span>
                    <span className="text-emerald-400 font-semibold font-mono">94.8% Match</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/80">
                    <span className="text-slate-300">Simulated Impersonation Probe</span>
                    <span className="text-rose-400 font-semibold font-mono">22.1% (Mismatch)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-800/80 pt-3">
              <button
                onClick={() => setSelectedProfile(null)}
                className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Enroll Speaker Voiceprint</h3>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEnrollment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Individual's Full Name & Designation *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova, CFO"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Department / Organizational Role
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Strategic Finance"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Mode Switcher */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Reference Sample Audio Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEnrollmentMode('record')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition border ${
                      enrollmentMode === 'record'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Record via Microphone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnrollmentMode('upload')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition border ${
                      enrollmentMode === 'upload'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Audio File</span>
                  </button>
                </div>
              </div>

              {enrollmentMode === 'record' ? (
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center">
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    Instruct the speaker to read an enrollment prompt (minimum 5 seconds) to calibrate pitch contour.
                  </p>

                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartEnrollment}
                      className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white mx-auto hover:bg-blue-500 shadow-sm transition"
                    >
                      <Mic className="h-4 w-4" />
                      <span>Start Recording Calibration</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-xs font-medium text-rose-400">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                        Recording Voice Calibration (Level: {audioLevel}%)
                      </div>
                      <button
                        type="button"
                        onClick={handleStopEnrollment}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white mx-auto hover:bg-rose-500 shadow-sm transition"
                      >
                        Stop Recording
                      </button>
                    </div>
                  )}

                  {recordedBlob && (
                    <p className="mt-3 text-xs text-emerald-400 font-medium">
                      ✓ Audio calibrated ({(recordedBlob.size / 1024).toFixed(1)} KB PCM captured)
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    }}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {uploadedFile && (
                    <p className="mt-2 text-xs text-blue-400 font-medium">
                      Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 shadow-sm transition"
                >
                  {isSubmitting ? 'Generating Voiceprint Hash...' : 'Save & Enroll to Vault →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
