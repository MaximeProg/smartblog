'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

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

/** Bandeau pub flottant, ancré en bas de l'écran sur toutes les pages
 * publiques (monté une fois dans PublicFooter, sa position "fixed" le rend
 * indépendant de l'endroit où il est rendu dans l'arbre). Repliable mais
 * jamais fermé définitivement — la plateforme veut une pub visible à
 * chaque visite, donc aucune persistance de fermeture entre pages/sessions :
 * l'état "replié" repart à zéro (déplié) à chaque montage. */
export function PlatformAdFloatingBar() {
  const t = useTranslations('advertiser');
  const [ad, setAd] = useState<PlatformAdData | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sponsor-feed/active', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: PlatformAdData | null) => {
        if (cancelled || !data) return;
        setAd(data);
        if (trackedRef.current !== data.id) {
          fetch(`/api/sponsor-feed/${data.id}/impression`, { method: 'POST' }).catch(() => {});
          trackedRef.current = data.id;
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!ad) return null;

  const domain = getDomain(ad.click_url);

  function handleClick() {
    if (!ad) return;
    fetch(`/api/sponsor-feed/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    window.open(ad.click_url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40" role="complementary">
      {/* Onglet repli/dépli centré en haut du bandeau */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-slate-700 rounded-t-xl px-5 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-sm"
      >
        {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {collapsed ? t('showAdButton') : t('collapseButton')}
      </button>

      {!collapsed && (
        <div
          className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
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
          </div>
        </div>
      )}
    </div>
  );
}
