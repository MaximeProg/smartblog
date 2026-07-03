'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Save, Send, Loader2,
  Bold, Italic, Link2, Image as ImageIcon, Quote, Heading2, Heading3,
  Minus, X, Check,
} from 'lucide-react';
import Link from 'next/link';
import { articlesApi, categoriesApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useStudioPreview } from '@/contexts/studio-preview';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

// ─── Markdown toolbar helpers ─────────────────────────────────────────────────

function wrapSelection(
  ref: { current: HTMLTextAreaElement | null },
  setter: (v: string) => void,
  before: string,
  after: string,
  placeholder = '',
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const end   = el.selectionEnd;
  const sel   = el.value.slice(start, end) || placeholder;
  const next  = el.value.slice(0, start) + before + sel + after + el.value.slice(end);
  setter(next);
  setTimeout(() => {
    el.focus();
    el.setSelectionRange(start + before.length, start + before.length + sel.length);
  }, 0);
}

function insertAtCursor(
  ref: { current: HTMLTextAreaElement | null },
  setter: (v: string) => void,
  text: string,
) {
  const el = ref.current;
  if (!el) return;
  const pos  = el.selectionStart;
  const next = el.value.slice(0, pos) + text + el.value.slice(pos);
  setter(next);
  setTimeout(() => { el.focus(); el.setSelectionRange(pos + text.length, pos + text.length); }, 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewArticlePage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const router  = useRouter();
  const { toast } = useToast();
  const { setFullWidth } = useStudioPreview();

  // Full-width layout for article editor (no preview split)
  useEffect(() => {
    setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth]);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [title,         setTitle]         = useState('');
  const [slug,          setSlug]          = useState('');
  const [slugManual,    setSlugManual]    = useState(false);
  const [content,       setContent]       = useState('');
  const [excerpt,       setExcerpt]       = useState('');
  const [categoryId,    setCategoryId]    = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [publish,       setPublish]       = useState(false);

  // Toolbar states
  const [showLinkInput,  setShowLinkInput]  = useState(false);
  const [linkUrl,        setLinkUrl]        = useState('');
  const [showImgPicker,  setShowImgPicker]  = useState(false);

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
        title:          title.trim(),
        slug:           slug.trim() || slugify(title),
        content,
        excerpt,
        category_id:    categoryId  || undefined,
        cover_image_url: coverImageUrl || undefined,
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

  // Toolbar actions
  const handleBold   = () => wrapSelection(contentRef, setContent, '**', '**', 'texte en gras');
  const handleItalic = () => wrapSelection(contentRef, setContent, '*',  '*',  'texte en italique');
  const handleH2     = () => wrapSelection(contentRef, setContent, '## ', '', 'Titre de section');
  const handleH3     = () => wrapSelection(contentRef, setContent, '### ', '', 'Sous-titre');
  const handleQuote  = () => wrapSelection(contentRef, setContent, '> ', '', 'Citation');
  const handleRule   = () => insertAtCursor(contentRef, setContent, '\n---\n');

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    wrapSelection(contentRef, setContent, '[', `](${linkUrl.trim()})`, 'texte du lien');
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleInsertImage = useCallback((url: string) => {
    insertAtCursor(contentRef, setContent, `\n![image](${url})\n`);
    setShowImgPicker(false);
  }, []);

  const toolbarBtnCls = 'h-7 w-7 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-14 border-b border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-6 gap-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/${locale}/blogs/${blogId}/articles`}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Articles
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 truncate">
            {title || 'Nouvel article'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setPublish(false); mutation.mutate(); }}
            disabled={!canSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            {mutation.isPending && !publish
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Save className="h-3.5 w-3.5" />}
            Sauvegarder brouillon
          </button>
          <button
            onClick={() => { setPublish(true); mutation.mutate(); }}
            disabled={!canSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-40 shadow-sm"
          >
            {mutation.isPending && publish
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Publier
          </button>
        </div>
      </div>

      {/* ── Editor body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left: main editor */}
        <div className="flex-1 overflow-y-auto px-10 py-8 min-w-0">

          {/* Title */}
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Titre de l'article…"
            autoFocus
            className="w-full text-[32px] font-black text-slate-900 dark:text-slate-100 bg-transparent border-0 outline-none placeholder-slate-200 dark:placeholder-slate-700 mb-2 leading-tight"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 text-[12px] mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 dark:text-slate-500 font-mono shrink-0">URL :</span>
            <div className="flex items-center gap-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[12px]">
              <span className="text-slate-400 dark:text-slate-500 shrink-0">nexusblog.io/{blogId}/</span>
              <input
                value={slug}
                onChange={e => { setSlugManual(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')); }}
                className="bg-transparent outline-none text-slate-700 dark:text-slate-300 min-w-[120px]"
                placeholder="mon-article"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Résumé</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Un résumé court affiché dans les listings et les moteurs de recherche…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Les liens au format <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">[texte](url)</code> seront cliquables dans l'article publié.</p>
          </div>

          {/* Content editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Contenu</label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Markdown</span>
            </div>

            {/* Markdown toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border border-slate-200 dark:border-slate-700 border-b-0 rounded-t-xl bg-slate-50 dark:bg-slate-800 flex-wrap">
              <button type="button" onClick={handleBold}   title="Gras"             className={toolbarBtnCls}><Bold      className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleItalic} title="Italique"          className={toolbarBtnCls}><Italic    className="h-3.5 w-3.5" /></button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />
              <button type="button" onClick={handleH2}     title="Titre H2"          className={toolbarBtnCls}><Heading2  className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleH3}     title="Titre H3"          className={toolbarBtnCls}><Heading3  className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleQuote}  title="Citation"          className={toolbarBtnCls}><Quote     className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleRule}   title="Ligne de séparation" className={toolbarBtnCls}><Minus   className="h-3.5 w-3.5" /></button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />

              {/* Link button + inline input */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => { setShowLinkInput(v => !v); setShowImgPicker(false); }}
                  title="Insérer un lien"
                  className={`${toolbarBtnCls} ${showLinkInput ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                {showLinkInput && (
                  <div className="absolute top-full left-0 mt-1 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 z-20 whitespace-nowrap">
                    <input
                      autoFocus
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleInsertLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
                      placeholder="https://exemple.com"
                      className="h-7 w-56 px-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-[12px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button onClick={handleInsertLink} className="h-7 w-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setShowLinkInput(false)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Image button */}
              <button
                type="button"
                onClick={() => { setShowImgPicker(v => !v); setShowLinkInput(false); }}
                title="Insérer une image"
                className={`${toolbarBtnCls} ${showImgPicker ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Inline image picker (collapsible) */}
            {showImgPicker && (
              <div className="border border-slate-200 dark:border-slate-700 border-t-0 border-b-0 bg-white dark:bg-slate-800 px-4 py-3">
                <ImagePicker
                  value=""
                  onChange={handleInsertImage}
                  tenantId={blogId}
                  ratio="16/9"
                />
              </div>
            )}

            <textarea
              ref={contentRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={'Commencez à écrire votre article…\n\nExemples Markdown :\n**gras**  *italique*  ## Titre\n[texte](https://…)  ![alt](https://image.jpg)'}
              rows={26}
              className="w-full px-4 py-4 border border-slate-200 dark:border-slate-700 rounded-b-xl bg-white dark:bg-slate-800 text-[14px] text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Right: metadata sidebar */}
        <div className="w-[280px] shrink-0 border-l border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto px-5 py-6 space-y-6">

          {/* Cover image */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Image de couverture</p>
            <ImagePicker
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              tenantId={blogId}
              ratio="16/9"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Catégorie</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option value="">Sans catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Tips */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Raccourcis Markdown</p>
            <div className="space-y-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <p><span className="font-bold">**gras**</span></p>
              <p><span className="italic">*italique*</span></p>
              <p>## Titre H2</p>
              <p>[lien](https://…)</p>
              <p>![image](https://…)</p>
              <p>{'>'} Citation</p>
            </div>
          </div>

          {/* Bottom CTA (sticky) */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => { setPublish(true); mutation.mutate(); }}
              disabled={!canSave}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors disabled:opacity-40 shadow-sm"
            >
              {mutation.isPending && publish
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
              Publier l'article
            </button>
            <button
              onClick={() => { setPublish(false); mutation.mutate(); }}
              disabled={!canSave}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
            >
              {mutation.isPending && !publish
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
              Sauvegarder en brouillon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
