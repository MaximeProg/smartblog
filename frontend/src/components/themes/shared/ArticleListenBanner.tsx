'use client';

import { Headphones, Pause, X } from 'lucide-react';
import { useState } from 'react';
import { useAudioPlayer } from './PersistentAudioPlayer';

interface ArticleListenBannerProps {
  audioUrl: string;
  title: string;
  authorName?: string | null;
  coverUrl?: string | null;
  primaryColor?: string;
}

export default function ArticleListenBanner({
  audioUrl,
  title,
  authorName,
  coverUrl,
  primaryColor = '#3b82f6',
}: ArticleListenBannerProps) {
  const { play, pause, track, playing } = useAudioPlayer();
  const [dismissed, setDismissed] = useState(false);

  const isActive = track?.url === audioUrl;

  // Hide once the track is playing (the PersistentAudioPlayer takes over UX at the bottom)
  if (dismissed || (isActive && playing)) return null;

  const handleClick = () => {
    if (isActive && !playing) {
      play({ url: audioUrl, title, author: authorName, coverUrl, primaryColor });
    } else {
      play({ url: audioUrl, title, author: authorName, coverUrl, primaryColor });
    }
  };

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 pl-4 pr-2 py-2.5 rounded-full shadow-lg border text-sm font-medium"
      style={{
        borderColor: `${primaryColor}30`,
        backgroundColor: 'white',
        color: primaryColor,
        boxShadow: `0 4px 20px ${primaryColor}20, 0 1px 4px rgba(0,0,0,0.08)`,
      }}
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-2"
        aria-label="Listen to this article"
      >
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
          style={{ backgroundColor: `${primaryColor}18` }}
        >
          <Headphones className="h-3.5 w-3.5" />
        </div>
        <span className="pr-1 max-w-[140px] truncate text-zinc-700">Listen</span>
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="flex items-center justify-center w-6 h-6 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
