'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare, Check, X, Clock, AlertTriangle, Trash2, Search,
  Shield, Ban, Settings2, EyeOff, ChevronDown, ChevronUp,
} from 'lucide-react';
import { moderationApi, tenantsApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import type { CommentStatus, CommentsMode, CommentBanInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

const STATUS_TABS: { key: CommentStatus | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'all',      label: 'All',      icon: MessageSquare, color: 'text-slate-500' },
  { key: 'pending',  label: 'Pending',  icon: Clock,         color: 'text-amber-500' },
  { key: 'approved', label: 'Approved', icon: Check,         color: 'text-emerald-500' },
  { key: 'rejected', label: 'Rejected', icon: X,             color: 'text-red-500' },
  { key: 'spam',     label: 'Spam',     icon: AlertTriangle, color: 'text-orange-500' },
  { key: 'shadow_banned', label: 'Shadow', icon: EyeOff, color: 'text-slate-500' },
];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: CommentStatus }) {
  const map: Record<CommentStatus, { label: string; cls: string }> = {
    pending:      { label: 'Pending',  cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    approved:     { label: 'Approved', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    rejected:     { label: 'Rejected', cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
    spam:         { label: 'Spam',     cls: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
    shadow_banned:{ label: 'Shadow',   cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600' };
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
  );
}

function StatCard({ label, value, icon: Icon, iconBg, iconBorder, iconColor }: {
  label: string; value: number;
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

// ── Settings panel ────────────────────────────────────────────────────────────

function SettingsPanel({ blogId }: { blogId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('comments');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const { data: bans = [], isLoading: bansLoading } = useQuery({
    queryKey: ['bans', blogId],
    queryFn: async () => { const { data } = await moderationApi.listBans(blogId); return data; },
  });

  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<CommentsMode>(tenant?.comments_mode ?? 'open');

  const modeMut = useMutation({
    mutationFn: (m: CommentsMode) => tenantsApi.update(blogId, { comments_mode: m }),
    onSuccess: (_, m) => {
      setMode(m);
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: t('modeSaved') });
    },
    onError: () => toast({ variant: 'destructive', title: t('modeError') }),
  });

  const deleteBanMut = useMutation({
    mutationFn: (banId: string) => moderationApi.deleteBan(blogId, banId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bans', blogId] });
      toast({ title: t('banRemoved') });
    },
    onError: () => toast({ variant: 'destructive', title: t('banRemoveError') }),
  });

  const currentMode = tenant?.comments_mode ?? mode;

  const MODES: { value: CommentsMode; label: string; desc: string }[] = [
    { value: 'open',      label: t('modeOpen'),      desc: t('modeOpenDesc') },
    { value: 'moderated', label: t('modeModerated'), desc: t('modeModeratedDesc') },
    { value: 'closed',    label: t('modeClosed'),    desc: t('modeClosedDesc') },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <Settings2 className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
        <span className="flex-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t('settings')}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-800 pt-4">

          {/* Comment mode */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">{t('globalMode')}</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => modeMut.mutate(m.value)}
                  disabled={modeMut.isPending}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                    currentMode === m.value
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`text-[12px] font-bold mb-0.5 ${currentMode === m.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {m.label}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Ban list */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">{t('banList')} ({bans.length})</p>
            {bansLoading ? (
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : bans.length === 0 ? (
              <p className="text-[12px] text-slate-400 dark:text-slate-500">{t('noBans')}</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {bans.map((ban: CommentBanInfo) => (
                  <div key={ban.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <Ban className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="flex-1 text-[11px] text-slate-700 dark:text-slate-300 truncate font-mono">
                      {ban.email || ban.ip_address}
                    </span>
                    {ban.reason && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{ban.reason}</span>
                    )}
                    <button
                      onClick={() => deleteBanMut.mutate(ban.id)}
                      disabled={deleteBanMut.isPending}
                      className="h-5 w-5 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommentsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const t = useTranslations('comments');
  const ts = useTranslations('studio');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<CommentStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['comments-stats', blogId],
    queryFn: async () => { const { data } = await moderationApi.stats(blogId); return data; },
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', blogId, activeTab, search],
    queryFn: async () => {
      const { data } = await moderationApi.listComments(blogId, {
        status: activeTab === 'all' ? undefined : activeTab,
        search: search || undefined,
        limit: 50,
      });
      return data;
    },
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommentStatus }) =>
      moderationApi.moderate(blogId, id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', blogId] });
      qc.invalidateQueries({ queryKey: ['comments-stats', blogId] });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moderationApi.delete(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', blogId] });
      qc.invalidateQueries({ queryKey: ['comments-stats', blogId] });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const banMutation = useMutation({
    mutationFn: ({ email, ip }: { email?: string; ip?: string }) =>
      moderationApi.ban(blogId, { email, ip_address: ip, reason: 'Banni depuis le dashboard' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bans', blogId] });
      toast({ title: t('banSuccess') });
    },
    onError: () => toast({ variant: 'destructive', title: t('banError') }),
  });

  return (
    <FullPageShell
      title={ts('pageComments')}
      description={ts('pageCommentsDesc')}
    >
      <div className="px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label={ts('commentStatsTotal')}
            value={stats?.total ?? 0}
            icon={MessageSquare}
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            iconBorder="border-blue-100 dark:border-blue-800"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label={ts('commentStatsPending')}
            value={stats?.pending ?? 0}
            icon={Clock}
            iconBg="bg-amber-50 dark:bg-amber-900/30"
            iconBorder="border-amber-100 dark:border-amber-800"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label={ts('commentStatsApproved')}
            value={stats?.approved ?? 0}
            icon={Check}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            iconBorder="border-emerald-100 dark:border-emerald-800"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label={ts('commentStatsRejected')}
            value={stats?.rejected ?? 0}
            icon={X}
            iconBg="bg-red-50 dark:bg-red-900/30"
            iconBorder="border-red-100 dark:border-red-800"
            iconColor="text-red-600 dark:text-red-400"
          />
        </div>

        {/* Settings panel (collapsible) */}
        <SettingsPanel blogId={blogId} />

        {/* Tabs + search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0 flex-wrap">
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
                <tab.icon className={`h-3.5 w-3.5 shrink-0 ${activeTab === tab.key ? tab.color : ''}`} />
                {tab.label}
                {tab.key !== 'all' && stats && (stats as unknown as Record<string, number>)[tab.key] > 0 && (
                  <span className="ml-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full px-1.5 py-px text-[9px] font-bold">
                    {(stats as unknown as Record<string, number>)[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={ts('commentSearchPlaceholder')}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Comment list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">{ts('commentEmptyState')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
            {comments.map(c => (
              <div key={c.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar name={c.author_name ?? '?'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{c.author_name || ts('commentAnonymous')}</span>
                      {c.author_email && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{c.author_email}</span>
                      )}
                      <StatusBadge status={c.status} />
                      {c.ip_address && (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">{c.ip_address}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">{fmtDate(c.created_at.toString())}</p>
                    {c.article_title && (
                      <p className="text-[11px] text-blue-500 dark:text-blue-400 font-medium mb-1.5">{c.article_title}</p>
                    )}
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pl-12 flex-wrap">
                  {c.status !== 'approved' && (
                    <button
                      onClick={() => moderateMutation.mutate({ id: c.id, status: 'approved' })}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      <Check className="h-3 w-3" /> {ts('commentApprove')}
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button
                      onClick={() => moderateMutation.mutate({ id: c.id, status: 'rejected' })}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-[11px] font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <X className="h-3 w-3" /> {ts('commentReject')}
                    </button>
                  )}
                  {c.status !== 'spam' && (
                    <button
                      onClick={() => moderateMutation.mutate({ id: c.id, status: 'spam' })}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-[11px] font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3" /> {ts('commentSpam')}
                    </button>
                  )}
                  {c.status !== 'shadow_banned' && (
                    <button
                      onClick={() => moderateMutation.mutate({ id: c.id, status: 'shadow_banned' })}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <EyeOff className="h-3 w-3" /> {t('shadowBan')}
                    </button>
                  )}
                  {(c.author_email || c.ip_address) && (
                    <button
                      onClick={() => banMutation.mutate({ email: c.author_email ?? undefined, ip: c.ip_address ?? undefined })}
                      disabled={banMutation.isPending}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-[11px] font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Shield className="h-3 w-3" /> {t('banAuthor')}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3 w-3" /> {ts('commentDelete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FullPageShell>
  );
}
