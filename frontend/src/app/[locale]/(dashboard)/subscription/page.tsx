'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Zap, Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getPlanConfig } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { PlatformShell } from '@/components/dashboard/PlatformShell';
import type { PricingPlan } from '@/lib/platform-api';

const PLAN_COLORS: Record<string, string> = {
  free:     'from-slate-500 to-slate-600',
  starter:  'from-blue-500 to-blue-600',
  pro:      'from-violet-500 to-violet-600',
  business: 'from-amber-500 to-orange-500',
};

export default function SubscriptionPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('subscription');
  const tNav = useTranslations('platformNav');
  const { user } = useAuthStore();
  const currentPlanSlug = user?.plan ?? 'free';
  const currentConfig = getPlanConfig(currentPlanSlug);
  const isFr = locale === 'fr';

  const { data: plans = [], isLoading } = useQuery<PricingPlan[]>({
    queryKey: ['platform-pricing'],
    queryFn: async () => {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${base}/api/v1/platform/pricing`, { signal: controller.signal });
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      } finally {
        clearTimeout(timer);
      }
    },
    staleTime: 1000 * 60 * 60,
  });

  return (
    <PlatformShell
      locale={locale}
      breadcrumbs={[
        { label: tNav('dashboard'), href: `/${locale}/dashboard` },
        { label: t('title') },
      ]}
    >
      <div className="max-w-5xl">

        {/* ── Current plan banner ─────────────────────────── */}
        <div className={`relative mb-8 rounded-2xl bg-gradient-to-br ${currentConfig.color} p-5 text-white overflow-hidden shadow-lg`}>
          <div className="pointer-events-none absolute -right-4 -top-4 opacity-10">
            <Zap strokeWidth={1} className="h-32 w-32" />
          </div>
          <div className="relative">
            <p className="text-[10px] font-semibold opacity-70 uppercase tracking-widest">
              {t('currentPlanLabel')}
            </p>
            <h2 className="text-2xl font-black mt-0.5">{currentConfig.label}</h2>
            <p className="text-sm opacity-80 mt-1">
              {currentPlanSlug === 'free' ? t('upgradeDesc') : t('thankYou')}
            </p>
          </div>
        </div>

        {/* ── Plans grid ──────────────────────────────────── */}
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
          {t('comparePlans')}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">{isFr ? 'Chargement des plans…' : 'Loading plans…'}</span>
          </div>
        ) : plans.length === 0 ? (
          /* Fallback: API unavailable — show static 4-plan grid */
          <FallbackPlans currentPlanSlug={currentPlanSlug} isFr={isFr} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.slug === currentPlanSlug;
              const features = isFr ? (plan.features_fr ?? plan.features) : plan.features;
              const name = isFr ? (plan.name_fr ?? plan.name) : plan.name;
              const badge = isFr ? (plan.badge_fr ?? plan.badge) : plan.badge;
              const color = PLAN_COLORS[plan.slug] ?? 'from-slate-500 to-slate-600';
              const price = plan.price_monthly === null
                ? (isFr ? 'Gratuit' : 'Free')
                : `${plan.currency === 'EUR' ? '€' : '$'}${plan.price_monthly}`;
              const period = plan.price_monthly !== null
                ? (isFr ? '/mois' : '/month')
                : '';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                    isCurrent
                      ? 'border-blue-400 dark:border-blue-600 shadow-md shadow-blue-100 dark:shadow-blue-900/20'
                      : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700'
                  } bg-white dark:bg-zinc-900`}
                >
                  {(plan.is_highlighted || badge) && (
                    <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white text-[9px] font-bold uppercase tracking-wider text-center py-1">
                      {badge ?? t('popular')}
                    </div>
                  )}

                  <div className="p-4">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
                      <Zap className="h-4 w-4 text-white" />
                    </div>

                    <h3 className="font-black text-sm text-slate-800 dark:text-white">{name}</h3>

                    <div className="flex items-end gap-0.5 mt-1 mb-3">
                      <span className="text-xl font-black text-slate-800 dark:text-white">{price}</span>
                      {period && (
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 mb-0.5">{period}</span>
                      )}
                    </div>

                    <ul className="space-y-1.5 mb-4">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-300">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="w-full text-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg py-1.5">
                        {t('currentBadge')}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs gap-1"
                        variant={plan.is_highlighted ? 'default' : 'outline'}
                      >
                        {t('choosePlan')}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PlatformShell>
  );
}

