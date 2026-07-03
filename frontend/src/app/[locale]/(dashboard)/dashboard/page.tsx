'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Newspaper, Mail, Users, ExternalLink, Settings, TrendingUp, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAuthStore } from '@/store/auth.store';
import { tenantsApi } from '@/lib/api';
import type { TenantInfo } from '@/types';

const PLAN_GRADIENTS: Record<string, string> = {
  free:     'from-slate-400 to-slate-600',
  starter:  'from-indigo-400 to-indigo-600',
  pro:      'from-blue-400 to-blue-600',
  business: 'from-amber-400 to-orange-500',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuit', starter: 'Starter', pro: 'Pro', business: 'Business',
};

function BlogCard({ blog, locale }: { blog: TenantInfo; locale: string }) {
  const plan     = blog.plan?.toLowerCase() ?? 'free';
  const gradient = PLAN_GRADIENTS[plan] ?? PLAN_GRADIENTS.free;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="relative h-[100px] shrink-0 overflow-hidden">
        {blog.cover_image_url ? (
          <img src={blog.cover_image_url} alt={blog.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-[72px] font-black text-white/[0.12] leading-none select-none">
              {blog.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/25 text-white backdrop-blur-sm">
          {PLAN_LABELS[plan] ?? plan}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[14px] leading-tight truncate">{blog.name}</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">{blog.slug}.nexusblog.io</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Newspaper, val: blog.articles_count ?? 0,    label: 'articles' },
            { icon: Mail,      val: blog.subscribers_count ?? 0, label: 'abonnés'  },
            { icon: Users,     val: blog.authors_count ?? 0,     label: 'auteurs'  },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="text-[15px] font-black text-slate-800 dark:text-slate-200 leading-none">{s.val}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Link
            href={`/${locale}/blogs/${blog.id}/general`}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[12px] font-semibold transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Studio
          </Link>
          <a
            href={`/${locale}/${blog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
            title="Voir le blog"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-[100px] bg-slate-100 dark:bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/5" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-2/5" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data } = await tenantsApi.list();
      return data;
    },
  });

  const firstName        = user?.display_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'là';
  const totalArticles    = blogs.reduce((s, b) => s + (b.articles_count    ?? 0), 0);
  const totalSubscribers = blogs.reduce((s, b) => s + (b.subscribers_count ?? 0), 0);
  const totalAuthors     = blogs.reduce((s, b) => s + (b.authors_count     ?? 0), 0);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">

            {/* Welcome header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-tight">
                  Bonjour, {firstName} 👋
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                  {isLoading
                    ? 'Chargement de vos blogs…'
                    : blogs.length === 0
                    ? 'Créez votre premier blog pour commencer.'
                    : `Vous gérez ${blogs.length} blog${blogs.length > 1 ? 's' : ''}.`}
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/onboarding`)}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[13px] font-semibold transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouveau blog
              </button>
            </div>

            {/* Global stats — only when blogs exist */}
            {!isLoading && blogs.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Blogs actifs',      value: blogs.length,     icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-100 dark:border-blue-800'   },
                  { label: 'Articles publiés',   value: totalArticles,    icon: Newspaper,  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20',  border: 'border-violet-100 dark:border-violet-800' },
                  { label: 'Abonnés cumulés',    value: totalSubscribers, icon: Mail,       color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800'},
                  { label: 'Auteurs au total',   value: totalAuthors,     icon: Users,      color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-100 dark:border-amber-800'  },
                ].map(stat => (
                  <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm px-5 py-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                      <p className="text-[28px] font-black text-slate-900 dark:text-slate-100 leading-none">{stat.value}</p>
                    </div>
                    <div className={`h-11 w-11 rounded-xl border ${stat.border} ${stat.bg} flex items-center justify-center shrink-0`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Blogs section */}
            {!isLoading && blogs.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vos blogs</p>
                <Link href={`/${locale}/blogs`} className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-4 gap-4">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            ) : blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                  <Newspaper className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 mb-2">Aucun blog pour l'instant</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-[260px] mb-6 leading-relaxed">
                  Créez votre premier blog et publiez du contenu de qualité en quelques minutes.
                </p>
                <button
                  onClick={() => router.push(`/${locale}/onboarding`)}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[13px] font-semibold transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Créer mon premier blog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {blogs.map(blog => <BlogCard key={blog.id} blog={blog} locale={locale} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
