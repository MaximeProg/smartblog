'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, ImageIcon, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { mediaApi } from '@/lib/api';
import type { MediaItem } from '@/types';

// ── Props ──────────────────────────────────────────────────────────────────────

interface MediaPickerModalProps {
  blogId: string;
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
  currentUrl?: string;
}

// ── Skeleton grid ──────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse"
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MediaPickerModal({
  blogId,
  onSelect,
  trigger,
  currentUrl,
}: MediaPickerModalProps) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media', blogId, 'image'],
    queryFn: () =>
      mediaApi.list(blogId, { type: 'image', limit: 48 }).then((r) => r.data),
    enabled: open && !!blogId,
  });

  const items: MediaItem[] = data?.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => mediaApi.upload(blogId, file).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', blogId, 'image'] });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    // reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleSelect(item: MediaItem) {
    onSelect(item.cloudinary_secure_url);
    setOpen(false);
  }

  // ── Default trigger ──────────────────────────────────────────────────────────

  const defaultTrigger = currentUrl ? (
    <button
      type="button"
      className="group relative w-full rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video border border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentUrl}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs font-medium">Edit</span>
      </span>
    </button>
  ) : (
    <button
      type="button"
      className="w-full flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 py-6 text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Upload className="h-5 w-5" />
      <span className="text-xs font-medium">Select image</span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      <DialogContent className="max-w-2xl w-full">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Media Library</DialogTitle>
            <button
              type="button"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploadMutation.isPending ? 'Uploading…' : 'Upload new'}
            </button>
          </div>
        </DialogHeader>

        <div className="mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <SkeletonGrid />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500">
              <ImageIcon className="h-10 w-10 opacity-40" />
              <p className="text-sm">No images yet. Upload one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => {
                const isSelected = item.cloudinary_secure_url === currentUrl;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="group relative aspect-square rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-blue-500 focus-visible:border-blue-500 focus-visible:outline-none transition-all"
                    style={
                      isSelected
                        ? { borderColor: 'rgb(59 130 246)' }
                        : undefined
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cloudinary_secure_url}
                      alt={item.alt_text ?? item.original_filename}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 px-1">
                      <span className="text-white text-[11px] font-medium text-center leading-tight line-clamp-2">
                        {item.original_filename}
                      </span>
                      {item.width && item.height && (
                        <span className="text-white/70 text-[10px]">
                          {item.width}&times;{item.height}
                        </span>
                      )}
                    </span>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <span className="absolute top-1 right-1 rounded-full bg-blue-500 p-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
