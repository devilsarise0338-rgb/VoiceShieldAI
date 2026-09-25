import { AudioAnalysis, RiskLevel, ResultLabel, SpectralArtifact } from '../types';

export interface AnalysisRequest {
  audioBlob?: Blob;
  fileName?: string;
  speakerProfileId?: string;
  sourceType: 'audio_upload' | 'live_stream' | 'telephony_stream' | 'reference_sample';
}

export interface EnrollmentResponse {
  speaker_id: string;
  display_name: string;
  voiceprint_hash: string;
  audio_duration_seconds: number;
  sample_rate_hz: number;
  enrollment_status: string;
  created_at: string;
}

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function parseBackendError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // Fall through to the raw body/status message below.
  }
  return body.trim() || `Backend request failed with HTTP ${status}.`;
}

function isAudioAnalysis(value: unknown): value is AudioAnalysis {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  const requiredStrings = [
    'id',
    'file_name',
    'source_type',
    'status',
    'result_label',
    'risk_level',
    'model_version',
    'explanation',
  ];
  const requiredNumbers = [
    'duration_seconds',
    'authenticity_score',
    'spoof_risk_score',
    'model_confidence',
  ];
  return (
    requiredStrings.every((key) => typeof data[key] === 'string') &&
    requiredNumbers.every((key) => typeof data[key] === 'number') &&
    Array.isArray(data.spectral_artifacts) &&
    typeof data.is_demo === 'boolean'
  );
}

export class AIDetectionService {
  private backendUrl: string;
  private isDemoMode: boolean;

  constructor() {
    this.backendUrl = trimTrailingSlash(
      import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000'
    );
    this.isDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
  }

  public setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
  }

  public getDemoMode(): boolean {
    return this.isDemoMode;
  }

  public setBackendUrl(url: string) {
    const normalized = trimTrailingSlash(url);
    try {
      const parsed = new URL(normalized);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Backend URL must use http:// or https://.');
      }
      this.backendUrl = normalized;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid backend URL.');
    }
  }

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  public async analyzeAudioFile(
    file: File,
    speakerProfileId?: string,
    speakerName?: string
  ): Promise<AudioAnalysis> {
    const analysis = await this.submitAudioAnalysis({
      audioBlob: file,
      fileName: file.name,
      speakerProfileId,
      sourceType: 'audio_upload',
    });
    if (speakerName) analysis.speaker_name = speakerName;
    return analysis;
  }

  public async submitAudioAnalysis(req: AnalysisRequest): Promise<AudioAnalysis> {
    if (this.isDemoMode) {
      return this.createDemoResult(req);
    }

    if (!this.backendUrl) {
      throw new Error('The AI backend URL is not configured. Set VITE_AI_BACKEND_URL and try again.');
    }
    if (!req.audioBlob) {
      throw new Error('Choose an audio file before starting analysis.');
    }
    if (req.audioBlob.size > MAX_FILE_SIZE) {
      throw new Error('The selected file is larger than 25 MB. Choose a smaller recording.');
    }

    const formData = new FormData();
    formData.append('file', req.audioBlob, req.fileName || 'sample.wav');
    if (req.speakerProfileId) formData.append('speaker_profile_id', req.speakerProfileId);
    formData.append('source_type', req.sourceType);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.backendUrl}/api/v1/analyses`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const body = await res.text();
      if (!res.ok) {
        throw new Error(parseBackendError(res.status, body));
      }

      let data: unknown;
      try {
        data = JSON.parse(body);
      } catch {
        throw new Error('The backend returned an unreadable response. Check the backend logs.');
      }
      if (!isAudioAnalysis(data)) {
        throw new Error('The backend response did not match the audio-analysis contract.');
      }
      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Analysis timed out after 120 seconds. Check backend health and try a shorter clip.');
      }
      if (error instanceof TypeError) {
        throw new Error(
          `Cannot reach the VoiceShield backend at ${this.backendUrl}. Ensure FastAPI is running on port 8000.`
        );
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  public async enrollSpeakerProfile(
    displayName: string,
    department: string | undefined,
    audioBlob: Blob,
    fileName: string
  ): Promise<EnrollmentResponse> {
    if (this.isDemoMode) {
      throw new Error('Speaker enrollment requires demo mode to be disabled.');
    }
    if (audioBlob.size === 0) throw new Error('Record or select a non-empty enrollment sample.');
    if (audioBlob.size > MAX_FILE_SIZE) throw new Error('The enrollment sample is larger than 25 MB.');

    const formData = new FormData();
    formData.append('display_name', displayName);
    if (department) formData.append('department', department);
    formData.append('file', audioBlob, fileName);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.backendUrl}/api/v1/enrollment`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const body = await res.text();
      if (!res.ok) throw new Error(parseBackendError(res.status, body));
      return JSON.parse(body) as EnrollmentResponse;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Speaker enrollment timed out after 120 seconds.');
      }
      if (error instanceof TypeError) {
        throw new Error(`Cannot reach the VoiceShield backend at ${this.backendUrl}.`);
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private async createDemoResult(req: AnalysisRequest): Promise<AudioAnalysis> {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const spoofRiskScore = 87.4;
    const resultLabel: ResultLabel = 'synthetic_clone';
    const riskLevel: RiskLevel = 'critical';
    const artifacts: SpectralArtifact[] = [
      {
        name: 'Demo Spectral Heuristic',
        score: spoofRiskScore,
        status: 'anomaly_detected',
        description: 'Simulated diagnostic; no AASIST inference was run.',
      },
    ];
    return {
      id: crypto.randomUUID(),
      user_id: 'demo-user',
      speaker_profile_id: req.speakerProfileId || null,
      source_type: req.sourceType,
      file_name: req.fileName || 'demo_sample.wav',
      duration_seconds: 5,
      status: 'completed',
      result_label: resultLabel,
      risk_level: riskLevel,
      authenticity_score: 100 - spoofRiskScore,
      spoof_risk_score: spoofRiskScore,
      speaker_similarity_score: null,
      model_confidence: 92,
      model_version: 'SIMULATION - NOT AASIST',
      spectral_artifacts: artifacts,
      explanation: 'SIMULATED RESULT: demo mode is enabled; no real model inference was performed.',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      is_demo: true,
    };
  }
}

export const aiDetectionService = new AIDetectionService();
