'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Loader2, RefreshCw, CreditCard } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import { paymentsApi, type UserPaymentItem, type CryptoPaymentResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type FilterKey = 'all' | 'completed' | 'pending' | 'partially_paid';

const STATUS_STYLE: Record<string, string> = {
  completed: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
  pending: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700',
  partially_paid: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  failed: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  refunded: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  disputed: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  paid: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
  processing: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  requested: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700',
  rejected: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
};

export default function PaymentsPage() {
  const t = useTranslations('paymentCenter');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [resuming, setResuming] = useState<string | null>(null);
  const [payment, setPayment] = useState<CryptoPaymentResponse | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => { const { data } = await paymentsApi.listMyPayments(); return data; },
  });

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  async function handleResume(item: UserPaymentItem) {
    setResuming(item.id);
    try {
      const { data } = await paymentsApi.resumePayment(item.tenant_id, item.id, item.order_id);
      setActiveTenantId(item.tenant_id);
      setPayment(data);
    } catch {
      toast({ variant: 'destructive', title: t('resumeError') });
    } finally {
      setResuming(null);
    }
  }

  function handlePaymentConfirmed() {
    setPayment(null);
    qc.invalidateQueries({ queryKey: ['my-payments'] });
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'completed', label: t('filterCompleted') },
    { key: 'pending', label: t('filterPending') },
    { key: 'partially_paid', label: t('filterPartial') },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100">{t('title')}</h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{t('subtitle')}</p>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`h-8 px-3 rounded-full text-[12px] font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <CreditCard className="h-8 w-8 text-slate-300" />
                  <p className="text-[13px] text-slate-400">{t('empty')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {t(`type.${item.transaction_type}` as any)}{item.tenant_name ? ` — ${item.tenant_name}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-[13px] font-bold ${item.direction === 'out' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.direction === 'out' ? '-' : ''}${item.amount.toFixed(2)} {item.currency}
                        </p>
                        {item.status === 'partially_paid' && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            {t('received', { amount: item.amount_received.toFixed(2) })}
                          </p>
                        )}
                      </div>

                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLE[item.status] ?? STATUS_STYLE.pending}`}>
                        {t(`status.${item.status}` as any)}
                      </span>

                      {item.status === 'partially_paid' && (
                        <button
                          onClick={() => handleResume(item)}
                          disabled={resuming === item.id}
                          className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50"
                        >
                          {resuming === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          {t('resume')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {payment && activeTenantId && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={activeTenantId}
          transactionId={payment.transaction_id}
          orderId={payment.order_id}
          payAddress={payment.pay_address}
          payAmount={payment.pay_amount}
          payCurrency={payment.pay_currency}
          qrCodeDataUri={payment.qr_code_data_uri}
          expiresAt={payment.expires_at}
          amountUsd={payment.amount_usd}
          onConfirmed={handlePaymentConfirmed}
        />
      )}
    </div>
  );
}
