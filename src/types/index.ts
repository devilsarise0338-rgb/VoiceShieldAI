/**
 * VoiceShield AI - Core Type Definitions
 * SIH26104: AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks
 */

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type SourceType = 'live_stream' | 'audio_upload' | 'telephony_stream' | 'reference_sample';
export type ResultLabel = 'authentic' | 'suspicious' | 'synthetic_clone' | 'inconclusive';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'under_review' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';
export type InvestigationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type InvestigationStatus = 'open' | 'in_progress' | 'in_review' | 'escalated' | 'resolved' | 'closed';
export type EnrollmentStatus = 'enrolled' | 'pending' | 'failed' | 'processing';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'security_analyst' | 'admin' | 'incident_responder';
  organization?: string;
  created_at: string;
  updated_at: string;
}

export interface SpeakerProfile {
  id: string;
  user_id: string;
  display_name: string;
  department?: string;
  phone_number?: string;
  enrollment_status: EnrollmentStatus;
  reference_audio_path?: string;
  audio_duration_seconds?: number;
  sample_rate_hz?: number;
  voiceprint_hash?: string;
  total_verifications: number;
  total_samples_enrolled?: number;
  last_verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SpectralArtifact {
  name: string;
  score: number; // 0-100% anomaly
  status: 'normal' | 'anomaly_detected';
  description: string;
}

export interface AudioAnalysis {
  id: string;
  user_id: string;
  speaker_profile_id?: string | null;
  speaker_name?: string | null;
  source_type: SourceType;
  file_name?: string;
  file_path?: string;
  duration_seconds: number;
  status: AnalysisStatus;
  result_label: ResultLabel;
  risk_level: RiskLevel;
  authenticity_score: number; // 0 - 100 (100 = definitely human)
  spoof_risk_score: number; // 0 - 100 (100 = definitely cloned)
  speaker_similarity_score?: number | null; // 0 - 100 (match with enrolled voice)
  model_confidence: number; // 0 - 100%
  model_version: string;
  spectral_artifacts: SpectralArtifact[];
  explanation: string;
  created_at: string;
  completed_at?: string | null;
  is_demo: boolean;
  processing_time_ms?: number | null;
  num_windows?: number | null;
  spoof_probability_max?: number | null;
}

export interface DetectionEvent {
  id: string;
  analysis_id: string;
  timestamp: string;
  event_type: 'acoustic_anomaly' | 'pitch_inflection_loss' | 'phase_discontinuity' | 'speaker_mismatch' | 'waveform_slice';
  risk_level: RiskLevel;
  confidence: number;
  time_offset_ms: number;
  details: string;
}

export interface Alert {
  id: string;
  user_id: string;
  analysis_id?: string;
  investigation_id?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  source_type: SourceType;
  target_identity?: string;
  target_individual?: string;
  caller_number?: string;
  spoof_probability: number;
  spoof_score?: number;
  anomaly_tags?: string[];
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}

export type ImpersonationAlert = Alert;

export interface InvestigationNote {
  id: string;
  investigation_id: string;
  user_id: string;
  author_name: string;
  content: string;
  note_text?: string;
  created_at: string;
}

export interface Investigation {
  id: string;
  user_id: string;
  alert_id?: string;
  analysis_id?: string;
  title: string;
  description: string;
  priority: InvestigationPriority;
  status: InvestigationStatus;
  assigned_to?: string;
  detected_caller?: string;
  target_individual?: string;
  timeline_events: Array<{
    id: string;
    timestamp: string;
    title: string;
    description: string;
    type: 'alert' | 'note' | 'escalation' | 'status_change';
  }>;
  timeline?: Array<{
    id?: string;
    timestamp: string;
    action: string;
    description: string;
    type?: string;
  }>;
  notes: InvestigationNote[];
  created_at: string;
  updated_at: string;
}

export interface SecurityReport {
  id: string;
  user_id: string;
  analysis_id?: string;
  report_title: string;
  report_type: 'incident_forensic' | 'speaker_audit' | 'executive_summary';
  classification_label: string;
  risk_assessment: RiskLevel;
  confidence_score: number;
  evidence_summary: string;
  storage_path?: string;
  created_at: string;
}

export interface LiveStreamDetectionState {
  isMonitoring: boolean;
  isPaused: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'streaming' | 'analyzing' | 'error' | 'disconnected';
  liveRiskLevel: RiskLevel;
  authenticityScore: number;
  spoofRiskScore: number;
  speakerSimilarityScore?: number;
  modelConfidence: number;
  activeExplanation: string;
  detectedAnomalies: string[];
  durationSeconds: number;
  audioInputLevel: number; // 0 - 100
  selectedDeviceId?: string;
  selectedSpeakerId?: string;
  challengeActive: boolean;
}

export interface BackendSystemConfig {
  backendUrl: string;
  backendWsUrl: string;
  aiBackendRestUrl?: string;
  aiBackendWsUrl?: string;
  demoMode: boolean;
  sensitivityThreshold: number; // 0 - 100
  spoofThreshold?: number;
  speakerSimilarityThreshold?: number;
  selectedModel: string;
  isSupabaseConnected: boolean;
}
