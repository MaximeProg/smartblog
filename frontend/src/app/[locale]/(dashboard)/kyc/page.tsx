'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Clock, ShieldAlert, ShieldX, ExternalLink } from 'lucide-react';
import { kycApi, type KycStatusResponse, type KycSubmitResponse } from '@/lib/api';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import { CryptoCurrencyPicker } from '@/components/payments/CryptoCurrencyPicker';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

const PLATFORM_TENANT_ID = process.env.NEXT_PUBLIC_PLATFORM_TENANT_ID || '00000000-0000-0000-0000-000000000001';

const YEARS_OPTIONS = [1, 2, 3, 5] as const;
const MIN_YEARS = 1;
const MAX_YEARS = 50;

const STATUS_ICON: Record<string, typeof ShieldCheck> = {
  not_started: ShieldCheck,
  pending: Clock,
  verified: ShieldCheck,
  expired: ShieldAlert,
  rejected: ShieldX,
};

export default function KycPage() {
  const t = useTranslations('kyc');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [years, setYears] = useState(1);
  const [payCurrency, setPayCurrency] = useState('usdtbsc');
  const [payCurrencyValid, setPayCurrencyValid] = useState(true);
  const [payment, setPayment] = useState<KycSubmitResponse | null>(null);

  const { data: status, isLoading } = useQuery<KycStatusResponse>({
    queryKey: ['kyc-status'],
    queryFn: async () => { const { data } = await kycApi.getStatus(); return data; },
  });

  const totalAmount = (status?.price_per_year ?? 0) * years;

  const submitMutation = useMutation({
    mutationFn: async () => {
      // La langue de facture suit la locale de navigation courante — repli
      // anglais automatique côté backend (DeepL) si non supportée.
      const invoice_language = typeof window !== 'undefined'
        ? (window.location.pathname.split('/')[1] || 'en')
        : 'en';
      const { data } = await kycApi.submit({ years, pay_currency: payCurrency, invoice_language });
      return data;
    },
    onSuccess: (data) => setPayment(data),
    onError: (err: any) => {
      toast({ variant: 'destructive', title: t('submitError'), description: getErrorMessage(err, '') });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => { const { data } = await kycApi.retrySession(); return data; },
    onSuccess: (data) => {
      if (data.verification_url) window.open(data.verification_url, '_blank', 'noopener,noreferrer');
      qc.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: t('submitError'), description: getErrorMessage(err, '') });
    },
  });

  const Icon = status ? (STATUS_ICON[status.kyc_status] ?? ShieldCheck) : ShieldCheck;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 space-y-6 max-w-2xl mx-auto">
            <div>
              <h1 className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-tight">{t('pageTitle')}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{t('pageSubtitle')}</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* Current status */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-[14px]">
                      {t(`statusLabel.${status?.kyc_status ?? 'not_started'}`)}
                    </p>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('yearsRemaining', { count: status?.kyc_years_remaining ?? 0 })}
                    </p>
                  </div>
                </div>

                {status?.kaluta_verification_url && status.kyc_status === 'pending' && (
                  <a
                    href={status.kaluta_verification_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('resumeVerification')}
                  </a>
                )}

                {/* Re-verification via prepaid years (material profile change) */}
                {(status?.kyc_status === 'expired') && (status?.kyc_years_remaining ?? 0) > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6">
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-4">{t('reverifyExplain')}</p>
                    <button
                      onClick={() => retryMutation.mutate()}
                      disabled={retryMutation.isPending}
                      className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {retryMutation.isPending ? '…' : t('reverifyCta')}
                    </button>
                  </div>
                )}

                {/* New purchase */}
                {(status?.kyc_status === 'not_started' || status?.kyc_status === 'rejected' || ((status?.kyc_years_remaining ?? 0) === 0 && status?.kyc_status !== 'pending' && status?.kyc_status !== 'verified')) && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 space-y-5">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('purchaseTitle')}</h2>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        {t('durationLabel')}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {YEARS_OPTIONS.map(y => (
                          <button
                            key={y}
                            onClick={() => setYears(y)}
                            className={`px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors ${
                              years === y
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {t('yearsCount', { count: y })}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[12px] text-slate-400 dark:text-slate-500 shrink-0">{t('customDurationLabel')}</span>
                        <input
                          type="number"
                          min={MIN_YEARS}
                          max={MAX_YEARS}
                          value={years}
                          onChange={e => {
                            const v = parseInt(e.target.value, 10);
                            if (Number.isNaN(v)) { setYears(0); return; }
                            setYears(Math.min(MAX_YEARS, Math.max(0, v)));
                          }}
                          className="w-20 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-[12.5px] text-slate-500 dark:text-slate-400">{t('totalLabel')}</span>
                      <span className="text-[18px] font-black text-slate-900 dark:text-slate-100">${totalAmount.toFixed(2)}</span>
                    </div>

                    <CryptoCurrencyPicker
                      tenantId={PLATFORM_TENANT_ID}
                      amountUsd={totalAmount}
                      value={payCurrency}
                      onChange={setPayCurrency}
                      onValidityChange={setPayCurrencyValid}
                    />

                    <button
                      onClick={() => submitMutation.mutate()}
                      disabled={submitMutation.isPending || !payCurrencyValid || years < MIN_YEARS || totalAmount <= 0}
                      className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitMutation.isPending ? '…' : t('payCta', { amount: totalAmount.toFixed(2) })}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {payment && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={PLATFORM_TENANT_ID}
          transactionId={payment.transaction_id}
          orderId={payment.order_id}
          payAddress={payment.pay_address}
          payAmount={payment.pay_amount}
          payCurrency={payment.pay_currency}
          qrCodeDataUri={payment.qr_code_data_uri}
          expiresAt={payment.expires_at}
          amountUsd={payment.amount_usd}
          onConfirmed={() => {
            setPayment(null);
            qc.invalidateQueries({ queryKey: ['kyc-status'] });
            qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
            toast({ title: t('paymentConfirmedTitle'), description: t('paymentConfirmedDesc') });
          }}
        />
      )}
    </div>
  );
}
