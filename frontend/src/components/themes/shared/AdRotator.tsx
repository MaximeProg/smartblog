'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';

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
  const [collapsed, setCollapsed] = useState(false);
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

  function handleClick() {
    if (!ad) return;
    fetch(`${API_BASE}/api/v1/public/${slug}/ads/${ad.id}/click`, {
      method: 'POST',
    }).catch(() => {});
    window.open(ad.click_url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    fetchAd();
    const timer = setInterval(fetchAd, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ad || dismissed) return null;

  /* ── Collapsed state — thin bar like Google ── */
  if (collapsed) {
    return (
      <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-400 gap-3">
        <span className="font-black uppercase tracking-widest text-[9px]">Annonce masquée</span>
        <button
          onClick={() => setCollapsed(false)}
          className="text-[11px] font-semibold underline hover:text-slate-600 transition-colors"
        >
          Afficher
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Fermer définitivement"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="flex items-stretch" style={{ maxHeight: 88 }}>

        {/* Image thumbnail — fixed width, full height */}
        {ad.image_url && !imgError && (
          <button
            onClick={handleClick}
            className="shrink-0 w-20 overflow-hidden cursor-pointer"
            tabIndex={-1}
            aria-hidden
          >
            <img
              src={ad.image_url}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          </button>
        )}

        {/* Text area — clickable */}
        <button
          onClick={handleClick}
          className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Annonce
          </span>
          <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">
            {ad.title}
          </p>
          {ad.description && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
              {ad.description}
            </p>
          )}
          <span
            className="text-[11px] font-semibold mt-1 inline-flex items-center gap-1"
            style={{ color: primaryColor }}
          >
            En savoir plus
            <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </button>

        {/* Actions: minimize + close */}
        <div className="shrink-0 flex flex-col items-center justify-start gap-1 pt-2.5 pr-2.5">
          <button
            onClick={() => setCollapsed(true)}
            className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xs font-bold leading-none"
            aria-label="Réduire l'annonce"
            title="Réduire"
          >
            −
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fermer l'annonce"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
}
