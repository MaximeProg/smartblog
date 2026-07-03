import type { BlogInfo, PublicArticle, PublicArticleFull, PublicCategory } from '@/lib/public-api';
import CorporateHome from './corporate/CorporateHome';
import CorporateArticle from './corporate/CorporateArticle';

export interface HomeProps {
  blog: BlogInfo;
  articles: PublicArticle[];
  categories: PublicCategory[];
  currentCategory?: string;
  searchQuery?: string;
  getArticleHref?: (slug: string) => string;
  previewSlug?: string;
}

export interface ArticleProps {
  blog: BlogInfo;
  article: PublicArticleFull;
  relatedArticles: PublicArticle[];
  getArticleHref?: (slug: string) => string;
  basePath?: string;
  previewSlug?: string;
}

export function ThemeHome(props: HomeProps) {
  return <CorporateHome {...props} />;
}

export function ThemeArticle(props: ArticleProps) {
  return <CorporateArticle {...props} />;
}
