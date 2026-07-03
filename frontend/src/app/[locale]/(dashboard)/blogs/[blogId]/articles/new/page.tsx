'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { articlesApi, categoriesApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function NewArticlePage() {
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [publish, setPublish] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: async () => { const { data } = await categoriesApi.list(blogId); return data; },
  });

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await articlesApi.create(blogId, {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        content,
        excerpt,
        category_id: categoryId || undefined,
      });
      if (publish) await articlesApi.publish(blogId, data.id);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: publish ? 'Article publié !' : 'Brouillon sauvegardé.' });
      router.push(`/${locale}/blogs/${blogId}/articles/${data.id}/edit`);
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la création.' }),
  });

  const canSave = title.trim().length >= 2 && !mutation.isPending;

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-slate-50">

      {/* Topbar */}
      <div className="shrink-0 h-14 border-b border-slate-100 bg-white flex items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/blogs/${blogId}/articles`}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Articles
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[13px] font-semibold text-slate-800 truncate max-w-xs">{title || 'Nouvel article'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPublish(false); mutation.mutate(); }}
            disabled={!canSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {mutation.isPending && !publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Brouillon
          </button>
          <button
            onClick={() => { setPublish(true); mutation.mutate(); }}
            disabled={!canSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-40"
          >
            {mutation.isPending && publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Publier
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* Title */}
          <div>
            <input
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Titre de l'article…"
              autoFocus
              className="w-full text-3xl font-black text-slate-900 bg-transparent border-0 outline-none placeholder-slate-200 resize-none"
            />
          </div>

          {/* Slug */}
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-slate-400 font-mono">URL :</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 font-mono">
              <span className="text-slate-400">/{blogId}/</span>
              <input
                value={slug}
                onChange={e => { setSlugManual(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')); }}
                className="bg-transparent outline-none text-slate-700 min-w-[100px]"
                placeholder="mon-article"
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-semibold text-slate-500 shrink-0">Catégorie</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
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
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Un résumé court de l'article (affiché dans les listings)…"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-2">Contenu</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Commencez à écrire votre article…&#10;&#10;Utilisez Markdown pour la mise en forme."
              rows={20}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none font-mono leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">Markdown supporté</p>
          </div>
        </div>
      </div>
    </div>
  );
}
