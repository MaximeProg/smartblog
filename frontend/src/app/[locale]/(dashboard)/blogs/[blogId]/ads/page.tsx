'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Megaphone, Check, X, Clock, Pause, Play,
  ExternalLink, Shield, AlertTriangle, Eye, MousePointer, TrendingUp, Link2, Copy,
} from 'lucide-react';
import { adsApi, tenantsApi, type AdResponse } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
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
    SAFE:     { label: 'Safe',     cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: Shield },
    DANGEROUS: { label: 'Unsafe', cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',                        icon: AlertTriangle },
    UNKNOWN:  { label: 'Unknown',  cls: 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',               icon: Shield },
    SCANNING: { label: 'Scanning', cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',                  icon: Shield },
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
    PENDING:  { label: 'Pending review', cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    APPROVED: { label: 'Active',         cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    REJECTED: { label: 'Rejected',       cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600' };
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
  );
}

export default function AdsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const ts = useTranslations('studio');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<SubmissionStatus | 'all'>('all');
  const [copied, setCopied] = useState(false);

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

  const advertiseUrl = tenant?.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${params.locale ?? 'en'}/${tenant.slug}/advertise`
    : '';

  const copyUrl = () => {
    if (!advertiseUrl) return;
    navigator.clipboard.writeText(advertiseUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalImpressions = ads.reduce((s, a) => s + a.impressions_count, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks_count, 0);
  const pendingCount = ads.filter(a => a.submission_status === 'PENDING').length;
  const approvedCount = ads.filter(a => a.submission_status === 'APPROVED').length;

  const statCards = [
    { label: 'Total ads',           value: ads.length,        color: 'text-slate-800 dark:text-slate-200',   bg: 'bg-white dark:bg-slate-800/60',   border: 'border-slate-100 dark:border-slate-700', icon: Megaphone },
    { label: 'Pending review',      value: pendingCount,       color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800', icon: Clock },
    { label: 'Active',              value: approvedCount,      color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', icon: Check },
    { label: ts('adsImpressions'),  value: totalImpressions,   color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-100 dark:border-blue-800', icon: Eye },
    { label: ts('adsClicks'),       value: totalClicks,        color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800', icon: MousePointer },
    { label: ts('adsCTR'),          value: ctr(totalImpressions, totalClicks), color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800', icon: TrendingUp },
  ];

  const copyLinkButton = (
    <button
      onClick={copyUrl}
      disabled={!advertiseUrl}
      className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-40"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy advertiser link'}
    </button>
  );

  return (
    <FullPageShell
      title={ts('pageAds')}
      description={ts('pageAdsDesc')}
      action={copyLinkButton}
    >
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Advertise URL info */}
        {advertiseUrl && (
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
            <Link2 className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-[12px] text-blue-700 dark:text-blue-300 flex-1">
              Share this link with advertisers: <span className="font-mono font-semibold">{advertiseUrl}</span>
            </p>
            <button onClick={copyUrl} className="shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(s => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} px-3 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate">{s.label}</p>
              </div>
              <p className={`text-[20px] font-black leading-none ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ad list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Megaphone className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1">{ts('adsNoneTitle')}</p>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-sm">{ts('adsNoneDesc')}</p>
            {advertiseUrl && (
              <button onClick={copyUrl} className="mt-4 flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Copy className="h-3.5 w-3.5" /> Copy advertiser link
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/50 overflow-hidden">
            {ads.map(ad => (
              <div key={ad.id} className="p-5">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {ad.image_url ? (
                    <div className="h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-24 shrink-0 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                      <Megaphone className="h-6 w-6 text-slate-300 dark:text-slate-500" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{ad.title}</p>
                      <StatusBadge status={ad.submission_status} />
                      <SafetyBadge status={ad.link_safety_status} />
                    </div>
                    {ad.description && (
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-1 line-clamp-1">{ad.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">{ad.advertiser_name}</span>
                      {ad.advertiser_company && <span>· {ad.advertiser_company}</span>}
                      <span>· {fmtDate(ad.created_at)}</span>
                      {ad.starts_at && <span>· {fmtDate(ad.starts_at)} → {fmtDate(ad.ends_at)}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Eye className="h-3 w-3" /> {ad.impressions_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <MousePointer className="h-3 w-3" /> {ad.clicks_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <TrendingUp className="h-3 w-3" /> {ctr(ad.impressions_count, ad.clicks_count)}
                      </span>
                      <a
                        href={ad.click_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ml-auto"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">{ad.click_url.replace(/^https?:\/\//, '')}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pl-28 flex-wrap">
                  {ad.submission_status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => reviewMutation.mutate({ id: ad.id, decision: 'APPROVED' })}
                        disabled={ad.link_safety_status === 'DANGEROUS' || reviewMutation.isPending}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-40"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ id: ad.id, decision: 'REJECTED' })}
                        disabled={reviewMutation.isPending}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-[11px] font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-40"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </>
                  )}
                  {ad.submission_status === 'APPROVED' && ad.campaign_status === 'ACTIVE' && (
                    <button
                      onClick={() => pauseMutation.mutate(ad.id)}
                      disabled={pauseMutation.isPending}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-40"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  )}
                  {ad.submission_status === 'APPROVED' && ad.campaign_status === 'PAUSED' && (
                    <button
                      onClick={() => resumeMutation.mutate(ad.id)}
                      disabled={ad.link_safety_status === 'DANGEROUS' || resumeMutation.isPending}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-40"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                  {ad.link_safety_status === 'DANGEROUS' && (
                    <span className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-medium ml-auto">
                      <AlertTriangle className="h-3 w-3" /> Unsafe link — cannot approve
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FullPageShell>
  );
}
