'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Save, Send, Archive, Loader2, CheckCircle2,
  Bold, Italic, Link2, Image as ImageIcon, Quote, Heading2, Heading3,
  Minus, X, Check,
} from 'lucide-react';
import Link from 'next/link';
import { articlesApi, categoriesApi, mediaApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useStudioPreview } from '@/contexts/studio-preview';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

// ─── Markdown helpers ─────────────────────────────────────────────────────────

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

const STATUS_COLORS: Record<string, string> = {
  draft:     'text-slate-600 bg-slate-100',
  published: 'text-emerald-700 bg-emerald-50 border border-emerald-100',
  scheduled: 'text-blue-700 bg-blue-50',
  archived:  'text-slate-400 bg-slate-50',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', published: 'Publié', scheduled: 'Planifié', archived: 'Archivé',
};

export default function EditArticlePage() {
  const params      = useParams();
  const locale      = params.locale as string;
  const blogId      = params.blogId as string;
  const articleId   = params.articleId as string;
  const { toast }   = useToast();
  const qc          = useQueryClient();
  const { setFullWidth, refresh } = useStudioPreview();

  // Full-width layout for article editor
  useEffect(() => {
    setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth]);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [title,         setTitle]         = useState('');
  const [content,       setContent]       = useState('');
  const [excerpt,       setExcerpt]       = useState('');
  const [categoryId,    setCategoryId]    = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [dirty,         setDirty]         = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl,       setLinkUrl]       = useState('');
  const [showImgPicker, setShowImgPicker] = useState(false);
  const [textareaDragging, setTextareaDragging] = useState(false);
  const [textareaUploading, setTextareaUploading] = useState(false);

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
      setCoverImageUrl((article as any).cover_image_url ?? '');
      setDirty(false);
    }
  }, [article]);

  const mark = () => setDirty(true);

  const saveMut = useMutation({
    mutationFn: () => articlesApi.update(blogId, articleId, {
      title:           title.trim(),
      content,
      excerpt,
      category_id:     categoryId     || undefined,
      cover_image_url: coverImageUrl  || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      setDirty(false);
      toast({ title: 'Article sauvegardé.' });
      setTimeout(() => refresh(), 400);
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde.' }),
  });

  const publishMut = useMutation({
    mutationFn: () => articlesApi.publish(blogId, articleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      toast({ title: 'Article publié !' });
      setTimeout(() => refresh(), 400);
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

  // Toolbar actions
  const handleBold   = () => { wrapSelection(contentRef, setContent, '**', '**', 'gras');      mark(); };
  const handleItalic = () => { wrapSelection(contentRef, setContent, '*',  '*',  'italique');   mark(); };
  const handleH2     = () => { wrapSelection(contentRef, setContent, '## ', '', 'Titre');       mark(); };
  const handleH3     = () => { wrapSelection(contentRef, setContent, '### ', '', 'Sous-titre'); mark(); };
  const handleQuote  = () => { wrapSelection(contentRef, setContent, '> ', '', 'Citation');     mark(); };
  const handleRule   = () => { insertAtCursor(contentRef, setContent, '\n---\n');               mark(); };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    wrapSelection(contentRef, setContent, '[', `](${linkUrl.trim()})`, 'texte du lien');
    setLinkUrl('');
    setShowLinkInput(false);
    mark();
  };

  const handleInsertImage = useCallback((url: string) => {
    insertAtCursor(contentRef, setContent, `\n![image](${url})\n`);
    setShowImgPicker(false);
    mark();
  }, []);

  const handleTextareaDrop = useCallback(async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setTextareaDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setTextareaUploading(true);
    try {
      const { data } = await mediaApi.upload(blogId, file);
      insertAtCursor(contentRef, setContent, `\n![image](${data.cloudinary_secure_url})\n`);
      mark();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de l\'upload de l\'image.' });
    } finally {
      setTextareaUploading(false);
    }
  }, [blogId, toast]);

  const toolbarBtnCls = 'h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors';

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-14 border-b border-slate-200/70 bg-white flex items-center justify-between px-6 gap-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/${locale}/blogs/${blogId}/articles`}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Articles
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[13px] font-semibold text-slate-700 truncate max-w-[240px]">
            {title || 'Sans titre'}
          </span>
          {article && (
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[article.status] ?? STATUS_COLORS.draft}`}>
              {STATUS_LABELS[article.status] ?? article.status}
            </span>
          )}
          {dirty && <span className="shrink-0 text-[10px] text-amber-600 font-semibold">● Non sauvegardé</span>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => saveMut.mutate()}
            disabled={isPending || !dirty}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Sauvegarder
          </button>

          {article?.status === 'draft' && (
            <button
              onClick={() => publishMut.mutate()}
              disabled={isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-60 shadow-sm"
            >
              {publishMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publier
            </button>
          )}
          {article?.status === 'published' && (
            <button
              onClick={() => archiveMut.mutate()}
              disabled={isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {archiveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Archiver
            </button>
          )}
          {article?.status === 'archived' && (
            <span className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Archivé
            </span>
          )}
        </div>
      </div>

      {/* ── Editor body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left: main content */}
        <div className="flex-1 overflow-y-auto px-10 py-8 min-w-0">

          {/* Title */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); mark(); }}
            placeholder="Titre de l'article…"
            className="w-full text-[32px] font-black text-slate-900 bg-transparent border-0 outline-none placeholder-slate-200 mb-2 leading-tight"
          />

          <div className="mb-8 pb-6 border-b border-slate-200" />

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Résumé</label>
            <textarea
              value={excerpt}
              onChange={e => { setExcerpt(e.target.value); mark(); }}
              placeholder="Un résumé court affiché dans les listings et les moteurs de recherche…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-1">Les liens au format <code className="bg-slate-100 px-1 rounded">[texte](url)</code> seront cliquables dans l'article publié.</p>
          </div>

          {/* Content editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Contenu</label>
              <span className="text-[10px] text-slate-400">Markdown</span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border border-slate-200 border-b-0 rounded-t-xl bg-slate-50 flex-wrap">
              <button type="button" onClick={handleBold}   title="Gras"              className={toolbarBtnCls}><Bold      className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleItalic} title="Italique"           className={toolbarBtnCls}><Italic    className="h-3.5 w-3.5" /></button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button type="button" onClick={handleH2}     title="Titre H2"           className={toolbarBtnCls}><Heading2  className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleH3}     title="Titre H3"           className={toolbarBtnCls}><Heading3  className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleQuote}  title="Citation"           className={toolbarBtnCls}><Quote     className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={handleRule}   title="Séparateur"         className={toolbarBtnCls}><Minus     className="h-3.5 w-3.5" /></button>
              <div className="w-px h-4 bg-slate-200 mx-1" />

              {/* Link */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => { setShowLinkInput(v => !v); setShowImgPicker(false); }}
                  title="Insérer un lien"
                  className={`${toolbarBtnCls} ${showLinkInput ? 'bg-blue-50 text-blue-600' : ''}`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                {showLinkInput && (
                  <div className="absolute top-full left-0 mt-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-20 whitespace-nowrap">
                    <input
                      autoFocus
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleInsertLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
                      placeholder="https://exemple.com"
                      className="h-7 w-56 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button onClick={handleInsertLink} className="h-7 w-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setShowLinkInput(false)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Image */}
              <button
                type="button"
                onClick={() => { setShowImgPicker(v => !v); setShowLinkInput(false); }}
                title="Insérer une image"
                className={`${toolbarBtnCls} ${showImgPicker ? 'bg-blue-50 text-blue-600' : ''}`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {showImgPicker && (
              <div className="border border-slate-200 border-t-0 border-b-0 bg-white px-4 py-3">
                <ImagePicker
                  value=""
                  onChange={handleInsertImage}
                  tenantId={blogId}
                  ratio="16/9"
                />
              </div>
            )}

            <div className="relative">
              <textarea
                ref={contentRef}
                value={content}
                onChange={e => { setContent(e.target.value); mark(); }}
                placeholder={'Commencez à écrire votre article…\n\nExemples Markdown :\n**gras**  *italique*  ## Titre\n[texte](https://…)  ![alt](https://image.jpg)\n\nGlissez-déposez une image directement ici'}
                rows={26}
                onDragOver={e => { e.preventDefault(); setTextareaDragging(true); }}
                onDragLeave={() => setTextareaDragging(false)}
                onDrop={handleTextareaDrop}
                className={`w-full px-4 py-4 border rounded-b-xl bg-white text-[14px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-mono leading-relaxed transition-colors ${
                  textareaDragging ? 'border-blue-400 bg-blue-50/40 focus:border-blue-400' : 'border-slate-200 focus:border-blue-400'
                }`}
              />
              {textareaUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-b-xl">
                  <div className="flex items-center gap-2 text-[13px] text-blue-600 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upload en cours…
                  </div>
                </div>
              )}
              {textareaDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50/70 border-2 border-blue-400 border-dashed rounded-b-xl pointer-events-none">
                  <div className="flex items-center gap-2 text-[13px] text-blue-600 font-semibold">
                    <ImageIcon className="h-5 w-5" />
                    Déposez l&apos;image ici
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: metadata sidebar */}
        <div className="w-[280px] shrink-0 border-l border-slate-200/70 bg-white overflow-y-auto px-5 py-6 space-y-6">

          {/* Cover image */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Image de couverture</p>
            <ImagePicker
              value={coverImageUrl}
              onChange={url => { setCoverImageUrl(url); mark(); }}
              tenantId={blogId}
              ratio="16/9"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Catégorie</label>
            <select
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); mark(); }}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option value="">Sans catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Tips */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 mb-1.5">Raccourcis Markdown</p>
            <div className="space-y-1 text-[10px] text-slate-400 font-mono">
              <p><span className="font-bold">**gras**</span></p>
              <p><span className="italic">*italique*</span></p>
              <p>## Titre H2</p>
              <p>[lien](https://…)</p>
              <p>![image](https://…)</p>
              <p>{'>'} Citation</p>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="space-y-2 pt-2">
            {article?.status === 'draft' && (
              <button
                onClick={() => publishMut.mutate()}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50 shadow-sm"
              >
                {publishMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publier
              </button>
            )}
            <button
              onClick={() => saveMut.mutate()}
              disabled={isPending || !dirty}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
