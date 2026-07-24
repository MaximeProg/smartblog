'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Globe, Search, RefreshCw, Loader2, ChevronDown, ChevronUp, Star,
  ShoppingCart, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { superadminApi, type SuperAdminDomainView } from '@/lib/api';
import SAPagination from '@/components/superadmin/SAPagination';

const PAGE_SIZE = 20;

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  paid: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
  registering: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  registered: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  registration_failed: 'bg-red-500/15 text-red-500 border-red-500/20',
  refund_pending: 'bg-orange-500/15 text-orange-500 border-orange-500/20',
  refunded: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

function DomainRow({ d }: { d: SuperAdminDomainView }) {
  const t = useTranslations('superAdmin');
  const [expanded, setExpanded] = useState(false);

  const { data: detail, isFetching } = useQuery({
    queryKey: ['sa-domain-detail', d.id],
    queryFn: () => superadminApi.getDomainDetail(d.id).then((r) => r.data),
    enabled: expanded,
  });

  const failed = detail?.orders.some((o) => o.status === 'registration_failed');

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--sa-border)' }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--sa-surface)]"
        style={{ background: 'var(--sa-card)' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Globe className="h-4 w-4 shrink-0" style={{ color: 'var(--sa-text-3)' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold truncate" style={{ color: 'var(--sa-text)' }}>{d.domain}</p>
            {d.is_primary && <Star className="h-3 w-3 text-amber-500 shrink-0" />}
            {d.source === 'purchased' && <ShoppingCart className="h-3 w-3 text-emerald-500 shrink-0" />}
          </div>
          <p className="text-[11px] truncate" style={{ color: 'var(--sa-text-3)' }}>
            {d.tenant_name} {d.owner_email && `· ${d.owner_email}`}
          </p>
        </div>
        {d.registrar && (
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderColor: 'rgba(99,102,241,0.2)' }}>
            {d.registrar}
          </span>
        )}
        <span className="shrink-0 text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{fmtDate(d.expires_at)}</span>
        {d.purchase_price != null && (
          <span className="shrink-0 text-[12px] font-bold text-emerald-500">${d.purchase_price.toFixed(2)}</span>
        )}
        {d.order_status && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ORDER_STATUS_COLOR[d.order_status] ?? ''}`}>
            {t(`domains.status_${d.order_status}` as any)}
          </span>
        )}
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--sa-text-3)' }} />
                  : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--sa-text-3)' }} />}
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t" style={{ background: 'var(--sa-bg)', borderColor: 'var(--sa-border)' }}>
          {isFetching ? (
            <div className="py-6 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} /></div>
          ) : detail ? (
            <>
              {failed && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t('domains.registrationFailedNote')}
                </div>
              )}

              {detail.orders.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--sa-text-3)' }}>{t('domains.ordersLabel')}</p>
                  <div className="space-y-1.5">
                    {detail.orders.map((o) => (
                      <div key={o.id} className="flex items-center gap-2 text-[12px] p-2 rounded-lg" style={{ background: 'var(--sa-surface)' }}>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ORDER_STATUS_COLOR[o.status] ?? ''}`}>{t(`domains.status_${o.status}` as any)}</span>
                        <span style={{ color: 'var(--sa-text-2)' }}>{o.years} {t('domains.yearsUnit')}</span>
                        {o.purchase_price != null && <span style={{ color: 'var(--sa-text-2)' }}>${o.purchase_price.toFixed(2)}</span>}
                        <span style={{ color: 'var(--sa-text-3)' }}>{fmtDate(o.created_at)}</span>
                        {o.transaction_id && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--sa-text-3)' }}>
                            <ExternalLink className="h-3 w-3" /> {t('domains.txLabel')} {o.transaction_id.slice(0, 8)}
                          </span>
                        )}
                        {o.error_message && <span className="text-red-500 truncate">{o.error_message}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.logs.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--sa-text-3)' }}>{t('domains.activityLogLabel')}</p>
                  <div className="space-y-1">
                    {detail.logs.map((l, i) => (
                      <div key={i} className="text-[11.5px] flex items-start gap-2" style={{ color: 'var(--sa-text-3)' }}>
                        <span className={l.level === 'error' ? 'text-red-500 font-bold' : l.level === 'warning' ? 'text-amber-500 font-bold' : 'font-bold'}>
                          {l.action}
                        </span>
                        <span>{l.details}</span>
                        <span className="ml-auto shrink-0">{fmtDate(l.ts)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminDomainsPage() {
  const t = useTranslations('superAdmin');
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-domains', searchSubmitted, sourceFilter, page],
    queryFn: () => superadminApi.listDomains({
      search: searchSubmitted || undefined,
      source: sourceFilter || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then((r) => r.data),
  });

  const domains = data?.items ?? [];
  const total = data?.total ?? 0;

  const TABS = [
    { key: '', label: t('common.all') },
    { key: 'purchased', label: t('domains.tabPurchased') },
    { key: 'external', label: t('domains.tabExternal') },
  ];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Globe className="h-5 w-5" style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{t('domains.title')}</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
              {isLoading ? t('common.loading') : t('domains.domainsCount', { count: total })}
            </p>
          </div>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" /> {t('common.refresh')}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 border-b flex-1" style={{ borderColor: 'var(--sa-border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setSourceFilter(tab.key); setPage(1); }}
              className={`px-4 py-2 text-[13px] font-bold transition-colors border-b-2 -mb-px ${sourceFilter === tab.key ? 'border-[#6366f1]' : 'border-transparent'}`}
              style={{ color: sourceFilter === tab.key ? '#6366f1' : 'var(--sa-text-3)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--sa-text-3)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearchSubmitted(search.trim()); setPage(1); } }}
            placeholder={t('domains.searchPlaceholder')}
            className="h-8 pl-8 pr-3 rounded-lg border text-[12px] bg-transparent focus:outline-none"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" style={{ color: 'var(--sa-text-3)' }} />
          <p className="text-[13px]" style={{ color: 'var(--sa-text-3)' }}>{t('common.loading')}</p>
        </div>
      ) : domains.length === 0 ? (
        <div className="py-24 text-center">
          <Globe className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--sa-border)' }} />
          <p className="text-[14px] font-bold" style={{ color: 'var(--sa-text-3)' }}>{t('domains.noDomainsFound')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {domains.map((d) => <DomainRow key={d.id} d={d} />)}
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
            <SAPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} loading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
