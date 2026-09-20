import { AudioAnalysis, RiskLevel, ResultLabel, SpectralArtifact } from '../types';

export interface AnalysisRequest {
  audioBlob?: Blob;
  fileName?: string;
  speakerProfileId?: string;
  sourceType: 'audio_upload' | 'live_stream' | 'telephony_stream';
}

export interface EnrollmentRequest {
  speakerId: string;
  displayName: string;
  audioBlob: Blob;
  sampleRate: number;
}

export class AIDetectionService {
  private backendUrl: string;
  private isDemoMode: boolean;

  constructor() {
    this.backendUrl = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';
    this.isDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE !== 'false';
  }

  public setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
  }

  public getDemoMode(): boolean {
    return this.isDemoMode;
  }

  public setBackendUrl(url: string) {
    this.backendUrl = url;
  }

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  /**
   * Submit audio file or recorded stream for deepfake / voice-cloning analysis
   */
  async analyzeAudioFile(file: File, speakerProfileId?: string, speakerName?: string): Promise<AudioAnalysis> {
    const analysis = await this.submitAudioAnalysis({
      audioBlob: file,
      fileName: file.name,
      speakerProfileId,
      sourceType: 'audio_upload',
    });
    if (speakerName) {
      analysis.speaker_name = speakerName;
    }
    return analysis;
  }

  async submitAudioAnalysis(req: AnalysisRequest, isSuspiciousSimulated = false): Promise<AudioAnalysis> {
    // If backend is active and demo mode is disabled, call the real FastAPI endpoint
    if (!this.isDemoMode && this.backendUrl && !this.backendUrl.includes('localhost:8000')) {
      try {
        const formData = new FormData();
        if (req.audioBlob) {
          formData.append('file', req.audioBlob, req.fileName || 'sample.wav');
        }
        if (req.speakerProfileId) {
          formData.append('speaker_profile_id', req.speakerProfileId);
        }
        formData.append('source_type', req.sourceType);

        const res = await fetch(`${this.backendUrl}/api/v1/analyses`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            ...data,
            is_demo: false,
          };
        }
      } catch (err) {
        console.warn('Backend call failed, falling back to simulated analysis adapter.', err);
      }
    }

    // High-fidelity development simulation adapter with acoustic explainability
    await new Promise((resolve) => setTimeout(resolve, 1800)); // realistic processing latency

    const id = 'ana_' + Math.random().toString(36).substring(2, 10);
    const duration = Math.floor(Math.random() * 8) + 4;

    if (isSuspiciousSimulated) {
      const spoofScore = Math.floor(Math.random() * 15) + 82; // 82 - 97%
      const authScore = 100 - spoofScore;
      const artifacts: SpectralArtifact[] = [
        {
          name: 'Linear Predictive Coding (LPC) Discontinuity',
          score: 89,
          status: 'anomaly_detected',
          description: 'High-frequency phase incoherence typical of neural vocoder synthesis (HiFi-GAN / DiffSinger).',
        },
        {
          name: 'Fundamental Pitch Inflection (F0)',
          score: 92,
          status: 'anomaly_detected',
          description: 'Acoustic micro-prosody is artificially flattened across phoneme transitions.',
        },
        {
          name: 'Phase Inconsistency & Spectral Centroid',
          score: 76,
          status: 'anomaly_detected',
          description: 'Robotic spectral energy roll-off above 7.8 kHz detected.',
        },
        {
          name: 'Phoneme Articulation Latency',
          score: 64,
          status: 'normal',
          description: 'Vocal tract resonance timing remains within acceptable human dispersion.',
        },
      ];

      return {
        id,
        user_id: 'current-user',
        speaker_profile_id: req.speakerProfileId,
        source_type: req.sourceType,
        file_name: req.fileName || 'recorded_intercept.wav',
        duration_seconds: duration,
        status: 'completed',
        result_label: 'synthetic_clone',
        risk_level: 'critical',
        authenticity_score: authScore,
        spoof_risk_score: spoofScore,
        speaker_similarity_score: req.speakerProfileId ? Math.floor(Math.random() * 20) + 12 : undefined,
        model_confidence: 94.2,
        model_version: 'VoiceShield-RawNet3-v2.4 [Demo Engine]',
        spectral_artifacts: artifacts,
        explanation:
          'High probability of neural voice cloning detected. Acoustic signature reveals synthetic vocoder phase discontinuities and unnatural fundamental frequency (F0) micro-inflection consistency.',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        is_demo: true,
      };
    } else {
      const spoofScore = Math.floor(Math.random() * 12) + 4; // 4 - 16%
      const authScore = 100 - spoofScore;
      const artifacts: SpectralArtifact[] = [
        {
          name: 'Linear Predictive Coding (LPC) Discontinuity',
          score: 11,
          status: 'normal',
          description: 'Natural organic phase distribution across resonant vocal tract formants.',
        },
        {
          name: 'Fundamental Pitch Inflection (F0)',
          score: 8,
          status: 'normal',
          description: 'Organic human micro-tremor and breathing pauses present.',
        },
        {
          name: 'Phase Inconsistency & Spectral Centroid',
          score: 14,
          status: 'normal',
          description: 'Uniform spectral decay across high frequencies without synthetic cutoff.',
        },
        {
          name: 'Phoneme Articulation Latency',
          score: 9,
          status: 'normal',
          description: 'Acoustic dynamics match biological human vocalization.',
        },
      ];

      return {
        id,
        user_id: 'current-user',
        speaker_profile_id: req.speakerProfileId,
        source_type: req.sourceType,
        file_name: req.fileName || 'voice_sample.wav',
        duration_seconds: duration,
        status: 'completed',
        result_label: 'authentic',
        risk_level: 'safe',
        authenticity_score: authScore,
        spoof_risk_score: spoofScore,
        speaker_similarity_score: req.speakerProfileId ? Math.floor(Math.random() * 10) + 88 : undefined,
        model_confidence: 96.8,
        model_version: 'VoiceShield-RawNet3-v2.4 [Demo Engine]',
        spectral_artifacts: artifacts,
        explanation:
          'Natural human vocal tract acoustics verified. Organic pitch variations, breath artifacts, and continuous phase coherence indicate biological origin.',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        is_demo: true,
      };
    }
  }

  /**
   * Enroll speaker reference profile
   */
  async enrollSpeakerProfile(req: EnrollmentRequest): Promise<{ voiceprintHash: string; success: boolean }> {
    await new Promise((r) => setTimeout(r, 1200));
    return {
      voiceprintHash: 'vp_sha256_' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      success: true,
    };
  }
}

export const aiDetectionService = new AIDetectionService();
