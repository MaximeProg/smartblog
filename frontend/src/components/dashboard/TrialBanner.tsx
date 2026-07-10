'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, Clock, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { useCurrentTenant } from '@/store/auth.store';
import { useTranslations } from 'next-intl';

function daysLeft(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TrialBanner() {
  const tenant = useCurrentTenant();
  const t = useTranslations('trial');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const [dismissed, setDismissed] = useState(false);

  if (!tenant?.trial_ends_at || dismissed) return null;

  const days = daysLeft(tenant.trial_ends_at);
  const expired = days === 0;

  if (expired) {
    return (
      <div className="flex items-center gap-3 bg-red-600 text-white px-5 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="flex-1 text-[13px] font-semibold">{t('expiredMessage')}</p>
        <Link
          href={`/${locale}/subscription`}
          className="flex items-center gap-1.5 text-[12px] font-bold bg-white text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors shrink-0"
        >
          {t('upgradeNow')} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (days > 14) return null;

  const urgent = days <= 3;

  return (
    <div className={`flex items-center gap-3 px-5 py-2.5 ${urgent ? 'bg-amber-500' : 'bg-amber-400'} text-white`}>
      <Clock className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-[13px] font-medium">
        {days === 1 ? t('lastDay') : t('daysLeft', { days })}
      </p>
      <Link
        href={`/${locale}/subscription`}
        className="flex items-center gap-1 text-[11px] font-bold border border-white/60 rounded-lg px-2.5 py-1 hover:bg-white/20 transition-colors shrink-0"
      >
        {t('viewPlans')} <ArrowRight className="h-3 w-3" />
      </Link>
      {!urgent && (
        <button onClick={() => setDismissed(true)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
