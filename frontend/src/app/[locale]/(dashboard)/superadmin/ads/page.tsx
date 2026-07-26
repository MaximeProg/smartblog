'use client';

import { useState, type ElementType, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Check, X, Clock, ExternalLink, Shield, AlertTriangle,
  ChevronDown, ChevronUp, DollarSign, Mail as _Mail, Building2, Globe,
  Eye, MousePointer, CreditCard, RefreshCw, Loader2,
} from 'lucide-react';
import { superadminApi, type SuperAdminAdView } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';
import SAPagination from '@/components/superadmin/SAPagination';

const PAGE_SIZE = 15;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtBudget(n: number | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_COLOR: Record<string, string> = {
  pending:         'bg-amber-500/15 text-amber-500 border-amber-500/20',
  approved:        'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  rejected:        'bg-red-500/15 text-red-500 border-red-500/20',
  payment_pending: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
  paid:            'bg-violet-500/15 text-violet-500 border-violet-500/20',
  expired:         'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const SAFETY_COLOR: Record<string, string> = {
  safe:      'text-emerald-500',
  dangerous: 'text-red-500',
  unknown:   'text-slate-400',
  unchecked: 'text-slate-500',
  scanning:  'text-amber-500',
};

function DetailItem({ icon: Icon, label, value }: { icon: ElementType; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'var(--sa-text-3)' }} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider leading-none mb-0.5" style={{ color: 'var(--sa-text-3)' }}>{label}</p>
        <div className="text-[12px]" style={{ color: 'var(--sa-text-2)' }}>{value}</div>
      </div>
    </div>
  );
}

