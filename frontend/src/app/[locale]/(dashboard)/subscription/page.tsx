'use client';

import { Check, Zap, Star, Building2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAuthStore } from '@/store/auth.store';

const PLAN_GRADIENTS: Record<string, string> = {
  free:     'ring-slate-200',
  starter:  'ring-indigo-300',
  pro:      'ring-blue-400',
  business: 'ring-amber-300',
};

const PLAN_ACCENTS: Record<string, string> = {
  free:     'text-slate-600',
  starter:  'text-indigo-600',
  pro:      'text-blue-600',
  business: 'text-amber-600',
};

const PLAN_ICONS = { free: Zap, starter: Star, pro: Sparkles, business: Building2 };

const PLAN_CTA_CLS: Record<string, string> = {
  free:     'bg-slate-100 text-slate-400 cursor-default',
  starter:  'bg-indigo-600 hover:bg-indigo-700 text-white',
  pro:      'bg-blue-600 hover:bg-blue-700 text-white',
  business: 'bg-amber-600 hover:bg-amber-700 text-white',
};

const PLAN_BADGE_CLS: Record<string, string> = {
  starter:  'bg-indigo-600',
  pro:      'bg-blue-600',
};

const PLAN_PRICES: Record<string, number> = { free: 0, starter: 9, pro: 29, business: 99 };

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const t = useTranslations('subscription');
  const currentPlan = user?.plan ?? 'free';

  const PLAN_IDS = ['free', 'starter', 'pro', 'business'] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">

            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="text-[26px] font-black text-slate-900 dark:text-slate-100 mb-2">{t('pageTitle')}</h2>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                {t('pageSubtitle')}
              </p>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-4 gap-5 max-w-6xl mx-auto">
              {PLAN_IDS.map(planId => {
                const isCurrent = currentPlan === planId;
                const price     = PLAN_PRICES[planId];
                const PlanIcon  = PLAN_ICONS[planId];
                const planData  = t.raw(`plans.${planId}`) as { name: string; cta: string; badge?: string; features: string[] };
                const ring      = PLAN_GRADIENTS[planId];
                const accent    = PLAN_ACCENTS[planId];

                return (
                  <div
                    key={planId}
                    className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all flex flex-col p-6 shadow-sm ${
                      isCurrent ? 'border-blue-400 dark:border-blue-600 shadow-blue-50 dark:shadow-blue-900/20 shadow-lg' : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                    }`}
                  >
                    {/* Badge */}
                    {(planData.badge || isCurrent) && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className={`text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${isCurrent ? 'bg-slate-800 dark:bg-slate-600' : PLAN_BADGE_CLS[planId] ?? 'bg-blue-600'}`}>
                          {isCurrent ? t('yourPlan') : planData.badge}
                        </span>
                      </div>
                    )}

                    {/* Icon + plan name */}
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <PlanIcon className={`h-5 w-5 ${accent}`} />
                    </div>
                    <h3 className="text-[16px] font-black text-slate-900 dark:text-slate-100 mb-1">{planData.name}</h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-[30px] font-black text-slate-900 dark:text-slate-100">
                        {price === 0 ? t('freeLabel') : `${price}€`}
                      </span>
                      {price > 0 && <span className="text-[13px] text-slate-400 dark:text-slate-500">{t('perMonth')}</span>}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {planData.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      className={`w-full h-10 rounded-xl text-[13px] font-bold transition-colors ${isCurrent ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-default' : PLAN_CTA_CLS[planId]}`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? t('currentPlanButton') : planData.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[12px] text-slate-400 dark:text-slate-500 mt-10">
              {t('footerNote')}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
