'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, Archive, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { articlesApi, categoriesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function EditArticlePage() {
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;
  const articleId = params.articleId as string;
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dirty, setDirty] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', blogId, articleId],
    queryFn: async () => { const { data } = await articlesApi.get(blogId, articleId); return data; },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: async () => { const { data } = await categoriesApi.list(blogId); return data; },
  });

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content ?? '');
      setExcerpt(article.excerpt ?? '');
      setCategoryId(article.category?.id ?? '');
    }
  }, [article]);

  const saveMut = useMutation({
    mutationFn: () => articlesApi.update(blogId, articleId, {
      title: title.trim(),
      content,
      excerpt,
      category_id: categoryId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      setDirty(false);
      toast({ title: 'Article sauvegardé.' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde.' }),
  });

  const publishMut = useMutation({
    mutationFn: () => articlesApi.publish(blogId, articleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      toast({ title: 'Article publié !' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la publication.' }),
  });

  const archiveMut = useMutation({
    mutationFn: () => articlesApi.archive(blogId, articleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      toast({ title: 'Article archivé.' });
    },
  });

  const isPending = saveMut.isPending || publishMut.isPending || archiveMut.isPending;

  const STATUS_COLORS: Record<string, string> = {
    draft:     'text-slate-500 bg-slate-100',
    published: 'text-emerald-700 bg-emerald-50',
    scheduled: 'text-blue-700 bg-blue-50',
    archived:  'text-slate-400 bg-slate-50',
  };

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Brouillon', published: 'Publié', scheduled: 'Planifié', archived: 'Archivé',
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-slate-50">

      {/* Topbar */}
      <div className="shrink-0 h-14 border-b border-slate-100 bg-white flex items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/${locale}/blogs/${blogId}/articles`}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Articles
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[13px] font-semibold text-slate-800 truncate">{title || 'Article sans titre'}</span>
          {article && (
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[article.status] ?? STATUS_COLORS.draft}`}>
              {STATUS_LABELS[article.status] ?? article.status}
            </span>
          )}
          {dirty && <span className="shrink-0 text-[10px] text-amber-600 font-medium">● Modifié</span>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => saveMut.mutate()}
            disabled={isPending || !dirty}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Sauvegarder
          </button>

          {article?.status === 'draft' && (
            <button
              onClick={() => publishMut.mutate()}
              disabled={isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-60"
            >
              {publishMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publier
            </button>
          )}
          {article?.status === 'published' && (
            <button
              onClick={() => archiveMut.mutate()}
              disabled={isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {archiveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Archiver
            </button>
          )}
          {article?.status === 'archived' && (
            <span className="flex items-center gap-1.5 h-8 px-4 text-[12px] text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Archivé
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* Title */}
          <div>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setDirty(true); }}
              placeholder="Titre de l'article…"
              className="w-full text-3xl font-black text-slate-900 bg-transparent border-0 outline-none placeholder-slate-200"
            />
          </div>

          {/* Category + Status */}
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-semibold text-slate-500 shrink-0">Catégorie</label>
            <select
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); setDirty(true); }}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700 outline-none"
            >
              <option value="">Sans catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-2">Extrait</label>
            <textarea
              value={excerpt}
              onChange={e => { setExcerpt(e.target.value); setDirty(true); }}
              placeholder="Un résumé court de l'article…"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-2">Contenu</label>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setDirty(true); }}
              placeholder="Commencez à écrire…"
              rows={24}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none font-mono leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">Markdown supporté</p>
          </div>
        </div>
      </div>
    </div>
  );
}
