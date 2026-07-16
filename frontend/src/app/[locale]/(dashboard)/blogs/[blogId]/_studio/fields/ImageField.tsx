'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, X, Image } from 'lucide-react';
import { useParams } from 'next/navigation';
import { mediaApi } from '@/lib/api';
import type { FieldDef } from '@/templates/types';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function ImageField({ field, value, onChange }: Props) {
  const params = useParams();
  const blogId = params.blogId as string;
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = (value as string) ?? '';

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { data } = await mediaApi.upload(blogId, file);
      onChange(data.cloudinary_secure_url);
    } catch {
      // silently ignore upload errors — user can retry
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      {url ? (
        <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <img
            src={url}
            alt=""
            className={`w-full object-cover ${field.ratio === '1/1' ? 'h-20' : 'h-28'}`}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-800 rounded-md hover:bg-slate-100 transition"
            >
              Changer
            </button>
            <button
              onClick={() => onChange('')}
              className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-20 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
        >
          {uploading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Image className="h-4 w-4" />
          }
          <span className="text-[11px] font-medium">
            {uploading ? 'Upload en cours…' : 'Ajouter une image'}
          </span>
        </button>
      )}

      <input
        type="text"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full text-[11px] px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
      />
    </div>
  );
}
