'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Save, Eye } from 'lucide-react';
import Link from 'next/link';

import { articlesApi, categoriesApi } from '@/lib/api';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/utils';

export default function NewArticlePage() {
  const t = useTranslations('editor');
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({});
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data: categories } = useQuery({
    queryKey: ['categories', blogId],
    queryFn: () => categoriesApi.list(blogId).then((r) => r.data),
    enabled: !!blogId,
  });

  const createMutation = useMutation<string, Error, boolean>({
    mutationFn: (publish: boolean) =>
      articlesApi
        .create(blogId, {
          title,
          slug: slugify(title),
          content,
          content_json: contentJson,
          excerpt: excerpt || undefined,
          category_id: categoryId || undefined,
        })
        .then(async ({ data }) => {
          if (publish) await articlesApi.publish(blogId, data.id);
          return data.id;
        }),
    onSuccess: (articleId, publish) => {
      queryClient.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ variant: 'success', title: publish ? t('published') : t('saved') });
      router.push(`/${locale}/blogs/${blogId}/articles/${articleId}/edit`);
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to save article' }),
  });

  const handleEditorChange = useCallback(
    (html: string, json: Record<string, unknown>) => {
      setContent(html);
      setContentJson(json);
    },
    []
  );

  const canSave = title.trim().length > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar locale={locale} blogId={blogId} />
      <div className="flex-1 ml-[240px] flex flex-col">
        {/* Editor header */}
        <div className="fixed top-0 right-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-6" style={{ left: 240 }}>
          <Link
            href={`/${locale}/blogs/${blogId}/articles`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('save')}
          </Link>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => createMutation.mutate(false)}
            disabled={!canSave || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
          <Button
            size="sm"
            onClick={() => createMutation.mutate(true)}
            disabled={!canSave || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {t('publish')}
          </Button>
        </div>

        <main className="mt-14 flex gap-6 p-6 max-w-6xl mx-auto w-full">
          {/* Editor area */}
          <div className="flex-1 space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="text-2xl font-bold border-0 shadow-none px-0 h-auto py-2 focus-visible:ring-0 placeholder:text-muted-foreground/40"
            />
            <ArticleEditor
              content={content}
              onChange={handleEditorChange}
              placeholder={t('contentPlaceholder')}
            />
          </div>

          {/* Settings sidebar */}
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
