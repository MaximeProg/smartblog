'use client';

import { useRef, useState } from 'react';
import { Upload, Link2, X, ImageIcon, Loader2, Check } from 'lucide-react';
import { mediaApi } from '@/lib/api';

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  tenantId: string;
  /** Ratio de l'aperçu — '16/9' | '1/1' | '3/2' */
  ratio?: '16/9' | '1/1' | '3/2';
}

type Tab = 'file' | 'url';

export function ImagePicker({ value, onChange, tenantId, ratio = '16/9' }: ImagePickerProps) {
  const [tab, setTab] = useState<Tab>('file');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const paddingPct = ratio === '1/1' ? '100%' : ratio === '3/2' ? '66.67%' : '56.25%';

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError('Fichier invalide. Sélectionnez une image (JPG, PNG, WebP…)');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const { data } = await mediaApi.upload(tenantId, file);
      onChange(data.cloudinary_secure_url);
      setPreviewError(false);
    } catch {
      setUploadError('Erreur lors de l\'upload. Vérifiez votre connexion et réessayez.');
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

  // ── Preview mode (image already set) ──────────────────────────────────────
  if (value && !previewError) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group" style={{ paddingBottom: paddingPct }}>
          <img
            src={value}
            alt="Aperçu"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setPreviewError(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-8 px-3 rounded-lg bg-white text-[11px] font-bold text-slate-800 flex items-center gap-1.5 hover:bg-slate-100 transition-colors shadow"
            >
              <Upload className="h-3.5 w-3.5" /> Changer
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
        <p className="text-[10px] text-slate-400 truncate font-mono">{value}</p>
      </div>
    );
  }

  // ── Upload / URL mode ──────────────────────────────────────────────────────
  return (
    <div className="space-y-2.5">
      {/* Tabs */}
      <div className="flex border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold transition-colors ${
            tab === 'file' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Upload className="h-3 w-3" /> Depuis l'ordinateur
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold transition-colors border-l border-slate-200 ${
            tab === 'url' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Link2 className="h-3 w-3" /> URL directe
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
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white'
            }`}
            style={{ paddingBottom: paddingPct, position: 'relative' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
                  <span className="text-[11px] text-slate-500 font-medium">Upload en cours…</span>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-slate-700">
                      {dragging ? 'Déposez ici' : 'Cliquez ou glissez une image'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP, GIF • max 10 Mo</p>
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
              className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono"
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

      {/* Error */}
      {uploadError && (
        <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{uploadError}</p>
      )}
    </div>
  );
}
