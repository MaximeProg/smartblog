'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ExternalLink, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const ROTATE_INTERVAL_MS = 30_000;

interface AdData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  click_url: string;
  placement: string | null;
}

interface Props {
  slug: string;
  primaryColor?: string;
}

export function AdRotator({ slug, primaryColor = '#2563eb' }: Props) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const trackedRef = useRef<string | null>(null);

  async function fetchAd() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/public/${slug}/ads/rotator`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data: AdData | null = await res.json();
      if (data && data.id !== trackedRef.current) {
        setAd(data);
        setImgError(false);
        // Track impression immediately
        trackImpression(data.id);
        trackedRef.current = data.id;
      }
    } catch {
      // Silent — no ads is fine
    }
  }

  function trackImpression(adId: string) {
    fetch(`${API_BASE}/api/v1/public/${slug}/ads/${adId}/impression`, {
      method: 'POST',
    }).catch(() => {});
  }

  async function handleClick() {
    if (!ad) return;
    // Track click fire-and-forget
    fetch(`${API_BASE}/api/v1/public/${slug}/ads/${ad.id}/click`, {
      method: 'POST',
    }).catch(() => {});
    window.open(ad.click_url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    fetchAd();
    const timer = setInterval(fetchAd, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slug]);

  if (!ad || dismissed) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Label */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Publicité
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-300 hover:text-slate-500 transition-colors rounded-lg p-0.5"
          aria-label="Fermer la publicité"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Banner image */}
      {ad.image_url && !imgError && (
        <button
          onClick={handleClick}
          className="block w-full relative aspect-[4/3] overflow-hidden group cursor-pointer"
          aria-label={`Voir l'annonce : ${ad.title}`}
        >
          <Image
            src={ad.image_url}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            sizes="(max-width: 1024px) 100vw, 320px"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-end justify-end p-3">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <ExternalLink className="h-2.5 w-2.5" />
              Visiter
            </span>
          </div>
        </button>
      )}

      {/* Text content */}
      <div className="p-4">
        <p className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">
          {ad.title}
        </p>
        {ad.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
            {ad.description}
          </p>
        )}
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          En savoir plus
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
