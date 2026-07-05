'use client';
import { useParams } from 'next/navigation';
import type { BlogInfo, PublicArticle, PublicCategory } from '@/lib/public-api';
import {
  MOCK_BLOG_EDITORIAL, MOCK_BLOG_MAGAZINE, MOCK_BLOG_MINIMAL, MOCK_BLOG_CREATIVE,
  MOCK_ARTICLES, MOCK_CATEGORIES,
} from '@/components/themes/mock/data';
import EditorialCategoryPage from '@/components/themes/editorial/EditorialCategoryPage';
import MagazineCategoryPage  from '@/components/themes/magazine/MagazineCategoryPage';
import CreativeCategoryPage  from '@/components/themes/creative/CreativeCategoryPage';
import LuminaryCategoryPage  from '@/components/themes/luminary/LuminaryCategoryPage';

const MOCK_BLOG_LUMINARY: BlogInfo = {
  ...MOCK_BLOG_MINIMAL,
  id: 'mock-luminary', name: 'The Luminary', slug: 'the-luminary',
  description: 'A premium literary journal exploring ideas that shape the world.',
  theme: 'luminary', primary_color: '#b8960c',
} as unknown as BlogInfo;

const BASE_CONFIGS: Record<string, BlogInfo> = {
  editorial: MOCK_BLOG_EDITORIAL as unknown as BlogInfo,
  magazine:  MOCK_BLOG_MAGAZINE  as unknown as BlogInfo,
  creative:  MOCK_BLOG_CREATIVE  as unknown as BlogInfo,
  luminary:  MOCK_BLOG_LUMINARY,
};

function mockBlog(theme: string): BlogInfo {
  const base = BASE_CONFIGS[theme] ?? (MOCK_BLOG_EDITORIAL as unknown as BlogInfo);
  return { ...base, slug: `preview/${theme}` };
}

export default function PreviewCategoryPage() {
  const { locale, theme, catSlug } = useParams() as { locale: string; theme: string; catSlug: string };
  const blog       = mockBlog(theme);
  const basePath   = `/${locale}/preview/${theme}`;
  const categories = MOCK_CATEGORIES as unknown as PublicCategory[];
  const category   = (MOCK_CATEGORIES.find(c => c.slug === catSlug) ?? MOCK_CATEGORIES[0]) as unknown as PublicCategory;
  const articles   = MOCK_ARTICLES.filter(a => a.category_slug === catSlug) as unknown as PublicArticle[];

  switch (theme) {
    case 'editorial': return <EditorialCategoryPage blog={blog} category={category} articles={articles} categories={categories} basePath={basePath} />;
    case 'magazine':  return <MagazineCategoryPage  blog={blog} category={category} articles={articles} categories={categories} basePath={basePath} />;
    case 'creative':  return <CreativeCategoryPage  blog={blog} category={category} articles={articles} categories={categories} basePath={basePath} />;
    case 'luminary':  return <LuminaryCategoryPage  blog={blog} category={category} articles={articles} categories={categories} basePath={basePath} />;
    default:          return <EditorialCategoryPage blog={blog} category={category} articles={articles} categories={categories} basePath={basePath} />;
  }
}
