import React from 'react';

export const LimitationsPage = () => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 py-6 border-b border-border bg-card">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Model limitations</h1>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground font-mono">
          <span>system</span>
          <span>/</span>
          <span>model limitations</span>
        </div>
      </div>
      <div className="p-8 max-w-3xl">
        <div className="border border-border bg-card p-6 space-y-6 rounded-sm">
          <p className="text-sm text-foreground leading-relaxed">
            The VS-VoiceMatch-v2.1 model is designed to detect synthetic voice artifacts and voice cloning attempts. However, operators must be aware of the following operational limitations and edge cases where confidence scores may be impacted.
          </p>

          <details className="group border border-border bg-muted/20">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground select-none list-none flex justify-between">
              <span>Low-Fidelity Audio Inputs</span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 pb-4 pt-2 border-t border-border text-sm text-muted-foreground leading-relaxed">
              Audio streams with significant background noise, low bitrates (below 16kbps), or aggressive compression artifacts can introduce false positives.
            </div>
          </details>

          <details className="group border border-border bg-muted/20">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground select-none list-none flex justify-between">
              <span>Short Utterances</span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 pb-4 pt-2 border-t border-border text-sm text-muted-foreground leading-relaxed">
              Audio samples shorter than 1.5 seconds do not provide sufficient phonetic coverage. The system requires at least 2-3 seconds of continuous speech.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
