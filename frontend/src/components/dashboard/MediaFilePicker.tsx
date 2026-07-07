'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Upload, Link2, X, Loader2, Check, Grid3X3,
  Video, Mic, Play, Music,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { mediaApi } from '@/lib/api';
import type { MediaType } from '@/types';

interface MediaFilePickerProps {
  value: string;
  onChange: (url: string) => void;
  tenantId: string;
  mediaType: 'video' | 'audio';
}

type Tab = 'gallery' | 'upload' | 'url';

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaFilePicker({
  value,
  onChange,
  tenantId,
  mediaType,
}: MediaFilePickerProps) {
  const ts = useTranslations('studio');
  const [tab, setTab] = useState<Tab>('gallery');
  const [urlInput, setUrlInput] = useState(value.startsWith('http') && !isUploadedUrl(value) ? value : '');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const accept = mediaType === 'video'
    ? 'video/mp4,video/webm,video/quicktime,video/avi'
    : 'audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp3';

  const mimePrefix = mediaType === 'video' ? 'video/' : 'audio/';

  const { data: mediaItems = [], isLoading: loadingGallery } = useQuery({
    queryKey: ['media', tenantId, mediaType],
    queryFn: async () => {
      const { data } = await mediaApi.list(tenantId, { type: mediaType, limit: 30 });
      return data ?? [];
    },
  });

  async function upload(file: File) {
    if (!file.type.startsWith(mimePrefix) && file.type !== '') {
      setUploadError(mediaType === 'video' ? 'Format vidéo non supporté (MP4, WebM, MOV)' : 'Format audio non supporté (MP3, WAV, OGG, AAC)');
      return;
    }
    setUploading(true);
    setUploadPct(0);
    setUploadError('');
    try {
      const { data } = await mediaApi.upload(tenantId, file, setUploadPct);
      onChange(data.cloudinary_secure_url);
    } catch (err: any) {
      const msg = err?.code === 'ECONNABORTED'
        ? 'Délai dépassé. Essaie avec une connexion plus rapide ou un fichier plus petit.'
        : 'Erreur lors de l\'upload. Réessaie.';
      setUploadError(msg);
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  }

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }, [tenantId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }, [tenantId]);

  function handleUrlConfirm() {
    const url = urlInput.trim();
    if (url) { onChange(url); }
  }

  const Icon = mediaType === 'video' ? Video : Mic;
  const PreviewIcon = mediaType === 'video' ? Play : Music;

  const tabs: { id: Tab; label: string; icon: typeof Upload }[] = [
    { id: 'gallery', label: 'Galerie', icon: Grid3X3 },
    { id: 'upload',  label: 'Upload',  icon: Upload },
    { id: 'url',     label: 'URL',     icon: Link2 },
  ];

  const videoEmbed = useMemo(() => {
    if (!value || mediaType !== 'video') return null;
    const yt = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return { kind: 'yt' as const, src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
    const vm = value.match(/vimeo\.com\/(\d+)/);
    if (vm) return { kind: 'vm' as const, src: `https://player.vimeo.com/video/${vm[1]}` };
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(value)) return { kind: 'direct' as const, src: value };
    return null;
  }, [value, mediaType]);

  return (
    <div className="space-y-3">
      {/* Live video preview */}
      {videoEmbed && (
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          {videoEmbed.kind === 'direct' ? (
            <video src={videoEmbed.src} controls playsInline className="absolute inset-0 w-full h-full" />
          ) : (
            <iframe
              src={videoEmbed.src}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              title="Preview"
            />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/60 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Live audio preview */}
      {value && mediaType === 'audio' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate flex-1 mr-2">{value.split('/').pop()}</p>
            <button
              type="button"
              onClick={() => onChange('')}
              className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <audio controls className="w-full h-8" src={value} />
        </div>
      )}

      {/* Fallback URL bar for unrecognized video URLs */}
      {value && mediaType === 'video' && !videoEmbed && (
        <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <PreviewIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="flex-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate min-w-0">{value}</p>
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {tabs.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 h-7 text-[11px] font-semibold rounded-lg transition-all ${
              tab === id
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <TabIcon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Gallery tab */}
      {tab === 'gallery' && (
        <div>
          {loadingGallery ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icon className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Aucun fichier {mediaType === 'video' ? 'vidéo' : 'audio'}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Utilise "Upload" pour en ajouter un</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {mediaItems.map(item => {
                const isSelected = value === item.cloudinary_secure_url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange(item.cloudinary_secure_url)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {mediaType === 'video'
                        ? <Play className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        : <Music className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate leading-tight">
                        {item.original_filename}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        {formatSize(item.file_size_bytes)}
                        {(item as any).duration_seconds && ` · ${formatDuration((item as any).duration_seconds)}`}
                      </p>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div>
          <input ref={fileRef} type="file" accept={accept} onChange={handleFileInput} className="sr-only" />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
              dragging
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 w-full px-4">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {uploadPct > 0 ? `Envoi… ${uploadPct}%` : 'Connexion…'}
                </span>
                {uploadPct > 0 && (
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    {dragging ? 'Dépose ici' : 'Clique ou glisse-dépose'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {mediaType === 'video' ? 'MP4, WebM, MOV — max 100 MB' : 'MP3, WAV, OGG, AAC — max 50 MB'}
                  </p>
                </div>
              </>
            )}
          </button>
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleUrlConfirm(); }}
            placeholder={mediaType === 'video'
              ? 'https://youtube.com/watch?v=… ou https://…/video.mp4'
              : 'https://…/audio.mp3 ou https://soundcloud.com/…'
            }
            className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono"
          />
          <button
            type="button"
            onClick={handleUrlConfirm}
            disabled={!urlInput.trim()}
            className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Utiliser cette URL
          </button>
          {mediaType === 'video' && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">YouTube et Vimeo sont automatiquement convertis en embed.</p>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">{uploadError}</p>
      )}
    </div>
  );
}

function isUploadedUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary');
}
