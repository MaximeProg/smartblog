'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Megaphone, Check, X, Clock, Pause, Play,
  ExternalLink, Shield, AlertTriangle, Eye, MousePointer, TrendingUp,
  Plus, ChevronDown, ChevronUp,
} from 'lucide-react';
import { adsApi, tenantsApi, type AdResponse, type SubmitAdData } from '@/lib/api';
import { BlogStudioShell } from '@/components/dashboard/BlogStudioShell';
import { useToast } from '@/hooks/use-toast';

type SubmissionStatus = AdResponse['submission_status'];
type SafetyStatus = AdResponse['link_safety_status'];

const STATUS_TABS: { key: SubmissionStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { key: 'all',      label: 'All',      icon: Megaphone },
  { key: 'PENDING',  label: 'Pending',  icon: Clock },
  { key: 'APPROVED', label: 'Active',   icon: Check },
  { key: 'REJECTED', label: 'Rejected', icon: X },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function ctr(impressions: number, clicks: number) {
  if (!impressions) return '0%';
  return ((clicks / impressions) * 100).toFixed(1) + '%';
}

function SafetyBadge({ status }: { status: SafetyStatus }) {
  const map: Record<SafetyStatus, { label: string; cls: string; icon: React.ElementType }> = {
    SAFE:     { label: 'Safe',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Shield },
    DANGEROUS: { label: 'Unsafe', cls: 'bg-red-50 text-red-700 border-red-200',             icon: AlertTriangle },
    UNKNOWN:  { label: 'Unknown',  cls: 'bg-slate-50 text-slate-500 border-slate-200',       icon: Shield },
    SCANNING: { label: 'Scanning', cls: 'bg-blue-50 text-blue-600 border-blue-200',          icon: Shield },
  };
  const { label, cls, icon: Icon } = map[status] ?? map.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${cls}`}>
      <Icon className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const map: Record<SubmissionStatus, { label: string; cls: string }> = {
    PENDING:  { label: 'Pending review', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { label: 'Active',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rejected',       cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
  );
}

function SubmitAdForm({ tenantId, onSuccess }: { tenantId: string; onSuccess: () => void }) {
  const ts = useTranslations('studio');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SubmitAdData>({
    advertiser_name: '',
    advertiser_email: '',
    advertiser_company: '',
    title: '',
    description: '',
    image_url: '',
    click_url: '',
    starts_at: '',
    ends_at: '',
    total_budget: undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: SubmitAdData) => adsApi.submit(tenantId, data),
    onSuccess: () => {
      toast({ title: ts('adsCreateSuccess') });
      setForm({ advertiser_name: '', advertiser_email: '', advertiser_company: '', title: '', description: '', image_url: '', click_url: '', starts_at: '', ends_at: '', total_budget: undefined });
      setOpen(false);
      onSuccess();
    },
    onError: () => toast({ variant: 'destructive', title: ts('adsCreateError') }),
  });

  const set = (k: keyof SubmitAdData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: SubmitAdData = {
      ...form,
      total_budget: form.total_budget ? Number(form.total_budget) : undefined,
      starts_at: form.starts_at || undefined,
      ends_at: form.ends_at || undefined,
      advertiser_company: form.advertiser_company || undefined,
      description: form.description || undefined,
      image_url: form.image_url || undefined,
    };
    mutation.mutate(data);
  };

  const inputCls = 'w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors';
  const labelCls = 'block text-[11px] font-semibold text-slate-600 mb-1';

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <span className="text-[13px] font-bold text-slate-800">{ts('adsNewAd')}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>{ts('adsAdvertiser')} *</label>
              <input required value={form.advertiser_name} onChange={set('advertiser_name')} placeholder="John Doe" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ts('adsAdvertiserEmail')} *</label>
              <input required type="email" value={form.advertiser_email} onChange={set('advertiser_email')} placeholder="john@company.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input value={form.advertiser_company} onChange={set('advertiser_company')} placeholder="Acme Corp" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ts('adsTitle')} *</label>
              <input required value={form.title} onChange={set('title')} placeholder="Summer sale — 50% off" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>{ts('adsDescription')}</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Short ad copy…" className={inputCls + ' h-auto py-2 resize-none'} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>{ts('adsClickUrl')} *</label>
              <input required type="url" value={form.click_url} onChange={set('click_url')} placeholder="https://yoursite.com/landing" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>{ts('adsImageUrl')}</label>
              <input type="url" value={form.image_url} onChange={set('image_url')} placeholder="https://cdn.example.com/banner.jpg" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ts('adsStartDate')}</label>
              <input type="date" value={form.starts_at} onChange={set('starts_at')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ts('adsEndDate')}</label>
              <input type="date" value={form.ends_at} onChange={set('ends_at')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ts('adsBudget')}</label>
              <input type="number" min="0" step="0.01" value={form.total_budget ?? ''} onChange={e => setForm(p => ({ ...p, total_budget: e.target.value ? Number(e.target.value) : undefined }))} placeholder="500" className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setOpen(false)} className="h-8 px-4 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">{ts('adsCancelButton')}</button>
            <button type="submit" disabled={mutation.isPending} className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-60">
              {mutation.isPending ? '…' : ts('adsSaveButton')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AdsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const ts = useTranslations('studio');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<SubmissionStatus | 'all'>('all');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['ads', blogId, activeTab],
    queryFn: async () => {
      const { data } = await adsApi.list(blogId, {
        status: activeTab === 'all' ? undefined : activeTab,
        limit: 50,
      });
      return data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVED' | 'REJECTED' }) =>
      adsApi.review(blogId, id, decision),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads', blogId] }),
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => adsApi.pause(blogId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads', blogId] }),
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => adsApi.resume(blogId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads', blogId] }),
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const totalImpressions = ads.reduce((s, a) => s + a.impressions_count, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks_count, 0);
  const pendingCount = ads.filter(a => a.submission_status === 'PENDING').length;
  const approvedCount = ads.filter(a => a.submission_status === 'APPROVED').length;

  const statCards = [
    { label: 'Total ads',      value: ads.length,        color: 'text-slate-800',   bg: 'bg-slate-50',   border: 'border-slate-100', icon: Megaphone },
    { label: 'Pending review', value: pendingCount,       color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100', icon: Clock },
    { label: 'Active',         value: approvedCount,      color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Check },
    { label: ts('adsImpressions'), value: totalImpressions, color: 'text-blue-700',  bg: 'bg-blue-50',    border: 'border-blue-100', icon: Eye },
    { label: ts('adsClicks'),   value: totalClicks,        color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-100', icon: MousePointer },
    { label: ts('adsCTR'),      value: ctr(totalImpressions, totalClicks), color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100', icon: TrendingUp },
  ];

  return (
    <BlogStudioShell
      title={ts('pageAds')}
      description={ts('pageAdsDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
    >
      <div className="p-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {statCards.map(s => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} px-3 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <p className="text-[10px] text-slate-400 leading-tight truncate">{s.label}</p>
              </div>
              <p className={`text-[20px] font-black leading-none ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Submit form */}
        <SubmitAdForm tenantId={blogId} onSuccess={() => qc.invalidateQueries({ queryKey: ['ads', blogId] })} />

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-3 w-3 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ad list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <Megaphone className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-[14px] font-bold text-slate-700 mb-1">{ts('adsNoneTitle')}</p>
            <p className="text-[12px] text-slate-400 max-w-xs">{ts('adsNoneDesc')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {ads.map(ad => (
              <div key={ad.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {ad.image_url ? (
                    <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                      <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-24 shrink-0 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <Megaphone className="h-6 w-6 text-slate-300" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <p className="text-[14px] font-bold text-slate-800 leading-tight">{ad.title}</p>
                      <StatusBadge status={ad.submission_status} />
                      <SafetyBadge status={ad.link_safety_status} />
                    </div>
                    {ad.description && (
                      <p className="text-[12px] text-slate-500 mb-1 line-clamp-1">{ad.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-medium text-slate-600">{ad.advertiser_name}</span>
                      {ad.advertiser_company && <span>· {ad.advertiser_company}</span>}
                      <span>· {fmtDate(ad.created_at)}</span>
                      {ad.starts_at && <span>· {fmtDate(ad.starts_at)} → {fmtDate(ad.ends_at)}</span>}
                    </div>
                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-2 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Eye className="h-3 w-3" /> {ad.impressions_count.toLocaleString()} {ts('adsImpressions').toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MousePointer className="h-3 w-3" /> {ad.clicks_count.toLocaleString()} {ts('adsClicks').toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <TrendingUp className="h-3 w-3" /> {ctr(ad.impressions_count, ad.clicks_count)} CTR
                      </span>
                      <a
                        href={ad.click_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors ml-auto"
                      >
                        <ExternalLink className="h-3 w-3" /> {ad.click_url.replace(/^https?:\/\//, '').slice(0, 40)}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pl-28 flex-wrap">
                  {ad.submission_status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => reviewMutation.mutate({ id: ad.id, decision: 'APPROVED' })}
                        disabled={ad.link_safety_status === 'DANGEROUS' || reviewMutation.isPending}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-40"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ id: ad.id, decision: 'REJECTED' })}
                        disabled={reviewMutation.isPending}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold hover:bg-red-100 transition-colors disabled:opacity-40"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </>
                  )}
                  {ad.submission_status === 'APPROVED' && ad.campaign_status === 'ACTIVE' && (
                    <button
                      onClick={() => pauseMutation.mutate(ad.id)}
                      disabled={pauseMutation.isPending}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold hover:bg-amber-100 transition-colors disabled:opacity-40"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  )}
                  {ad.submission_status === 'APPROVED' && ad.campaign_status === 'PAUSED' && (
                    <button
                      onClick={() => resumeMutation.mutate(ad.id)}
                      disabled={ad.link_safety_status === 'DANGEROUS' || resumeMutation.isPending}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-40"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                  {ad.link_safety_status === 'DANGEROUS' && (
                    <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium ml-auto">
                      <AlertTriangle className="h-3 w-3" /> Unsafe link — cannot approve
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BlogStudioShell>
  );
}
