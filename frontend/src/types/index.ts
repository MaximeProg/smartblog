// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserInfo {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: PlanTier;
  is_super_admin: boolean;
  two_fa_enabled: boolean;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  role: UserRole;
  articles_count?: number;
  subscribers_count?: number;
  authors_count?: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
  tenants: TenantInfo[];
  requires_2fa?: boolean;
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'pro' | 'business';
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'grace_period' | 'cancelled';
export type CommentsMode = 'open' | 'moderated' | 'closed';

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  favicon_url: string | null;
  theme: string;
  primary_color: string;
  language: string;
  timezone: string;
  plan: PlanTier;
  status: TenantStatus;
  comments_mode: CommentsMode;
  articles_count: number;
  authors_count: number;
  subscribers_count: number;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
  font_family?: string;
  limits?: PlanLimits;
  usage?: PlanUsage;
}

export interface PlanLimits {
  max_articles: number;
  max_authors: number;
  max_storage_gb: number;
  max_subscribers: number;
  max_domains: number;
  ai_tokens_per_month: number;
}

export interface PlanUsage {
  articles_count: number;
  authors_count: number;
  storage_used_gb: number;
  subscribers_count: number;
  domains_count: number;
  ai_tokens_used: number;
}

export interface CreateTenantData {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  language?: string;
  timezone?: string;
  theme?: string;
  primary_color?: string;
  font_family?: string;
}

export interface UpdateTenantData {
  name?: string;
  description?: string;
  category?: string;
  language?: string;
  timezone?: string;
  primary_color?: string;
  font_family?: string;
  theme?: string;
  comments_mode?: CommentsMode;
  seo_meta_description?: string;
}

export interface SlugCheckResponse {
  slug: string;
  available: boolean;
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived';
export type ArticleType = 'article' | 'page' | 'newsletter';

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  article_type: ArticleType;
  cover_image_url: string | null;
  excerpt: string | null;
  reading_time_minutes: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  author?: AuthorInfo;
  category?: CategoryInfo;
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
  content_json: Record<string, unknown> | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: TagInfo[];
}

export interface AuthorInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface TagInfo {
  id: string;
  name: string;
  slug: string;
}

export interface CreateArticleData {
  title: string;
  slug?: string;
  content?: string;
  content_json?: Record<string, unknown>;
  excerpt?: string;
  cover_image_url?: string;
  category_id?: string;
  tag_ids?: string[];
  seo_title?: string;
  seo_description?: string;
  article_type?: ArticleType;
  scheduled_at?: string;
}

export interface UpdateArticleData extends CreateArticleData {}

export interface ArticleListParams {
  page?: number;
  limit?: number;
  status?: ArticleStatus;
  q?: string;
  category_id?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export type UserRole = 'tenant_admin' | 'editor' | 'author' | 'viewer';

export interface TeamMember {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: UserRole;
  invited_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface InviteTeamData {
  email: string;
  role: UserRole;
  message?: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  period_days: number;
  total_views: number;
  unique_sessions: number;
  avg_duration_seconds: number;
  top_articles: TopArticle[];
  top_referrers: TopReferrer[];
  views_by_day: DailyMetric[];
  devices: Record<string, number>;
}

export interface TopArticle {
  id: string;
  title: string;
  slug: string;
  views: number;
}

export interface TopReferrer {
  domain: string;
  visits: number;
}

export interface DailyMetric {
  date: string;
  views: number;
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  subscribed_at: string;
  status: 'active' | 'unsubscribed';
}

// ─── Public blog ──────────────────────────────────────────────────────────────

export interface PublicBlog {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  language: string;
}

export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  reading_time_minutes: number;
  views_count: number;
  published_at: string;
  author: AuthorInfo | null;
  category: CategoryInfo | null;
  tags: TagInfo[];
}
