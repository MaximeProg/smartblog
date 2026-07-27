'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Save, Send, Loader2, FileText, Camera, Video,
  Mic, Radio, Layers, Sparkles, X as XIcon, Lock,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { articlesApi, categoriesApi, aiApi } from '@/lib/api';
import type { AiGeneratedArticle } from '@/lib/api';
import { slugify, getErrorMessage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useStudioPreview } from '@/contexts/studio-preview';
import { ImagePicker } from '@/components/dashboard/ImagePicker';
import { MediaFilePicker } from '@/components/dashboard/MediaFilePicker';
import dynamic from 'next/dynamic';
const RichEditor = dynamic(() => import('@/components/editor/RichEditor').then(m => m.RichEditor), { ssr: false });
import type { ArticleType } from '@/types';

const TONES = [
  { value: 'professional', labelKey: 'toneProfessional2' },
  { value: 'casual',       labelKey: 'toneCasual' },
  { value: 'educational',  labelKey: 'toneEducational2' },
  { value: 'persuasive',   labelKey: 'tonePersuasive' },
  { value: 'informative',  labelKey: 'toneInformative' },
] as const;

const LANGUAGES = [
  { value: 'fr', labelKey: 'langFrench' },
  { value: 'en', labelKey: 'langEnglish' },
  { value: 'es', labelKey: 'langSpanish' },
  { value: 'de', labelKey: 'langGerman' },
  { value: 'pt', labelKey: 'langPortuguese' },
] as const;

const WORD_COUNTS = [500, 800, 1200, 2000];

