import React, { useRef, useEffect } from 'react';

interface AudioWaveformVisualizerProps {
  analyserNode?: AnalyserNode | null;
  isActive: boolean;
  color?: 'cyan' | 'rose' | 'emerald' | 'amber';
  height?: number;
  label?: string;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  analyserNode,
  isActive,
  color = 'cyan',
  height = 140,
  label = 'Real-Time Audio Waveform',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const colorMap = {
      cyan: { stroke: '#38bdf8', gradientStart: 'rgba(56, 189, 248, 0.25)', gradientEnd: 'rgba(56, 189, 248, 0.0)' },
      rose: { stroke: '#f43f5e', gradientStart: 'rgba(244, 63, 94, 0.25)', gradientEnd: 'rgba(244, 63, 94, 0.0)' },
      emerald: { stroke: '#10b981', gradientStart: 'rgba(16, 185, 129, 0.25)', gradientEnd: 'rgba(16, 185, 129, 0.0)' },
      amber: { stroke: '#f59e0b', gradientStart: 'rgba(245, 158, 11, 0.25)', gradientEnd: 'rgba(245, 158, 11, 0.0)' },
    };

    const activeTheme = colorMap[color] || colorMap.cyan;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      // Clean subtle center baseline
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isActive && analyserNode) {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);

        // Fill gradient under wave
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, activeTheme.gradientStart);
        gradient.addColorStop(1, activeTheme.gradientEnd);

        ctx.lineWidth = 2;
        ctx.strokeStyle = activeTheme.stroke;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();
      } else if (isActive) {
        // Simulated live waveform oscillation when mic node is mock-streamed
        offset += 0.04;
        ctx.lineWidth = 2;
        ctx.strokeStyle = activeTheme.stroke;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const norm = x / width;
          const freq1 = Math.sin(norm * 16 + offset) * 14;
          const freq2 = Math.sin(norm * 38 - offset * 1.4) * 7;
          const freq3 = Math.sin(norm * 7 + offset * 0.6) * 5;
          const y = h / 2 + freq1 + freq2 + freq3;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      } else {
        // Idle flat-line with subtle resting wave
        offset += 0.02;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = h / 2 + Math.sin(x * 0.02 + offset) * 1.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isActive, color]);

  return (
    <div className="relative w-full rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <span className="text-xs font-medium text-slate-300">{label}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {isActive ? '48 kHz • Active Stream' : 'Standby'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        className="w-full h-full block rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
