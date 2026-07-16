import type { BlogInfo, PublicArticle, PublicArticleFull, PublicCategory } from '@/lib/public-api';

export interface EditModeProps {
  editMode?: boolean;
  selectedSectionId?: string | null;
  onSectionClick?: (id: string) => void;
  onSectionHover?: (id: string | null) => void;
}

import AdvertisePage from './shared/AdvertisePage';

import CorporateHome from './corporate/CorporateHome';
import CorporateArticle from './corporate/CorporateArticle';
import CorporateAbout from './corporate/CorporateAbout';
import CorporateContact from './corporate/CorporateContact';
import CorporateCategories from './corporate/CorporateCategories';
import CorporateCategoryPage from './corporate/CorporateCategoryPage';

import EditorialHome from './editorial/EditorialHome';
import EditorialArticle from './editorial/EditorialArticle';
import EditorialAbout from './editorial/EditorialAbout';
import EditorialContact from './editorial/EditorialContact';
import EditorialCategories from './editorial/EditorialCategories';
import EditorialCategoryPage from './editorial/EditorialCategoryPage';

import MagazineHome from './magazine/MagazineHome';
import MagazineArticle from './magazine/MagazineArticle';
import MagazineAbout from './magazine/MagazineAbout';
import MagazineContact from './magazine/MagazineContact';
import MagazineCategories from './magazine/MagazineCategories';
import MagazineCategoryPage from './magazine/MagazineCategoryPage';

import CreativeHome from './creative/CreativeHome';
import CreativeArticle from './creative/CreativeArticle';
import CreativeAbout from './creative/CreativeAbout';
import CreativeContact from './creative/CreativeContact';
import CreativeCategories from './creative/CreativeCategories';
import CreativeCategoryPage from './creative/CreativeCategoryPage';

import LuminaryHome from './luminary/LuminaryHome';
import LuminaryArticle from './luminary/LuminaryArticle';
import LuminaryAbout from './luminary/LuminaryAbout';
import LuminaryContact from './luminary/LuminaryContact';
import LuminaryCategories from './luminary/LuminaryCategories';
import LuminaryCategoryPage from './luminary/LuminaryCategoryPage';

export interface HomeProps extends EditModeProps {
  blog: BlogInfo;
  articles: PublicArticle[];
  categories: PublicCategory[];
  currentCategory?: string;
  searchQuery?: string;
  getArticleHref?: (slug: string) => string;
  previewSlug?: string;
  basePath?: string;
}

export interface ArticleProps {
  blog: BlogInfo;
  article: PublicArticleFull;
  relatedArticles: PublicArticle[];
  categories?: PublicCategory[];
  getArticleHref?: (slug: string) => string;
  basePath?: string;
  previewSlug?: string;
}

export interface AboutProps extends EditModeProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export interface ContactProps extends EditModeProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export interface CategoriesProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  articles: PublicArticle[];
  basePath: string;
}

export interface CategoryPageProps {
  blog: BlogInfo;
  category: PublicCategory;
  articles: PublicArticle[];
  categories: PublicCategory[];
  basePath: string;
}

export interface AdvertiseProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export function ThemeHome(props: HomeProps) {
  switch (props.blog.theme) {
    case 'magazine':  return <MagazineHome {...props} />;
    case 'creative':  return <CreativeHome {...props} />;
    case 'luminary':  return <LuminaryHome {...props} />;
    case 'corporate': return <CorporateHome {...props} />;
    default:          return <EditorialHome {...props} />;
  }
}

export function ThemeArticle(props: ArticleProps) {
  switch (props.blog.theme) {
    case 'magazine':  return <MagazineArticle {...props} />;
    case 'creative':  return <CreativeArticle {...props} />;
    case 'luminary':  return <LuminaryArticle {...props} />;
    case 'corporate': return <CorporateArticle {...props} />;
    default:          return <EditorialArticle {...props} />;
  }
}

export function ThemeAbout(props: AboutProps) {
  switch (props.blog.theme) {
    case 'magazine':  return <MagazineAbout {...props} />;
    case 'creative':  return <CreativeAbout {...props} />;
    case 'luminary':  return <LuminaryAbout {...props} />;
    case 'corporate': return <CorporateAbout {...props} />;
    default:          return <EditorialAbout {...props} />;
  }
}

export function ThemeContact(props: ContactProps) {
  switch (props.blog.theme) {
    case 'magazine':  return <MagazineContact {...props} />;
    case 'creative':  return <CreativeContact {...props} />;
    case 'luminary':  return <LuminaryContact {...props} />;
    case 'corporate': return <CorporateContact {...props} />;
    default:          return <EditorialContact {...props} />;
  }
}

export function ThemeCategories(props: CategoriesProps) {
  switch (props.blog.theme) {
    case 'magazine':  return <MagazineCategories {...props} />;
    case 'creative':  return <CreativeCategories {...props} />;
    case 'luminary':  return <LuminaryCategories {...props} />;
    case 'corporate': return <CorporateCategories blog={props.blog} categories={props.categories} articles={props.articles} basePath={props.basePath} />;
    default:          return <EditorialCategories {...props} />;
  }
}

export function ThemeCategoryPage(props: CategoryPageProps) {
  switch (props.blog.theme) {
    case 'magazine':  return <MagazineCategoryPage {...props} />;
    case 'creative':  return <CreativeCategoryPage {...props} />;
    case 'luminary':  return <LuminaryCategoryPage {...props} />;
    case 'corporate': return <CorporateCategoryPage blog={props.blog} categories={props.categories} category={props.category} articles={props.articles} basePath={props.basePath} />;
    default:          return <EditorialCategoryPage {...props} />;
  }
}

export function ThemeAdvertise(props: AdvertiseProps) {
  return <AdvertisePage {...props} />;
}
