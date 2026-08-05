'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Clock, ShieldAlert, ShieldX, Sparkles } from 'lucide-react';
import { kycApi, type KycStatusResponse } from '@/lib/api';

const STATUS_CONFIG: Record<string, { icon: typeof ShieldCheck; iconBg: string; border: string }> = {
  not_started: { icon: ShieldCheck, iconBg: 'bg-blue-500',  border: 'border-blue-200 dark:border-blue-800' },
  pending:     { icon: Clock,       iconBg: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800' },
  expired:     { icon: ShieldAlert, iconBg: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800' },
  rejected:    { icon: ShieldX,     iconBg: 'bg-red-500',   border: 'border-red-200 dark:border-red-800' },
};

/**
 * Statut de vérification KYC + bouton de vérification, réutilisé sur le
 * dashboard (variant="banner", animé, attire l'attention) et sur le profil
 * (variant="compact", ligne d'info discrète) — demande PDG 2026-08-05.
 * Ne remplace pas KycRequiredGate (verrouillage plein-écran de la page
 * affiliation, qui reste en place) : ceci est un simple statut + CTA,
 * jamais bloquant.
 */
export function KycStatusBanner({ variant = 'banner' }: { variant?: 'banner' | 'compact' }) {
  const t = useTranslations('kycBanner');
  const params = useParams();
  const locale = params.locale as string;

  const { data: status } = useQuery<KycStatusResponse>({
    queryKey: ['kyc-status'],
    queryFn: async () => { const { data } = await kycApi.getStatus(); return data; },
    staleTime: 60_000,
  });

  if (!status) return null;

  if (status.kyc_status === 'verified') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-400">{t('verifiedBadge')}</span>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[status.kyc_status] ?? STATUS_CONFIG.not_started;
  const Icon = cfg.icon;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${cfg.border} bg-white dark:bg-slate-900`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-8 w-8 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
              {t(`status.${status.kyc_status}.title`)}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/kyc`}
          className="shrink-0 text-[12.5px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap"
        >
          {t(`status.${status.kyc_status}.cta`)}
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 ${cfg.border} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 sm:p-5`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative h-11 w-11 shrink-0">
            <span className={`absolute inset-0 rounded-xl ${cfg.iconBg} animate-ping opacity-40`} />
            <div className={`relative h-11 w-11 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
              {t(`status.${status.kyc_status}.title`)}
            </p>
            <p className="text-[12.5px] text-slate-600 dark:text-slate-400 mt-0.5">
              {t(`status.${status.kyc_status}.description`)}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/kyc`}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-semibold transition-colors shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t(`status.${status.kyc_status}.cta`)}
        </Link>
      </div>
    </div>
  );
}
