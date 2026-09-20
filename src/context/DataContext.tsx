import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  AudioAnalysis,
  SpeakerProfile,
  Alert,
  Investigation,
  SecurityReport,
  BackendSystemConfig,
  RiskLevel,
} from '../types';

interface DataContextType {
  analyses: AudioAnalysis[];
  speakerProfiles: SpeakerProfile[];
  alerts: Alert[];
  investigations: Investigation[];
  reports: SecurityReport[];
  backendConfig: BackendSystemConfig;
  unreadAlertsCount: number;
  openInvestigationsCount: number;
  isSupabaseConnected: boolean;
  addAnalysis: (analysis: AudioAnalysis) => Promise<void>;
  deleteAnalysis: (id: string) => Promise<void>;
  addSpeakerProfile: (profile: Omit<SpeakerProfile, 'id' | 'created_at' | 'updated_at' | 'total_verifications'>) => Promise<SpeakerProfile>;
  deleteSpeakerProfile: (id: string) => Promise<void>;
  updateAlertStatus: (id: string, status: Alert['status'], notes?: string) => Promise<void>;
  createInvestigation: (inv: Omit<Investigation, 'id' | 'created_at' | 'updated_at' | 'timeline_events' | 'notes'>) => Promise<Investigation>;
  updateInvestigation: (id: string, updates: Partial<Investigation>) => Promise<void>;
  addInvestigationNote: (invId: string, content: string, authorName?: string) => Promise<void>;
  generateReport: (analysisId: string, title?: string, reportType?: SecurityReport['report_type']) => Promise<SecurityReport>;
  updateBackendConfig: (updates: Partial<BackendSystemConfig>) => void;
  resetToDemoSeed: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial realistic dataset for SIH26104 AI voice cloning defense
const SEED_SPEAKER_PROFILES: SpeakerProfile[] = [
  {
    id: 'spk_01',
    user_id: 'usr_sih_analyst_01',
    display_name: 'Col. Vikramaditya Rathore',
    department: 'Strategic Operations Command',
    phone_number: '+91 98110 44210',
    enrollment_status: 'enrolled',
    reference_audio_path: 'ref_rathore_hq.wav',
    audio_duration_seconds: 14.5,
    sample_rate_hz: 48000,
    voiceprint_hash: 'vp_sha256_8f9c011e29ad41',
    total_verifications: 28,
    last_verified_at: new Date(Date.now() - 42 * 60000).toISOString(),
    notes: 'Primary voiceprint enrolled via High-Definition condenser microphone with acoustic isolation.',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'spk_02',
    user_id: 'usr_sih_analyst_01',
    display_name: 'Smt. Ananya Sen',
    department: 'Financial Disbursement Division',
    phone_number: '+91 98450 11984',
    enrollment_status: 'enrolled',
    reference_audio_path: 'ref_ananya_sen.wav',
    audio_duration_seconds: 12.0,
    sample_rate_hz: 44100,
    voiceprint_hash: 'vp_sha256_3b7d84a1e944b2',
    total_verifications: 15,
    last_verified_at: new Date(Date.now() - 180 * 60000).toISOString(),
    notes: 'Dual-factor verification required for fund authorizations exceeding ₹5,00,000.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'spk_03',
    user_id: 'usr_sih_analyst_01',
    display_name: 'Dr. S. K. Nambiar',
    department: 'Critical Infrastructure Operations',
    phone_number: '+91 97223 90114',
    enrollment_status: 'enrolled',
    reference_audio_path: 'ref_nambiar_ops.wav',
    audio_duration_seconds: 16.2,
    sample_rate_hz: 48000,
    voiceprint_hash: 'vp_sha256_9c2e40993bc2f1',
    total_verifications: 7,
    last_verified_at: new Date(Date.now() - 500 * 60000).toISOString(),
    notes: 'SCADA switchboard emergency authentication profile.',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

const SEED_ANALYSES: AudioAnalysis[] = [
  {
    id: 'ana_101',
    user_id: 'usr_sih_analyst_01',
    speaker_profile_id: 'spk_01',
    speaker_name: 'Col. Vikramaditya Rathore',
    source_type: 'live_stream',
    file_name: 'live_interception_stream_04.raw',
    duration_seconds: 8.4,
    status: 'completed',
    result_label: 'synthetic_clone',
    risk_level: 'critical',
    authenticity_score: 9.4,
    spoof_risk_score: 90.6,
    speaker_similarity_score: 22.1,
    model_confidence: 96.4,
    model_version: 'VoiceShield-RawNet3-v2.4',
    spectral_artifacts: [
      {
        name: 'Phase Incoherence & Vocoder Bleed',
        score: 94,
        status: 'anomaly_detected',
        description: 'HiFi-GAN vocoder artifact detected with irregular high-frequency energy distribution.',
      },
      {
        name: 'Fundamental Pitch Inflection (F0)',
        score: 91,
        status: 'anomaly_detected',
        description: 'Artificial micro-prosody flattening observed across plosive consonants.',
      },
      {
        name: 'LPC Resonance Discontinuity',
        score: 87,
        status: 'anomaly_detected',
        description: 'Formant tracking shows algorithmic jump atypical of human vocal tract inertia.',
      },
    ],
    explanation:
      'High confidence voice cloning impersonation attack detected. Voice acoustics simulate Col. Rathore, but deep neural vocoder artifacts and synthetic phase distortion reveal artificial generation.',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    completed_at: new Date(Date.now() - 24 * 60000).toISOString(),
    is_demo: true,
  },
  {
    id: 'ana_102',
    user_id: 'usr_sih_analyst_01',
    speaker_profile_id: 'spk_02',
    speaker_name: 'Smt. Ananya Sen',
    source_type: 'audio_upload',
    file_name: 'wire_transfer_verification_req_331.wav',
    duration_seconds: 14.8,
    status: 'completed',
    result_label: 'synthetic_clone',
    risk_level: 'high',
    authenticity_score: 18.2,
    spoof_risk_score: 81.8,
    speaker_similarity_score: 88.5, // High similarity to impersonate victim!
    model_confidence: 92.8,
    model_version: 'VoiceShield-RawNet3-v2.4',
    spectral_artifacts: [
      {
        name: 'Diffusion-based Voice Cloning Latency',
        score: 82,
        status: 'anomaly_detected',
        description: 'Micro-phoneme temporal jitter detected consistent with zero-shot voice cloning model.',
      },
      {
        name: 'High-frequency Cutoff (8kHz boundary)',
        score: 85,
        status: 'anomaly_detected',
        description: 'Spectral leakage above telephone bandwidth reveals synthetic upsampling.',
      },
    ],
    explanation:
      'Zero-shot voice clone attempting CEO/executive impersonation. Pitch profile mimics enrolled voiceprint closely, but micro-spectral diffusion signatures confirm AI generation.',
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
    completed_at: new Date(Date.now() - 109 * 60000).toISOString(),
    is_demo: true,
  },
  {
    id: 'ana_103',
    user_id: 'usr_sih_analyst_01',
    speaker_profile_id: 'spk_03',
    speaker_name: 'Dr. S. K. Nambiar',
    source_type: 'live_stream',
    file_name: 'grid_substation_routine_check.wav',
    duration_seconds: 11.2,
    status: 'completed',
    result_label: 'authentic',
    risk_level: 'safe',
    authenticity_score: 95.8,
    spoof_risk_score: 4.2,
    speaker_similarity_score: 94.2,
    model_confidence: 97.1,
    model_version: 'VoiceShield-RawNet3-v2.4',
    spectral_artifacts: [
      {
        name: 'Vocal Tract Inertia',
        score: 6,
        status: 'normal',
        description: 'Organic mechanical resonance of vocal tract confirmed.',
      },
      {
        name: 'Continuous Natural Prosody',
        score: 8,
        status: 'normal',
        description: 'Natural breath dynamics and legitimate human micro-tremor verified.',
      },
    ],
    explanation:
      'Authentic human speaker verified against enrolled voiceprint with 94.2% biometric match. No synthetic artifacts detected.',
    created_at: new Date(Date.now() - 320 * 60000).toISOString(),
    completed_at: new Date(Date.now() - 319 * 60000).toISOString(),
    is_demo: true,
  },
  {
    id: 'ana_104',
    user_id: 'usr_sih_analyst_01',
    source_type: 'audio_upload',
    file_name: 'unknown_telecom_intercept_892.mp3',
    duration_seconds: 6.5,
    status: 'completed',
    result_label: 'authentic',
    risk_level: 'safe',
    authenticity_score: 92.4,
    spoof_risk_score: 7.6,
    model_confidence: 93.5,
    model_version: 'VoiceShield-RawNet3-v2.4',
    spectral_artifacts: [
      {
        name: 'Acoustic Phase Continuity',
        score: 9,
        status: 'normal',
        description: 'Unperturbed acoustic waveform with standard room reverberation.',
      },
    ],
    explanation: 'Organic human voice recording verified. No enrolled speaker profile was targeted.',
    created_at: new Date(Date.now() - 600 * 60000).toISOString(),
    completed_at: new Date(Date.now() - 599 * 60000).toISOString(),
    is_demo: true,
  },
];

const SEED_ALERTS: Alert[] = [
  {
    id: 'alt_01',
    user_id: 'usr_sih_analyst_01',
    analysis_id: 'ana_101',
    investigation_id: 'inv_01',
    severity: 'critical',
    title: 'Real-Time Voice Impersonation Intercepted',
    description:
      'Critical impersonation attack targeted at Strategic Operations Command. Neural vocoder artifacts detected with 90.6% spoof probability.',
    status: 'new',
    source_type: 'live_stream',
    target_identity: 'Col. Vikramaditya Rathore',
    spoof_probability: 90.6,
    notes: 'Triggered immediate biometric challenge. Call disconnected by adversary.',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'alt_02',
    user_id: 'usr_sih_analyst_01',
    analysis_id: 'ana_102',
    investigation_id: 'inv_02',
    severity: 'high',
    title: 'Synthetic Voice Wire Transfer Authorization Attempt',
    description:
      'Voice clone attempt imitating Smt. Ananya Sen detected on wire transfer verification audio file. High-frequency vocoder leakage.',
    status: 'under_review',
    source_type: 'audio_upload',
    target_identity: 'Smt. Ananya Sen',
    spoof_probability: 81.8,
    notes: 'Transferred to Forensic Incident Cell for deep spectrogram reconstruction.',
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
  },
  {
    id: 'alt_03',
    user_id: 'usr_sih_analyst_01',
    severity: 'medium',
    title: 'Unusual Pitch inflections on Dispatch Trunk #4',
    description: 'Automated monitoring detected low vocal tract inertia variance on external incoming trunk line.',
    status: 'resolved',
    source_type: 'telephony_stream',
    target_identity: 'Unknown External Caller',
    spoof_probability: 44.5,
    resolved_at: new Date(Date.now() - 1200 * 60000).toISOString(),
    notes: 'Determined to be aggressive background noise suppression on caller mobile handset.',
    created_at: new Date(Date.now() - 1440 * 60000).toISOString(),
  },
];

const SEED_INVESTIGATIONS: Investigation[] = [
  {
    id: 'inv_01',
    user_id: 'usr_sih_analyst_01',
    alert_id: 'alt_01',
    analysis_id: 'ana_101',
    title: 'Operation Phantasm: Command Protocol Spoofing Attempt',
    description:
      'Active investigation into synthetic voice cloning attack attempting unauthorized clearance instructions pretending to originate from Col. Vikramaditya Rathore.',
    priority: 'urgent',
    status: 'in_review',
    assigned_to: 'Dr. Kabir Sharma',
    detected_caller: '+91 99001 22849 (Spoofed CLI)',
    target_individual: 'Col. Vikramaditya Rathore',
    timeline_events: [
      {
        id: 'evt_1',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        title: 'Critical Live Detection Alert Generated',
        description: 'RawNet3 model flagged neural vocoder phase anomaly with 90.6% spoof score.',
        type: 'alert',
      },
      {
        id: 'evt_2',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        title: 'Escalated to Cyber Incident Cell',
        description: 'Priority changed to Urgent. Voiceprint quarantine initiated.',
        type: 'escalation',
      },
      {
        id: 'evt_3',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        title: 'Forensic Spectral Analysis Attached',
        description: 'Synthetic F0 flatline confirmed in phoneme transition /ra/ -> /th/.',
        type: 'note',
      },
    ],
    notes: [
      {
        id: 'not_1',
        investigation_id: 'inv_01',
        user_id: 'usr_sih_analyst_01',
        author_name: 'Dr. Kabir Sharma',
        content:
          'Spectral energy inspection reveals zero room acoustic response between 4kHz - 8kHz, consistent with TTS or VC zero-shot synthesis model trained on clean studio podcast audio.',
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'inv_02',
    user_id: 'usr_sih_analyst_01',
    alert_id: 'alt_02',
    analysis_id: 'ana_102',
    title: 'Financial Authorization Impersonation (Wire #331)',
    description:
      'Fraudulent audio verification file submitted to release treasury disbursement. Audio cloned from public seminar recording of Smt. Ananya Sen.',
    priority: 'high',
    status: 'open',
    assigned_to: 'Dr. Kabir Sharma',
    detected_caller: 'Internal Portal Upload',
    target_individual: 'Smt. Ananya Sen',
    timeline_events: [
      {
        id: 'evt_21',
        timestamp: new Date(Date.now() - 110 * 60000).toISOString(),
        title: 'File Upload Analysis Flagged',
        description: 'Spoof score 81.8% with diffusion model latency signature.',
        type: 'alert',
      },
    ],
    notes: [],
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 110 * 60000).toISOString(),
  },
];

const SEED_REPORTS: SecurityReport[] = [
  {
    id: 'rep_01',
    user_id: 'usr_sih_analyst_01',
    analysis_id: 'ana_101',
    report_title: 'Forensic Biometric Incident Brief: Audio Intercept #ana_101',
    report_type: 'incident_forensic',
    classification_label: 'CONFIDENTIAL // LAW ENFORCEMENT & CYBER CELL',
    risk_assessment: 'critical',
    confidence_score: 96.4,
    evidence_summary:
      'Confirmed synthetic deepfake voice impersonation with 90.6% spoof score. HiFi-GAN vocoder phase incoherence and loss of biological F0 tremor verified.',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'rep_02',
    user_id: 'usr_sih_analyst_01',
    analysis_id: 'ana_102',
    report_title: 'Financial Fraud Intercept Report: Wire Verification Sample',
    report_type: 'incident_forensic',
    classification_label: 'INTERNAL CYBER AUDIT',
    risk_assessment: 'high',
    confidence_score: 92.8,
    evidence_summary:
      'Diffusion-based voice cloning attempt imitating Smt. Sen detected with 81.8% spoof probability. High-frequency vocoder leakage confirmed.',
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
  },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AudioAnalysis[]>(() => {
    const saved = localStorage.getItem('voiceshield_analyses');
    return saved ? JSON.parse(saved) : SEED_ANALYSES;
  });

  const [speakerProfiles, setSpeakerProfiles] = useState<SpeakerProfile[]>(() => {
    const saved = localStorage.getItem('voiceshield_speakers');
    return saved ? JSON.parse(saved) : SEED_SPEAKER_PROFILES;
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('voiceshield_alerts');
    return saved ? JSON.parse(saved) : SEED_ALERTS;
  });

  const [investigations, setInvestigations] = useState<Investigation[]>(() => {
    const saved = localStorage.getItem('voiceshield_investigations');
    return saved ? JSON.parse(saved) : SEED_INVESTIGATIONS;
  });

  const [reports, setReports] = useState<SecurityReport[]>(() => {
    const saved = localStorage.getItem('voiceshield_reports');
    return saved ? JSON.parse(saved) : SEED_REPORTS;
  });

  const [backendConfig, setBackendConfig] = useState<BackendSystemConfig>(() => {
    return {
      backendUrl: import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000',
      backendWsUrl: import.meta.env.VITE_AI_BACKEND_WS_URL || 'ws://localhost:8000/ws/v1/live-detection',
      demoMode: import.meta.env.VITE_ENABLE_DEMO_MODE !== 'false',
      sensitivityThreshold: 75,
      selectedModel: 'VoiceShield-RawNet3-v2.4',
      isSupabaseConnected: isSupabaseConfigured,
    };
  });

  // Save changes to localStorage for persistent interactive experience
  useEffect(() => {
    localStorage.setItem('voiceshield_analyses', JSON.stringify(analyses));
  }, [analyses]);

  useEffect(() => {
    localStorage.setItem('voiceshield_speakers', JSON.stringify(speakerProfiles));
  }, [speakerProfiles]);

  useEffect(() => {
    localStorage.setItem('voiceshield_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('voiceshield_investigations', JSON.stringify(investigations));
  }, [investigations]);

  useEffect(() => {
    localStorage.setItem('voiceshield_reports', JSON.stringify(reports));
  }, [reports]);

  // If live Supabase is configured, pull database tables
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !user) return;

    const fetchSupabaseData = async () => {
      try {
        const [anaRes, spkRes, altRes, invRes, repRes] = await Promise.all([
          client.from('audio_analyses').select('*').order('created_at', { ascending: false }),
          client.from('speaker_profiles').select('*').order('created_at', { ascending: false }),
          client.from('alerts').select('*').order('created_at', { ascending: false }),
          client.from('investigations').select('*').order('created_at', { ascending: false }),
          client.from('reports').select('*').order('created_at', { ascending: false }),
        ]);

        if (anaRes.data && anaRes.data.length > 0) setAnalyses(anaRes.data as AudioAnalysis[]);
        if (spkRes.data && spkRes.data.length > 0) setSpeakerProfiles(spkRes.data as SpeakerProfile[]);
        if (altRes.data && altRes.data.length > 0) setAlerts(altRes.data as Alert[]);
        if (invRes.data && invRes.data.length > 0) setInvestigations(invRes.data as Investigation[]);
        if (repRes.data && repRes.data.length > 0) setReports(repRes.data as SecurityReport[]);
      } catch (err) {
        console.warn('Error syncing with remote Supabase, using local state.', err);
      }
    };

    fetchSupabaseData();
  }, [user]);

  const deleteAnalysis = async (id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('audio_analyses').delete().eq('id', id);
    }
  };

  const addAnalysis = async (analysis: AudioAnalysis) => {
    setAnalyses((prev) => [analysis, ...prev]);

    // Automatically trigger an Alert if analysis detected high or critical risk!
    if (analysis.risk_level === 'high' || analysis.risk_level === 'critical') {
      const newAlert: Alert = {
        id: 'alt_' + Math.random().toString(36).substring(2, 9),
        user_id: user?.id || 'usr_current',
        analysis_id: analysis.id,
        severity: analysis.risk_level === 'critical' ? 'critical' : 'high',
        title: `Synthetic Voice Detected (${analysis.spoof_risk_score}% Spoof Risk)`,
        description: `Voice clone anomaly detected in ${analysis.source_type.replace('_', ' ')}. ${analysis.explanation}`,
        status: 'new',
        source_type: analysis.source_type,
        target_identity: analysis.speaker_name,
        spoof_probability: analysis.spoof_risk_score,
        created_at: new Date().toISOString(),
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    if (isSupabaseConfigured && supabase && user) {
      try {
        await supabase.from('audio_analyses').insert([
          {
            id: analysis.id,
            user_id: user.id,
            speaker_profile_id: analysis.speaker_profile_id,
            source_type: analysis.source_type,
            file_name: analysis.file_name,
            duration_seconds: analysis.duration_seconds,
            status: analysis.status,
            result_label: analysis.result_label,
            risk_level: analysis.risk_level,
            authenticity_score: analysis.authenticity_score,
            spoof_risk_score: analysis.spoof_risk_score,
            speaker_similarity_score: analysis.speaker_similarity_score,
            model_confidence: analysis.model_confidence,
            model_version: analysis.model_version,
            spectral_artifacts: analysis.spectral_artifacts,
            explanation: analysis.explanation,
            is_demo: analysis.is_demo,
          },
        ]);
      } catch (e) {
        console.warn('Supabase insert audio_analyses failed', e);
      }
    }
  };

  const addSpeakerProfile = async (
    profileData: Omit<SpeakerProfile, 'id' | 'created_at' | 'updated_at' | 'total_verifications'>
  ): Promise<SpeakerProfile> => {
    const newProfile: SpeakerProfile = {
      ...profileData,
      id: 'spk_' + Math.random().toString(36).substring(2, 9),
      total_verifications: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSpeakerProfiles((prev) => [newProfile, ...prev]);

    if (isSupabaseConfigured && supabase && user) {
      try {
        await supabase.from('speaker_profiles').insert([
          {
            id: newProfile.id,
            user_id: user.id,
            display_name: newProfile.display_name,
            department: newProfile.department,
            phone_number: newProfile.phone_number,
            enrollment_status: newProfile.enrollment_status,
            reference_audio_path: newProfile.reference_audio_path,
            audio_duration_seconds: newProfile.audio_duration_seconds,
            sample_rate_hz: newProfile.sample_rate_hz,
            voiceprint_hash: newProfile.voiceprint_hash,
            notes: newProfile.notes,
          },
        ]);
      } catch (e) {
        console.warn('Supabase insert speaker_profiles failed', e);
      }
    }

    return newProfile;
  };

  const deleteSpeakerProfile = async (id: string) => {
    setSpeakerProfiles((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('speaker_profiles').delete().eq('id', id);
    }
  };

  const updateAlertStatus = async (id: string, status: Alert['status'], notes?: string) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status,
            notes: notes !== undefined ? notes : a.notes,
            resolved_at: status === 'resolved' ? new Date().toISOString() : a.resolved_at,
          };
        }
        return a;
      })
    );

