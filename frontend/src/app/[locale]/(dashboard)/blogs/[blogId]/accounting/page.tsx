'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, DollarSign, Receipt, CheckCircle, Clock, XCircle } from 'lucide-react';
import { tenantAccountingApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function fmtAmount(n: number, currency = 'USDT') {
  return `${n.toFixed(2)} ${currency}`;
}

const TYPE_LABEL: Record<string, string> = {
  subscription:     'Subscription',
  paid_article:     'Paid article',
  paid_newsletter:  'Paid newsletter',
  ad_campaign:      'Ad revenue',
};

const STATUS_CFG: Record<string, { cls: string; icon: React.ElementType }> = {
  completed: { cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
  pending:   { cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',   icon: Clock },
  failed:    { cls: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',               icon: XCircle },
  refunded:  { cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',     icon: XCircle },
};

export default function TenantAccountingPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const t = useTranslations('tenantAccounting');

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-accounting', blogId],
    queryFn: async () => { const { data } = await tenantAccountingApi.getSummary(blogId); return data; },
  });

  const netColor = (data?.net ?? 0) >= 0
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <FullPageShell title={t('title')} description={t('description')}>
      <div className="px-6 py-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: t('totalRevenue'),
              value: fmtAmount(data?.total_ad_revenue ?? 0),
              icon: TrendingUp,
              bg: 'bg-emerald-50 dark:bg-emerald-900/30',
              border: 'border-emerald-100 dark:border-emerald-800',
              color: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: t('totalCost'),
              value: fmtAmount(data?.total_subscription_paid ?? 0),
              icon: TrendingDown,
              bg: 'bg-red-50 dark:bg-red-900/30',
              border: 'border-red-100 dark:border-red-800',
              color: 'text-red-600 dark:text-red-400',
            },
            {
              label: t('netBalance'),
              value: fmtAmount(data?.net ?? 0),
              icon: DollarSign,
              bg: (data?.net ?? 0) >= 0 ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-red-50 dark:bg-red-900/30',
              border: (data?.net ?? 0) >= 0 ? 'border-blue-100 dark:border-blue-800' : 'border-red-100 dark:border-red-800',
              color: netColor,
            },
          ].map(({ label, value, icon: Icon, bg, border, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm px-5 py-5">
              <div className={`h-9 w-9 rounded-xl border ${border} ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className={`text-[22px] font-black leading-none ${color}`}>{value}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-400" />
            <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t('transactions')}</h2>
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 animate-pulse bg-slate-50 dark:bg-slate-800/50" />)}
            </div>
          ) : !data?.transactions.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Receipt className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('noTransactions')}</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500">{t('noTransactionsDesc')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_140px_120px_100px_90px] px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {[t('type'), t('reference'), t('amount'), t('status'), t('date')].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.transactions.map(txn => {
                  const sc = STATUS_CFG[txn.status] ?? STATUS_CFG.pending;
                  const StatusIcon = sc.icon;
                  const isExpense = txn.type === 'subscription';
                  return (
                    <div key={txn.id} className="grid grid-cols-[1fr_140px_120px_100px_90px] px-5 py-3 items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <span className="text-[12px] font-medium text-slate-800 dark:text-slate-200">
                        {TYPE_LABEL[txn.type] ?? txn.type}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        {txn.reference ?? '—'}
                      </span>
                      <span className={`text-[12px] font-bold ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {isExpense ? '−' : '+'}{fmtAmount(txn.amount, txn.currency)}
                      </span>
                      <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border w-fit ${sc.cls}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {txn.status}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{fmtDate(txn.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('disclaimer')}</p>
      </div>
    </FullPageShell>
  );
}