function AdRow({
  ad, onApprove, onReject, mutPending, ta, tc,
}: {
  ad: SuperAdminAdView;
  onApprove: (id: string, tenantId: string) => void;
  onReject:  (id: string, tenantId: string, reason: string) => void;
  mutPending: boolean;
  ta: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const [expanded, setExpanded]         = useState(false);
  const [rejecting, setRejecting]       = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isPendingAd = ad.submission_status === 'pending';
  const isDangerous = ad.link_safety_status === 'dangerous';

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--sa-border)' }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--sa-surface)]"
        style={{ background: 'var(--sa-card)' }}
        onClick={() => setExpanded(v => !v)}
      >
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
          {ad.tenant_name}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold truncate" style={{ color: 'var(--sa-text)' }}>{ad.title}</p>
          <p className="text-[11px] truncate" style={{ color: 'var(--sa-text-3)' }}>{ad.advertiser_name} · {ad.advertiser_email}</p>
        </div>
        {ad.total_budget && (
          <span className="shrink-0 text-[12px] font-bold text-emerald-500">{fmtBudget(ad.total_budget)}</span>
        )}
        <Shield className={`h-3.5 w-3.5 shrink-0 ${SAFETY_COLOR[ad.link_safety_status] ?? 'text-slate-400'}`} />
        {isDangerous && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[ad.submission_status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
          {ta(`status.${ad.submission_status}`) ?? ad.submission_status}
        </span>
        <span className="shrink-0 text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{fmtDate(ad.created_at)}</span>
        {expanded
          ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--sa-text-3)' }} />
          : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--sa-text-3)' }} />}
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t" style={{ background: 'var(--sa-bg)', borderColor: 'var(--sa-border)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[12px]">
            <DetailItem icon={Building2}    label={ta('table.company')}      value={ad.advertiser_company ?? '—'} />
            <DetailItem icon={Globe}        label={ta('table.targetUrl')}
              value={
                <a href={ad.click_url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1 truncate">
                  {ad.click_url} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              }
            />
            <DetailItem icon={DollarSign}   label={ta('table.budget')}       value={fmtBudget(ad.total_budget)} />
            <DetailItem icon={DollarSign}   label={ta('table.pricePerDay')}  value={fmtBudget(ad.price_per_day)} />
            <DetailItem icon={Eye}          label={ta('table.impressions')}  value={ad.impressions_count.toLocaleString()} />
            <DetailItem icon={MousePointer} label={ta('table.clicks')}       value={ad.clicks_count.toLocaleString()} />
            {ad.placement  && <DetailItem icon={Megaphone} label={ta('table.placement')} value={ad.placement} />}
            {ad.starts_at  && <DetailItem icon={Clock}     label={ta('table.startDate')} value={fmtDate(ad.starts_at)} />}
            {ad.ends_at    && <DetailItem icon={Clock}     label={ta('table.endDate')}   value={fmtDate(ad.ends_at)} />}
          </div>

          {ad.description && (
            <p className="text-[12px] leading-relaxed border-t pt-3" style={{ color: 'var(--sa-text-3)', borderColor: 'var(--sa-border)' }}>
              {ad.description}
            </p>
          )}

          {ad.image_url && (
            <div className="border-t pt-3" style={{ borderColor: 'var(--sa-border)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--sa-text-3)' }}>{ta('table.visual')}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.image_url} alt="Ad visual" className="h-32 rounded-lg object-cover border" style={{ borderColor: 'var(--sa-border)' }} />
            </div>
          )}

          {isDangerous && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-500">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {ta('dangerousLinkWarning')}
            </div>
          )}

          {ad.payment_link_url && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <CreditCard className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-blue-400 mb-0.5">{ta('paymentLinkGenerated')}</p>
                <p className="text-[11px] text-blue-400 truncate">{ad.payment_link_url}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(ad.payment_link_url!)}
                className="shrink-0 text-[11px] font-bold text-blue-500 hover:text-blue-400 border border-blue-500/30 rounded-lg px-2 py-1 transition-colors"
              >
                {ta('copy')}
              </button>
            </div>
          )}

          {isPendingAd && (
            <div className="border-t pt-3 space-y-3" style={{ borderColor: 'var(--sa-border)' }}>
              {rejecting ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder={ta('rejectionPlaceholder')}
                    rows={2}
                    className="w-full border rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#6366f1]/30 resize-none bg-transparent"
                    style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={!rejectReason.trim() || mutPending}
                      onClick={() => onReject(ad.id, ad.tenant_id, rejectReason)}
                      className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {mutPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {ta('confirmReject')}
                    </button>
                    <button
                      onClick={() => setRejecting(false)}
                      className="h-9 px-4 rounded-xl border text-[13px] font-bold transition-colors hover:bg-[var(--sa-surface)]"
                      style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
                    >
                      {tc('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    disabled={isDangerous || mutPending}
                    onClick={() => onApprove(ad.id, ad.tenant_id)}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors disabled:opacity-40"
                  >
                    {mutPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {ta('approve')}
                  </button>
                  <button
                    disabled={mutPending}
                    onClick={() => setRejecting(true)}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[13px] font-bold transition-colors disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" /> {ta('reject')}
                  </button>
                </div>
              )}
            </div>
          )}

          {ad.rejection_reason && (
            <div className="flex items-start gap-2 p-3 rounded-lg border text-[12px] text-red-500"
              style={{ background: 'var(--sa-surface)', borderColor: 'var(--sa-border)' }}>
              <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span><strong>{ta('table.rejectionReason')} :</strong> {ad.rejection_reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SuperAdminAdsPage() {
  const t  = useTranslations('superAdmin');
  const ta = useTranslations('superAdmin.ads');
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const { toast }  = useToast();
  const qc         = useQueryClient();

  const TABS = [
    { key: 'pending',  label: ta('status.pending') },
    { key: '',         label: t('common.all') },
    { key: 'approved', label: ta('status.approved') },
    { key: 'rejected', label: ta('status.rejected') },
  ];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-ads', activeTab, page],
    queryFn:  () => superadminApi.listAllAds({
      status: activeTab || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then(r => r.data),
  });

  const ads   = data?.items ?? [];
  const total = data?.total ?? 0;

  const reviewMutation = useMutation({
    mutationFn: ({ id, tenantId, decision, reason }: { id: string; tenantId: string; decision: 'approved' | 'rejected'; reason?: string }) =>
      superadminApi.reviewAd(tenantId, id, decision, reason),
    onSuccess: (_, vars) => {
      toast({ title: vars.decision === 'approved' ? ta('approve') : ta('reject') });
      qc.invalidateQueries({ queryKey: ['superadmin-ads'] });
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: t('common.error'), description: getErrorMessage(e, '') });
    },
  });

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Megaphone className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ta('title')}</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
              {isLoading ? t('common.loading') : ta('subtitle', { total })}
            </p>
          </div>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" /> {t('common.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--sa-border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-4 py-2 text-[13px] font-bold transition-colors border-b-2 -mb-px ${
              activeTab === tab.key ? 'border-[#6366f1]' : 'border-transparent'
            }`}
            style={{ color: activeTab === tab.key ? '#6366f1' : 'var(--sa-text-3)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" style={{ color: 'var(--sa-text-3)' }} />
          <p className="text-[13px]" style={{ color: 'var(--sa-text-3)' }}>{t('common.loading')}</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="py-24 text-center">
          <Megaphone className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--sa-border)' }} />
          <p className="text-[14px] font-bold" style={{ color: 'var(--sa-text-3)' }}>
            {activeTab === 'pending' ? ta('emptyPending') : ta('empty')}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {ads.map(ad => (
              <AdRow
                key={ad.id}
                ad={ad}
                ta={ta}
                tc={t}
                mutPending={reviewMutation.isPending}
                onApprove={(id, tenantId) => reviewMutation.mutate({ id, tenantId, decision: 'approved' })}
                onReject={(id, tenantId, reason) => reviewMutation.mutate({ id, tenantId, decision: 'rejected', reason })}
              />
            ))}
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
            <SAPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} loading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
