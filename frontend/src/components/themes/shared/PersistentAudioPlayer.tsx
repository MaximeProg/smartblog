'use client';
import { useState, useRef, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { Play, Pause, X, SkipBack, SkipForward, Volume2 } from 'lucide-react';

// ── Audio context shared between all themes ────────────────────────────────────

interface AudioTrack {
  url: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  primaryColor?: string;
}

interface AudioCtx {
  track: AudioTrack | null;
  playing: boolean;
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const Ctx = createContext<AudioCtx>({
  track: null,
  playing: false,
  play: () => {},
  pause: () => {},
  resume: () => {},
  stop: () => {},
});

export const useAudioPlayer = () => useContext(Ctx);

// ── Provider + player UI ───────────────────────────────────────────────────────

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function PersistentAudioProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((t: AudioTrack) => {
    setTrack(t);
    setPlaying(true);
    setCurrentTime(0);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTrack(null);
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    if (!audioRef.current || !track) return;
    audioRef.current.src = track.url;
    audioRef.current.playbackRate = speed;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => setPlaying(false));
  }, [track]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const seekTo = (pct: number) => {
    if (!audioRef.current || !duration) return;
    const t = pct * duration;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const skipBy = (secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + secs));
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const primaryColor = track?.primaryColor || '#18181b';

  return (
    <Ctx.Provider value={{ track, playing, play, pause, resume, stop }}>
      {children}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />

      {/* Player bar — only shown when a track is loaded */}
      {track && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[300] border-t shadow-2xl"
          style={{
            backgroundColor: '#18181b',
            borderColor: '#27272a',
          }}
        >
          {/* Progress bar */}
          <div
            className="relative h-1 w-full cursor-pointer group"
            style={{ backgroundColor: '#3f3f46' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="h-full transition-none"
              style={{ width: `${progressPct}%`, backgroundColor: primaryColor }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
            {/* Cover / icon */}
            {track.coverUrl ? (
              <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Volume2 className="h-4 w-4 text-white" />
              </div>
            )}

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{track.title}</p>
              {track.author && (
                <p className="text-xs text-zinc-400 truncate">{track.author}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => skipBy(-15)}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title="-15s"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                onClick={() => (playing ? pause() : resume())}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                style={{ backgroundColor: primaryColor }}
              >
                {playing
                  ? <Pause className="h-4 w-4" />
                  : <Play className="h-4 w-4 translate-x-0.5" />
                }
              </button>

              <button
                onClick={() => skipBy(30)}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title="+30s"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Time */}
            <div className="text-xs text-zinc-400 tabular-nums shrink-0 hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Speed */}
            <select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 rounded px-1.5 py-1 shrink-0 hidden sm:block"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                <option key={s} value={s}>{s}×</option>
              ))}
            </select>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <Volume2 className="h-3 w-3 text-zinc-500" />
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="w-16 accent-white"
              />
            </div>

            {/* Close */}
            <button
              onClick={stop}
              className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

// ── Helper button to play from an article ─────────────────────────────────────

interface PlayButtonProps {
  audioUrl: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  primaryColor?: string;
  className?: string;
}

export function PlayAudioButton({ audioUrl, title, author, coverUrl, primaryColor, className }: PlayButtonProps) {
  const { track, playing, play, pause, resume } = useAudioPlayer();
  const isThis = track?.url === audioUrl;

  const handleClick = () => {
    if (!isThis) {
      play({ url: audioUrl, title, author, coverUrl, primaryColor });
    } else if (playing) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium text-sm transition-all hover:opacity-90 ${className ?? ''}`}
      style={{ backgroundColor: primaryColor || '#18181b' }}
    >
      {isThis && playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
      {isThis && playing ? 'Pause' : 'Listen'}
    </button>
  );
}