export default function NewArticlePage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const router  = useRouter();
  const { toast } = useToast();
  const { setFullWidth } = useStudioPreview();
  const ts = useTranslations('studio');
  const te = useTranslations('editor');

  useEffect(() => {
    setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth]);

  // ── Article fields ───────────────────────────────────────────────
  const [title,         setTitle]         = useState('');
  const [slug,          setSlug]          = useState('');
  const [slugManual,    setSlugManual]    = useState(false);
  const [content,       setContent]       = useState('');
  const [contentJson,   setContentJson]   = useState<Record<string, unknown> | undefined>();
  const [excerpt,       setExcerpt]       = useState('');
  const [categoryId,    setCategoryId]    = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [publish,       setPublish]       = useState(false);
  const [articleType,   setArticleType]   = useState<ArticleType>('article');
  const [videoUrl,      setVideoUrl]      = useState('');
  const [audioUrl,      setAudioUrl]      = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [season,        setSeason]        = useState('');

  // ── AI generation state ──────────────────────────────────────────
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt,    setAiPrompt]    = useState('');
  const [aiTone,      setAiTone]      = useState('professional');
  const [aiLang,      setAiLang]      = useState('fr');
  const [aiWords,     setAiWords]     = useState(800);
  const [aiLoading,   setAiLoading]   = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: async () => { const { data } = await categoriesApi.list(blogId); return data; },
  });

  const { data: aiUsage } = useQuery({
    queryKey: ['ai-usage', blogId],
    queryFn: async () => { const { data } = await aiApi.usage(blogId); return data; },
    staleTime: 5 * 60 * 1000,
  });
  const aiBlocked = aiUsage?.tokens_limit === 0;

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleEditorChange = useCallback((html: string, json: Record<string, unknown>) => {
    setContent(html);
    setContentJson(json);
  }, []);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await aiApi.generate(blogId, {
        prompt:       aiPrompt.trim(),
        tone:         aiTone,
        language:     aiLang,
        target_words: aiWords,
      });
      // Handle both direct dict and wrapped {result: "..."} formats
      const generated: AiGeneratedArticle =
        typeof (data as any).result === 'string'
          ? JSON.parse((data as any).result)
          : (data as unknown as AiGeneratedArticle);

      if (generated.title)   { setTitle(generated.title);   if (!slugManual) setSlug(slugify(generated.title)); }
      if (generated.excerpt) setExcerpt(generated.excerpt);
      if (generated.content) setContent(generated.content);
      setShowAiPanel(false);
      toast({ title: te('articleGeneratedToast') });
    } catch {
      toast({ variant: 'destructive', title: te('aiGenerationError') });
    } finally {
      setAiLoading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await articlesApi.create(blogId, {
        title:           title.trim(),
        slug:            slug.trim() || slugify(title),
        content,
        content_json:    contentJson,
        excerpt,
        category_id:     categoryId    || undefined,
        cover_image_url: coverImageUrl || undefined,
        article_type:    articleType,
        ...(videoUrl      ? { video_url:     videoUrl }                    : {}),
        ...(audioUrl      ? { audio_url:      audioUrl }                    : {}),
        ...(episodeNumber ? { episode_number: parseInt(episodeNumber, 10) } : {}),
        ...(season        ? { season:         parseInt(season, 10) }        : {}),
      });
      if (publish) await articlesApi.publish(blogId, data.id);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: publish ? ts('articlePublishedToast') : ts('articleSavedToast') });
      router.push(`/${locale}/blogs/${blogId}/articles/${data.id}/edit`);
    },
    onError: (err: any) => toast({ variant: 'destructive', title: ts('articleCreateError'), description: getErrorMessage(err, '') }),
  });

  const titleValid = title.trim().length >= 2;
  const canSave = titleValid && !mutation.isPending;

  const attemptSave = (shouldPublish: boolean) => {
    if (mutation.isPending) return;
    if (!titleValid) {
      toast({ variant: 'destructive', title: ts('titleRequiredToast') });
      return;
    }
    setPublish(shouldPublish);
    mutation.mutate();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Top bar ── */}
      <div className="shrink-0 h-14 border-b border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-6 gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/blogs/${blogId}/articles`} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> {te('articlesBreadcrumb')}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{te('newArticleBreadcrumb')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => attemptSave(false)} disabled={mutation.isPending}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors ${!canSave ? 'opacity-40' : ''}`}>
            {mutation.isPending && !publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {ts('articleSave')}
          </button>
          <button onClick={() => attemptSave(true)} disabled={mutation.isPending}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors shadow-sm ${!canSave ? 'opacity-60' : ''}`}>
            {mutation.isPending && publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {ts('articlePublishAction')}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Main editor */}
        <div className="flex-1 overflow-y-auto px-10 py-8 min-w-0">

          {/* ── AI Generation Panel ── */}
          {aiBlocked ? (
            <div className="mb-8 w-full flex items-center gap-3 px-4 h-11 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-slate-400 text-[13px]">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{te('generateWithAiBadge')}</span>
              <Link href={`/${locale}/subscription`} className="ml-auto text-[11px] font-bold text-blue-600 hover:underline whitespace-nowrap">
                {te('upgradeToStarterLink')}
              </Link>
            </div>
          ) : showAiPanel ? (
            <div className="mb-8 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-violet-600 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h3 className="text-[13px] font-bold text-violet-900 dark:text-violet-200">{te('generateArticleWithAiTitle')}</h3>
                </div>
                <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{te('articleSubjectLabel')}</label>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder={te('articleSubjectPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{te('toneLabel')}</label>
                    <select value={aiTone} onChange={e => setAiTone(e.target.value)}
                      className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                      {TONES.map(t => <option key={t.value} value={t.value}>{te(t.labelKey)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{te('aiLanguageLabel')}</label>
                    <select value={aiLang} onChange={e => setAiLang(e.target.value)}
                      className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                      {LANGUAGES.map(l => <option key={l.value} value={l.value}>{te(l.labelKey)}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{te('lengthLabel')}</label>
                  <div className="flex gap-1.5">
                    {WORD_COUNTS.map(n => (
                      <button key={n} type="button" onClick={() => setAiWords(n)}
                        className={`flex-1 h-8 rounded-xl text-[11px] font-bold border transition-all ${aiWords === n ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300 bg-white dark:bg-slate-800'}`}>
                        {te('wordsUnit', { n })}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt.trim() || aiLoading}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiLoading ? te('generatingInProgress') : te('generateArticleButton')}
                </button>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                  {te('reviewGeneratedContentHint')}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAiPanel(true)}
              className="mb-8 w-full flex items-center justify-center gap-2 h-11 rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all text-[13px] font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              {te('generateWithAiBadge')}
            </button>
          )}

          {/* Title */}
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            {ts('articleTitleLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder={ts('articleTitlePlaceholder')}
            className="w-full text-[32px] font-black text-slate-900 dark:text-slate-100 bg-transparent border-0 border-b-2 border-transparent focus:border-blue-200 dark:focus:border-blue-800 outline-none placeholder-slate-300 dark:placeholder-slate-600 mb-2 pb-1 leading-tight transition-colors"
          />
          {!titleValid && (
            <p className="text-[11.5px] text-amber-600 dark:text-amber-400 mb-2 -mt-1">{ts('articleTitleHint')}</p>
          )}

          {/* Slug */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[11px] text-slate-400">{te('slugLabel')}</span>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
              placeholder={te('slugPlaceholder')}
              className="flex-1 h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-mono text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700" />

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleExcerptLabel')}</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder={ts('articleExcerptPlaceholder')} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>

          {/* Rich editor */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleContentLabel')}</label>
            <RichEditor
              content={content}
              onChange={handleEditorChange}
              placeholder={te('placeholder')}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[280px] shrink-0 border-l border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto px-5 py-6 space-y-6">

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
                <button key={type} type="button" onClick={() => setArticleType(type as ArticleType)}
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
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{ts('articleFieldVideoUrl')}</label>
              <MediaFilePicker value={videoUrl} onChange={setVideoUrl} tenantId={blogId} mediaType="video" />
            </div>
          )}
          {(articleType === 'audio' || articleType === 'podcast') && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{ts('articleFieldAudioUrl')}</label>
              <MediaFilePicker value={audioUrl} onChange={setAudioUrl} tenantId={blogId} mediaType="audio" />
            </div>
          )}
          {articleType === 'podcast' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{te('episodeNumber')}</label>
                <input type="number" min="1" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} placeholder="1"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{te('season')}</label>
                <input type="number" min="1" value={season} onChange={e => setSeason(e.target.value)} placeholder="1"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] focus:outline-none" />
              </div>
            </div>
          )}

          {/* Cover image */}
          {articleType !== 'video' && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleCoverImageLabel')}</p>
              <ImagePicker value={coverImageUrl} onChange={setCoverImageUrl} tenantId={blogId} ratio="16/9" />
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ts('articleCategoryLabel')}</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">{ts('articleNoCategory')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button onClick={() => attemptSave(true)} disabled={mutation.isPending}
              className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors shadow-sm ${!canSave ? 'opacity-50' : ''}`}>
              {mutation.isPending && publish ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {ts('articlePublishAction')}
            </button>
            <button onClick={() => attemptSave(false)} disabled={mutation.isPending}
              className={`w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors ${!canSave ? 'opacity-40' : ''}`}>
              {mutation.isPending && !publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {ts('articleSave')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
