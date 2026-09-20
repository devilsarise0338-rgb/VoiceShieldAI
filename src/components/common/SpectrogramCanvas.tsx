import React, { useRef, useEffect } from 'react';

interface SpectrogramCanvasProps {
  analyserNode?: AnalyserNode | null;
  isActive: boolean;
  height?: number;
}

export const SpectrogramCanvas: React.FC<SpectrogramCanvasProps> = ({
  analyserNode,
  isActive,
  height = 110,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const numBars = 48;
      const barWidth = w / numBars - 2;

      if (isActive && analyserNode) {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        for (let i = 0; i < numBars; i++) {
          const index = Math.floor((i / numBars) * (bufferLength / 2));
          const val = dataArray[index] || 0;
          const barHeight = (val / 255) * (h - 10);

          // Color gradient based on frequency intensity
          let fill = '#38bdf8'; // Sky blue
          if (val > 185) fill = '#f43f5e'; // High energy peak / vocal anomaly
          else if (val > 130) fill = '#818cf8'; // Indigo
          else if (val > 70) fill = '#3b82f6'; // Blue

          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.roundRect(i * (barWidth + 2), h - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      } else if (isActive) {
        tick += 0.05;
        for (let i = 0; i < numBars; i++) {
          const wave = Math.sin(i * 0.3 + tick) * 0.5 + 0.5;
          const noise = (Math.sin(i * 1.5 - tick * 2) * 0.5 + 0.5) * 0.4;
          const barHeight = Math.max(3, (wave + noise) * (h - 20));

          let fill = '#38bdf8';
          if (barHeight > h * 0.7) fill = '#818cf8';
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.roundRect(i * (barWidth + 2), h - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      } else {
        // Idle baseline bars
        for (let i = 0; i < numBars; i++) {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(i * (barWidth + 2), h - 4, barWidth, 4, [1, 1, 0, 0]);
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [analyserNode, isActive]);

  return (
    <div className="relative w-full rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium text-slate-300">
          Spectral Frequency Density (FFT 256)
        </span>
        <span className="text-[11px] font-mono text-slate-400">0 Hz — 24 kHz</span>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={height}
        className="w-full h-full block rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
