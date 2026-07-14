'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ScrollText, Download, Info, CheckCircle, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { superadminApi, type SALogEntry } from '@/lib/api';
import SAPagination from '@/components/superadmin/SAPagination';

const PAGE_SIZE = 15;

type Level = 'info' | 'success' | 'warning' | 'error';

const ACTION_LABELS: Record<string, string> = {
  'user.login':          'User login',
  'user.logout':         'User logout',
  'user.register':       'New registration',
  'user.password_reset': 'Password reset',
  'tenant.created':      'Blog created',
  'tenant.deleted':      'Blog deleted',
  'tenant.suspended':    'Blog suspended',
  'tenant.reactivated':  'Blog reactivated',
  'plan.upgraded':       'Plan upgrade',
  'plan.downgraded':     'Plan downgrade',
  'payment.completed':   'Payment completed',
  'payment.pending':     'Payment pending',
  'payment.failed':      'Payment failed',
  'payment.refunded':    'Payment refunded',
  'affiliate.cashout_requested': 'Cashout requested',
  'affiliate.cashout_approved':  'Cashout approved',
  'affiliate.cashout_rejected':  'Cashout rejected',
  'admin.settings_updated':      'Settings updated',
  'admin.plan_updated':          'Plan updated',
  'admin.plan_created':          'Plan created',
};

const LEVEL_META: Record<Level, { icon: typeof Info; cls: string }> = {
  info:    { icon: Info,          cls: 'text-blue-500 bg-blue-500/10' },
  success: { icon: CheckCircle,  cls: 'text-emerald-500 bg-emerald-500/10' },
  warning: { icon: AlertTriangle,cls: 'text-amber-500 bg-amber-500/10' },
  error:   { icon: XCircle,      cls: 'text-red-500 bg-red-500/10' },
};

function fmtTs(s: string) {
  return new Date(s).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LogsPage() {
  const t  = useTranslations('superAdmin');
  const tl = useTranslations('superAdmin.logs');
  const [level, setLevel] = useState<Level | ''>('');
  const [page, setPage]   = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-logs', level, page],
    queryFn: () => superadminApi.listLogs({
      level: level || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then(r => r.data),
  });

  const logs     = data?.logs ?? [];
  const total    = data?.total ?? 0;
  const errors   = logs.filter((l: SALogEntry) => l.level === 'error').length;
  const warnings = logs.filter((l: SALogEntry) => l.level === 'warning').length;
  const LEVELS: (Level | '')[] = ['', 'info', 'success', 'warning', 'error'];

  function exportCsv() {
    const rows = logs.map((l: SALogEntry) => `"${l.ts}","${l.level}","${l.action}","${l.actor}","${l.details}"`);
    const csv  = ['ts,level,action,actor,details', ...rows].join('\n');
    const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a    = document.createElement('a'); a.href = url; a.download = 'smarterbloggers-logs.csv'; a.click();
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tl('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tl('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            {tl('subtitle', { count: logs.length, errors, warnings })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 h-9 px-4 rounded-xl border text-[12px] font-semibold"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            <Download className="h-3.5 w-3.5" /> {t('common.exportCsv')}
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {LEVELS.map(l => (
          <button key={l || 'all'}
            onClick={() => { setLevel(l); setPage(1); }}
            className="px-3 h-8 rounded-xl border text-[11px] font-semibold transition-colors"
            style={{
              borderColor: level === l ? '#6366f1' : 'var(--sa-border)',
              background: level === l ? '#6366f1' : 'transparent',
              color: level === l ? '#fff' : 'var(--sa-text-3)',
            }}>
            {l ? tl(`level.${l}`) : t('common.all')}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <ScrollText className="h-8 w-8" style={{ color: 'var(--sa-text-3)' }} />
            <p className="text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{tl('empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--sa-divider)]">
            {logs.map((log: SALogEntry, i: number) => {
              const meta = LEVEL_META[log.level as Level] ?? LEVEL_META.info;
              const Icon = meta.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className={`flex-shrink-0 mt-0.5 p-1 rounded-lg ${meta.cls}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--sa-text)' }}>{ACTION_LABELS[log.action] ?? log.action}</span>
                      <span className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>— {log.actor}</span>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{log.details}</p>
                  </div>
                  <span className="text-[10px] whitespace-nowrap font-mono" style={{ color: 'var(--sa-text-3)' }}>{fmtTs(log.ts)}</span>
                </div>
              );
            })}
          </div>
        )}
        <SAPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} loading={isLoading} />
      </div>
    </div>
  );
}