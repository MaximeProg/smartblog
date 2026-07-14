'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import {
  LifeBuoy, RefreshCw, MessageSquare, Loader2, ChevronRight,
  Clock, CheckCircle2, XCircle, Flame,
} from 'lucide-react';
import { superadminApi, type SupportTicketItem } from '@/lib/api';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

const STATUS_CFG: Record<string, { cls: string; dotCls: string }> = {
  open:        { cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',       dotCls: 'bg-blue-500' },
  in_progress: { cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', dotCls: 'bg-amber-500' },
  resolved:    { cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dotCls: 'bg-emerald-500' },
  closed:      { cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',   dotCls: 'bg-slate-400' },
};

const PRIORITY_ICON: Record<string, { icon: React.ElementType; cls: string }> = {
  urgent: { icon: Flame, cls: 'text-red-500' },
  high:   { icon: Flame, cls: 'text-amber-500' },
  normal: { icon: Clock, cls: 'text-slate-400' },
  low:    { icon: Clock, cls: 'text-slate-300' },
};

const FILTER_STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'] as const;

export default function SupportPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('superAdmin.support');

  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-support', filterStatus],
    queryFn: () => superadminApi.listSupportTickets({
      status: filterStatus || undefined,
      limit: 50,
    }).then(r => r.data),
  });

  const tickets = (data?.tickets ?? []) as SupportTicketItem[];

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{t('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{t('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{t('subtitle', { count: data?.total ?? 0 })}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="h-7 px-3 rounded-lg text-[11px] font-semibold border transition-colors"
            style={{
              borderColor: filterStatus === s ? 'var(--sa-accent)' : 'var(--sa-border)',
              background: filterStatus === s ? 'var(--sa-accent)' : 'transparent',
              color: filterStatus === s ? '#fff' : 'var(--sa-text-3)',
            }}
          >
            {s ? t(`status_${s}`) : t('all')}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <MessageSquare className="h-10 w-10" style={{ color: 'var(--sa-text-3)' }} />
            <p className="text-[13px] font-semibold" style={{ color: 'var(--sa-text)' }}>{t('emptyTitle')}</p>
            <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{t('emptyDesc')}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--sa-border)' }}>
            {tickets.map((ticket) => {
              const sc = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
              const pc = PRIORITY_ICON[ticket.priority] ?? PRIORITY_ICON.normal;
              const PIcon = pc.icon;
              return (
                <button
                  key={ticket.id}
                  onClick={() => router.push(`/${locale}/superadmin/support/${ticket.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:opacity-90"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--sa-surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Priority + status icon */}
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--sa-surface)', border: '1px solid var(--sa-border)' }}>
                    <PIcon className={`h-4 w-4 ${pc.cls}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-bold truncate" style={{ color: 'var(--sa-text)' }}>{ticket.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--sa-accent)' }}>
                        {ticket.tenant_name ?? '—'}
                      </span>
                      {ticket.opener_email && (
                        <span className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>
                          · {ticket.opener_email}
                        </span>
                      )}
                    </div>
                    {ticket.last_message && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
                        {ticket.last_message_from_admin ? `[${t('you')}] ` : ''}{ticket.last_message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${sc.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dotCls}`} />
                      {t(`status_${ticket.status}`)}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{fmtDate(ticket.updated_at ?? ticket.created_at)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--sa-text-3)' }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
