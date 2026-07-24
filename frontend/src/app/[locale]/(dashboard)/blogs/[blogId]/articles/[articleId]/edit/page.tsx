'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Save, Send, Archive, Loader2, CheckCircle2,
  Camera, Video, Mic, Radio, Layers, FileText,
  Eye, EyeOff, History, Monitor, Tablet, Smartphone,
  ThumbsUp, ThumbsDown, Clock, Headphones, Sparkles,
  Languages, CalendarClock, X as XIcon, Lock,
} from 'lucide-react';
import type { ArticleType, ArticleVersionResponse } from '@/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { articlesApi, categoriesApi, aiApi, articleScheduleApi } from '@/lib/api';
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
  const [ttsLoading,      setTtsLoading]      = useState(false);
  const [seoLoading,      setSeoLoading]      = useState(false);
  const [seoScore,        setSeoScore]        = useState<null | { score: number; suggestions: string[] }>(null);
  const [translateLang,   setTranslateLang]   = useState('en');
  const [translateLoading,setTranslateLoading]= useState(false);
  const [showSchedule,    setShowSchedule]    = useState(false);
  const [scheduleDate,    setScheduleDate]    = useState('');
  const [improveInstruction, setImproveInstruction] = useState('');
  const [improveLoading,     setImproveLoading]     = useState(false);
  const [summarizeLoading,   setSummarizeLoading]   = useState(false);
  const [coverPrompt,        setCoverPrompt]        = useState('');
  const [coverLoading,       setCoverLoading]       = useState(false);

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

  const { data: aiUsage } = useQuery({
    queryKey: ['ai-usage', blogId],
    queryFn: async () => { const { data } = await aiApi.usage(blogId); return data; },
    staleTime: 5 * 60 * 1000,
  });
  const aiBlocked = aiUsage?.tokens_limit === 0;

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['article', blogId, articleId] }); toast({ title: te('unpublishedToast') }); },
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

  const scheduleMut = useMutation({
    mutationFn: () => articleScheduleApi.schedule(blogId, articleId, scheduleDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      setShowSchedule(false);
      toast({ title: te('scheduledToast') });
    },
    onError: () => toast({ variant: 'destructive', title: te('scheduleError') }),
  });

  const cancelScheduleMut = useMutation({
    mutationFn: () => articleScheduleApi.cancelSchedule(blogId, articleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['article', blogId, articleId] }); toast({ title: te('scheduleCancelledToast') }); },
    onError: () => toast({ variant: 'destructive', title: te('genericError') }),
  });

  const handleSeoScore = useCallback(async () => {
    if (!title || !content) return;
    setSeoLoading(true);
    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const { data } = await aiApi.seo(blogId, { title, content: plainText.slice(0, 3000), keywords: seoTitle });
      setSeoScore({ score: data.score, suggestions: data.suggestions });
      if (data.seo_title && !seoTitle) { setSeoTitle(data.seo_title); mark(); }
      if (data.seo_description && !seoDesc) { setSeoDesc(data.seo_description); mark(); }
      toast({ title: te('seoScoreToast', { score: data.score }) });
    } catch {
      toast({ variant: 'destructive', title: te('seoAiError') });
    } finally {
      setSeoLoading(false);
    }
  }, [blogId, title, content, seoTitle, seoDesc, mark, toast]);

  const handleTranslate = useCallback(async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText) return;
    setTranslateLoading(true);
    try {
      const { data } = await aiApi.translate(blogId, { text: plainText.slice(0, 5000), target_lang: translateLang });
      setContent(data.result);
      mark();
      toast({ title: te('translationAppliedToast') });
    } catch {
      toast({ variant: 'destructive', title: te('translationError') });
    } finally {
      setTranslateLoading(false);
    }
  }, [blogId, content, translateLang, mark, toast]);

  const handleImprove = useCallback(async () => {
    if (!content) return;
    setImproveLoading(true);
    try {
      const { data } = await aiApi.improve(blogId, {
        content:     content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000),
        instruction: improveInstruction.trim() || undefined,
      });
      setContent(data.content);
      mark();
      toast({ title: te('contentImprovedToast') });
    } catch {
      toast({ variant: 'destructive', title: te('improveError') });
    } finally {
      setImproveLoading(false);
    }
  }, [blogId, content, improveInstruction, mark, toast]);

  const handleSummarize = useCallback(async () => {
    if (!content) return;
    setSummarizeLoading(true);
    try {
      const { data } = await aiApi.summarize(blogId, {
        content: content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000),
        max_chars: 200,
      });
      setExcerpt(data.excerpt);
      mark();
      toast({ title: te('excerptGeneratedToast') });
    } catch {
      toast({ variant: 'destructive', title: te('excerptError') });
    } finally {
      setSummarizeLoading(false);
    }
  }, [blogId, content, mark, toast]);

  const handleGenerateCover = useCallback(async () => {
    if (!coverPrompt.trim()) return;
    setCoverLoading(true);
    try {
      const { data } = await aiApi.cover(blogId, { prompt: coverPrompt.trim() });
      setCoverImageUrl(data.image_url);
      mark();
      toast({ title: te('coverGeneratedToast') });
    } catch {
      toast({ variant: 'destructive', title: te('coverError') });
    } finally {
      setCoverLoading(false);
    }
  }, [blogId, coverPrompt, mark, toast]);

  const handleGenerateTts = useCallback(async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText) return;
    setTtsLoading(true);
    try {
      const { data } = await aiApi.tts(blogId, { text: plainText.slice(0, 5000), article_id: articleId });
      setAudioUrl(data.audio_url);
      mark();
      toast({ title: te('ttsGenerated') });
    } catch {
      toast({ variant: 'destructive', title: te('ttsError') });
    } finally {
      setTtsLoading(false);
    }
  }, [content, blogId, articleId, mark, toast, te]);

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
              <ArrowLeft className="h-3.5 w-3.5" /> {te('articlesBreadcrumb')}
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
                <EyeOff className="h-3.5 w-3.5" /> {te('unpublishButton')}
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{ts('articleExcerptLabel')}</label>
              <button
                type="button"
                onClick={handleSummarize}
                disabled={summarizeLoading || !content || aiBlocked}
                title={aiBlocked ? te('planStarterRequired') : te('generateExcerptTitle')}
                className="flex items-center gap-1 h-6 px-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-40"
              >
                {summarizeLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : aiBlocked ? <Lock className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                {aiBlocked ? te('planRequiredShort') : te('generateButton')}
              </button>
            </div>
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
              <p className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-1">{te('statusRejected')}</p>
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
                  {tab === 'meta' ? te('tabContent') : tab === 'seo' ? te('seo') : te('tabWorkflow')}
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

                  {/* TTS — générer audio depuis le contenu (tous types d'articles) */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{te('ttsLabel')}</p>
                    {audioUrl && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {te('ttsReady')}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateTts}
                      disabled={ttsLoading || !content || aiBlocked}
                      title={aiBlocked ? te('planStarterRequired') : undefined}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40"
                    >
                      {ttsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : aiBlocked ? <Lock className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
                      {ttsLoading ? te('ttsGenerating') : aiBlocked ? te('planStarterRequiredShort') : te('ttsGenerate')}
                    </button>
                  </div>

                  {/* Améliorer le contenu */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{te('improveContentTitle')}</p>
                    {aiBlocked ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[12px]">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>{te('planStarterRequired')}</span>
                      </div>
                    ) : (
                      <>
                        <input
                          value={improveInstruction}
                          onChange={e => setImproveInstruction(e.target.value)}
                          placeholder={te('improveInstructionPlaceholder')}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 mb-2"
                        />
                        <button
                          type="button"
                          onClick={handleImprove}
                          disabled={improveLoading || !content}
                          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-[12px] font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-40"
                        >
                          {improveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          {improveLoading ? te('improvingButton') : te('improveWithAiButton')}
                        </button>
                      </>
                    )}
                  </div>
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
                      {/* DALL-E 3 cover generation */}
                      <div className="flex gap-1.5 mb-2">
                        <input
                          value={coverPrompt}
                          onChange={e => setCoverPrompt(e.target.value)}
                          disabled={aiBlocked}
                          placeholder={aiBlocked ? te('planStarterRequiredShort') : te('generateImagePlaceholder')}
                          className="flex-1 h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateCover}
                          disabled={coverLoading || !coverPrompt.trim() || aiBlocked}
                          title={aiBlocked ? te('planStarterRequired') : te('generateWithDalleTitle')}
                          className="h-8 w-8 shrink-0 rounded-xl border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors flex items-center justify-center disabled:opacity-40"
                        >
                          {coverLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : aiBlocked ? <Lock className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                        </button>
                      </div>
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
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{te('seoMetaTitle')}</label>
                    <input value={seoTitle} onChange={e => { setSeoTitle(e.target.value); mark(); }} placeholder={te('seoMetaTitlePlaceholder')}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <p className="mt-1 text-[10px] text-slate-400">{seoTitle.length}/60</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{te('seoMetaDescription')}</label>
                    <textarea value={seoDesc} onChange={e => { setSeoDesc(e.target.value); mark(); }} placeholder={te('seoMetaDescriptionPlaceholder')} rows={3}
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

                  {/* SEO AI Score */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{te('aiSeoAnalysisTitle')}</p>
                    {seoScore && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{te('scoreLabel')}</span>
                          <span className={`text-[13px] font-black ${seoScore.score >= 70 ? 'text-emerald-600' : seoScore.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                            {seoScore.score}/100
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${seoScore.score >= 70 ? 'bg-emerald-500' : seoScore.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${seoScore.score}%` }} />
                        </div>
                        {seoScore.suggestions.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {seoScore.suggestions.slice(0, 3).map((s, i) => (
                              <li key={i} className="text-[10px] text-slate-500 flex gap-1.5">
                                <span className="text-amber-500 shrink-0">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <button onClick={handleSeoScore} disabled={seoLoading || !title || !content || aiBlocked}
                      title={aiBlocked ? te('planStarterRequired') : undefined}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40">
                      {seoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : aiBlocked ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {seoLoading ? te('analyzingButton') : aiBlocked ? te('planStarterRequiredShort') : te('analyzeWithAiButton')}
                    </button>
                  </div>

                  {/* Translation */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{te('deeplTranslationTitle')}</p>
                    <div className="flex gap-2">
                      <select value={translateLang} onChange={e => setTranslateLang(e.target.value)}
                        className="flex-1 h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none">
                        <option value="en">{te('langEnglish')}</option>
                        <option value="fr">{te('langFrench')}</option>
                        <option value="es">{te('langSpanish')}</option>
                        <option value="de">{te('langGerman')}</option>
                        <option value="pt">{te('langPortuguese')}</option>
                        <option value="it">{te('langItalian')}</option>
                        <option value="zh">{te('langChinese')}</option>
                        <option value="ar">{te('langArabic')}</option>
                      </select>
                      <button onClick={handleTranslate} disabled={translateLoading || !content || aiBlocked}
                        title={aiBlocked ? te('planStarterRequired') : undefined}
                        className="flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40">
                        {translateLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : aiBlocked ? <Lock className="h-3.5 w-3.5" /> : <Languages className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{te('translationHint')}</p>
                  </div>
                </>
              )}

              {/* ── Workflow tab ── */}
              {sidebarTab === 'workflow' && (
                <div className="space-y-4">
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">{te('statusLabel')}</span>
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
                            {te('confirmRejectButton')}
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
                      <EyeOff className="h-4 w-4" /> {te('unpublishButton')}
                    </button>
                  )}
                  {['published', 'unpublished', 'approved', 'rejected'].includes(article?.status ?? '') && (
                    <button onClick={() => archiveMut.mutate()} disabled={isPending}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
                      <Archive className="h-4 w-4" /> {ts('articleArchiveAction')}
                    </button>
                  )}

                  {/* Scheduled info / Programming */}
                  {article?.scheduled_at ? (
                    <div className="flex items-start gap-2 text-[11px] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3">
                      <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-blue-700 dark:text-blue-400 font-semibold block">{te('scheduledPublicationLabel')}</span>
                        <span className="text-blue-600 dark:text-blue-300">{new Date(article.scheduled_at).toLocaleString(locale)}</span>
                      </div>
                      <button onClick={() => cancelScheduleMut.mutate()} disabled={cancelScheduleMut.isPending}
                        className="shrink-0 text-blue-400 hover:text-red-500 transition-colors">
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {(article?.status === 'draft' || article?.status === 'approved') && (
                        <>
                          <button onClick={() => setShowSchedule(v => !v)}
                            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[12px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <CalendarClock className="h-4 w-4" /> {te('schedulePublicationButton')}
                          </button>
                          {showSchedule && (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 space-y-2">
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{te('dateTimeLabel')}</label>
                              <input
                                type="datetime-local"
                                value={scheduleDate}
                                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                                onChange={e => setScheduleDate(e.target.value)}
                                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                              <button onClick={() => scheduleMut.mutate()} disabled={!scheduleDate || scheduleMut.isPending}
                                className="w-full h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-40">
                                {scheduleMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : te('confirmButton')}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
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
