'use client';

import { Check, Zap, Star, Building2, Sparkles, Clock, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useLocale } from 'next-intl';
import { useAuthStore, useCurrentTenant } from '@/store/auth.store';
import { paymentsApi, platformApi, authApi, type PublicPlan, type CryptoPaymentResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import { getErrorMessage } from '@/lib/utils';

// ── Plan config ───────────────────────────────────────────────────

const PLAN_ICONS = { free: Zap, starter: Star, pro: Sparkles, business: Building2 };
const PLAN_ACCENTS: Record<string, string> = {
  free: 'text-slate-600', starter: 'text-indigo-600', pro: 'text-blue-600', business: 'text-amber-600',
};
const PLAN_BADGE_CLS: Record<string, string> = {
  starter: 'bg-indigo-600', pro: 'bg-blue-600', business: 'bg-amber-600',
};
// Fallback prices used only while the API is loading
const PLAN_PRICES_FALLBACK: Record<string, number> = { free: 0, starter: 5, pro: 30, business: 90 };

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

// ── Main page ─────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { user, updateUser } = useAuthStore();
  const tenant = useCurrentTenant();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('subscription');
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [payment, setPayment] = useState<CryptoPaymentResponse | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const currentPlan = user?.plan ?? 'free';

  const { data: plansData } = useQuery({
    queryKey: ['platform-plans'],
    queryFn: async () => {
      const { data } = await platformApi.getPlans();
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });

  const planById = Object.fromEntries((plansData ?? []).map((p: PublicPlan) => [p.id, p]));
  const getPlanPrice = (planId: string): number =>
    planById[planId]?.price_monthly ?? PLAN_PRICES_FALLBACK[planId] ?? 0;

  async function handleCheckout(planId: string) {
    if (planId === 'free' || planId === currentPlan) return;
    if (!tenant?.id) {
      toast({ title: t('needBlogTitle'), description: t('needBlogDesc') });
      router.push(`/${locale}/blogs/new`);
      return;
    }
    setCheckoutLoading(planId);
    try {
      const { data } = await paymentsApi.createSubscriptionCheckout(tenant.id, {
        plan: planId,
        billing: 'monthly',
      });
      setPendingPlan(planId);
      setPayment(data);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('checkoutError'),
        description: getErrorMessage(e, ''),
      });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePaymentConfirmed() {
    setPayment(null);
    toast({ title: t('checkoutSuccess') });
    try {
      const { data } = await authApi.me();
      updateUser(data);
    } catch {}
    setPendingPlan(null);
  }

  const trialDays = tenant?.trial_ends_at ? daysLeft(tenant.trial_ends_at) : null;
  const trialExpired = trialDays === 0 && tenant?.trial_ends_at != null;
  const onTrial = trialDays !== null && !trialExpired;

  const PLAN_IDS = ['free', 'starter', 'pro', 'business'] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 max-w-6xl mx-auto">

            {/* Trial status banner */}
            {(onTrial || trialExpired) && (
              <div className={`mb-8 rounded-2xl border p-5 flex items-center gap-4 ${
                trialExpired
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : trialDays! <= 3
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <Clock className={`h-8 w-8 shrink-0 ${trialExpired ? 'text-red-500' : trialDays! <= 3 ? 'text-amber-500' : 'text-blue-500'}`} />
                <div className="flex-1">
                  <p className={`text-[14px] font-black ${trialExpired ? 'text-red-700 dark:text-red-400' : trialDays! <= 3 ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
                    {trialExpired ? t('trialExpiredTitle') : trialDays === 1 ? t('trialLastDay') : t('trialDaysLeft', { days: trialDays })}
                  </p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {trialExpired ? t('trialExpiredDesc') : t('trialActiveDesc')}
                  </p>
                </div>
                <button
                  onClick={() => handleCheckout('pro')}
                  disabled={checkoutLoading !== null}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold shrink-0 transition-colors disabled:opacity-60"
                >
                  {checkoutLoading === 'pro' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>{t('upgradeNow')} <ArrowRight className="h-3.5 w-3.5" /></>}
                </button>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="text-[26px] font-black text-slate-900 dark:text-slate-100 mb-2">{t('pageTitle')}</h2>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto">{t('pageSubtitle')}</p>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {PLAN_IDS.map(planId => {
                const isCurrent = currentPlan === planId;
                const price = getPlanPrice(planId);
                const PlanIcon = PLAN_ICONS[planId];
                const planData = t.raw(`plans.${planId}`) as { name: string; cta: string; badge?: string; features: string[] };
                const accent = PLAN_ACCENTS[planId];

                return (
                  <div
                    key={planId}
                    className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all flex flex-col p-6 shadow-sm ${
                      isCurrent
                        ? 'border-blue-400 dark:border-blue-600 shadow-blue-50 dark:shadow-blue-900/20 shadow-lg'
                        : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                    }`}
                  >
                    {(planData.badge || isCurrent) && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className={`text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${isCurrent ? 'bg-slate-800 dark:bg-slate-600' : PLAN_BADGE_CLS[planId] ?? 'bg-blue-600'}`}>
                          {isCurrent ? t('yourPlan') : planData.badge}
                        </span>
                      </div>
                    )}

                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <PlanIcon className={`h-5 w-5 ${accent}`} />
                    </div>
                    <h3 className="text-[16px] font-black text-slate-900 dark:text-slate-100 mb-1">{planData.name}</h3>

                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-[30px] font-black text-slate-900 dark:text-slate-100">
                        {price === 0 ? t('freeLabel') : `$${price}`}
                      </span>
                      {price > 0 && <span className="text-[13px] text-slate-400 dark:text-slate-500">{t('perMonth')}</span>}
                    </div>

                    <ul className="space-y-2.5 flex-1 mb-6">
                      {planData.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleCheckout(planId)}
                      disabled={isCurrent || planId === 'free' || checkoutLoading !== null}
                      className={`w-full h-10 rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-default'
                          : planId === 'free'
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
                            : planId === 'starter'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60'
                              : planId === 'pro'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                                : 'bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60'
                      }`}
                    >
                      {checkoutLoading === planId ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> {t('preparingPayment')}</>
                      ) : isCurrent || planId === 'free' ? (
                        t('currentPlanButton')
                      ) : (
                        <><CreditCard className="h-4 w-4" /> {planData.cta}</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[12px] text-slate-400 dark:text-slate-500 mt-10">{t('footerNote')}</p>
          </div>
        </main>
      </div>

      {payment && tenant?.id && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={tenant.id}
          transactionId={payment.transaction_id}
          orderId={payment.order_id}
          payAddress={payment.pay_address}
          payAmount={payment.pay_amount}
          payCurrency={payment.pay_currency}
          qrCodeDataUri={payment.qr_code_data_uri}
          expiresAt={payment.expires_at}
          amountUsd={payment.amount_usd}
          onConfirmed={handlePaymentConfirmed}
          onRetry={pendingPlan ? () => { setPayment(null); handleCheckout(pendingPlan); } : undefined}
        />
      )}
    </div>
  );
}
