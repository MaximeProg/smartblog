'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';

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
  /**
   * inline  – carte avec grande image à gauche, texte à droite (position haute)
   * strip   – barre horizontale compacte avec logo + titre + bouton (position basse)
   */
  variant?: 'inline' | 'strip';
  /** ID d'une annonce déjà affichée à exclure (évite le doublon haut/bas) */
  excludeId?: string;
  /** Callback appelé quand une nouvelle annonce est chargée */
  onAdLoaded?: (id: string) => void;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function AdRotator({ slug, primaryColor = '#2563eb', variant = 'inline', excludeId, onAdLoaded }: Props) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const trackedRef = useRef<string | null>(null);
  const onAdLoadedRef = useRef(onAdLoaded);
  onAdLoadedRef.current = onAdLoaded;

  async function fetchAd(currentExcludeId?: string) {
    try {
      const url = currentExcludeId
        ? `/api/ads-proxy/${slug}/rotator?exclude=${encodeURIComponent(currentExcludeId)}`
        : `/api/ads-proxy/${slug}/rotator`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const data: AdData | null = await res.json();
      if (data && data.id !== trackedRef.current) {
        setAd(data);
        setImgError(false);
        trackImpression(data.id);
        trackedRef.current = data.id;
        onAdLoadedRef.current?.(data.id);
      }
    } catch { /* silent */ }
  }

  function trackImpression(adId: string) {
    fetch(`/api/ads-proxy/${slug}/${adId}/impression`, { method: 'POST' }).catch(() => {});
  }

  function handleClick() {
    if (!ad) return;
    fetch(`/api/ads-proxy/${slug}/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    window.open(ad.click_url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    fetchAd(excludeId);
    const timer = setInterval(() => fetchAd(excludeId), ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slug, excludeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ad || dismissed) return null;

  const domain = getDomain(ad.click_url);

  /* ─────────────────────────────────────────────────────────────────
   * STRIP — barre basse (comme deuxième capture Google)
   * ───────────────────────────────────────────────────────────────── */
  if (variant === 'strip') {
    return (
      <div className="w-full bg-white border-t border-slate-200 relative"
        style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.07)' }}>

        {/* Onglet collapse centré en haut */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border border-b-white border-slate-200 rounded-t-xl px-6 py-1.5 flex items-center gap-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
          style={{ borderBottomColor: 'white' }}
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {collapsed ? 'Afficher l\'annonce' : 'Réduire'}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-5 px-6 py-4 max-w-7xl mx-auto">

            {/* Miniature image ou icône */}
            {ad.image_url && !imgError ? (
              <div className="shrink-0 w-[60px] h-[60px] rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={ad.image_url} alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="shrink-0 w-[60px] h-[60px] rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                📢
              </div>
            )}

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-bold text-slate-900 leading-tight line-clamp-1">
                {ad.title}
              </p>
              {ad.description && (
                <p className="text-sm text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                  {ad.description}
                </p>
              )}
              {domain && (
                <p className="text-xs text-slate-400 mt-0.5">{domain}</p>
              )}
            </div>

            {/* Bouton Ouvrir */}
            <button
              onClick={handleClick}
              className="shrink-0 flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors whitespace-nowrap"
            >
              Ouvrir <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Fermer */}
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Fermer l'annonce"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
   * INLINE — carte avec grande image (comme première capture Google)
   * ───────────────────────────────────────────────────────────────── */
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <div className="flex">

        {/* Image grande à gauche */}
        {ad.image_url && !imgError && (
          <button
            onClick={handleClick}
            className="shrink-0 overflow-hidden cursor-pointer"
            style={{ width: 'clamp(180px, 38%, 300px)', minHeight: 160 }}
            aria-label={ad.title}
          >
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
              style={{ minHeight: 160 }}
              onError={() => setImgError(true)}
            />
          </button>
        )}

        {/* Panneau texte */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-5 gap-4">

          {/* Ligne haute : texte + icônes */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[18px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                {ad.title}
              </p>
              {ad.description && (
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {ad.description}
                </p>
              )}
            </div>

            {/* Icônes ⓘ × */}
            <div className="flex items-center gap-0.5 text-slate-400 shrink-0 mt-0.5">
              <span className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-default transition-colors">
                <Info className="w-4 h-4" />
              </span>
              <button
                onClick={() => setDismissed(true)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ligne basse : badge + bouton Ouvrir */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-1 rounded">
                Annonce
              </span>
              {domain && (
                <span className="text-xs text-slate-400 truncate">{domain}</span>
              )}
            </div>
            <button
              onClick={handleClick}
              className="shrink-0 px-5 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Ouvrir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
