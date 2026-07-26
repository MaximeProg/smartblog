'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Tag, Trash2, Check, X, ChevronDown, ImageIcon, Edit2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { categoriesApi } from '@/lib/api';
import { slugify, getErrorMessage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { ImagePicker } from '@/components/dashboard/ImagePicker';
import type { CategoryInfo } from '@/types';

const CATEGORY_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#16a34a', '#0891b2', '#334155',
];

// ─── New-category form ────────────────────────────────────────────────────────

function NewCategoryForm({ blogId, onDone }: { blogId: string; onDone: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const createMut = useMutation({
    mutationFn: () => categoriesApi.create(blogId, {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      color,
      cover_image_url: coverImageUrl || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', blogId] });
      toast({ title: ts('catToastCreated') });
      onDone();
    },
    onError: (err: any) => toast({ variant: 'destructive', title: ts('catToastCreateError'), description: getErrorMessage(err, '') }),
  });

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-sm p-5 space-y-3 max-w-lg">
      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{ts('catNewTitle')}</p>

      <input
        value={name}
        onChange={e => handleNameChange(e.target.value)}
        placeholder={ts('catNamePlaceholder')}
        autoFocus
        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      />

      <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
        <span className="flex items-center px-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 font-mono shrink-0">slug:</span>
        <input
          value={slug}
          onChange={e => { setSlugManual(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')); }}
          placeholder={ts('placeholderSlugExample')}
          className="flex-1 h-9 px-2 text-[12px] font-mono bg-transparent outline-none text-slate-700 dark:text-slate-300"
        />
      </div>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={ts('catDescPlaceholder')}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
      />

      <div>
        <p className="text-[11px] text-slate-500 mb-1.5">{ts('catColorLabel')}</p>
        <div className="flex items-center gap-1.5">
          {CATEGORY_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-lg transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      <div>
        <button type="button" onClick={() => setShowImage(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors">
          <ImageIcon className="h-3.5 w-3.5" />
          {ts('catCoverOptional')}
          <ChevronDown className={`h-3 w-3 transition-transform ${showImage ? 'rotate-180' : ''}`} />
        </button>
        {showImage && (
          <div className="mt-2">
            <ImagePicker value={coverImageUrl} onChange={setCoverImageUrl} tenantId={blogId} ratio="3/2" />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => createMut.mutate()} disabled={!name.trim() || createMut.isPending}
          className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors disabled:opacity-50">
          <Check className="h-3.5 w-3.5" />
          {createMut.isPending ? ts('catCreating') : ts('catCreate')}
        </button>
        <button onClick={onDone} className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-600 text-[12px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5">
          <X className="h-3.5 w-3.5" /> {ts('cancel')}
        </button>
      </div>
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({ cat, blogId }: { cat: CategoryInfo; blogId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(cat.name);
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState(cat.color ?? '#2563eb');
  const [editCover, setEditCover] = useState(cat.cover_image_url ?? '');
  const [showImage, setShowImage] = useState(!!cat.cover_image_url);

  function openEdit() {
    setEditName(cat.name);
    setEditDescription('');
    setEditColor(cat.color ?? '#2563eb');
    setEditCover(cat.cover_image_url ?? '');
    setShowImage(!!cat.cover_image_url);
    setEditing(true);
  }

  const updateMut = useMutation({
    mutationFn: () => categoriesApi.update(blogId, cat.id, {
      name: editName.trim(),
      color: editColor,
      cover_image_url: editCover || null,
      description: editDescription.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', blogId] });
      toast({ title: ts('catToastUpdated') });
      setEditing(false);
    },
    onError: (err: any) => toast({ variant: 'destructive', title: ts('catToastUpdateError'), description: getErrorMessage(err, '') }),
  });

  const deleteMut = useMutation({
    mutationFn: () => categoriesApi.delete(blogId, cat.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', blogId] });
      toast({ title: ts('catToastDeleted') });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: ts('catToastDeleteError'), description: getErrorMessage(err, '') }),
  });

  if (editing) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-4 space-y-3">
        <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
          className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORY_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setEditColor(c)}
              className={`h-5 w-5 rounded-md transition-transform hover:scale-110 ${editColor === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div>
          <button type="button" onClick={() => setShowImage(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors">
            <ImageIcon className="h-3.5 w-3.5" />
            {ts('catCoverLabel')}
            <ChevronDown className={`h-3 w-3 transition-transform ${showImage ? 'rotate-180' : ''}`} />
          </button>
          {showImage && (
            <div className="mt-2">
              <ImagePicker value={editCover} onChange={setEditCover} tenantId={blogId} ratio="3/2" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateMut.mutate()} disabled={!editName.trim() || updateMut.isPending}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50">
            <Check className="h-3 w-3" />
            {updateMut.isPending ? '…' : ts('catSave')}
          </button>
          <button onClick={() => setEditing(false)}
            className="h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-600 text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
            <X className="h-3 w-3" /> {ts('cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md transition-all overflow-hidden">
      {/* Color band */}
      <div className="h-1.5 w-full" style={{ backgroundColor: cat.color ?? '#94a3b8' }} />

      {/* Cover image */}
      {cat.cover_image_url && (
        <div className="relative h-24 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img src={cat.cover_image_url} alt={cat.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-snug truncate">{cat.name}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">{cat.slug}</p>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {cat.articles_count ?? 0}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={openEdit}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors bg-white/90 dark:bg-slate-900/90 shadow-sm">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => deleteMut.mutate()}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-white/90 dark:bg-slate-900/90 shadow-sm">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const ts = useTranslations('studio');

  const [creating, setCreating] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: async () => { const { data } = await categoriesApi.list(blogId); return data; },
  });

  const addButton = (
    <button
      onClick={() => setCreating(true)}
      className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
    >
      <Plus className="h-4 w-4" /> {ts('catNewButton')}
    </button>
  );

  return (
    <FullPageShell title={ts('pageCategories')} description={ts('pageCategoriesDesc')} action={!creating ? addButton : undefined}>
      <div className="p-6 space-y-6">

        {/* New category form */}
        {creating && (
          <NewCategoryForm blogId={blogId} onDone={() => setCreating(false)} />
        )}

        {/* Categories grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 && !creating ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Tag className="h-7 w-7 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1.5">{ts('catNoneTitle')}</p>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 mb-5">{ts('catNoneDesc')}</p>
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors">
              <Plus className="h-4 w-4" /> {ts('catNewButton')}
            </button>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map(cat => (
              <CategoryCard key={cat.id} cat={cat} blogId={blogId} />
            ))}
          </div>
        ) : null}

      </div>
    </FullPageShell>
  );
}
