import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

export const AnalyzePage = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveformRef.current) {
      if (!wavesurfer.current) {
        wavesurfer.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#A7F3D0', // light teal
          progressColor: '#0F6E56', // accent teal
          barWidth: 3,
          barGap: 2,
          barRadius: 2,
          height: 60,
        });
      }
      if (audioUrl) {
        wavesurfer.current.load(audioUrl);
      } else {
        // Just empty it
        wavesurfer.current.empty();
      }
    }
    return () => {
      // Don't destroy on every render, just keep it alive or clean properly
    };
  }, [audioUrl]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-8 py-6 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Audio analysis</h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground font-mono">
            <span>console</span>
            <span>/</span>
            <span>analyze</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 text-sm font-medium border border-border rounded text-foreground hover:bg-muted transition-colors">
            Refresh
          </button>
          <button className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
            New session
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-border bg-card flex items-center gap-6">
        <button className="py-3 text-sm font-medium text-accent border-b-2 border-accent">
          Live analysis
        </button>
        <button className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          Batch queue <span className="bg-muted px-1.5 rounded-full text-xs font-mono">3</span>
        </button>
        <button className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          Agent activity <span className="bg-muted px-1.5 rounded-full text-xs font-mono">12</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-8 space-y-6 max-w-[1200px]">
        {/* Stat Strip */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-muted-foreground">Analyses today</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-medium text-foreground">247</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">+18 vs yesterday</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-muted-foreground">Flagged high risk</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-medium text-destructive">9</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">3.6% of total</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-muted-foreground">Avg. detection time</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-medium text-foreground">1.8s</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">per 5s clip</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-muted-foreground">Model EER</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-medium text-accent">4.2%</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">ASVspoof19 eval</span>
          </div>
        </div>

        {/* Main Panels */}
        <div className="grid grid-cols-2 gap-6">
          {/* Input Source */}
          <div className="bg-card border border-border rounded-sm p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground tracking-tight">Input source</h2>
              <p className="text-xs text-muted-foreground mt-0.5">WAV, MP3 · up to 5 min · max 25MB</p>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <button className="w-full py-2.5 border border-border rounded-sm text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Start recording
              </button>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground uppercase">
                <div className="flex-1 border-t border-border"></div>
                <span>or</span>
                <div className="flex-1 border-t border-border"></div>
              </div>

              <div className="flex-1 min-h-[120px] border border-dashed border-border rounded-sm flex flex-col items-center justify-center p-6 text-center hover:bg-muted/50 cursor-pointer">
                <span className="text-sm font-medium text-foreground">Drop an audio file or click to upload</span>
                <span className="text-xs text-muted-foreground mt-1 font-mono">caller_sample_0847.wav — ready</span>
              </div>

              <div className="h-16 w-full border border-border border-dashed rounded-sm p-2 flex items-center justify-center">
                <div ref={waveformRef} className="w-full"></div>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 bg-accent text-accent-foreground text-sm font-medium rounded-sm hover:bg-accent/90 transition-colors">
              Run analysis
            </button>
          </div>

          {/* Analysis Result */}
          <div className="bg-card border border-border rounded-sm p-6 flex flex-col">
             <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-base font-semibold text-foreground tracking-tight">Analysis result</h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">caller_sample_0847.wav</p>
              </div>
              <button className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-muted transition-colors">
                Export
              </button>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                <span className="text-sm font-medium text-foreground">Suspicious — likely synthetic</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-sm">
                HIGH RISK
              </span>
            </div>

            <div className="py-6 border-b border-border flex items-baseline gap-2">
              <span className="text-5xl font-mono font-medium text-foreground tracking-tight">87</span>
              <span className="text-sm text-muted-foreground">% synthetic confidence</span>
            </div>

            <div className="mt-6 p-4 bg-[#FFF8E6] border border-[#FDE68A] rounded-sm">
              <p className="text-sm text-[#92400E]">
                <strong>Verify caller before proceeding.</strong> Confirm identity through a separate, previously known channel before acting on this request.
              </p>
            </div>

            <div className="mt-6 flex-1 flex flex-col justify-end">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Duration analyzed</span>
                <span className="text-xs font-mono text-foreground">6.4s</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Sample rate</span>
                <span className="text-xs font-mono text-foreground">16,000 Hz</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-muted-foreground">Context flags</span>
                <span className="text-xs font-mono text-foreground">OTP, urgent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
