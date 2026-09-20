import { RiskLevel } from '../types';

export interface LiveDetectionEventPayload {
  timestamp: string;
  authenticityScore: number;
  spoofRiskScore: number;
  speakerSimilarityScore?: number;
  riskLevel: RiskLevel;
  confidence: number;
  anomaly?: string;
  explanation: string;
}

export type LiveStreamCallback = (payload: LiveDetectionEventPayload) => void;
export type LiveStatusCallback = (status: 'idle' | 'connecting' | 'connected' | 'streaming' | 'analyzing' | 'error' | 'disconnected') => void;

export class LiveDetectionWebSocketService {
  private socket: WebSocket | null = null;
  private wsUrl: string;
  private listeners: Set<LiveStreamCallback> = new Set();
  private statusListeners: Set<LiveStatusCallback> = new Set();
  private mockInterval: number | null = null;
  private currentStatus: 'idle' | 'connecting' | 'connected' | 'streaming' | 'analyzing' | 'error' | 'disconnected' = 'idle';
  private isSimulation = true;

  constructor() {
    this.wsUrl = import.meta.env.VITE_AI_BACKEND_WS_URL || 'ws://localhost:8000/ws/v1/live-detection';
  }

  public setWsUrl(url: string) {
    this.wsUrl = url;
  }

  public getWsUrl(): string {
    return this.wsUrl;
  }

  public onAnalysisUpdate(cb: LiveStreamCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onStatusChange(cb: LiveStatusCallback): () => void {
    this.statusListeners.add(cb);
    cb(this.currentStatus);
    return () => this.statusListeners.delete(cb);
  }

  private setStatus(status: 'idle' | 'connecting' | 'connected' | 'streaming' | 'analyzing' | 'error' | 'disconnected') {
    this.currentStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public connect(speakerProfileId?: string) {
    this.setStatus('connecting');

    // Check if real WS endpoint is provided
    const isLocalUnreachable = this.wsUrl.includes('localhost:8000');
    if (!isLocalUnreachable && typeof WebSocket !== 'undefined') {
      try {
        const fullUrl = speakerProfileId ? `${this.wsUrl}?speaker_profile_id=${speakerProfileId}` : this.wsUrl;
        this.socket = new WebSocket(fullUrl);

        this.socket.onopen = () => {
          this.isSimulation = false;
          this.setStatus('connected');
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.broadcast(data);
          } catch (err) {
            console.error('Failed to parse WS live message', err);
          }
        };

        this.socket.onerror = () => {
          console.warn('Live WebSocket failed to connect. Falling back to simulated streaming engine.');
          this.startSimulation();
        };

        this.socket.onclose = () => {
          this.setStatus('disconnected');
        };
        return;
      } catch (err) {
        console.warn('WebSocket init exception. Starting simulation.', err);
      }
    }

    // Default: Start simulated streaming engine
    this.startSimulation();
  }

  private startSimulation() {
    this.isSimulation = true;
    this.setStatus('streaming');

    let tick = 0;
    // Periodically generate acoustic telemetry updates
    this.mockInterval = window.setInterval(() => {
      tick++;
      // Baseline authentic human voice characteristics with slight dynamic fluctuations
      const baseSpoof = Math.sin(tick * 0.4) * 6 + 10; // 4 - 16%
      const spoofScore = Math.max(2, Math.min(98, Math.round(baseSpoof)));
      const authScore = 100 - spoofScore;

      const payload: LiveDetectionEventPayload = {
        timestamp: new Date().toISOString(),
        authenticityScore: authScore,
        spoofRiskScore: spoofScore,
        speakerSimilarityScore: 94 - Math.floor(Math.random() * 5),
        riskLevel: 'safe',
        confidence: 96.5,
        explanation: 'Continuous vocal tract acoustic resonance verified. Natural phase jitter within human limits.',
      };

      this.broadcast(payload);
    }, 1500);
  }

  public simulateSuspiciousInjection() {
    // Injects a high-risk deepfake cloning signature into the live monitor
    const payload: LiveDetectionEventPayload = {
      timestamp: new Date().toISOString(),
      authenticityScore: 12,
      spoofRiskScore: 88,
      speakerSimilarityScore: 23,
      riskLevel: 'critical',
      confidence: 93.8,
      anomaly: 'HiFi-GAN neural vocoder phase discontinuity & synthetic spectral flattening detected.',
      explanation: 'ALERT: Synthesized acoustic pattern detected! Phoneme transitions show zero human micro-tremor.',
    };
    this.broadcast(payload);
  }

  public sendAudioChunk(chunk: ArrayBuffer | Blob) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(chunk);
    }
  }

  private broadcast(payload: LiveDetectionEventPayload) {
    this.listeners.forEach((fn) => fn(payload));
  }

  public disconnect() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('idle');
  }

  public isSimulated(): boolean {
    return this.isSimulation;
  }
}

export const liveDetectionWs = new LiveDetectionWebSocketService();
