'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, X } from 'lucide-react';

interface PlatformAdData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  click_url: string;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function dismissKey(adId: string): string {
  return `platform-ad-dismissed:${adId}`;
}

/** Bandeau pub flottant, ancré en bas de l'écran sur toutes les pages
 * publiques (monté une fois dans PublicFooter, sa position "fixed" le rend
 * indépendant de l'endroit où il est rendu dans l'arbre). Fermable — une
 * fois fermé, reste fermé pour cette pub précise pendant la session du
 * navigateur (sessionStorage), pour ne pas réapparaître à chaque navigation
 * tant que l'utilisateur lit le site. */
export function PlatformAdFloatingBar() {
  const t = useTranslations('advertiser');
  const [ad, setAd] = useState<PlatformAdData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sponsor-feed/active', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: PlatformAdData | null) => {
        if (cancelled || !data) return;
        if (typeof window !== 'undefined' && window.sessionStorage.getItem(dismissKey(data.id))) {
          return;
        }
        setAd(data);
        if (trackedRef.current !== data.id) {
          fetch(`/api/sponsor-feed/${data.id}/impression`, { method: 'POST' }).catch(() => {});
          trackedRef.current = data.id;
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!ad || dismissed) return null;

  const domain = getDomain(ad.click_url);

  function handleClick() {
    if (!ad) return;
    fetch(`/api/sponsor-feed/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    window.open(ad.click_url, '_blank', 'noopener,noreferrer');
  }

  function handleDismiss() {
    if (ad && typeof window !== 'undefined') {
      window.sessionStorage.setItem(dismissKey(ad.id), '1');
    }
    setDismissed(true);
  }

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
      role="complementary"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
        {ad.image_url && !imgError && (
          <button onClick={handleClick} className="shrink-0 h-11 w-11 sm:h-14 sm:w-14 rounded-lg overflow-hidden" aria-label={ad.title}>
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <span className="inline-block text-[9px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
            {t('sponsoredLabel')}
          </span>
          <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
            {ad.title}
          </p>
          {domain && <p className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 truncate">{domain}</p>}
        </div>
        <button
          onClick={handleClick}
          className="shrink-0 flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 text-xs sm:text-sm font-bold transition-opacity whitespace-nowrap"
        >
          <span className="hidden sm:inline">{t('openButton')}</span> <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDismiss}
          aria-label={t('closeButton')}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
