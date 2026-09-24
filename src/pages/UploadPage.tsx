import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Mic, UploadCloud, Square, Play, Pause, Activity } from 'lucide-react';

export const UploadPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<null | { verdict: string, confidence: number, risk: 'low' | 'medium' | 'high' }>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (audioUrl && waveformRef.current) {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#9CA3AF',
        progressColor: '#14B8A6',
        cursorColor: '#14B8A6',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 80,
      });

      wavesurfer.current.load(audioUrl);
      
      wavesurfer.current.on('finish', () => setIsPlaying(false));
      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
    }
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setResult(null);
    }
  };

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const analyzeAudio = () => {
    setIsAnalyzing(true);
    setResult(null);
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        verdict: 'Synthetic Voice Detected',
        confidence: 98.4,
        risk: 'high'
      });
    }, 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Audio Analysis</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Input Source</h2>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center justify-center gap-2 py-3 border transition-colors ${
                  isRecording 
                    ? 'border-destructive text-destructive bg-destructive/10' 
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="text-sm font-medium">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <label className="flex items-center justify-center gap-2 py-3 border border-border border-dashed text-foreground hover:bg-muted cursor-pointer transition-colors">
                <UploadCloud className="w-4 h-4" />
                <span className="text-sm font-medium">Upload Audio File</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {/* Waveform Section */}
          {audioUrl && (
            <div className="border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Waveform Preview</span>
                <button onClick={togglePlay} className="p-1 hover:bg-muted text-foreground">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              <div ref={waveformRef} className="w-full" />
              
              <button
                onClick={analyzeAudio}
                disabled={isAnalyzing}
                className="w-full py-2 bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  'Analyze Audio'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="space-y-4">
          <div className="border border-border bg-card p-6 h-full flex flex-col">
            <h2 className="text-sm font-medium text-foreground mb-6 border-b border-border pb-2">Analysis Result</h2>
            
            {!result && !isAnalyzing && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                No analysis results yet.
              </div>
            )}

            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Activity className="w-6 h-6 animate-pulse text-accent" />
                <span className="text-sm">Processing audio fingerprint...</span>
              </div>
            )}

            {result && (
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${result.risk === 'high' ? 'bg-destructive' : result.risk === 'medium' ? 'bg-warning' : 'bg-accent'}`} />
                    <span className="text-sm font-medium">{result.verdict}</span>
                  </div>
                  <div className={`px-2 py-0.5 text-xs font-semibold ${result.risk === 'high' ? 'bg-destructive/10 text-destructive border border-destructive/20' : result.risk === 'medium' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                    {result.risk.toUpperCase()} RISK
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Confidence Score</div>
                  <div className="text-5xl font-mono text-foreground tracking-tight">
                    {result.confidence.toFixed(1)}%
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4">
                  <div className="text-xs font-medium text-foreground mb-1">Recommendation</div>
                  <p className="text-sm text-muted-foreground">
                    {result.risk === 'high' 
                      ? 'Do not authenticate this caller. The voice signature exhibits strong synthetic artifacts matching known deepfake generation models.' 
                      : 'Proceed with standard authentication protocols.'}
                  </p>
                </div>
                
                <table className="w-full text-sm text-left">
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="py-2 text-muted-foreground text-xs">Model Used</td>
                      <td className="py-2 text-right font-mono text-xs">VS-VoiceMatch-v2.1</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="py-2 text-muted-foreground text-xs">Processing Time</td>
                      <td className="py-2 text-right font-mono text-xs">1.24s</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
