'use client';
import { useParams } from 'next/navigation';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import {
  MOCK_BLOG_EDITORIAL, MOCK_BLOG_MAGAZINE, MOCK_BLOG_MINIMAL, MOCK_BLOG_CREATIVE,
  MOCK_CATEGORIES,
} from '@/components/themes/mock/data';
import EditorialAbout from '@/components/themes/editorial/EditorialAbout';
import MagazineAbout  from '@/components/themes/magazine/MagazineAbout';
import CreativeAbout  from '@/components/themes/creative/CreativeAbout';
import LuminaryAbout  from '@/components/themes/luminary/LuminaryAbout';

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

export default function PreviewAboutPage() {
  const { locale, theme } = useParams() as { locale: string; theme: string };
  const blog       = mockBlog(theme);
  const basePath   = `/${locale}/preview/${theme}`;
  const categories = MOCK_CATEGORIES as unknown as PublicCategory[];

  switch (theme) {
    case 'editorial': return <EditorialAbout blog={blog} categories={categories} basePath={basePath} />;
    case 'magazine':  return <MagazineAbout  blog={blog} categories={categories} basePath={basePath} />;
    case 'creative':  return <CreativeAbout  blog={blog} categories={categories} basePath={basePath} />;
    case 'luminary':  return <LuminaryAbout  blog={blog} categories={categories} basePath={basePath} />;
    default:          return <EditorialAbout blog={blog} categories={categories} basePath={basePath} />;
  }
}
