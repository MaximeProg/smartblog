'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Megaphone, Check, X, Clock, Pause, Play,
  ExternalLink, Shield, AlertTriangle, Eye, MousePointer, TrendingUp,
  Link2, Copy, ChevronRight, Mail, Building2, Globe, MapPin,
  Calendar, DollarSign, BarChart2, Info, FileText, CreditCard,
} from 'lucide-react';
import { adsApi, tenantsApi, type AdResponse } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { useToast } from '@/hooks/use-toast';

type SubmissionStatus = AdResponse['submission_status'];
type SafetyStatus     = AdResponse['link_safety_status'];

const STATUS_TABS: { key: SubmissionStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { key: 'all',             label: 'All',             icon: Megaphone },
  { key: 'pending',         label: 'Pending',         icon: Clock },
  { key: 'payment_pending', label: 'Awaiting payment', icon: DollarSign },
  { key: 'approved',        label: 'Active',          icon: Check },
  { key: 'rejected',        label: 'Rejected',        icon: X },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function ctr(impressions: number, clicks: number) {
  if (!impressions) return '0%';
  return ((clicks / impressions) * 100).toFixed(1) + '%';
}

function parseDescription(raw: string | null): { desc: string; targeting: string } {
  if (!raw) return { desc: '', targeting: '' };
  const idx = raw.indexOf('\n\nTargeting:');
  if (idx === -1) return { desc: raw, targeting: '' };
  return { desc: raw.slice(0, idx).trim(), targeting: raw.slice(idx + 2).trim() };
}

// ── Badges ────────────────────────────────────────────────────────────────────

function SafetyBadge({ status }: { status: SafetyStatus }) {
  const map: Partial<Record<SafetyStatus, { label: string; cls: string; icon: React.ElementType }>> = {
    safe:      { label: 'Safe',     cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: Shield },
    dangerous: { label: 'Unsafe',   cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',                        icon: AlertTriangle },
    unknown:   { label: 'Unknown',  cls: 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',               icon: Shield },
    unchecked: { label: 'Pending',  cls: 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',               icon: Shield },
    scanning:  { label: 'Scanning', cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',                  icon: Shield },
  };
  const { label, cls, icon: Icon } = map[status] ?? map.unknown!;
  return (
    <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${cls}`}>
      <Icon className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const map: Partial<Record<SubmissionStatus, { label: string; cls: string }>> = {
    pending:         { label: 'Platform review',   cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    approved:        { label: 'Approved',           cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    rejected:        { label: 'Rejected',           cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
    payment_pending: { label: 'Awaiting payment',  cls: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800' },
    paid:            { label: 'Paid',              cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    expired:         { label: 'Expired',           cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600' };
  return <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>;
}

function CampaignBadge({ status }: { status: AdResponse['campaign_status'] }) {
  const map: Record<string, string> = {
    active:    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    paused:    'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    canceled:  'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
    suspended: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border capitalize ${map[status] ?? map.canceled}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, iconBg, iconBorder, iconColor }: {
  label: string; value: string | number;
  icon: React.ElementType;
  iconBg: string; iconBorder: string; iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm px-5 py-5">
      <div className={`h-9 w-9 rounded-xl border ${iconBorder} ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <p className="text-[26px] font-black text-slate-900 dark:text-slate-100 leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function DetailRow({ icon: Icon, label, value, mono }: {
  icon?: React.ElementType; label: string; value: React.ReactNode; mono?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
        <div className={`text-[13px] text-slate-700 dark:text-slate-300 ${mono ? 'font-mono break-all' : ''}`}>{value}</div>
      </div>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-5 mb-2">{title}</p>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm mx-5 px-4 divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </div>
    </div>
  );
}

interface DrawerProps {
  ad: AdResponse;
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
  isPending: boolean;
}

function AdDetailDrawer({ ad, onClose, onPause, onResume, isPending }: DrawerProps) {
  const { desc, targeting } = parseDescription(ad.description);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className="w-full max-w-[480px] h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 px-5 py-4 flex items-start gap-3">
          {ad.image_url ? (
            <img src={ad.image_url} alt={ad.title} className="h-12 w-16 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="h-12 w-16 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-black text-slate-800 dark:text-slate-100 leading-tight mb-1 line-clamp-2">{ad.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={ad.submission_status} />
              <SafetyBadge status={ad.link_safety_status} />
              {ad.submission_status === 'approved' && <CampaignBadge status={ad.campaign_status} />}
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-4">

          <DrawerSection title="Advertiser">
            <DetailRow icon={FileText}    label="Name"      value={ad.advertiser_name} />
            {ad.advertiser_email && <DetailRow icon={Mail}      label="Email"     value={<a href={`mailto:${ad.advertiser_email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{ad.advertiser_email}</a>} />}
            {ad.advertiser_company && <DetailRow icon={Building2} label="Company"  value={ad.advertiser_company} />}
            <DetailRow icon={Calendar}   label="Submitted"  value={fmtDate(ad.created_at)} />
          </DrawerSection>

          <DrawerSection title="Ad Content">
            <DetailRow icon={FileText} label="Headline"         value={ad.title} />
            {desc && <DetailRow icon={FileText} label="Description" value={<span className="whitespace-pre-wrap">{desc}</span>} />}
            <DetailRow icon={ExternalLink} label="Destination URL" value={
              <a href={ad.click_url} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-1">
                {ad.click_url} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            } mono />
            {ad.image_url && <DetailRow icon={FileText} label="Image URL" value={
              <a href={ad.image_url} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all">{ad.image_url}</a>
            } mono />}
            {ad.placement && <DetailRow icon={MapPin} label="Placement" value={ad.placement} />}
          </DrawerSection>

          {targeting && (
            <DrawerSection title="Targeting">
              {targeting.split(' | ').map((part, i) => {
                const [key, ...rest] = part.split(': ');
                return <DetailRow key={i} icon={Globe} label={key ?? part} value={rest.join(': ') || '—'} />;
              })}
            </DrawerSection>
          )}

          <DrawerSection title="Campaign">
            {(ad.starts_at || ad.ends_at) && (
              <DetailRow icon={Calendar} label="Period" value={`${fmtDate(ad.starts_at)} → ${fmtDate(ad.ends_at)}`} />
            )}
            {ad.total_budget != null && (
              <DetailRow icon={DollarSign} label="Budget" value={`${ad.total_budget.toLocaleString()}`} />
            )}
            {!ad.starts_at && !ad.ends_at && !ad.total_budget && (
              <div className="py-3 text-[12px] text-slate-400 dark:text-slate-500 italic">No campaign details provided.</div>
            )}
          </DrawerSection>

          {ad.submission_status === 'payment_pending' && ad.payment_link_url && (
            <DrawerSection title="Payment">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-blue-800 dark:text-blue-200 mb-1">Awaiting advertiser payment</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mb-2 leading-relaxed">Share this checkout link with the advertiser to collect payment before activating the campaign.</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={ad.payment_link_url}
                      className="flex-1 min-w-0 text-[11px] font-mono bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 truncate"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(ad.payment_link_url!)}
                      className="shrink-0 h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </DrawerSection>
          )}

          {(ad.submission_status === 'approved' || ad.submission_status === 'paid') && (
            <DrawerSection title="Performance">
              <DetailRow icon={Eye}          label="Impressions"     value={ad.impressions_count.toLocaleString()} />
              <DetailRow icon={MousePointer} label="Clicks"          value={ad.clicks_count.toLocaleString()} />
              <DetailRow icon={TrendingUp}   label="CTR"             value={ctr(ad.impressions_count, ad.clicks_count)} />
              <DetailRow icon={BarChart2}    label="Campaign status" value={<CampaignBadge status={ad.campaign_status} />} />
            </DrawerSection>
          )}

          {ad.submission_status === 'rejected' && ad.rejection_reason && (
            <DrawerSection title="Rejection">
              <DetailRow icon={Info} label="Reason" value={ad.rejection_reason} />
            </DrawerSection>
          )}

          <DrawerSection title="Technical">
            <DetailRow icon={Info}   label="Ad ID"       value={ad.id} mono />
            <DetailRow icon={Shield} label="Link safety" value={<SafetyBadge status={ad.link_safety_status} />} />
          </DrawerSection>
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 px-5 py-4 flex gap-2 flex-wrap">
          {ad.submission_status === 'pending' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 w-full">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-amber-800 dark:text-amber-200">Awaiting platform review</p>
                <p className="text-[12px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">The NexusBlog team is reviewing this submission. You'll be notified once a decision is made.</p>
              </div>
            </div>
          )}
          {ad.submission_status === 'rejected' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 w-full">
              <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-red-800 dark:text-red-200">Not approved by platform</p>
                <p className="text-[12px] text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">{ad.rejection_reason || 'The NexusBlog team declined this ad submission.'}</p>
              </div>
            </div>
          )}
          {ad.submission_status === 'approved' && ad.campaign_status === 'active' && (
            <button
              onClick={onPause}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[13px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-40"
            >
              <Pause className="h-3.5 w-3.5" /> Pause campaign
            </button>
          )}
          {ad.submission_status === 'approved' && ad.campaign_status === 'paused' && (
            <button
              onClick={onResume}
              disabled={ad.link_safety_status === 'dangerous' || isPending}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" /> Resume campaign
            </button>
          )}
          {ad.link_safety_status === 'dangerous' && ad.submission_status === 'approved' && (
            <p className="w-full text-center text-[11px] text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Unsafe link — campaign suspended
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdsPage() {
  const params     = useParams();
  const blogId     = params.blogId as string;
  const ts         = useTranslations('studio');
  const { toast }  = useToast();
  const qc         = useQueryClient();

  const [activeTab,  setActiveTab]  = useState<SubmissionStatus | 'all'>('all');
  const [selectedAd, setSelectedAd] = useState<AdResponse | null>(null);
  const [copied,     setCopied]     = useState(false);

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

  const isMutating = pauseMutation.isPending || resumeMutation.isPending;

  const advertiseUrl = tenant?.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${params.locale ?? 'en'}/${tenant.slug}/advertise`
    : '';

  const copyUrl = () => {
    if (!advertiseUrl) return;
    navigator.clipboard.writeText(advertiseUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const totalImpressions = ads.reduce((s, a) => s + a.impressions_count, 0);
  const totalClicks      = ads.reduce((s, a) => s + a.clicks_count, 0);
  const pendingCount     = ads.filter(a => a.submission_status === 'pending').length;
  const approvedCount    = ads.filter(a => a.submission_status === 'approved').length;

  return (
    <FullPageShell
      title={ts('pageAds')}
      description={ts('pageAdsDesc')}
      action={
        <button
          onClick={copyUrl}
          disabled={!advertiseUrl}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-40"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy advertiser link'}
        </button>
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Advertise URL banner */}
        {advertiseUrl && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-sm rounded-2xl px-4 py-3.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center shrink-0">
              <Link2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Advertiser link</p>
              <p className="text-[12px] text-slate-700 dark:text-slate-300 font-mono truncate">{advertiseUrl}</p>
            </div>
            <button
              onClick={copyUrl}
              className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total ads"          value={ads.length}                         icon={Megaphone}    iconBg="bg-blue-50 dark:bg-blue-900/30"    iconBorder="border-blue-100 dark:border-blue-800"    iconColor="text-blue-600 dark:text-blue-400"    />
          <StatCard label="Pending review"     value={pendingCount}                       icon={Clock}        iconBg="bg-amber-50 dark:bg-amber-900/30"   iconBorder="border-amber-100 dark:border-amber-800"  iconColor="text-amber-600 dark:text-amber-400"   />
          <StatCard label="Active"             value={approvedCount}                      icon={Check}        iconBg="bg-emerald-50 dark:bg-emerald-900/30" iconBorder="border-emerald-100 dark:border-emerald-800" iconColor="text-emerald-600 dark:text-emerald-400" />
          <StatCard label={ts('adsImpressions')} value={totalImpressions}                 icon={Eye}          iconBg="bg-violet-50 dark:bg-violet-900/30"  iconBorder="border-violet-100 dark:border-violet-800" iconColor="text-violet-600 dark:text-violet-400" />
          <StatCard label={ts('adsClicks')}    value={totalClicks}                        icon={MousePointer} iconBg="bg-rose-50 dark:bg-rose-900/30"     iconBorder="border-rose-100 dark:border-rose-800"    iconColor="text-rose-600 dark:text-rose-400"     />
          <StatCard label={ts('adsCTR')}       value={ctr(totalImpressions, totalClicks)} icon={TrendingUp}   iconBg="bg-slate-100 dark:bg-slate-800"     iconBorder="border-slate-200 dark:border-slate-700"  iconColor="text-slate-600 dark:text-slate-400"   />
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
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col items-center justify-center py-24 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
              <Megaphone className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1">{ts('adsNoneTitle')}</p>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-sm mb-4">{ts('adsNoneDesc')}</p>
            {advertiseUrl && (
              <button onClick={copyUrl} className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Copy className="h-3.5 w-3.5" /> Copy advertiser link
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
            {ads.map(ad => {
              const { desc } = parseDescription(ad.description);
              return (
                <div key={ad.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start gap-4">
                    {ad.image_url ? (
                      <div className="h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-24 shrink-0 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                        <Megaphone className="h-6 w-6 text-slate-300 dark:text-slate-500" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{ad.title}</p>
                        <StatusBadge status={ad.submission_status} />
                        <SafetyBadge status={ad.link_safety_status} />
                        {ad.submission_status === 'approved' && <CampaignBadge status={ad.campaign_status} />}
                      </div>
                      {desc && (
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-1 line-clamp-1">{desc}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">{ad.advertiser_name}</span>
                        {ad.advertiser_company && <span>· {ad.advertiser_company}</span>}
                        {ad.advertiser_email && (
                          <span className="flex items-center gap-0.5">· <Mail className="h-2.5 w-2.5" /> {ad.advertiser_email}</span>
                        )}
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
                        <a href={ad.click_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 dark:text-blue-400 hover:underline ml-auto">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">{ad.click_url.replace(/^https?:\/\//, '')}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Row actions */}
                  <div className="flex items-center gap-2 mt-4 pl-28 flex-wrap">
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight className="h-3 w-3" /> View details
                    </button>

                    {ad.submission_status === 'pending' && (
                      <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="h-3 w-3" /> Under platform review
                      </span>
                    )}
                    {ad.submission_status === 'approved' && ad.campaign_status === 'active' && (
                      <button
                        onClick={() => pauseMutation.mutate(ad.id)}
                        disabled={isMutating}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-40"
                      >
                        <Pause className="h-3 w-3" /> Pause
                      </button>
                    )}
                    {ad.submission_status === 'approved' && ad.campaign_status === 'paused' && (
                      <button
                        onClick={() => resumeMutation.mutate(ad.id)}
                        disabled={ad.link_safety_status === 'dangerous' || isMutating}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-40"
                      >
                        <Play className="h-3 w-3" /> Resume
                      </button>
                    )}
                    {ad.link_safety_status === 'dangerous' && (
                      <span className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-medium ml-auto">
                        <AlertTriangle className="h-3 w-3" /> Unsafe link
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedAd && (
        <AdDetailDrawer
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onPause={() => pauseMutation.mutate(selectedAd.id)}
          onResume={() => resumeMutation.mutate(selectedAd.id)}
          isPending={isMutating}
        />
      )}
    </FullPageShell>
  );
}
