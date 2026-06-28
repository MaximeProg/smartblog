import type { BlogInfo, PublicArticle, PublicArticleFull, PublicCategory } from '@/lib/public-api';

import MinimalHome from './minimal/MinimalHome';
import MinimalArticle from './minimal/MinimalArticle';
import MagazineHome from './magazine/MagazineHome';
import MagazineArticle from './magazine/MagazineArticle';
import BusinessHome from './business/BusinessHome';
import BusinessArticle from './business/BusinessArticle';
import NewsHome from './news/NewsHome';
import NewsArticle from './news/NewsArticle';
import TechHome from './tech/TechHome';
import TechArticle from './tech/TechArticle';
import PortfolioHome from './portfolio/PortfolioHome';
import PortfolioArticle from './portfolio/PortfolioArticle';

export interface HomeProps {
  blog: BlogInfo;
  articles: PublicArticle[];
  categories: PublicCategory[];
  currentCategory?: string;
  searchQuery?: string;
  /** Converts an article slug to its href. Defaults to relative `./{slug}`. */
  getArticleHref?: (slug: string) => string;
}

export interface ArticleProps {
  blog: BlogInfo;
  article: PublicArticleFull;
  relatedArticles: PublicArticle[];
  /** Converts an article slug to its href. Defaults to relative `./{slug}`. */
  getArticleHref?: (slug: string) => string;
}

const HOME_THEMES: Record<string, React.ComponentType<HomeProps>> = {
  minimal: MinimalHome,
  magazine: MagazineHome,
  business: BusinessHome,
  news: NewsHome,
  tech: TechHome,
  portfolio: PortfolioHome,
};

const ARTICLE_THEMES: Record<string, React.ComponentType<ArticleProps>> = {
  minimal: MinimalArticle,
  magazine: MagazineArticle,
  business: BusinessArticle,
  news: NewsArticle,
  tech: TechArticle,
  portfolio: PortfolioArticle,
};

export function ThemeHome(props: HomeProps) {
  const Component = HOME_THEMES[props.blog.theme] ?? HOME_THEMES.minimal;
  return <Component {...props} />;
}

export function ThemeArticle(props: ArticleProps) {
  const Component = ARTICLE_THEMES[props.blog.theme] ?? ARTICLE_THEMES.minimal;
  return <Component {...props} />;
}
