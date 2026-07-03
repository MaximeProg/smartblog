'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Plus, Search, FileText, Eye, Clock, CheckCircle2,
  Archive, MoreVertical, Edit2, Trash2,
} from 'lucide-react';
import { articlesApi, tenantsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ArticleListItem, ArticleStatus } from '@/types';
import { BlogStudioShell } from '@/components/dashboard/BlogStudioShell';

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; icon: typeof FileText }> = {
  draft:     { label: 'Brouillon',   color: 'text-slate-500 bg-slate-100',    icon: FileText },
  published: { label: 'Publié',      color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle2 },
  scheduled: { label: 'Planifié',    color: 'text-blue-700 bg-blue-50',       icon: Clock },
  archived:  { label: 'Archivé',     color: 'text-slate-400 bg-slate-50',     icon: Archive },
};

function ArticleRow({
  article, locale, blogId,
  onDelete, onPublish, onArchive,
}: {
  article: ArticleListItem;
  locale: string;
  blogId: string;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const sc = STATUS_CONFIG[article.status];

  return (
    <div className="group flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 rounded-lg px-2 transition-colors">
      {/* Cover thumb */}
      <div className="h-10 w-14 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
        {article.cover_image_url
          ? <img src={article.cover_image_url} alt="" className="h-full w-full object-cover" />
          : <div className="h-full w-full flex items-center justify-center"><FileText className="h-4 w-4 text-slate-300" /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate leading-snug">{article.title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {formatRelativeTime(article.updated_at)} · {article.reading_time_minutes} min de lecture
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Eye className="h-3 w-3" />
          {article.views_count}
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>
          <sc.icon className="h-3 w-3" />
          {sc.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => router.push(`/${locale}/blogs/${blogId}/articles/${article.id}/edit`)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Modifier"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-40" onBlur={() => setMenuOpen(false)}>
              {article.status === 'draft' && (
                <button onClick={() => { onPublish(article.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Publier
                </button>
              )}
              {article.status === 'published' && (
                <button onClick={() => { onArchive(article.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50">
                  <Archive className="h-3.5 w-3.5 text-slate-400" /> Archiver
                </button>
              )}
              <button onClick={() => { onDelete(article.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ArticleStatus | ''>('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['articles', blogId, status],
    queryFn: async () => {
      const { data } = await articlesApi.list(blogId, { status: status || undefined, limit: 50 });
      return data;
    },
  });

  const articles = (data?.items ?? []).filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMut = useMutation({
    mutationFn: (id: string) => articlesApi.delete(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: 'Article supprimé.' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la suppression.' }),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => articlesApi.publish(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: 'Article publié !' });
    },
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => articlesApi.archive(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: 'Article archivé.' });
    },
  });

  return (
    <BlogStudioShell
      title="Articles"
      description="Tous les articles de votre blog."
      previewPath=""
      blogSlug={tenant?.slug}
    >
      <div className="p-4 space-y-3">

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ArticleStatus | '')}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] text-slate-600 outline-none"
          >
            <option value="">Tous</option>
            <option value="draft">Brouillons</option>
            <option value="published">Publiés</option>
            <option value="archived">Archivés</option>
          </select>
          <button
            onClick={() => router.push(`/${locale}/blogs/${blogId}/articles/new`)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Créer
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-3 animate-pulse py-3">
                <div className="h-10 w-14 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-[14px] font-bold text-slate-800 mb-1">
              {search ? 'Aucun article trouvé' : 'Aucun article'}
            </p>
            {!search && (
              <>
                <p className="text-[12px] text-slate-400 mb-4">Commencez par créer votre premier article.</p>
                <button
                  onClick={() => router.push(`/${locale}/blogs/${blogId}/articles/new`)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Créer un article
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="pt-1">
            <p className="text-[11px] text-slate-400 mb-2 px-2">{articles.length} article{articles.length > 1 ? 's' : ''}</p>
            {articles.map(a => (
              <ArticleRow
                key={a.id}
                article={a}
                locale={locale}
                blogId={blogId}
                onDelete={id => deleteMut.mutate(id)}
                onPublish={id => publishMut.mutate(id)}
                onArchive={id => archiveMut.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </BlogStudioShell>
  );
}
