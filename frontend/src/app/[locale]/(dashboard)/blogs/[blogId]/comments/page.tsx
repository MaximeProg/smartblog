'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Check, X, Clock, AlertTriangle, Trash2, Search } from 'lucide-react';
import { moderationApi, tenantsApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import type { CommentStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

const STATUS_TABS: { key: CommentStatus | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'all',      label: 'All',      icon: MessageSquare, color: 'text-slate-500' },
  { key: 'pending',  label: 'Pending',  icon: Clock,         color: 'text-amber-500' },
  { key: 'approved', label: 'Approved', icon: Check,         color: 'text-emerald-500' },
  { key: 'rejected', label: 'Rejected', icon: X,             color: 'text-red-500' },
  { key: 'spam',     label: 'Spam',     icon: AlertTriangle, color: 'text-orange-500' },
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

export default function CommentsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const ts = useTranslations('studio');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<CommentStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

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

  const statCards = [
    { label: ts('commentStatsTotal'),    value: stats?.total    ?? 0, color: 'text-slate-800 dark:text-slate-200',   bg: 'bg-white dark:bg-slate-800/60',   border: 'border-slate-100 dark:border-slate-700' },
    { label: ts('commentStatsPending'),  value: stats?.pending  ?? 0, color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-100 dark:border-amber-800' },
    { label: ts('commentStatsApproved'), value: stats?.approved ?? 0, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
    { label: ts('commentStatsRejected'), value: stats?.rejected ?? 0, color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-100 dark:border-red-800' },
  ];

  return (
    <FullPageShell
      title={ts('pageComments')}
      description={ts('pageCommentsDesc')}
    >
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(s => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} px-5 py-4`}>
              <p className={`text-[28px] font-black leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
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
                {tab.key !== 'all' && stats && (stats as any)[tab.key] > 0 && (
                  <span className="ml-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full px-1.5 py-px text-[9px] font-bold">
                    {(stats as any)[tab.key]}
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
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Comment list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">{ts('commentEmptyState')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/50 overflow-hidden">
            {comments.map(c => (
              <div key={c.id} className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={c.author_name ?? '?'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{c.author_name || ts('commentAnonymous')}</span>
                      {c.author_email && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{c.author_email}</span>
                      )}
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">{fmtDate(c.created_at.toString())}</p>
                    {c.article_title && (
                      <p className="text-[11px] text-blue-500 dark:text-blue-400 font-medium mb-1.5">{c.article_title}</p>
                    )}
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pl-12 flex-wrap">
                  {c.status !== 'approved' && (
                    <button
                      onClick={() => moderateMutation.mutate({ id: c.id, status: 'approved' })}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      <Check className="h-3 w-3" /> {ts('commentApprove')}
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button
                      onClick={() => moderateMutation.mutate({ id: c.id, status: 'rejected' })}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-[11px] font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <X className="h-3 w-3" /> {ts('commentReject')}
                    </button>
                  )}
                  {c.status !== 'spam' && (
                    <button
                      onClick={() => moderateMutation.mutate({ id: c.id, status: 'spam' })}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-[11px] font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3" /> {ts('commentSpam')}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors ml-auto"
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
