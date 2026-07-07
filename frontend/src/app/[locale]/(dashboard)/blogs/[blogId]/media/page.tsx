'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';
import {
  Upload, Search, X, Loader2, Check, Copy, ExternalLink,
  Image as ImageIcon, Video, Music, FileText, Trash2,
  Info, Grid3X3, List, File,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { mediaApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import type { MediaItem, MediaType } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_FILTERS = ['all', 'image', 'video', 'audio', 'document'] as const;
type FilterType = typeof TYPE_FILTERS[number];

function formatBytes(b?: number | null) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(s?: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function typeIcon(type: MediaType, cls = 'h-5 w-5') {
  if (type === 'video') return <Video className={cls} />;
  if (type === 'audio') return <Music className={cls} />;
  if (type === 'document') return <FileText className={cls} />;
  return <ImageIcon className={cls} />;
}

// ─── Media thumbnail ─────────────────────────────────────────────────────────

function MediaThumb({ item, active, onClick }: { item: MediaItem; active: boolean; onClick: () => void }) {
  const isImage = item.media_type === 'image';

  return (
    <button
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square bg-slate-100 dark:bg-slate-800
        ${active
          ? 'border-blue-500 shadow-md'
          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
        }`}
    >
      {isImage ? (
        <img
          src={item.cloudinary_secure_url}
          alt={item.alt_text ?? item.original_filename}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500">
          {typeIcon(item.media_type, 'h-8 w-8')}
          <span className="text-[10px] font-mono uppercase">{item.format ?? item.media_type}</span>
        </div>
      )}

      {active && (
        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Hover overlay with filename */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-white truncate">{item.original_filename}</p>
      </div>
    </button>
  );
}

// ─── Media list row ───────────────────────────────────────────────────────────

function MediaListRow({ item, active, onClick }: { item: MediaItem; active: boolean; onClick: () => void }) {
  const isImage = item.media_type === 'image';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left
        ${active
          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
        }`}
    >
      {/* Thumbnail */}
      <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
        {isImage
          ? <img src={item.cloudinary_secure_url} alt="" className="h-full w-full object-cover" />
          : typeIcon(item.media_type, 'h-5 w-5 text-slate-400')
        }
      </div>

      {/* Name + type */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">
          {item.original_filename}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {item.media_type} · {formatBytes(item.file_size_bytes)}
        </p>
      </div>

      {/* Date */}
      <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{formatDate(item.created_at)}</span>

      {active && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ item, blogId, onClose }: { item: MediaItem; blogId: string; onClose: () => void }) {
  const t = useTranslations('media');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [altText, setAltText] = useState(item.alt_text ?? '');
  const [caption, setCaption] = useState(item.caption ?? '');
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isImage = item.media_type === 'image';

  const updateMut = useMutation({
    mutationFn: () => mediaApi.update(blogId, item.id, { alt_text: altText, caption }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media', blogId] });
      toast({ title: t('metaSaved') });
    },
    onError: () => toast({ variant: 'destructive', title: 'Save failed' }),
  });

  const deleteMut = useMutation({
    mutationFn: () => mediaApi.delete(blogId, item.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media', blogId] });
      toast({ title: t('deleted') });
      onClose();
    },
    onError: () => toast({ variant: 'destructive', title: t('deleteError') }),
  });

  function copyUrl() {
    navigator.clipboard.writeText(item.cloudinary_secure_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          {t('details')}
        </span>
        <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preview */}
        <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center" style={{ minHeight: 160 }}>
          {isImage ? (
            <img src={item.cloudinary_secure_url} alt={item.alt_text ?? ''} className="max-w-full max-h-48 object-contain" />
          ) : item.media_type === 'video' ? (
            <video src={item.cloudinary_secure_url} controls className="max-w-full max-h-48" />
          ) : item.media_type === 'audio' ? (
            <audio src={item.cloudinary_secure_url} controls className="w-full" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <File className="h-12 w-12" />
              <span className="text-[12px] uppercase font-mono">{item.format ?? 'doc'}</span>
            </div>
          )}
        </div>

        {/* Filename */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('filename')}</p>
          <p className="text-[12px] text-slate-700 dark:text-slate-300 font-mono break-all">{item.original_filename}</p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('fileSize')}</p>
            <p className="text-[12px] text-slate-700 dark:text-slate-300">{formatBytes(item.file_size_bytes)}</p>
          </div>
          {item.format && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('format')}</p>
              <p className="text-[12px] text-slate-700 dark:text-slate-300 uppercase">{item.format}</p>
            </div>
          )}
          {item.width && item.height && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('dimensions')}</p>
              <p className="text-[12px] text-slate-700 dark:text-slate-300">{item.width} × {item.height}</p>
            </div>
          )}
          {formatDuration(item.duration_seconds) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('duration')}</p>
              <p className="text-[12px] text-slate-700 dark:text-slate-300">{formatDuration(item.duration_seconds)}</p>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{t('uploadDate')}</p>
            <p className="text-[12px] text-slate-700 dark:text-slate-300">{formatDate(item.created_at)}</p>
          </div>
        </div>

        {/* URL */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('url')}</p>
          <div className="flex items-center gap-1.5">
            <p className="flex-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-800 rounded px-2 py-1">
              {item.cloudinary_secure_url}
            </p>
            <button onClick={copyUrl} title={t('copyUrl')}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shrink-0">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a href={item.cloudinary_secure_url} target="_blank" rel="noopener noreferrer"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shrink-0">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Alt text */}
        {isImage && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('altText')}</label>
            <textarea
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder={t('altTextPlaceholder')}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('caption')}</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder={t('captionPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        {/* Save */}
        <button
          onClick={() => updateMut.mutate()}
          disabled={updateMut.isPending}
          className="w-full flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-50"
        >
          {updateMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {t('saveMetadata')}
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 space-y-2">
            <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">{t('confirmDelete')}</p>
            <p className="text-[11px] text-red-500 dark:text-red-400">{t('confirmDeleteDesc')}</p>
            <div className="flex gap-2">
              <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold disabled:opacity-50">
                {deleteMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {t('delete')}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {t('close')}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            {t('delete')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Upload zone ─────────────────────────────────────────────────────────────

function UploadZone({ blogId, onDone }: { blogId: string; onDone: () => void }) {
  const t = useTranslations('media');
  const { toast } = useToast();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState('');

  const ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/aac,application/pdf';

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    setPct(0);

    try {
      for (const file of Array.from(files)) {
        await mediaApi.upload(blogId, file, p => setPct(p));
      }
      qc.invalidateQueries({ queryKey: ['media', blogId] });
      toast({ title: t('upload') });
      onDone();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
      setPct(0);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [blogId]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all
        ${dragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-900/50'}`}
    >
      <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-[13px] font-semibold text-blue-600">{pct}%</p>
        </>
      ) : (
        <>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Upload className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t('uploadDragDrop')}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Images · Vidéos · Audio · PDF</p>
          </div>
        </>
      )}

      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const t = useTranslations('media');

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media', blogId, filter, search],
    queryFn: async () => {
      const { data } = await mediaApi.list(blogId, {
        type: filter === 'all' ? undefined : filter,
        q: search || undefined,
        limit: 100,
      });
      return data;
    },
  });

  const FILTER_ICONS: Record<FilterType, React.ReactNode> = {
    all: <File className="h-3.5 w-3.5" />,
    image: <ImageIcon className="h-3.5 w-3.5" />,
    video: <Video className="h-3.5 w-3.5" />,
    audio: <Music className="h-3.5 w-3.5" />,
    document: <FileText className="h-3.5 w-3.5" />,
  };

  const FILTER_LABELS: Record<FilterType, string> = {
    all: t('filterAll'),
    image: t('filterImages'),
    video: t('filterVideos'),
    audio: t('filterAudio'),
    document: t('filterDocuments'),
  };

  const uploadBtn = (
    <button
      onClick={() => setShowUpload(v => !v)}
      className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
    >
      <Upload className="h-4 w-4" />
      {t('upload')}
    </button>
  );

  return (
    <FullPageShell title={t('title')} description={`${items.length} ${t('filterAll').toLowerCase()}`} action={uploadBtn}>
      <div className={`flex h-full overflow-hidden`}>

        {/* Left: main panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Toolbar */}
          <div className="shrink-0 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold transition-all
                    ${filter === f ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {FILTER_ICONS[f]}
                  <span className="hidden sm:inline">{FILTER_LABELS[f]}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 bg-transparent text-[13px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
              />
              {search && <button onClick={() => setSearch('')}><X className="h-3.5 w-3.5 text-slate-400" /></button>}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
              <button onClick={() => setViewMode('grid')}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Upload zone */}
          {showUpload && (
            <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <UploadZone blogId={blogId} onDone={() => setShowUpload(false)} />
            </div>
          )}

          {/* Grid / list */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3' : 'space-y-2'}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`${viewMode === 'grid' ? 'aspect-square' : 'h-14'} bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse`} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                  {search ? t('noResults') : t('empty')}
                </p>
                {!search && (
                  <button onClick={() => setShowUpload(true)}
                    className="mt-4 flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors">
                    <Upload className="h-4 w-4" />
                    {t('uploadFirst')}
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {items.map(item => (
                  <MediaThumb
                    key={item.id}
                    item={item}
                    active={selected?.id === item.id}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <MediaListRow
                    key={item.id}
                    item={item}
                    active={selected?.id === item.id}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="w-72 shrink-0 overflow-y-auto">
            <DetailPanel
              item={selected}
              blogId={blogId}
              onClose={() => setSelected(null)}
            />
          </div>
        )}

        {/* Empty state when nothing selected */}
        {!selected && items.length > 0 && (
          <div className="w-72 shrink-0 flex items-center justify-center border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-center px-4">
              <Info className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-[12px] text-slate-400 dark:text-slate-500">{t('selectToSee')}</p>
            </div>
          </div>
        )}
      </div>
    </FullPageShell>
  );
}
