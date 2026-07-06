'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Mail, Users, TrendingUp, Download, Search, UserPlus, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';

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

  return (
    <FullPageShell
      title={ts('pageNewsletter')}
      description={ts('pageNewsletterDesc')}
      action={
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label={ts('newsletterSubscribersLabel')}
            value={totalSubscribers}
            icon={Users}
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            iconBorder="border-blue-100 dark:border-blue-800"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label={ts('newsletterThisMonth')}
            value="—"
            icon={TrendingUp}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            iconBorder="border-emerald-100 dark:border-emerald-800"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="New this week"
            value="—"
            icon={UserPlus}
            iconBg="bg-violet-50 dark:bg-violet-900/30"
            iconBorder="border-violet-100 dark:border-violet-800"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            label="Unsubscribed"
            value="—"
            icon={UserMinus}
            iconBg="bg-amber-50 dark:bg-amber-900/30"
            iconBorder="border-amber-100 dark:border-amber-800"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-w-sm">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={ts('newsletterSearchPlaceholder')}
            className="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Subscriber list / empty state */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-4">
              <Mail className="h-7 w-7 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-[16px] font-bold text-slate-800 dark:text-slate-200 mb-1">{ts('newsletterNoTitle')}</p>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs">{ts('newsletterNoDesc')}</p>
          </div>
        </div>

      </div>
    </FullPageShell>
  );
}
