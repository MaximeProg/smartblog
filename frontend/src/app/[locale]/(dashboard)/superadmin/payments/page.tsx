'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileText, TrendingUp, Clock, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { superadminApi, type SATransaction } from '@/lib/api';
import SAPagination from '@/components/superadmin/SAPagination';

const PAGE_SIZE = 15;

const STATUS_CLS: Record<string, string> = {
  completed:  'text-emerald-500 bg-emerald-500/10',
  pending:    'text-amber-500  bg-amber-500/10',
  refunded:   'text-blue-500   bg-blue-500/10',
  failed:     'text-red-500    bg-red-500/10',
  disputed:   'text-purple-500 bg-purple-500/10',
  paid:       'text-emerald-500 bg-emerald-500/10',
  processing: 'text-amber-500  bg-amber-500/10',
  requested:  'text-slate-400  bg-slate-400/10',
  rejected:   'text-red-500    bg-red-500/10',
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentsPage() {
  const t  = useTranslations('superAdmin');
  const tp = useTranslations('superAdmin.payments');

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-transactions', statusFilter, page],
    queryFn: () => superadminApi.listTransactions({
      status: statusFilter || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then(r => r.data),
  });

  const kpi   = data?.kpi;
  const rows  = data?.transactions ?? [];
  const total = data?.total ?? 0;

  const STATUSES = ['', 'completed', 'pending', 'failed', 'refunded', 'disputed'];

  return (
    <div className="px-6 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tp('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tp('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            {isLoading ? t('common.loading') : tp('subtitle', { count: total })}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl border text-[12px] font-semibold transition-all hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" /> {t('common.refresh')}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: tp('kpi.mrr'),     value: `$${(kpi?.total_revenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
          { label: tp('kpi.rev24h'),  value: `$${(kpi?.rev_24h ?? 0).toLocaleString()}`,       icon: TrendingUp, color: '#3b82f6' },
          { label: tp('kpi.pending'), value: String(kpi?.pending ?? 0),                        icon: Clock,      color: '#f59e0b' },
          { label: tp('kpi.failed'),  value: String(kpi?.failed ?? 0),                         icon: XCircle,    color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border px-4 py-3" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
            <k.icon className="h-4 w-4 mb-2" style={{ color: k.color }} />
            <p className="text-[18px] font-black" style={{ color: 'var(--sa-text)' }}>{k.value}</p>
            <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button key={s || 'all'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className="px-3 h-9 rounded-xl border text-[11px] font-semibold transition-colors"
              style={{
                borderColor: statusFilter === s ? '#6366f1' : 'var(--sa-border)',
                background:  statusFilter === s ? '#6366f1' : 'transparent',
                color:       statusFilter === s ? '#fff'    : 'var(--sa-text-3)',
              }}>
              {s ? tp(`status.${s}`) : t('common.all')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{t('common.noResults')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sa-border)', background: 'var(--sa-surface)' }}>
                  {[tp('table.date'), tp('table.tenant'), tp('table.user'), tp('table.type'), tp('table.amount'), tp('table.gateway'), tp('table.status')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sa-divider)]">
                {rows.map((tx: SATransaction) => (
                  <tr key={tx.id} className="hover:bg-[var(--sa-surface)] transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{fmtDate(tx.created_at)}</td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--sa-text)' }}>{tx.tenant_name ?? '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--sa-text-3)' }}>{tx.user_email ?? '—'}</td>
                    <td className="px-4 py-2.5 capitalize" style={{ color: 'var(--sa-text-2)' }}>{tx.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 font-bold tabular-nums" style={{ color: tx.direction === 'out' ? '#ef4444' : 'var(--sa-text)' }}>
                      {tx.direction === 'out' ? '-' : ''}${tx.amount.toFixed(2)} <span className="text-[10px] font-normal" style={{ color: 'var(--sa-text-3)' }}>{tx.currency}</span>
                    </td>
                    <td className="px-4 py-2.5 capitalize" style={{ color: 'var(--sa-text-3)' }}>{tx.gateway}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CLS[tx.status] ?? ''}`}>
                        {tp(`status.${tx.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SAPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} loading={isLoading} />
      </div>
    </div>
  );
}
