'use client';
import { useParams } from 'next/navigation';
import type { BlogInfo, PublicArticle, PublicCategory } from '@/lib/public-api';
import {
  MOCK_BLOG_EDITORIAL, MOCK_BLOG_MAGAZINE, MOCK_BLOG_MINIMAL, MOCK_BLOG_CREATIVE,
  MOCK_ARTICLES, MOCK_CATEGORIES,
} from '@/components/themes/mock/data';
import EditorialCategories from '@/components/themes/editorial/EditorialCategories';
import MagazineCategories  from '@/components/themes/magazine/MagazineCategories';
import CreativeCategories  from '@/components/themes/creative/CreativeCategories';
import LuminaryCategories  from '@/components/themes/luminary/LuminaryCategories';

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

export default function PreviewCategoriesPage() {
  const { locale, theme } = useParams() as { locale: string; theme: string };
  const blog       = mockBlog(theme);
  const basePath   = `/${locale}/preview/${theme}`;
  const categories = MOCK_CATEGORIES as unknown as PublicCategory[];
  const articles   = MOCK_ARTICLES   as unknown as PublicArticle[];

  switch (theme) {
    case 'editorial': return <EditorialCategories blog={blog} categories={categories} articles={articles} basePath={basePath} />;
    case 'magazine':  return <MagazineCategories  blog={blog} categories={categories} articles={articles} basePath={basePath} />;
    case 'creative':  return <CreativeCategories  blog={blog} categories={categories} articles={articles} basePath={basePath} />;
    case 'luminary':  return <LuminaryCategories  blog={blog} categories={categories} articles={articles} basePath={basePath} />;
    default:          return <EditorialCategories blog={blog} categories={categories} articles={articles} basePath={basePath} />;
  }
}
