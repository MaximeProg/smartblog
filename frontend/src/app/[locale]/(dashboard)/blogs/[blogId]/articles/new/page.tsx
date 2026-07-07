'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Send, Loader2, FileText, Camera, Video, Mic, Radio, Layers } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { articlesApi, categoriesApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useStudioPreview } from '@/contexts/studio-preview';
import { ImagePicker } from '@/components/dashboard/ImagePicker';
import { MediaFilePicker } from '@/components/dashboard/MediaFilePicker';
import dynamic from 'next/dynamic';
const RichEditor = dynamic(() => import('@/components/editor/RichEditor').then(m => m.RichEditor), { ssr: false });
import type { ArticleType } from '@/types';

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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: async () => { const { data } = await categoriesApi.list(blogId); return data; },
  });

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleEditorChange = useCallback((html: string, json: Record<string, unknown>) => {
    setContent(html);
    setContentJson(json);
  }, []);

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
    onError: () => toast({ variant: 'destructive', title: ts('articleCreateError') }),
  });

  const canSave = title.trim().length >= 2 && !mutation.isPending;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Top bar ── */}
      <div className="shrink-0 h-14 border-b border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-6 gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/blogs/${blogId}/articles`} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Articles
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Nouvel article</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => { setPublish(false); mutation.mutate(); }} disabled={!canSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40">
            {mutation.isPending && !publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {ts('articleSave')}
          </button>
          <button onClick={() => { setPublish(true); mutation.mutate(); }} disabled={!canSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-60 shadow-sm">
            {mutation.isPending && publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {ts('articlePublishAction')}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Main editor */}
        <div className="flex-1 overflow-y-auto px-10 py-8 min-w-0">

          {/* Title */}
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder={ts('articleTitlePlaceholder')}
            className="w-full text-[32px] font-black text-slate-900 dark:text-slate-100 bg-transparent border-0 outline-none placeholder-slate-200 dark:placeholder-slate-700 mb-2 leading-tight"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[11px] text-slate-400">Slug :</span>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
              placeholder="mon-article"
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
              content=""
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
            <button onClick={() => { setPublish(true); mutation.mutate(); }} disabled={!canSave}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50 shadow-sm">
              {mutation.isPending && publish ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {ts('articlePublishAction')}
            </button>
            <button onClick={() => { setPublish(false); mutation.mutate(); }} disabled={!canSave}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40">
              {mutation.isPending && !publish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {ts('articleSave')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
