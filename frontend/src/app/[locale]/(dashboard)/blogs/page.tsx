'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Newspaper, Mail, Users, ExternalLink, Settings, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col">
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

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-[14px] leading-tight truncate">{blog.name}</h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{blog.slug}.nexusblog.io</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Newspaper, val: blog.articles_count ?? 0,    label: 'articles' },
            { icon: Mail,      val: blog.subscribers_count ?? 0, label: 'abonnés'  },
            { icon: Users,     val: blog.authors_count ?? 0,     label: 'auteurs'  },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-2 rounded-lg bg-slate-50">
              <span className="text-[15px] font-black text-slate-800 leading-none">{s.val}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <Link
            href={`/${locale}/blogs/${blog.id}/general`}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-semibold transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Studio
          </Link>
          <a
            href={`/${locale}/${blog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all"
            title="Voir le blog"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BlogsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => { const { data } = await tenantsApi.list(); return data; },
  });

  const filtered = search.trim()
    ? blogs.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.includes(search.toLowerCase()))
    : blogs;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-black text-slate-900">Mes blogs</h2>
                {!isLoading && (
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    {blogs.length === 0
                      ? 'Aucun blog créé pour le moment.'
                      : `${blogs.length} blog${blogs.length > 1 ? 's' : ''} créé${blogs.length > 1 ? 's' : ''}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {blogs.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher…"
                      className="h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors w-[200px]"
                    />
                  </div>
                )}
                <button
                  onClick={() => router.push(`/${locale}/onboarding`)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nouveau blog
                </button>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
                    <div className="h-[100px] bg-slate-100" />
                    <div className="p-4 space-y-3">
                      <div className="h-3.5 bg-slate-100 rounded-lg w-3/5" />
                      <div className="h-3 bg-slate-100 rounded-lg w-2/5" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-10 bg-slate-100 rounded-lg" />
                        <div className="h-10 bg-slate-100 rounded-lg" />
                        <div className="h-10 bg-slate-100 rounded-lg" />
                      </div>
                      <div className="h-8 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 && search ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200/80">
                <Search className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-[14px] font-bold text-slate-800">Aucun résultat pour «{search}»</p>
                <p className="text-[13px] text-slate-400 mt-1">Essayez un autre terme.</p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                  <Newspaper className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-2">Aucun blog</h3>
                <p className="text-[13px] text-slate-500 max-w-[260px] mb-6 leading-relaxed">
                  Créez votre premier blog en quelques secondes.
                </p>
                <button
                  onClick={() => router.push(`/${locale}/onboarding`)}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Créer mon premier blog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {filtered.map(blog => <BlogCard key={blog.id} blog={blog} locale={locale} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
