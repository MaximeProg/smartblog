'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Plus, Search, Trash2, Edit2, Check, X, Hash, Loader2, GitMerge } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { tagsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import type { TagInfo } from '@/types';

// ─── Tag row ─────────────────────────────────────────────────────────────────

function TagRow({
  tag,
  blogId,
  selected,
  onToggleSelect,
}: {
  tag: TagInfo;
  blogId: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('tags');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(tag.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const renameMut = useMutation({
    mutationFn: () => tagsApi.update(blogId, tag.id, editName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags', blogId] });
      toast({ title: t('save') });
      setEditing(false);
    },
    onError: () => toast({ variant: 'destructive', title: t('renameError') }),
  });

  const deleteMut = useMutation({
    mutationFn: () => tagsApi.delete(blogId, tag.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags', blogId] });
      toast({ title: t('delete') });
    },
    onError: () => toast({ variant: 'destructive', title: t('deleteError') }),
  });

  function startEdit() {
    setEditName(tag.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelEdit() {
    setEditing(false);
    setEditName(tag.name);
  }

  const hasArticles = (tag.articles_count ?? 0) > 0;

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
      ${selected
        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20'
        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
      }`}>

      {/* Checkbox for merge */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(tag.id)}
        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
      />

      {/* Hash icon */}
      <Hash className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />

      {/* Name (editable inline) */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') renameMut.mutate(); if (e.key === 'Escape') cancelEdit(); }}
              className="flex-1 h-8 px-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder={t('renamePlaceholder')}
            />
            <button onClick={() => renameMut.mutate()} disabled={!editName.trim() || renameMut.isPending}
              className="h-7 w-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 shrink-0">
              {renameMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button onClick={cancelEdit}
              className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={startEdit} className="flex items-center gap-2 group/name text-left">
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover/name:text-blue-600 transition-colors">
              {tag.name}
            </span>
            <Edit2 className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover/name:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Article count */}
      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full
        ${hasArticles
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
          : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
        }`}>
        {tag.articles_count ?? 0}
      </span>

      {/* Delete */}
      {!editing && (
        confirmDelete ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-red-500 font-medium">
              {hasArticles ? `${tag.articles_count} art.` : t('deleteConfirm')}
            </span>
            <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
              className="h-6 px-2 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold">
              {deleteMut.isPending ? '…' : t('delete')}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="h-6 px-2 rounded border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500">
              {t('cancel')}
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TagsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const t = useTranslations('tags');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', blogId, search],
    queryFn: async () => {
      const { data } = await tagsApi.list(blogId, search || undefined);
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: () => tagsApi.create(blogId, newName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags', blogId] });
      toast({ title: t('create') });
      setNewName('');
    },
    onError: () => toast({ variant: 'destructive', title: t('createError') }),
  });

  const mergeMut = useMutation({
    mutationFn: () => tagsApi.merge(blogId, Array.from(selected).filter(id => id !== mergeTarget), mergeTarget),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags', blogId] });
      toast({ title: t('mergeConfirm') });
      setSelected(new Set());
      setShowMerge(false);
      setMergeTarget('');
    },
    onError: () => toast({ variant: 'destructive', title: t('mergeError') }),
  });

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = search
    ? tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags;

  const totalArticles = tags.reduce((sum, t) => sum + (t.articles_count ?? 0), 0);

  return (
    <FullPageShell
      title={t('title')}
      description={`${tags.length} ${t('tagsCount')} · ${totalArticles} articles`}
    >
      <div className="p-6 space-y-5">

        {/* Create tag */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
            <Hash className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) createMut.mutate(); }}
              placeholder={t('namePlaceholder')}
              className="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => createMut.mutate()}
            disabled={!newName.trim() || createMut.isPending}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50"
          >
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t('new')}
          </button>
        </div>

        {/* Search + actions */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search')}
              className="flex-1 bg-transparent text-[13px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {selected.size >= 2 && (
            <button
              onClick={() => setShowMerge(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <GitMerge className="h-3.5 w-3.5" />
              {t('merge')} ({selected.size})
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Merge panel */}
        {showMerge && (
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-3">
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t('mergeTitle')}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">{t('mergeDesc')}</p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t('mergeTarget')}</label>
              <select
                value={mergeTarget}
                onChange={e => setMergeTarget(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{t('mergeTarget')}…</option>
                {Array.from(selected).map(id => {
                  const tag = tags.find(t => t.id === id);
                  return tag ? <option key={id} value={id}>{tag.name}</option> : null;
                })}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => mergeMut.mutate()}
                disabled={!mergeTarget || mergeMut.isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50"
              >
                {mergeMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitMerge className="h-3.5 w-3.5" />}
                {t('mergeConfirm')}
              </button>
              <button onClick={() => { setShowMerge(false); setMergeTarget(''); }}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Tip */}
        <p className="text-[12px] text-slate-400 dark:text-slate-500">{t('tip')}</p>

        {/* Tags list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Hash className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{t('empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(tag => (
              <TagRow
                key={tag.id}
                tag={tag}
                blogId={blogId}
                selected={selected.has(tag.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </FullPageShell>
  );
}
