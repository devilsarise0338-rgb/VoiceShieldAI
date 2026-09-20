import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AudioPlayerBarProps {
  audioBlob?: Blob | null;
  audioUrl?: string | null;
  title?: string;
  duration?: number;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioBlob,
  audioUrl,
  title = 'Recorded Audio Sample',
  duration,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [srcUrl, setSrcUrl] = useState<string>('');

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setSrcUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (audioUrl) {
      setSrcUrl(audioUrl);
    }
  }, [audioBlob, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !srcUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm shadow-sm">
      <audio
        ref={audioRef}
        src={srcUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
      />

      <button
        type="button"
        onClick={togglePlay}
        disabled={!srcUrl}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-medium transition ${
          srcUrl
            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-900/20'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
      </button>

      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="truncate font-medium text-slate-200">{title}</span>
          <span className="font-mono text-[11px] text-slate-400">
            {formatSec(currentTime)} / {formatSec(totalDuration)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={totalDuration || 10}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
          }
        }}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        title="Reset playback"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
};
