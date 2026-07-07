'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Save, Send, Archive, Loader2, CheckCircle2,
  Camera, Video, Mic, Radio, Layers, FileText,
  Eye, EyeOff, History, Monitor, Tablet, Smartphone,
  ThumbsUp, ThumbsDown, Clock,
} from 'lucide-react';
import type { ArticleType, ArticleVersionResponse } from '@/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { articlesApi, categoriesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useStudioPreview } from '@/contexts/studio-preview';
import { ImagePicker } from '@/components/dashboard/ImagePicker';
import { MediaFilePicker } from '@/components/dashboard/MediaFilePicker';
import dynamic from 'next/dynamic';
const RichEditor = dynamic(() => import('@/components/editor/RichEditor').then(m => m.RichEditor), { ssr: false });

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:       'text-slate-600 bg-slate-100',
  published:   'text-emerald-700 bg-emerald-50 border border-emerald-100',
  scheduled:   'text-blue-700 bg-blue-50',
  archived:    'text-slate-400 bg-slate-50',
  in_review:   'text-amber-700 bg-amber-50 border border-amber-100',
  approved:    'text-teal-700 bg-teal-50 border border-teal-100',
  rejected:    'text-red-700 bg-red-50 border border-red-100',
  unpublished: 'text-orange-600 bg-orange-50',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditArticlePage() {
  const params    = useParams();
  const locale    = params.locale as string;
  const blogId    = params.blogId as string;
  const articleId = params.articleId as string;
  const { toast } = useToast();
  const qc        = useQueryClient();
  const { setFullWidth, refresh } = useStudioPreview();
  const te = useTranslations('editor');
  const ts = useTranslations('studio');
  const ta = useTranslations('articles');

  useEffect(() => {
    setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth]);

  // ── Field state ──────────────────────────────────────────────────
  const [title,          setTitle]          = useState('');
  const [content,        setContent]        = useState('');
  const [contentJson,    setContentJson]    = useState<Record<string, unknown> | undefined>();
  const [excerpt,        setExcerpt]        = useState('');
  const [categoryId,     setCategoryId]     = useState('');
  const [coverImageUrl,  setCoverImageUrl]  = useState('');
  const [articleType,    setArticleType]    = useState<ArticleType>('article');
  const [videoUrl,       setVideoUrl]       = useState('');
  const [audioUrl,       setAudioUrl]       = useState('');
  const [episodeNumber,  setEpisodeNumber]  = useState('');
  const [season,         setSeason]         = useState('');
  const [seoTitle,       setSeoTitle]       = useState('');
  const [seoDesc,        setSeoDesc]        = useState('');
  const [canonicalUrl,   setCanonicalUrl]   = useState('');
  const [robotsNoindex,  setRobotsNoindex]  = useState(false);
  const [rejectReason,   setRejectReason]   = useState('');

  // ── UI state ─────────────────────────────────────────────────────
  const [dirty,          setDirty]          = useState(false);
  const [focusMode,      setFocusMode]      = useState(false);
  const [showVersions,   setShowVersions]   = useState(false);
  const [previewDevice,  setPreviewDevice]  = useState<'desktop' | 'tablet' | 'mobile' | null>(null);
  const [showRejectBox,  setShowRejectBox]  = useState(false);
  const [sidebarTab,     setSidebarTab]     = useState<'meta' | 'seo' | 'workflow'>('meta');

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load article ─────────────────────────────────────────────────
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', blogId, articleId],
    queryFn: async () => { const { data } = await articlesApi.get(blogId, articleId); return data; },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: async () => { const { data } = await categoriesApi.list(blogId); return data; },
  });

  const { data: versions = [] } = useQuery<ArticleVersionResponse[]>({
    queryKey: ['article-versions', blogId, articleId],
    queryFn: async () => { const { data } = await articlesApi.getVersions(blogId, articleId); return data; },
    enabled: showVersions,
  });

  useEffect(() => {
    if (!article) return;
    setTitle(article.title);
    setContent(article.content ?? '');
    setContentJson(article.content_json ?? undefined);
    setExcerpt(article.excerpt ?? '');
    setCategoryId((article as any).category?.id ?? '');
    setCoverImageUrl((article as any).cover_image_url ?? '');
    setArticleType((article.article_type as ArticleType) ?? 'article');
    setVideoUrl(article.video_url ?? '');
    setAudioUrl(article.audio_url ?? '');
    setEpisodeNumber((article as any).episode_number?.toString() ?? '');
    setSeason((article as any).season?.toString() ?? '');
    setSeoTitle(article.seo_title ?? '');
    setSeoDesc(article.seo_description ?? '');
    setCanonicalUrl(article.canonical_url ?? '');
    setRobotsNoindex(article.robots_noindex ?? false);
    setDirty(false);
  }, [article]);

  // ── Mutations ─────────────────────────────────────────────────────
  const buildPayload = useCallback(() => ({
    title:           title.trim(),
    content,
    content_json:    contentJson,
    excerpt,
    category_id:     categoryId     || undefined,
    cover_image_url: coverImageUrl  || undefined,
    article_type:    articleType,
    video_url:       videoUrl       || undefined,
    audio_url:       audioUrl       || undefined,
    episode_number:  episodeNumber ? parseInt(episodeNumber, 10) : undefined,
    season:          season        ? parseInt(season, 10) : undefined,
    seo_title:       seoTitle       || undefined,
    seo_description: seoDesc        || undefined,
    canonical_url:   canonicalUrl   || undefined,
    robots_noindex:  robotsNoindex,
  }), [title, content, contentJson, excerpt, categoryId, coverImageUrl, articleType, videoUrl, audioUrl, episodeNumber, season, seoTitle, seoDesc, canonicalUrl, robotsNoindex]);

  const saveMut = useMutation({
    mutationFn: () => articlesApi.update(blogId, articleId, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      setDirty(false);
      toast({ title: ts('articleSavedToast') });
      setTimeout(() => refresh(), 400);
    },
    onError: () => toast({ variant: 'destructive', title: ts('articleSaveError') }),
  });

  const publishMut = useMutation({
    mutationFn: () => articlesApi.publish(blogId, articleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['article', blogId, articleId] }); toast({ title: ts('articlePublishedToast') }); setTimeout(() => refresh(), 400); },
    onError: () => toast({ variant: 'destructive', title: ts('articlePublishError') }),
  });

  const unpublishMut = useMutation({
    mutationFn: () => articlesApi.unpublish(blogId, articleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['article', blogId, articleId] }); toast({ title: 'Dépublié' }); },
  });

  const archiveMut = useMutation({
    mutationFn: () => articlesApi.archive(blogId, articleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['article', blogId, articleId] }); toast({ title: ts('articleArchivedToast') }); },
  });

  const submitReviewMut = useMutation({
    mutationFn: () => articlesApi.submitReview(blogId, articleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['article', blogId, articleId] }); toast({ title: te('submitReview') }); },
  });

  const approveMut = useMutation({
    mutationFn: () => articlesApi.approve(blogId, articleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['article', blogId, articleId] }); toast({ title: te('approveArticle') }); },
  });

  const rejectMut = useMutation({
    mutationFn: () => articlesApi.reject(blogId, articleId, rejectReason || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      setShowRejectBox(false);
      setRejectReason('');
      toast({ title: te('rejectArticle') });
    },
  });

  const isPending = saveMut.isPending || publishMut.isPending || archiveMut.isPending || submitReviewMut.isPending || approveMut.isPending || rejectMut.isPending || unpublishMut.isPending;

  // ── Autosave 30s ──────────────────────────────────────────────────
  const mark = useCallback(() => {
    setDirty(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => saveMut.mutate(), 30_000);
  }, [saveMut]);

  useEffect(() => () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); }, []);

  const handleEditorChange = useCallback((html: string, json: Record<string, unknown>) => {
    setContent(html);
    setContentJson(json);
    mark();
  }, [mark]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const statusLabel = article ? (ta as any)(`status.${article.status}`, { defaultValue: article.status }) : '';

  return (
    <div className={`flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 ${focusMode ? 'focus-mode' : ''}`}>

      {/* ── Top bar ── */}
      {!focusMode && (
        <div className="shrink-0 h-14 border-b border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-6 gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/${locale}/blogs/${blogId}/articles`} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors shrink-0">
              <ArrowLeft className="h-3.5 w-3.5" /> Articles
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
              {title || ts('articleUntitled')}
            </span>
            {article && (
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[article.status] ?? STATUS_COLORS.draft}`}>
                {statusLabel}
              </span>
            )}
            {dirty && <span className="shrink-0 text-[10px] text-amber-600 font-semibold">● {ts('articleUnsaved')}</span>}
            {saveMut.isPending && <span className="shrink-0 text-[10px] text-blue-500">{te('autosaved')}…</span>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Preview device */}
            <div className="flex items-center gap-0.5 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
              {(['desktop', 'tablet', 'mobile'] as const).map(d => {
                const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
                return (
                  <button key={d} onClick={() => setPreviewDevice(prev => prev === d ? null : d)} title={te(`preview${d.charAt(0).toUpperCase() + d.slice(1)}` as any)}
                    className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${previewDevice === d ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>

            <button onClick={() => setShowVersions(v => !v)} title={te('versionHistory')}
              className={`h-8 px-3 flex items-center gap-1.5 rounded-xl border text-[12px] font-medium transition-colors ${showVersions ? 'bg-slate-100 border-slate-300 text-slate-700' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'}`}>
              <History className="h-3.5 w-3.5" />
            </button>

            <button onClick={() => setFocusMode(true)} title={te('focusMode')}
              className="h-8 px-3 flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>

            <button onClick={() => saveMut.mutate()} disabled={isPending || !dirty}
              className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40">
              {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {ts('articleSave')}
            </button>

            {article?.status === 'draft' && (
              <button onClick={() => submitReviewMut.mutate()} disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-[12px] font-bold transition-colors disabled:opacity-60">
                <Send className="h-3.5 w-3.5" /> {te('submitReview')}
              </button>
            )}
            {(article?.status === 'draft' || article?.status === 'approved') && (
              <button onClick={() => publishMut.mutate()} disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-60 shadow-sm">
                {publishMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {ts('articlePublishAction')}
              </button>
            )}
            {article?.status === 'published' && (
              <button onClick={() => unpublishMut.mutate()} disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-60">
                <EyeOff className="h-3.5 w-3.5" /> Dépublier
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Editor body ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Version history panel */}
        {showVersions && (
          <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{te('versionHistory')}</h3>
            </div>
            {versions.map(v => (
              <div key={v.id} className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">v{v.version_number}</span>
                  <span className="text-[10px] text-slate-400">{new Date(v.created_at).toLocaleString()}</span>
                </div>
                {v.change_summary && <p className="text-[10px] text-slate-500 truncate">{v.change_summary}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Main editor area */}
        <div className={`flex-1 overflow-y-auto px-10 py-8 min-w-0 ${focusMode ? 'max-w-3xl mx-auto w-full' : ''}`}>

          {focusMode && (
            <button onClick={() => setFocusMode(false)} className="mb-4 flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 transition-colors">
              <EyeOff className="h-3.5 w-3.5" /> {te('exitFocusMode')}
            </button>
          )}

          {/* Title */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); mark(); }}
            placeholder={ts('articleTitlePlaceholder')}
            className="w-full text-[32px] font-black text-slate-900 dark:text-slate-100 bg-transparent border-0 outline-none placeholder-slate-200 dark:placeholder-slate-700 mb-2 leading-tight"
          />

          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700" />

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleExcerptLabel')}</label>
            <textarea
              value={excerpt}
              onChange={e => { setExcerpt(e.target.value); mark(); }}
              placeholder={ts('articleExcerptPlaceholder')}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none leading-relaxed"
            />
          </div>

          {/* Rich editor */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleContentLabel')}</label>
            <RichEditor
              content={content}
              contentJson={contentJson}
              onChange={handleEditorChange}
              placeholder={te('placeholder')}
            />
          </div>

          {/* Rejection reason display */}
          {article?.status === 'rejected' && article.rejection_reason && (
            <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
              <p className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-1">Rejeté</p>
              <p className="text-[13px] text-red-600 dark:text-red-300">{article.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Right sidebar — hidden in focus mode */}
        {!focusMode && (
          <div className="w-[300px] shrink-0 border-l border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto flex flex-col">

            {/* Sidebar tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {(['meta', 'seo', 'workflow'] as const).map(tab => (
                <button key={tab} onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${sidebarTab === tab ? 'text-blue-600 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab === 'meta' ? 'Contenu' : tab === 'seo' ? 'SEO' : 'Workflow'}
                </button>
              ))}
            </div>

            <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto">

              {/* ── Meta tab ── */}
              {sidebarTab === 'meta' && (
                <>
                  {/* Article type */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleTypeLabel')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { type: 'article', icon: FileText, labelKey: 'articleTypeArticle' },
                        { type: 'photo',   icon: Camera,   labelKey: 'articleTypePhoto' },
                        { type: 'video',   icon: Video,    labelKey: 'articleTypeVideo' },
                        { type: 'audio',   icon: Mic,      labelKey: 'articleTypeAudio' },
                        { type: 'podcast', icon: Radio,    labelKey: 'articleTypePodcast' },
                        { type: 'mixed',   icon: Layers,   labelKey: 'articleTypeMixed' },
                      ] as const).map(({ type, icon: Icon, labelKey }) => (
                        <button key={type} type="button" onClick={() => { setArticleType(type as ArticleType); mark(); }}
                          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-[10px] font-semibold transition-all ${articleType === type ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {ts(labelKey as any)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Media fields */}
                  {articleType === 'video' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleFieldVideoUrl')}</label>
                      <MediaFilePicker value={videoUrl} onChange={url => { setVideoUrl(url); mark(); }} tenantId={blogId} mediaType="video" />
                    </div>
                  )}
                  {(articleType === 'audio' || articleType === 'podcast') && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleFieldAudioUrl')}</label>
                      <MediaFilePicker value={audioUrl} onChange={url => { setAudioUrl(url); mark(); }} tenantId={blogId} mediaType="audio" />
                    </div>
                  )}
                  {articleType === 'podcast' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{te('episodeNumber')}</label>
                        <input type="number" min="1" value={episodeNumber} onChange={e => { setEpisodeNumber(e.target.value); mark(); }} placeholder="1"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{te('season')}</label>
                        <input type="number" min="1" value={season} onChange={e => { setSeason(e.target.value); mark(); }} placeholder="1"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                    </div>
                  )}

                  {/* Cover image */}
                  {articleType !== 'video' && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleCoverImageLabel')}</p>
                      <ImagePicker value={coverImageUrl} onChange={url => { setCoverImageUrl(url); mark(); }} tenantId={blogId} ratio="16/9" />
                    </div>
                  )}

                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleCategoryLabel')}</label>
                    <select value={categoryId} onChange={e => { setCategoryId(e.target.value); mark(); }}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="">{ts('articleNoCategory')}</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* ── SEO tab ── */}
              {sidebarTab === 'seo' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Meta Title</label>
                    <input value={seoTitle} onChange={e => { setSeoTitle(e.target.value); mark(); }} placeholder="SEO title (60 chars max)"
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <p className="mt-1 text-[10px] text-slate-400">{seoTitle.length}/60</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Meta Description</label>
                    <textarea value={seoDesc} onChange={e => { setSeoDesc(e.target.value); mark(); }} placeholder="Brief description (160 chars max)" rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    <p className="mt-1 text-[10px] text-slate-400">{seoDesc.length}/160</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{te('canonicalUrl')}</label>
                    <input value={canonicalUrl} onChange={e => { setCanonicalUrl(e.target.value); mark(); }} placeholder="https://..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" />
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={robotsNoindex} onChange={e => { setRobotsNoindex(e.target.checked); mark(); }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-[12px] text-slate-600 dark:text-slate-300">{te('robotsNoindex')}</span>
                  </label>
                </>
              )}

              {/* ── Workflow tab ── */}
              {sidebarTab === 'workflow' && (
                <div className="space-y-4">
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Statut</span>
                    {article && (
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLORS[article.status] ?? STATUS_COLORS.draft}`}>
                        {statusLabel}
                      </span>
                    )}
                  </div>

                  {article?.status === 'draft' && (
                    <button onClick={() => submitReviewMut.mutate()} disabled={isPending}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-[12px] font-bold hover:bg-amber-100 transition-colors disabled:opacity-50">
                      <Send className="h-4 w-4" /> {te('submitReview')}
                    </button>
                  )}
                  {article?.status === 'in_review' && (
                    <>
                      <button onClick={() => approveMut.mutate()} disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold transition-colors disabled:opacity-50">
                        <ThumbsUp className="h-4 w-4" /> {te('approveArticle')}
                      </button>
                      <button onClick={() => setShowRejectBox(v => !v)} disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-red-300 bg-red-50 text-red-700 text-[12px] font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                        <ThumbsDown className="h-4 w-4" /> {te('rejectArticle')}
                      </button>
                      {showRejectBox && (
                        <div>
                          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={te('rejectionReasonPlaceholder')} rows={3}
                            className="w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-[12px] text-red-700 placeholder-red-300 focus:outline-none resize-none mb-2" />
                          <button onClick={() => rejectMut.mutate()} disabled={isPending}
                            className="w-full h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition-colors disabled:opacity-50">
                            Confirmer le rejet
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {(article?.status === 'draft' || article?.status === 'approved') && (
                    <button onClick={() => publishMut.mutate()} disabled={isPending}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-50">
                      {publishMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {ts('articlePublishAction')}
                    </button>
                  )}
                  {article?.status === 'published' && (
                    <button onClick={() => unpublishMut.mutate()} disabled={isPending}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
                      <EyeOff className="h-4 w-4" /> Dépublier
                    </button>
                  )}
                  {['published', 'unpublished', 'approved', 'rejected'].includes(article?.status ?? '') && (
                    <button onClick={() => archiveMut.mutate()} disabled={isPending}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
                      <Archive className="h-4 w-4" /> {ts('articleArchiveAction')}
                    </button>
                  )}

                  {/* Scheduled info */}
                  {article?.scheduled_at && (
                    <div className="flex items-center gap-2 text-[11px] text-blue-600 bg-blue-50 rounded-xl p-3">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Publication planifiée : {new Date(article.scheduled_at).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Save */}
                  <button onClick={() => saveMut.mutate()} disabled={isPending || !dirty}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40">
                    {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {ts('articleSave')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
