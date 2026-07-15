'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';

export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

export function getVideoThumbnailUrl(videoUrl: string | null): string | null {
  if (!videoUrl) return null;
  const ytId = getYouTubeId(videoUrl);
  return ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
}

interface VideoCardThumbProps {
  videoUrl: string | null;
  coverImageUrl?: string | null;
  className?: string;
}

export function VideoCardThumb({ videoUrl, coverImageUrl, className = '' }: VideoCardThumbProps) {
  const thumb = coverImageUrl ?? getVideoThumbnailUrl(videoUrl);

  return (
    <div className={`relative w-full h-full bg-zinc-900 overflow-hidden ${className}`}>
      {thumb && (
        <Image
          src={thumb}
          alt="Video"
          fill
          className="object-cover opacity-85"
          sizes="(max-width: 640px) 100vw, 400px"
          unoptimized
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
          <Play className="h-4 w-4 text-zinc-900 ml-0.5" fill="currentColor" />
        </div>
      </div>
      <div className="absolute bottom-1.5 left-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-900/80 text-white px-1.5 py-0.5 rounded">
          Vidéo
        </span>
      </div>
    </div>
  );
}
