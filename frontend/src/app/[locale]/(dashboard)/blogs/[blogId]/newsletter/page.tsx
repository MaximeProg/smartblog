'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Users, TrendingUp, Download, Search, Send,
  Plus, X, Check, Loader2, Calendar, Upload,
} from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import NewsletterBodyEditor from '@/components/dashboard/NewsletterBodyEditor';
import { useTranslations } from 'next-intl';
import { newsletterApi, tenantsApi, articlesApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { useToast } from '@/hooks/use-toast';
import type { NewsletterSubscriber, NewsletterCampaign, SubscriberStatus, CampaignStatus } from '@/types';

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
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

const STATUS_COLOR: Record<SubscriberStatus, string> = {
  active:       'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  pending:      'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  unsubscribed: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
  bounced:      'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
};

const CAMPAIGN_STATUS_COLOR: Record<CampaignStatus, string> = {
  draft:     'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  scheduled: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  sending:   'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  sent:      'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  canceled:  'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
};

// ── Campaign modal ────────────────────────────────────────────────────────────

interface CampaignModalProps {
  blogId: string;
  onClose: () => void;
  initialName?: string;
  initialSubject?: string;
  initialBody?: string;
}

function CampaignModal({ blogId, onClose, initialName = '', initialSubject = '', initialBody = '' }: CampaignModalProps) {
  const t = useTranslations('newsletter');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [preview, setPreview] = useState('');
  const [body, setBody] = useState(initialBody);
  const [scheduledAt, setScheduledAt] = useState('');

  const isScheduled = !!scheduledAt;

  const createMut = useMutation({
    mutationFn: () => newsletterApi.createCampaign(blogId, {
      name: name.trim(),
      subject: subject.trim(),
      preview_text: preview.trim() || undefined,
      content_html: body.trim() || undefined,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', blogId] });
      toast({ title: isScheduled ? t('campaignScheduled') : t('campaignCreated') });
      onClose();
    },
    onError: () => toast({ variant: 'destructive', title: t('campaignError') }),
  });

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('newCampaign')}</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('campaignName')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('campaignNamePlaceholder')}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('campaignSubject')}</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('campaignSubjectPlaceholder')}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('campaignPreview')}</label>
            <input value={preview} onChange={e => setPreview(e.target.value)} placeholder={t('campaignPreviewPlaceholder')}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('campaignBody')}</label>
            <NewsletterBodyEditor
              value={body}
              onChange={setBody}
              placeholder={t('campaignBodyPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {t('scheduleAt')}
              </span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            {scheduledAt && (
              <p className="mt-1 text-[10px] text-blue-500 font-medium">{t('willSchedule')}</p>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={() => createMut.mutate()} disabled={!name.trim() || !subject.trim() || createMut.isPending}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-xl text-white text-[12px] font-bold disabled:opacity-50 transition-colors ${isScheduled ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isScheduled ? <Calendar className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {isScheduled ? t('scheduleCampaign') : t('createDraft')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'subscribers' | 'campaigns';
const SUB_FILTERS: { key: SubscriberStatus | 'all'; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'active',       label: 'Active' },
  { key: 'pending',      label: 'Pending' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
];

interface ModalPrefill { name: string; subject: string; body: string }

function NewsletterPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const blogId = params.blogId as string;
  const [tab, setTab] = useState<Tab>('subscribers');
  const [subFilter, setSubFilter] = useState<SubscriberStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<ModalPrefill | undefined>();
  const t = useTranslations('newsletter');
  const { toast } = useToast();
  const qc = useQueryClient();

  const fromArticleId = searchParams.get('from_article');
  const { data: prefillArticle } = useQuery({
    queryKey: ['article-prefill', fromArticleId],
    queryFn: async () => { const { data } = await articlesApi.get(blogId, fromArticleId!); return data; },
    enabled: !!fromArticleId,
  });

  useEffect(() => {
    if (prefillArticle && fromArticleId) {
      const bodyHtml = prefillArticle.excerpt
        ? `<p>${prefillArticle.excerpt}</p>`
        : `<p>${prefillArticle.title}</p>`;
      setModalPrefill({
        name: prefillArticle.title,
        subject: prefillArticle.title,
        body: bodyHtml,
      });
      setTab('campaigns');
      setShowCampaignForm(true);
    }
  }, [prefillArticle, fromArticleId]);

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const { data: subscribers = [], isLoading: subsLoading } = useQuery({
    queryKey: ['subscribers', blogId, subFilter, search],
    queryFn: async () => {
      const { data } = await newsletterApi.listSubscribers(blogId, {
        status: subFilter === 'all' ? undefined : subFilter,
        q: search || undefined,
        limit: 100,
      });
      return data;
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', blogId],
    queryFn: async () => { const { data } = await newsletterApi.listCampaigns(blogId); return data; },
    enabled: tab === 'campaigns',
  });

  const sendMut = useMutation({
    mutationFn: (id: string) => newsletterApi.sendCampaign(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', blogId] });
      toast({ title: t('campaignSent') });
    },
    onError: () => toast({ variant: 'destructive', title: t('campaignSendError') }),
  });

  const [testCampaignId, setTestCampaignId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const testMut = useMutation({
    mutationFn: () => newsletterApi.testCampaign(blogId, testCampaignId!, testEmail.trim()),
    onSuccess: () => {
      toast({ title: t('testEmailSent') });
      setTestCampaignId(null);
      setTestEmail('');
    },
    onError: () => toast({ variant: 'destructive', title: t('testEmailError') }),
  });

  async function handleExport() {
    try {
      const res = await newsletterApi.exportSubscribers(blogId, subFilter === 'all' ? undefined : subFilter);
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscribers.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: t('exportError') });
    }
  }

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { data } = await newsletterApi.importSubscribers(blogId, file);
      qc.invalidateQueries({ queryKey: ['newsletter-subscribers', blogId] });
      toast({ title: t('importSuccess', { imported: data.imported, skipped: data.skipped }) });
    } catch {
      toast({ variant: 'destructive', title: t('importError') });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  const totalSubs = tenant?.subscribers_count ?? 0;
  const totalActive = subscribers.filter((s: NewsletterSubscriber) => s.status === 'active').length;

  return (
    <FullPageShell
      title={t('title')}
      description={`${fmtNum(totalSubs)} ${t('subscriberCount')}`}
      action={
        tab === 'subscribers' ? (
          <div className="flex items-center gap-2">
            <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <button onClick={() => importInputRef.current?.click()} disabled={importing}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {t('import')}
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Download className="h-3.5 w-3.5" /> {t('export')}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowCampaignForm(true)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors">
            <Plus className="h-3.5 w-3.5" /> {t('newCampaign')}
          </button>
        )
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={t('totalSubscribers')} value={fmtNum(totalSubs)} icon={Users}
            iconBg="bg-blue-50 dark:bg-blue-900/30" iconBorder="border-blue-100 dark:border-blue-800" iconColor="text-blue-600 dark:text-blue-400" />
          <StatCard label={t('activeSubscribers')} value={fmtNum(totalActive)} icon={Check}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30" iconBorder="border-emerald-100 dark:border-emerald-800" iconColor="text-emerald-600 dark:text-emerald-400" />
          <StatCard label={t('campaigns')} value={campaigns.length} icon={TrendingUp}
            iconBg="bg-violet-50 dark:bg-violet-900/30" iconBorder="border-violet-100 dark:border-violet-800" iconColor="text-violet-600 dark:text-violet-400" />
          <StatCard label={t('emailsSent')} value={fmtNum(campaigns.reduce((s: number, c: NewsletterCampaign) => s + c.recipients_count, 0))} icon={Send}
            iconBg="bg-amber-50 dark:bg-amber-900/30" iconBorder="border-amber-100 dark:border-amber-800" iconColor="text-amber-600 dark:text-amber-400" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {(['subscribers', 'campaigns'] as Tab[]).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={`h-8 px-4 rounded-lg text-[12px] font-semibold transition-all ${tab === k ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              {k === 'subscribers' ? t('tabSubscribers') : t('tabCampaigns')}
            </button>
          ))}
        </div>

        {/* Subscribers tab */}
        {tab === 'subscribers' && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {SUB_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setSubFilter(f.key)}
                    className={`h-7 px-3 rounded-lg text-[11px] font-semibold transition-all ${subFilter === f.key ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-[200px] flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')}
                  className="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
              {subsLoading ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800/50 animate-pulse" />)}
                </div>
              ) : subscribers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-4">
                    <Mail className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('noSubscribers')}</p>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-xs">{t('noSubscribersDesc')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_130px_90px_110px] px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {[t('emailHeader'), t('nameHeader'), t('statusHeader'), t('dateHeader')].map(h => (
                      <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subscribers.map((s: NewsletterSubscriber) => (
                      <div key={s.id} className="grid grid-cols-[1fr_130px_90px_110px] px-4 py-3 items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-[12px] font-medium text-slate-800 dark:text-slate-200 truncate">{s.email}</span>
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                          {[s.first_name, s.last_name].filter(Boolean).join(' ') || '—'}
                        </span>
                        <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border w-fit ${STATUS_COLOR[s.status]}`}>
                          {s.status}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{fmtDate(s.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Campaigns tab */}
        {tab === 'campaigns' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
            {campaignsLoading ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-slate-50 dark:bg-slate-800/50" />)}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 flex items-center justify-center mb-4">
                  <Send className="h-7 w-7 text-violet-500 dark:text-violet-400" />
                </div>
                <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('noCampaigns')}</p>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-xs">{t('noCampaignsDesc')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaigns.map((c: NewsletterCampaign) => (
                  <div key={c.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                        <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border shrink-0 ${CAMPAIGN_STATUS_COLOR[c.status]}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{c.subject}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {c.status === 'scheduled' && c.scheduled_at && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            <Calendar className="h-3 w-3" />
                            {fmtDate(c.scheduled_at)}
                          </span>
                        )}
                        {c.recipients_count > 0 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtNum(c.recipients_count)} {t('recipients')}</span>
                        )}
                        {c.opens_count > 0 && (
                          <span className="text-[10px] text-emerald-500">{fmtNum(c.opens_count)} {t('opens')}</span>
                        )}
                        {c.sent_at && c.status === 'sent' && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{t('sentAt')} {fmtDate(c.sent_at)}</span>
                        )}
                        {c.status !== 'scheduled' && c.status !== 'sent' && (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">{fmtDate(c.created_at)}</span>
                        )}
                      </div>
                    </div>
                    {(c.status === 'draft' || c.status === 'scheduled') && (
                      <div className="flex items-center gap-2 shrink-0">
                        {testCampaignId === c.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="email"
                              value={testEmail}
                              onChange={e => setTestEmail(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && testEmail.trim()) testMut.mutate(); if (e.key === 'Escape') { setTestCampaignId(null); setTestEmail(''); } }}
                              placeholder="email@test.com"
                              autoFocus
                              className="h-8 w-44 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                            <button onClick={() => testMut.mutate()} disabled={!testEmail.trim() || testMut.isPending}
                              className="flex items-center gap-1 h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50 transition-colors">
                              {testMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => { setTestCampaignId(null); setTestEmail(''); }}
                              className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setTestCampaignId(c.id)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Mail className="h-3.5 w-3.5" />
                            {t('sendTest')}
                          </button>
                        )}
                        <button onClick={() => sendMut.mutate(c.id)} disabled={sendMut.isPending}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold disabled:opacity-50 transition-colors">
                          {sendMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          {t('send')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCampaignForm && (
        <CampaignModal
          blogId={blogId}
          onClose={() => { setShowCampaignForm(false); setModalPrefill(undefined); }}
          initialName={modalPrefill?.name}
          initialSubject={modalPrefill?.subject}
          initialBody={modalPrefill?.body}
        />
      )}
    </FullPageShell>
  );
}

export default function NewsletterPage() {
  return (
    <Suspense fallback={null}>
      <NewsletterPageInner />
    </Suspense>
  );
}
