'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Tags, Trash2, Loader2 } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { categoriesApi, tenantsApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function CategoriesPage() {
  const params = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('categories');
  const [newName, setNewName] = useState('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: () => categoriesApi.list(blogId).then((r) => r.data),
    enabled: !!blogId,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => categoriesApi.create(blogId, { name, slug: slugify(name) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', blogId] });
      setNewName('');
      toast({ variant: 'success', title: 'Category created!' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to create category.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => categoriesApi.delete(blogId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', blogId] });
      toast({ title: 'Category deleted.' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to delete category.' }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (name.length < 2) return;
    createMutation.mutate(name);
  };

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[
        { label: tenant?.name ?? '…' },
        { label: t('title') },
      ]}
    >
      <div className="max-w-2xl">

        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{t('title')}</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleCreate} className="flex gap-2 mb-8">
          <Input
            placeholder={t('namePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={newName.trim().length < 2 || createMutation.isPending}
            className="gap-1.5 shrink-0"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t('create')}
          </Button>
        </form>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 py-16 text-center bg-white dark:bg-zinc-900">
            <Tags className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">{t('noCategories')}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{t('noCategoriesDesc')}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
            {categories.map((cat: any, i: number) => {
              const count = cat.articles_count ?? 0;
              return (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${i > 0 ? 'border-t border-slate-50 dark:border-zinc-800' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Tags className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{cat.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {count} {count !== 1 ? t('articles') : t('article')}
                      </p>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('deleteDesc')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(cat.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