    if (isSupabaseConfigured && supabase) {
      await supabase.from('alerts').update({ status, notes }).eq('id', id);
    }
  };

  const createInvestigation = async (
    invData: Omit<Investigation, 'id' | 'created_at' | 'updated_at' | 'timeline_events' | 'notes'>
  ): Promise<Investigation> => {
    const newInv: Investigation = {
      ...invData,
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      timeline_events: [
        {
          id: 'evt_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toISOString(),
          title: 'Investigation Case Created',
          description: invData.description,
          type: 'alert',
        },
      ],
      notes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setInvestigations((prev) => [newInv, ...prev]);

    // Link alert if provided
    if (invData.alert_id) {
      updateAlertStatus(invData.alert_id, 'under_review');
    }

    return newInv;
  };

  const updateInvestigation = async (id: string, updates: Partial<Investigation>) => {
    setInvestigations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates, updated_at: new Date().toISOString() } : inv))
    );
  };

  const addInvestigationNote = async (invId: string, content: string, authorName?: string) => {
    const newNote = {
      id: 'not_' + Math.random().toString(36).substring(2, 9),
      investigation_id: invId,
      user_id: user?.id || 'usr_current',
      author_name: authorName || user?.full_name || 'Dr. Kabir Sharma',
      content,
      note_text: content,
      created_at: new Date().toISOString(),
    };

    setInvestigations((prev) =>
      prev.map((inv) => {
        if (inv.id === invId) {
          const updatedTimeline = [
            ...(inv.timeline || []),
            {
              id: 'evt_' + Math.random().toString(36).substring(2, 7),
              timestamp: new Date().toISOString(),
              action: 'NOTE_ADDED',
              description: `Analyst note recorded by ${newNote.author_name}: ${content.substring(0, 100)}`,
            },
          ];

          return {
            ...inv,
            notes: [newNote, ...inv.notes],
            timeline: updatedTimeline,
            timeline_events: [
              ...inv.timeline_events,
              {
                id: 'evt_' + Math.random().toString(36).substring(2, 7),
                timestamp: new Date().toISOString(),
                title: 'Note Added by ' + newNote.author_name,
                description: content.substring(0, 120),
                type: 'note',
              },
            ],
            updated_at: new Date().toISOString(),
          };
        }
        return inv;
      })
    );
  };

  const generateReport = async (
    analysisId: string,
    title?: string,
    reportType: SecurityReport['report_type'] = 'incident_forensic'
  ): Promise<SecurityReport> => {
    const analysis = analyses.find((a) => a.id === analysisId) || analyses[0];
    const newReport: SecurityReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      user_id: user?.id || 'usr_current',
      analysis_id: analysis?.id,
      report_title: title || `Forensic Voice Biometrics Audit: ${analysis?.file_name || 'Stream Intercept'}`,
      report_type: reportType,
      classification_label: 'CONFIDENTIAL // CYBERSECURITY CELL',
      risk_assessment: (analysis?.risk_level as RiskLevel) || 'medium',
      confidence_score: analysis?.model_confidence || 95.0,
      evidence_summary:
        analysis?.explanation ||
        'Acoustic phase analysis and spectral centroid consistency evaluated against baseline human phonation parameters.',
      created_at: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  const updateBackendConfig = (updates: Partial<BackendSystemConfig>) => {
    setBackendConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetToDemoSeed = () => {
    setAnalyses(SEED_ANALYSES);
    setSpeakerProfiles(SEED_SPEAKER_PROFILES);
    setAlerts(SEED_ALERTS);
    setInvestigations(SEED_INVESTIGATIONS);
    setReports(SEED_REPORTS);
    localStorage.removeItem('voiceshield_analyses');
    localStorage.removeItem('voiceshield_speakers');
    localStorage.removeItem('voiceshield_alerts');
    localStorage.removeItem('voiceshield_investigations');
    localStorage.removeItem('voiceshield_reports');
  };

  const unreadAlertsCount = alerts.filter((a) => a.status === 'new').length;
  const openInvestigationsCount = investigations.filter((i) => i.status === 'open' || i.status === 'in_review').length;

  return (
    <DataContext.Provider
      value={{
        analyses,
        speakerProfiles,
        alerts,
        investigations,
        reports,
        backendConfig: {
          ...backendConfig,
          isSupabaseConnected: isSupabaseConfigured,
        },
        unreadAlertsCount,
        openInvestigationsCount,
        isSupabaseConnected: isSupabaseConfigured,
        addAnalysis,
        deleteAnalysis,
        addSpeakerProfile,
        deleteSpeakerProfile,
        updateAlertStatus,
        createInvestigation,
        updateInvestigation,
        addInvestigationNote,
        generateReport,
        updateBackendConfig,
        resetToDemoSeed,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
