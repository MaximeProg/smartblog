'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MOCK_BLOG, MOCK_CATEGORIES, MOCK_ARTICLES } from '@/components/themes/corporate/mock-data';
import { publicApi, type BlogInfo, type PublicCategory, type PublicArticle } from '@/lib/public-api';
import CorporateCategoriesPage from '@/components/themes/corporate/CorporateCategories';

const templateBasePath = '/en/template';

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview');

  const { data: realBlog } = useQuery({
    queryKey: ['public-blog', preview],
    queryFn: () => publicApi.getBlogInfo(preview!),
    enabled: !!preview,
  });
  const { data: realCategories } = useQuery({
    queryKey: ['public-categories', preview],
    queryFn: () => publicApi.getCategories(preview!),
    enabled: !!preview,
  });
  const { data: realArticles } = useQuery({
    queryKey: ['public-articles', preview],
    queryFn: () => publicApi.getArticles(preview!),
    enabled: !!preview,
  });

  const blog = (preview ? realBlog : null) ?? (MOCK_BLOG as unknown as BlogInfo);
  const categories: PublicCategory[] = (preview ? realCategories : null) ?? (MOCK_CATEGORIES as unknown as PublicCategory[]);
  const articles: PublicArticle[] = (preview ? realArticles : null) ?? (MOCK_ARTICLES as unknown as PublicArticle[]);

  return (
    <CorporateCategoriesPage
      blog={blog}
      categories={categories}
      articles={articles}
      basePath={templateBasePath}
      previewSlug={preview ?? undefined}
    />
  );
}
