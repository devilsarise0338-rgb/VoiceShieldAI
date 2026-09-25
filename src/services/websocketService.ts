import { RiskLevel } from '../types';

export interface LiveDetectionEventPayload {
  timestamp: string;
  authenticityScore: number;
  spoofRiskScore: number;
  speakerSimilarityScore?: number | null;
  riskLevel: RiskLevel;
  confidence: number;
  anomaly?: string | null;
  explanation: string;
  is_demo: boolean;
}

export type LiveStreamCallback = (payload: LiveDetectionEventPayload) => void;
export type LiveConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'analyzing'
  | 'error'
  | 'disconnected';
export type LiveStatusCallback = (status: LiveConnectionStatus) => void;

export class LiveDetectionWebSocketService {
  private socket: WebSocket | null = null;
  private wsUrl: string;
  private demoMode: boolean;
  private listeners = new Set<LiveStreamCallback>();
  private statusListeners = new Set<LiveStatusCallback>();
  private mockInterval: number | null = null;
  private currentStatus: LiveConnectionStatus = 'idle';
  private isSimulation = true;

  constructor() {
    this.wsUrl = import.meta.env.VITE_AI_BACKEND_WS_URL || 'ws://localhost:8000/ws/v1/live-detection';
    this.demoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
  }

  public setWsUrl(url: string) {
    const normalized = url.trim();
    try {
      const parsed = new URL(normalized);
      if (!['ws:', 'wss:'].includes(parsed.protocol)) {
        throw new Error('WebSocket URL must use ws:// or wss://.');
      }
      this.wsUrl = normalized;
      this.disconnect();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid WebSocket URL.');
    }
  }

  public setDemoMode(enabled: boolean) {
    this.demoMode = enabled;
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

  private setStatus(status: LiveConnectionStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public connect(speakerProfileId?: string) {
    this.disconnect();
    this.setStatus('connecting');

    if (this.demoMode) {
      this.startSimulation();
      return;
    }
    if (typeof WebSocket === 'undefined') {
      this.setStatus('error');
      return;
    }

    try {
      const url = new URL(this.wsUrl);
      if (speakerProfileId) url.searchParams.set('speaker_profile_id', speakerProfileId);
      this.socket = new WebSocket(url.toString());

      const connectionTimeout = window.setTimeout(() => {
        if (this.socket?.readyState === WebSocket.CONNECTING) {
          this.socket.close();
          this.setStatus('error');
        }
      }, 8_000);

      this.socket.onopen = () => {
        window.clearTimeout(connectionTimeout);
        this.isSimulation = false;
        this.setStatus('connected');
      };
      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as { event?: string; data?: unknown } & Partial<LiveDetectionEventPayload>;
          const payload = (parsed.data || parsed) as LiveDetectionEventPayload;
          if (typeof payload.spoofRiskScore !== 'number') return;
          this.broadcast({ ...payload, anomaly: payload.anomaly ?? undefined });
        } catch (error) {
          console.error('Failed to parse live WebSocket message.', error);
        }
      };
      this.socket.onerror = () => {
        window.clearTimeout(connectionTimeout);
        this.setStatus('error');
      };
      this.socket.onclose = () => {
        window.clearTimeout(connectionTimeout);
        if (this.currentStatus !== 'idle') this.setStatus('disconnected');
      };
    } catch (error) {
      console.error('Invalid live WebSocket URL.', error);
      this.setStatus('error');
    }
  }

  private startSimulation() {
    this.isSimulation = true;
    this.setStatus('streaming');
    let tick = 0;
    this.mockInterval = window.setInterval(() => {
      tick += 1;
      const spoofRiskScore = Math.max(2, Math.min(98, Math.round(Math.sin(tick * 0.4) * 6 + 10)));
      this.broadcast({
        timestamp: new Date().toISOString(),
        authenticityScore: 100 - spoofRiskScore,
        spoofRiskScore,
        speakerSimilarityScore: null,
        riskLevel: 'safe',
        confidence: 96.5,
        explanation: 'SIMULATED: demo mode is enabled; no audio inference was performed.',
        is_demo: true,
      });
    }, 1500);
  }

  public simulateSuspiciousInjection() {
    if (!this.demoMode) return;
    this.broadcast({
      timestamp: new Date().toISOString(),
      authenticityScore: 12,
      spoofRiskScore: 88,
      speakerSimilarityScore: null,
      riskLevel: 'critical',
      confidence: 93.8,
      anomaly: 'SIMULATED: synthetic voice injection.',
      explanation: 'SIMULATED RESULT: demo mode is enabled; no real model inference was performed.',
      is_demo: true,
    });
  }

  public sendAudioChunk(chunk: ArrayBuffer | Blob) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(chunk);
  }

  private broadcast(payload: LiveDetectionEventPayload) {
    this.listeners.forEach((fn) => fn(payload));
  }

  public disconnect() {
    if (this.mockInterval) {
      window.clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
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