/* ── Fallback when API is unavailable ────────────────────── */
const FALLBACK_PLANS = [
  {
    slug: 'free',
    name: 'Free', name_fr: 'Gratuit',
    price: 0, currency: 'EUR',
    features: ['1 blog', '10 articles / month', '1 author', 'nexusblog.io subdomain'],
    features_fr: ['1 blog', '10 articles / mois', '1 auteur', 'Sous-domaine nexusblog.io'],
    popular: false,
  },
  {
    slug: 'starter',
    name: 'Starter', name_fr: 'Starter',
    price: 9, currency: 'EUR',
    features: ['2 blogs', 'Unlimited articles', '3 authors', 'Custom domain', 'Newsletter — 1,000 subscribers'],
    features_fr: ['2 blogs', 'Articles illimités', '3 auteurs', 'Domaine personnalisé', 'Newsletter — 1 000 abonnés'],
    popular: false,
  },
  {
    slug: 'pro',
    name: 'Pro', name_fr: 'Pro',
    price: 29, currency: 'EUR',
    features: ['5 blogs', 'Unlimited articles', '10 authors', 'Custom domain', 'Newsletter — 10,000 subscribers', 'AI — 50 articles / month', 'Advanced analytics'],
    features_fr: ['5 blogs', 'Articles illimités', '10 auteurs', 'Domaine personnalisé', 'Newsletter — 10 000 abonnés', 'IA — 50 articles / mois', 'Analytics avancés'],
    popular: true,
  },
  {
    slug: 'business',
    name: 'Business', name_fr: 'Business',
    price: 79, currency: 'EUR',
    features: ['Unlimited blogs', 'Unlimited articles', 'Unlimited authors', 'Unlimited domains', 'Unlimited newsletter', 'Unlimited AI', 'API access', 'White label'],
    features_fr: ['Blogs illimités', 'Articles illimités', 'Auteurs illimités', 'Domaines illimités', 'Newsletter illimitée', 'IA illimitée', 'Accès API', 'White label'],
    popular: false,
  },
] as const;

function FallbackPlans({
  currentPlanSlug,
  isFr,
}: {
  currentPlanSlug: string;
  isFr: boolean;
}) {
  const t = useTranslations('subscription');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {FALLBACK_PLANS.map((plan) => {
        const isCurrent = plan.slug === currentPlanSlug;
        const color = PLAN_COLORS[plan.slug] ?? 'from-slate-500 to-slate-600';
        const name = isFr ? plan.name_fr : plan.name;
        const features = isFr ? plan.features_fr : plan.features;
        const price = plan.price === 0 ? (isFr ? 'Gratuit' : 'Free') : `€${plan.price}`;
        const period = plan.price > 0 ? (isFr ? '/mois' : '/month') : '';

        return (
          <div
            key={plan.slug}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
              isCurrent
                ? 'border-blue-400 dark:border-blue-600 shadow-md shadow-blue-100 dark:shadow-blue-900/20'
                : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700'
            } bg-white dark:bg-zinc-900`}
          >
            {plan.popular && (
              <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white text-[9px] font-bold uppercase tracking-wider text-center py-1">
                {t('popular')}
              </div>
            )}
            <div className="p-4">
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-black text-sm text-slate-800 dark:text-white">{name}</h3>
              <div className="flex items-end gap-0.5 mt-1 mb-3">
                <span className="text-xl font-black text-slate-800 dark:text-white">{price}</span>
                {period && <span className="text-[11px] text-slate-400 dark:text-zinc-500 mb-0.5">{period}</span>}
              </div>
              <ul className="space-y-1.5 mb-4">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-300">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full text-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg py-1.5">
                  {t('currentBadge')}
                </div>
              ) : (
                <Button size="sm" className="w-full h-8 text-xs gap-1" variant={plan.popular ? 'default' : 'outline'}>
                  {t('choosePlan')}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
