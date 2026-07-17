'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Link2, X, ImageIcon, Loader2, Check, Images } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { mediaApi, superadminApi } from '@/lib/api';

interface GalleryItem {
  id: string;
  cloudinary_secure_url: string;
  original_filename?: string | null;
  alt_text?: string | null;
}

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  /** Tenant propriétaire (upload tenant-scopé). Omis => mode "platform" (CMS
   * super admin, indépendant de tout tenant — voir /superadmin/media). */
  tenantId?: string;
  ratio?: '16/9' | '1/1' | '3/2';
}

type Tab = 'file' | 'url' | 'gallery';

export function ImagePicker({ value, onChange, tenantId, ratio = '16/9' }: ImagePickerProps) {
  const t = useTranslations('studio');
  const isPlatform = !tenantId;
  const [tab, setTab] = useState<Tab>('file');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab !== 'gallery') return;
    setGalleryLoading(true);
    const req = isPlatform
      ? superadminApi.listPlatformMedia(60)
      : mediaApi.list(tenantId!, { type: 'image', limit: 60 });
    req
      .then(({ data }) => setGallery(data))
      .catch(() => setGallery([]))
      .finally(() => setGalleryLoading(false));
  }, [tab, tenantId, isPlatform]);

  const paddingPct = ratio === '1/1' ? '100%' : ratio === '3/2' ? '66.67%' : '56.25%';

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError(t('imageInvalidFile'));
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const { data } = isPlatform
        ? await superadminApi.uploadPlatformMedia(file)
        : await mediaApi.upload(tenantId!, file);
      onChange(data.cloudinary_secure_url);
      setPreviewError(false);
    } catch {
      setUploadError(t('imageUploadError'));
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  function handleUrlConfirm() {
    const url = urlInput.trim();
    if (url) {
      onChange(url);
      setUrlInput('');
      setPreviewError(false);
    }
  }

  function clearImage() {
    onChange('');
    setPreviewError(false);
    setUploadError('');
  }

  if (value && !previewError) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group" style={{ paddingBottom: paddingPct }}>
          <img
            src={value}
            alt={t('imagePreviewAlt')}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setPreviewError(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-8 px-3 rounded-lg bg-white text-[11px] font-bold text-slate-800 flex items-center gap-1.5 hover:bg-slate-100 transition-colors shadow"
            >
              <Upload className="h-3.5 w-3.5" /> {t('imageChange')}
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="sr-only" />
        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">{value}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Tabs */}
      <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold transition-colors ${
            tab === 'file' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Upload className="h-3 w-3" /> {t('imageFromComputer')}
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold transition-colors border-l border-slate-200 dark:border-slate-700 ${
            tab === 'url' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Link2 className="h-3 w-3" /> {t('imageDirectUrl')}
        </button>
        <button
          type="button"
          onClick={() => setTab('gallery')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold transition-colors border-l border-slate-200 dark:border-slate-700 ${
            tab === 'gallery' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Images className="h-3 w-3" /> {t('imageGallery')}
        </button>
      </div>

      {/* File tab */}
      {tab === 'file' && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="sr-only" />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-xl transition-all ${
              dragging
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
            }`}
            style={{ paddingBottom: paddingPct, position: 'relative' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('articleUploading')}</span>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                      {dragging ? t('imageDropHere') : t('imageClickOrDrag')}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t('imageFormats')}</p>
                  </div>
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleUrlConfirm(); }}
              placeholder="https://exemple.com/image.jpg"
              className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono"
            />
            <button
              type="button"
              onClick={handleUrlConfirm}
              disabled={!urlInput.trim()}
              className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <Check className="h-3.5 w-3.5" /> OK
            </button>
          </div>
        </div>
      )}

      {/* Gallery tab */}
      {tab === 'gallery' && (
        <div>
          {galleryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            </div>
          ) : gallery.length === 0 ? (
            <p className="text-[12px] text-slate-400 dark:text-slate-500 text-center py-8">{t('imageGalleryEmpty')}</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {gallery.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item.cloudinary_secure_url); setPreviewError(false); }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
                  title={item.original_filename}
                >
                  <img src={item.cloudinary_secure_url} alt={item.alt_text ?? ''} className="absolute inset-0 w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">{uploadError}</p>
      )}
    </div>
  );
}
