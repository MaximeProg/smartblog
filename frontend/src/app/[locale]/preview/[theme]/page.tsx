'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { BlogInfo, PublicArticle, PublicCategory } from '@/lib/public-api';
import {
  MOCK_BLOG_EDITORIAL, MOCK_BLOG_MAGAZINE, MOCK_BLOG_MINIMAL, MOCK_BLOG_CREATIVE,
  MOCK_ARTICLES, MOCK_CATEGORIES,
} from '@/components/themes/mock/data';
import EditorialHome from '@/components/themes/editorial/EditorialHome';
import MagazineHome from '@/components/themes/magazine/MagazineHome';
import CreativeHome from '@/components/themes/creative/CreativeHome';
import LuminaryHome from '@/components/themes/luminary/LuminaryHome';

const MOCK_BLOG_LUMINARY: BlogInfo = {
  ...MOCK_BLOG_MINIMAL,
  id: 'mock-luminary',
  name: 'The Luminary',
  slug: 'the-luminary',
  description: 'A premium literary journal exploring ideas that shape the world.',
  theme: 'luminary',
  primary_color: '#b8960c',
} as unknown as BlogInfo;

const BASE_CONFIGS: Record<string, BlogInfo> = {
  editorial: MOCK_BLOG_EDITORIAL as unknown as BlogInfo,
  magazine:  MOCK_BLOG_MAGAZINE as unknown as BlogInfo,
  creative:  MOCK_BLOG_CREATIVE as unknown as BlogInfo,
  luminary:  MOCK_BLOG_LUMINARY,
};

function mockBlog(theme: string): BlogInfo {
  const base = BASE_CONFIGS[theme] ?? (MOCK_BLOG_EDITORIAL as unknown as BlogInfo);
  return { ...base, slug: `preview/${theme}` };
}

function PreviewHomeInner() {
  const { theme } = useParams() as { theme: string };
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') ?? undefined;
  const searchQuery     = searchParams.get('q') ?? undefined;

  const blog       = mockBlog(theme);
  const articles   = MOCK_ARTICLES  as unknown as PublicArticle[];
  const categories = MOCK_CATEGORIES as unknown as PublicCategory[];
  const props      = { blog, articles, categories, currentCategory, searchQuery };

  switch (theme) {
    case 'editorial': return <EditorialHome {...props} />;
    case 'magazine':  return <MagazineHome  {...props} />;
    case 'creative':  return <CreativeHome  {...props} />;
    case 'luminary':  return <LuminaryHome  {...props} />;
    default:          return <EditorialHome {...props} />;
  }
}

export default function PreviewHomePage() {
  return <Suspense><PreviewHomeInner /></Suspense>;
}
