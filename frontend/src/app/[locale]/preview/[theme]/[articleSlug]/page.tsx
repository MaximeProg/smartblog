'use client';
import { useParams } from 'next/navigation';
import type { BlogInfo, PublicArticle, PublicArticleFull } from '@/lib/public-api';
import {
  MOCK_BLOG_EDITORIAL, MOCK_BLOG_MAGAZINE, MOCK_BLOG_MINIMAL, MOCK_BLOG_CREATIVE,
  MOCK_ARTICLES, MOCK_ARTICLE_FULL, MOCK_CATEGORIES,
} from '@/components/themes/mock/data';
import EditorialArticle from '@/components/themes/editorial/EditorialArticle';
import MagazineArticle  from '@/components/themes/magazine/MagazineArticle';
import CreativeArticle  from '@/components/themes/creative/CreativeArticle';
import LuminaryArticle  from '@/components/themes/luminary/LuminaryArticle';

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
  magazine:  MOCK_BLOG_MAGAZINE  as unknown as BlogInfo,
  creative:  MOCK_BLOG_CREATIVE  as unknown as BlogInfo,
  luminary:  MOCK_BLOG_LUMINARY,
};

function mockBlog(theme: string): BlogInfo {
  const base = BASE_CONFIGS[theme] ?? (MOCK_BLOG_EDITORIAL as unknown as BlogInfo);
  return { ...base, slug: `preview/${theme}` };
}

export default function PreviewArticlePage() {
  const { theme, articleSlug } = useParams() as { theme: string; articleSlug: string };
  const blog = mockBlog(theme);

  const found   = MOCK_ARTICLES.find(a => a.slug === articleSlug);
  const article = (found ? { ...MOCK_ARTICLE_FULL, ...found } : MOCK_ARTICLE_FULL) as unknown as PublicArticleFull;
  const related = MOCK_ARTICLES.filter(a => a.slug !== article.slug).slice(0, 3) as unknown as PublicArticle[];
  const props   = { blog, article, relatedArticles: related, categories: MOCK_CATEGORIES, basePath: `/en/preview/${theme}` };

  switch (theme) {
    case 'editorial': return <EditorialArticle {...props} />;
    case 'magazine':  return <MagazineArticle  {...props} />;
    case 'creative':  return <CreativeArticle  {...props} />;
    case 'luminary':  return <LuminaryArticle  {...props} />;
    default:          return <EditorialArticle {...props} />;
  }
}
