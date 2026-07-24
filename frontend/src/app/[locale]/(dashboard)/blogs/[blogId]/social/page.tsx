'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Link2, Link2Off, Clock, Send, AlertCircle, CheckCircle2,
  Plus, Trash2, Loader2, ExternalLink, X, Zap,
} from 'lucide-react';
import { socialApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { useToast } from '@/hooks/use-toast';
import type { SocialAccountInfo, SocialPostInfo, SocialPlatform, SocialPostStatus } from '@/types';

// ── Platform metadata ─────────────────────────────────────────────────────────

interface PlatformMeta {
  label: string;
  bg: string;
  iconBg: string;
  color: string;
  icon: string;
}

const PLATFORMS: Partial<Record<SocialPlatform, PlatformMeta>> = {
  facebook:          { label: 'Facebook',        bg: 'bg-blue-50 dark:bg-blue-900/20', iconBg: 'bg-[#1877F2]',                              color: 'text-[#1877F2]', icon: 'f' },
  instagram:         { label: 'Instagram',       bg: 'bg-pink-50 dark:bg-pink-900/20', iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500', color: 'text-pink-600', icon: '◈' },
  twitter:           { label: 'X (Twitter)',     bg: 'bg-slate-50 dark:bg-slate-800',  iconBg: 'bg-slate-900 dark:bg-slate-100',             color: 'text-slate-900 dark:text-slate-100', icon: '✕' },
  linkedin:          { label: 'LinkedIn',        bg: 'bg-sky-50 dark:bg-sky-900/20',   iconBg: 'bg-[#0A66C2]',                              color: 'text-[#0A66C2]', icon: 'in' },
  pinterest:         { label: 'Pinterest',       bg: 'bg-red-50 dark:bg-red-900/20',   iconBg: 'bg-[#E60023]',                              color: 'text-red-600', icon: 'P' },
  youtube_community: { label: 'YouTube',         bg: 'bg-red-50 dark:bg-red-900/20',   iconBg: 'bg-[#FF0000]',                              color: 'text-red-600', icon: '▶' },
  tiktok:            { label: 'TikTok',         bg: 'bg-slate-50 dark:bg-slate-800',  iconBg: 'bg-black',                                  color: 'text-slate-900', icon: '♪' },
  threads:           { label: 'Threads',         bg: 'bg-slate-50 dark:bg-slate-800',  iconBg: 'bg-black dark:bg-slate-200',                 color: 'text-slate-800', icon: '@' },
  google_business:   { label: 'Google Business', bg: 'bg-amber-50 dark:bg-amber-900/20', iconBg: 'bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500', color: 'text-amber-600', icon: 'G' },
};

const PLATFORM_FALLBACK: PlatformMeta = {
  label: 'unknownPlatform', bg: 'bg-slate-50 dark:bg-slate-800', iconBg: 'bg-slate-400', color: 'text-slate-500', icon: '?',
};

const POST_STATUS_COLOR: Record<SocialPostStatus, { labelKey: string; cls: string; icon: React.ElementType }> = {
  pending:   { labelKey: 'status_pending',   cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Clock },
  scheduled: { labelKey: 'status_scheduled', cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: Clock },
  published: { labelKey: 'status_published', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
  failed:    { labelKey: 'status_failed',    cls: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800', icon: AlertCircle },
  canceled:  { labelKey: 'status_canceled',  cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600', icon: X },
};

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

// ── Platform icon ─────────────────────────────────────────────────────────────

function PlatformIcon({ platform, size = 'md' }: { platform: SocialPlatform; size?: 'sm' | 'md' | 'lg' }) {
  const meta = PLATFORMS[platform] ?? PLATFORM_FALLBACK;
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-9 w-9 text-[13px]', lg: 'h-12 w-12 text-[17px]' };
  return (
    <div className={`${sizes[size]} ${meta.iconBg} rounded-xl flex items-center justify-center text-white font-black shrink-0`}>
      {meta.icon}
    </div>
  );
}

// ── Account card ──────────────────────────────────────────────────────────────

function AccountCard({
  platform,
  account,
  blogId,
  onDisconnect,
  onToggleAutoPost,
}: {
  platform: SocialPlatform;
  account: SocialAccountInfo | undefined;
  blogId: string;
  onDisconnect: (id: string) => void;
  onToggleAutoPost: (id: string, enabled: boolean) => void;
}) {
  const t = useTranslations('social');
  const locale = useLocale();
  const meta = PLATFORMS[platform] ?? PLATFORM_FALLBACK;
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data } = await socialApi.getOAuthConnectUrl(blogId, platform, locale);
      window.location.href = data.url;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t('connectError');
      toast({ variant: 'destructive', title: msg });
      setConnecting(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all ${account ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900' : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'}`}>
      <div className="flex items-start gap-3">
        <PlatformIcon platform={platform} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{meta.label === 'unknownPlatform' ? t('unknownPlatform') : meta.label}</p>
          {account ? (
            <>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {account.platform_username ? `@${account.platform_username}` : account.platform_display_name || t('connected')}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{t('connected')}</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t('notConnected')}</p>
              {platform === 'instagram' && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 leading-snug">{t('instagramBusinessOnly')}</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {account ? (
          <>
            {/* Auto-post toggle */}
            <button
              onClick={() => onToggleAutoPost(account.id, !account.auto_post_enabled)}
              className={`flex items-center gap-1.5 w-full h-7 px-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                account.auto_post_enabled
                  ? 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300'
              }`}
            >
              <Zap className={`h-3 w-3 ${account.auto_post_enabled ? 'fill-blue-500' : ''}`} />
              {account.auto_post_enabled ? t('autoPostOn') : t('autoPostOff')}
            </button>

            {confirmDisconnect ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-red-500 flex-1">{t('disconnectConfirm')}</span>
                <button onClick={() => { onDisconnect(account.id); setConfirmDisconnect(false); }}
                  className="h-6 px-2 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold">
                  {t('yes')}
                </button>
                <button onClick={() => setConfirmDisconnect(false)}
                  className="h-6 px-2 rounded border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500">
                  {t('no')}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDisconnect(true)}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <Link2Off className="h-3 w-3" /> {t('disconnect')}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50"
          >
            {connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
            {connecting ? t('connecting') : t('connect')}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Post composer modal ────────────────────────────────────────────────────────

function PostModal({ blogId, accounts, onClose }: { blogId: string; accounts: SocialAccountInfo[]; onClose: () => void }) {
  const t = useTranslations('social');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const createMut = useMutation({
    mutationFn: () => socialApi.createPost(blogId, {
      social_account_id: accountId,
      content: content.trim(),
      scheduled_at: scheduledAt || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-posts', blogId] });
      toast({ title: t('postCreated') });
      onClose();
    },
    onError: () => toast({ variant: 'destructive', title: t('postError') }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('newPost')}</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('account')}</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {(() => { const l = (PLATFORMS[a.platform] ?? PLATFORM_FALLBACK).label; return l === 'unknownPlatform' ? t('unknownPlatform') : l; })()} — {a.platform_username || a.platform_display_name || a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('postContent')}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t('postContentPlaceholder')} rows={4}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">{content.length} / 280</p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('scheduleAt')}</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={() => createMut.mutate()} disabled={!content.trim() || !accountId || createMut.isPending}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors">
            {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {scheduledAt ? t('schedule') : t('postNow')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'accounts' | 'posts';

function SocialPageInner() {
  const params = useParams();
  const blogId = params.blogId as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('accounts');
  const [showPostForm, setShowPostForm] = useState(false);
  const t = useTranslations('social');
  const { toast } = useToast();
  const qc = useQueryClient();

  // Handle OAuth callback: ?connected=platform
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error     = searchParams.get('error');
    if (connected) {
      const meta = PLATFORMS[connected as SocialPlatform] ?? PLATFORM_FALLBACK;
      const platformName = meta.label === 'unknownPlatform' ? t('unknownPlatform') : meta.label;
      toast({ title: t('connectSuccess', { platform: platformName }) });
      qc.invalidateQueries({ queryKey: ['social-accounts', blogId] });
      // Remove query params from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      router.replace(url.pathname);
    }
    if (error) {
      toast({ variant: 'destructive', title: t('oauthError', { error }) });
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      router.replace(url.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts', blogId],
    queryFn: async () => { const { data } = await socialApi.listAccounts(blogId); return data; },
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['social-posts', blogId],
    queryFn: async () => { const { data } = await socialApi.listPosts(blogId, { limit: 50 }); return data; },
    enabled: tab === 'posts',
  });

  const disconnectMut = useMutation({
    mutationFn: (id: string) => socialApi.disconnectAccount(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-accounts', blogId] });
      toast({ title: t('disconnected') });
    },
    onError: () => toast({ variant: 'destructive', title: t('disconnectError') }),
  });

  const autoPostMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      socialApi.toggleAutoPost(blogId, id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-accounts', blogId] }),
    onError: () => toast({ variant: 'destructive', title: t('disconnectError') }),
  });

  const deletePostMut = useMutation({
    mutationFn: (id: string) => socialApi.deletePost(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-posts', blogId] });
      toast({ title: t('postDeleted') });
    },
    onError: () => toast({ variant: 'destructive', title: t('postDeleteError') }),
  });

  const connectedCount = accounts.length;
  const ALL_PLATFORMS = Object.keys(PLATFORMS) as SocialPlatform[];
  const getPlatformMeta = (p: SocialPlatform) => PLATFORMS[p] ?? PLATFORM_FALLBACK;

  return (
    <FullPageShell
      title={t('title')}
      description={`${connectedCount} ${t('connectedAccounts')}`}
      action={
        tab === 'posts' && accounts.length > 0 ? (
          <button onClick={() => setShowPostForm(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors">
            <Plus className="h-3.5 w-3.5" /> {t('newPost')}
          </button>
        ) : undefined
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {(['accounts', 'posts'] as Tab[]).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={`h-8 px-4 rounded-lg text-[12px] font-semibold transition-all ${tab === k ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              {k === 'accounts' ? t('tabAccounts') : t('tabPosts')}
            </button>
          ))}
        </div>

        {/* Accounts tab */}
        {tab === 'accounts' && (
          <>
            {/* Info banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Zap className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-blue-700 dark:text-blue-300">{t('autoPostBanner')}</p>
            </div>

            {/* Platform grid */}
            {accountsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ALL_PLATFORMS.map(platform => (
                  <AccountCard
                    key={platform}
                    platform={platform}
                    account={accounts.find((a: SocialAccountInfo) => a.platform === platform)}
                    blogId={blogId}
                    onDisconnect={(id) => disconnectMut.mutate(id)}
                    onToggleAutoPost={(id, enabled) => autoPostMut.mutate({ id, enabled })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Posts tab */}
        {tab === 'posts' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
            {postsLoading ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse bg-slate-50 dark:bg-slate-800/50" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
                  <Send className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('noPosts')}</p>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-xs">{t('noPostsDesc')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {posts.map((p: SocialPostInfo) => {
                  const st = POST_STATUS_COLOR[p.status];
                  const StatusIcon = st.icon;
                  return (
                    <div key={p.id} className="px-5 py-4 flex items-start gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <PlatformIcon platform={p.platform} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{getPlatformMeta(p.platform).label === 'unknownPlatform' ? t('unknownPlatform') : getPlatformMeta(p.platform).label}</span>
                          <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${st.cls}`}>
                            <StatusIcon className="h-3 w-3" /> {t(st.labelKey as any)}
                          </span>
                          {p.scheduled_at && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtDate(p.scheduled_at)}</span>
                          )}
                        </div>
                        <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">{p.content}</p>
                        {p.error_message && (
                          <p className="text-[10px] text-red-500 mt-1">{p.error_message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.platform_post_url && (
                          <a href={p.platform_post_url} target="_blank" rel="noopener noreferrer"
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {p.status !== 'published' && (
                          <button onClick={() => deletePostMut.mutate(p.id)} disabled={deletePostMut.isPending}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showPostForm && (
        <PostModal blogId={blogId} accounts={accounts} onClose={() => setShowPostForm(false)} />
      )}
    </FullPageShell>
  );
}

export default function SocialPage() {
  return (
    <Suspense>
      <SocialPageInner />
    </Suspense>
  );
}
