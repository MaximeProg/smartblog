'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Mail, Users, TrendingUp, Download, Search } from 'lucide-react';
import { useState } from 'react';
import { tenantsApi } from '@/lib/api';
import { BlogStudioShell } from '@/components/dashboard/BlogStudioShell';

export default function NewsletterPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const [search, setSearch] = useState('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const totalSubscribers = tenant?.subscribers_count ?? 0;

  return (
    <BlogStudioShell
      title="Newsletter & Abonnés"
      description="Gestion des abonnés à votre newsletter."
      previewPath=""
      blogSlug={tenant?.slug}
    >
      <div className="p-5 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Abonnés</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{totalSubscribers}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ce mois</span>
            </div>
            <p className="text-2xl font-black text-slate-900">—</p>
          </div>
        </div>

        {/* Search + export */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un abonné…"
              className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
            <Mail className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-[14px] font-bold text-slate-800 mb-1">Aucun abonné pour l'instant</p>
          <p className="text-[12px] text-slate-400 max-w-[200px]">
            Les abonnés apparaîtront ici une fois que des visiteurs s'inscriront à votre newsletter.
          </p>
        </div>
      </div>
    </BlogStudioShell>
  );
}
