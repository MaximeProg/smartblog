'use client';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export function AudioPlayer({ url, title }: { url: string; title: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onDur = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('durationchange', onDur);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('durationchange', onDur);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    playing ? a.pause() : a.play();
    setPlaying(!playing);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="my-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
      <audio ref={ref} src={url} preload="metadata" muted={muted} />

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--blog-primary)' }}
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing
            ? <Pause className="h-4 w-4 text-white" />
            : <Play className="h-4 w-4 text-white ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
              <Volume2 className="h-3 w-3 shrink-0" />
              Écouter l&apos;article
            </span>
            <span className="text-xs text-gray-400 shrink-0 ml-2">
              {fmt(current)} / {fmt(duration)}
            </span>
          </div>

          <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
              style={{ width: `${pct}%`, backgroundColor: 'var(--blog-primary)' }}
            />
            <input
              type="range" min={0} max={duration || 0} step={0.5} value={current}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                if (ref.current) ref.current.currentTime = t;
                setCurrent(t);
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setMuted(m => !m);
            if (ref.current) ref.current.muted = !muted;
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
