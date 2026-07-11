'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { LifeBuoy, RefreshCw, MessageSquare, Loader2 } from 'lucide-react';
import { superadminApi } from '@/lib/api';

export default function SupportPage() {
  const t  = useTranslations('superAdmin');
  const ts2 = useTranslations('superAdmin.support');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-support'],
    queryFn: () => superadminApi.listSupportTickets().then(r => r.data),
  });

  const tickets = (data?.tickets ?? []) as unknown[];

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{ts2('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ts2('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ts2('subtitle', { count: tickets.length })}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <MessageSquare className="h-10 w-10" style={{ color: 'var(--sa-text-3)' }} />
            <p className="text-[13px] font-semibold" style={{ color: 'var(--sa-text)' }}>{ts2('emptyTitle')}</p>
            <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{ts2('emptyDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--sa-divider)]">
            {tickets.map((ticket: any, i: number) => (
              <div key={ticket.id ?? i} className="flex items-start gap-4 px-5 py-4 hover:bg-[var(--sa-surface)] transition-colors">
                <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--sa-surface)', border: '1px solid var(--sa-border)' }}>
                  <MessageSquare className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--sa-text)' }}>{ticket.subject ?? t('common.noData')}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ticket.user_email ?? '—'}</p>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--sa-text-3)' }}>{ticket.created_at ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}