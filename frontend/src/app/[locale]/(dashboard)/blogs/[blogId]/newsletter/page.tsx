'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Mail, Users, Search } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { newsletterApi, tenantsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function NewsletterPage() {
  const params = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const t = useTranslations('newsletter');
  const [search, setSearch] = useState('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['newsletter', blogId],
    queryFn: () => newsletterApi.subscribers(blogId, { limit: 50 }).then((r) => r.data),
    enabled: !!blogId,
  });

  const allSubscribers = data?.items ?? [];
  const total = data?.total ?? 0;

  const subscribers = search
    ? allSubscribers.filter((s: any) => s.email?.toLowerCase().includes(search.toLowerCase()))
    : allSubscribers;

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[
        { label: tenant?.name ?? '…' },
        { label: t('title') },
      ]}
    >
      <div className="max-w-3xl">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-3">
              <Users className="h-[18px] w-[18px] text-blue-600" />
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mb-1" />
            ) : (
              <p className="text-2xl font-black text-slate-800 dark:text-white">{total.toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{t('activeSubscribers')}</p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
              <Mail className="h-[18px] w-[18px] text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white">—</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{t('emailsSent')}</p>
          </div>
        </div>

        {/* Subscribers list */}
        <div>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0">{t('subscribersTitle')}</h2>
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : subscribers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 py-16 text-center bg-white dark:bg-zinc-900">
              <Mail className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">
                {search ? t('noResults') : t('noSubscribers')}
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                {search ? t('noResultsDesc') : t('noSubscribersDesc')}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              <div className="grid grid-cols-[1fr_auto] text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800">
                <span>{t('emailHeader')}</span>
                <span>{t('dateHeader')}</span>
              </div>
              {subscribers.map((sub: any, i: number) => (
                <div
                  key={sub.id ?? i}
                  className={`grid grid-cols-[1fr_auto] items-center px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${i > 0 ? 'border-t border-slate-50 dark:border-zinc-800' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {(sub.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <span className="text-[13px] text-slate-700 dark:text-slate-200 truncate">{sub.email}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                    {formatDate(sub.subscribed_at ?? sub.created_at, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
