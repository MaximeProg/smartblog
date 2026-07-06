'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Mail, Users, TrendingUp, Download, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';

export default function NewsletterPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const [search, setSearch] = useState('');
  const ts = useTranslations('studio');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const totalSubscribers = tenant?.subscribers_count ?? 0;

  const exportButton = (
    <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <Download className="h-3.5 w-3.5" /> Export CSV
    </button>
  );

  return (
    <FullPageShell
      title={ts('pageNewsletter')}
      description={ts('pageNewsletterDesc')}
      action={exportButton}
    >
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ts('newsletterSubscribersLabel')}</span>
            </div>
            <p className="text-[28px] font-black text-slate-900 dark:text-slate-100">{totalSubscribers}</p>
          </div>
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ts('newsletterThisMonth')}</span>
            </div>
            <p className="text-[28px] font-black text-slate-900 dark:text-slate-100">—</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={ts('newsletterSearchPlaceholder')}
            className="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <Mail className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-[16px] font-bold text-slate-800 dark:text-slate-200 mb-1">{ts('newsletterNoTitle')}</p>
          <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs">
            {ts('newsletterNoDesc')}
          </p>
        </div>
      </div>
    </FullPageShell>
  );
}
