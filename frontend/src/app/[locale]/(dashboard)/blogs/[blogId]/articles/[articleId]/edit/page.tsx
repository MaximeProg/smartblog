'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Save, Eye, Check } from 'lucide-react';
import Link from 'next/link';

import { articlesApi, categoriesApi } from '@/lib/api';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function EditArticlePage() {
  const t = useTranslations('editor');
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;
  const articleId = params.articleId as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', blogId, articleId],
    queryFn: () => articlesApi.get(blogId, articleId).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: () => categoriesApi.list(blogId).then((r) => r.data),
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({});
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      if (article.content_json) setContentJson(article.content_json);
      setExcerpt(article.excerpt ?? '');
      setCategoryId(article.category?.id ?? '');
    }
  }, [article]);

  const saveMutation = useMutation({
    mutationFn: () =>
      articlesApi.update(blogId, articleId, {
        title,
        content,
        content_json: contentJson,
        excerpt: excerpt || undefined,
        category_id: categoryId || undefined,
      }),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('idle');
      toast({ variant: 'destructive', title: 'Failed to save' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => articlesApi.publish(blogId, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', blogId, articleId] });
      toast({ variant: 'success', title: t('published') });
    },
  });

  const handleEditorChange = useCallback(
    (html: string, json: Record<string, unknown>) => {
      setContent(html);
      setContentJson(json);
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar locale={locale} blogId={blogId} />
        <div className="flex-1 ml-[240px] p-6 space-y-4 mt-14">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  const isPublished = article?.status === 'published';

  return (
    <div className="flex min-h-screen">
      <Sidebar locale={locale} blogId={blogId} />
      <div className="flex-1 ml-[240px] flex flex-col">
        {/* Editor header */}
        <div
          className="fixed top-0 right-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-6"
          style={{ left: 240 }}
        >
          <Link
            href={`/${locale}/blogs/${blogId}/articles`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {isPublished && (
            <Badge variant="success" className="gap-1.5">
              <Check className="h-3 w-3" />
              Published
            </Badge>
          )}

          <div className="flex-1" />

          {saveStatus === 'saved' ? (
            <span className="text-xs text-emerald-600 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> {t('saved')}
            </span>
          ) : saveStatus === 'saving' ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('saving')}
            </span>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {t('save')}
          </Button>

          {!isPublished && (
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {t('publish')}
            </Button>
          )}
        </div>

        <main className="mt-14 flex gap-6 p-6 max-w-6xl mx-auto w-full">
          <div className="flex-1 space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="text-2xl font-bold border-0 shadow-none px-0 h-auto py-2 focus-visible:ring-0 placeholder:text-muted-foreground/40"
            />
            <ArticleEditor
              key={articleId}
              content={content}
              onChange={handleEditorChange}
              placeholder={t('contentPlaceholder')}
            />
          </div>

          <aside className="w-64 shrink-0 space-y-6">
            <div className="space-y-1.5">
              <Label>{t('category')}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('noCategoryOption')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('noCategoryOption')}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('excerpt')}</Label>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={t('excerptPlaceholder')}
                rows={4}
              />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
