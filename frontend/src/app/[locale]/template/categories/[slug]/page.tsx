'use client';

import { notFound } from 'next/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MOCK_BLOG, MOCK_CATEGORIES, MOCK_ARTICLES } from '@/components/themes/corporate/mock-data';
import { publicApi, type BlogInfo, type PublicCategory, type PublicArticle } from '@/lib/public-api';
import CorporateCategoryPage from '@/components/themes/corporate/CorporateCategoryPage';

const templateBasePath = '/en/template';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
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
  const { data: realCategoryArticles } = useQuery({
    queryKey: ['public-articles-cat', preview, slug],
    queryFn: () => publicApi.getArticles(preview!, { category: slug }),
    enabled: !!preview,
  });

  const blog = (preview ? realBlog : null) ?? (MOCK_BLOG as unknown as BlogInfo);
  const allCategories: PublicCategory[] = (preview ? realCategories : null) ?? (MOCK_CATEGORIES as unknown as PublicCategory[]);
  const articles: PublicArticle[] = preview
    ? (realCategoryArticles ?? [])
    : (MOCK_ARTICLES.filter(a => a.category_slug === slug) as unknown as PublicArticle[]);

  const category = allCategories.find(c => c.slug === slug);
  if (!category) notFound();

  return (
    <CorporateCategoryPage
      blog={blog}
      categories={allCategories}
      category={category}
      articles={articles}
      basePath={templateBasePath}
    />
  );
}
