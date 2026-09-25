import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAudioAnalyzerReturn {
  isRecording: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'error';
  audioLevel: number;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  recordedBlob: Blob | null;
  analyserNode: AnalyserNode | null;
  startRecording: (deviceId?: string, onAudioChunk?: (chunk: Blob) => void) => Promise<boolean>;
  stopRecording: () => Blob | null;
  setSelectedDeviceId: (id: string) => void;
  resetRecording: () => void;
  errorMessage: string | null;
  onAudioChunk?: (chunk: Blob) => void;
}

export function useAudioAnalyzer(): UseAudioAnalyzerReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Enumerate available microphones
  const loadDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate audio devices:', e);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Clean up helper
  const cleanUpStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceNodeRef.current = null;
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(
    async (deviceId?: string, onAudioChunk?: (chunk: Blob) => void): Promise<boolean> => {
      cleanUpStream();
      setErrorMessage(null);

      try {
        const constraints: MediaStreamConstraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setPermissionStatus('granted');

        // Setup Web Audio API Analyser
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceNodeRef.current = source;

        // Setup MediaRecorder for audio capture
        recordedChunksRef.current = [];
        let recorder: MediaRecorder;
        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

        if (supportedMime) {
          recorder = new MediaRecorder(stream, { mimeType: supportedMime });
        } else {
          recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
            onAudioChunk?.(event.data);
          }
        };

        recorder.onstop = () => {
          const mime = recorder.mimeType || 'audio/webm';
          const blob = new Blob(recordedChunksRef.current, { type: mime });
          setRecordedBlob(blob);
        };

        recorder.start(250); // 250ms chunks
        mediaRecorderRef.current = recorder;

        // Start Volume Meter loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(normalized);
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();

        setIsRecording(true);
        loadDevices();
        return true;
      } catch (err: unknown) {
        console.error('Microphone access failed:', err);
        setPermissionStatus('denied');
        const errObj = err as Error;
        setErrorMessage(errObj?.message || 'Permission denied or microphone unavailable');
        setIsRecording(false);
        return false;
      }
    },
    [cleanUpStream, loadDevices]
  );

  const stopRecording = useCallback((): Blob | null => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanUpStream();
    setIsRecording(false);
    return recordedBlob;
  }, [cleanUpStream, recordedBlob]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    recordedChunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanUpStream();
    };
  }, [cleanUpStream]);

  return {
    isRecording,
    permissionStatus,
    audioLevel,
    devices,
    selectedDeviceId,
    recordedBlob,
    analyserNode: analyserRef.current,
    startRecording,
    stopRecording,
    setSelectedDeviceId,
    resetRecording,
    errorMessage,
  };
}
