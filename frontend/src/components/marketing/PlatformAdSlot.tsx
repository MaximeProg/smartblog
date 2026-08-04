'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';

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

/** Emplacement pub sur la page d'accueil publique — n'affiche rien si aucune
 * pub active n'est disponible (pas de contenu de repli codé en dur). Les
 * pubs sont achetées par des utilisateurs connectés depuis /advertiser (voir
 * plan "Publicité sur le site principal"), validées par un super admin,
 * puis servies ici via le tenant sentinelle (settings.PLATFORM_TENANT_ID). */
export function PlatformAdSlot() {
  const t = useTranslations('advertiser');
  const [ad, setAd] = useState<PlatformAdData | null>(null);
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
    <section className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row">
            {ad.image_url && !imgError && (
              <button
                onClick={handleClick}
                className="shrink-0 overflow-hidden cursor-pointer w-full sm:w-[260px] h-[160px] sm:h-auto"
                aria-label={ad.title}
              >
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                  onError={() => setImgError(true)}
                />
              </button>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-between p-5 sm:p-6 gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded mb-2">
                  {t('sponsoredLabel')}
                </span>
                <p className="text-[17px] sm:text-[18px] font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                  {ad.title}
                </p>
                {ad.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mt-1">
                    {ad.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                {domain && <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{domain}</span>}
                <button
                  onClick={handleClick}
                  className="shrink-0 flex items-center gap-2 px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('openButton')} <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
