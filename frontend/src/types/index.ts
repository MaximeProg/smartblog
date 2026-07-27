// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserInfo {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  country: string | null;
  continent: string | null;
  gender: string | null;
  plan: PlanTier;
  is_super_admin: boolean;
  two_fa_enabled: boolean;
  usdt_wallet_address: string | null;
  payout_currency: string | null;
  payout_extra_id: string | null;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  role: UserRole;
  logo_url?: string | null;
  cover_image_url?: string | null;
  status?: TenantStatus;
  articles_count?: number;
  subscribers_count?: number;
  authors_count?: number;
  trial_ends_at?: string | null;
  plan_expires_at?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
  tenants: TenantInfo[];
  requires_2fa?: boolean;
  two_fa_challenge_token?: string | null;
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
  seo_title_template?: string | null;
  seo_meta_description?: string | null;
  template_config?: Record<string, unknown> | null;
  social_links?: Record<string, string>;
  robots_txt?: string | null;
  enabled_languages?: string[];
  trial_ends_at?: string | null;
  plan_expires_at?: string | null;
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
  secondary_color?: string;
  font_family?: string;
  logo_url?: string;
  favicon_url?: string;
  cover_image_url?: string;
  social_links?: Record<string, string>;
  sidebar_config?: Record<string, unknown>;
  seo_title_template?: string;
  seo_meta_description?: string;
  template_config?: Record<string, unknown>;
}

export interface UpdateTenantData {
  name?: string;
  description?: string;
  category?: string;
  language?: string;
  timezone?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  theme?: string;
  logo_url?: string;
  favicon_url?: string;
  cover_image_url?: string | null;
  social_links?: Record<string, string>;
  sidebar_config?: Record<string, unknown>;
  comments_mode?: CommentsMode;
  seo_title_template?: string;
  seo_meta_description?: string;
  template_config?: Record<string, unknown>;
  robots_txt?: string;
  enabled_languages?: string[];
}

export interface SlugCheckResponse {
  slug: string;
  available: boolean;
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived' | 'in_review' | 'unpublished' | 'approved' | 'rejected';
export type ArticleType = 'article' | 'photo' | 'video' | 'audio' | 'podcast' | 'mixed';

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
  seo_keywords: string[] | null;
  canonical_url: string | null;
  og_image_url: string | null;
  audio_url: string | null;
  video_url: string | null;
  episode_number: number | null;
  season: number | null;
  audio_duration_seconds: number | null;
  allow_comments: boolean;
  is_featured: boolean;
  robots_noindex: boolean;
  rejection_reason: string | null;
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
  description?: string | null;
  cover_image_url?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  articles_count?: number;
}

export interface TagInfo {
  id: string;
  name: string;
  slug: string;
  articles_count?: number;
}

export type ArticleVisibility = 'public' | 'private' | 'paid';

export interface CreateArticleData {
  title: string;
  slug?: string;
  content?: string;
  content_json?: Record<string, unknown>;
  excerpt?: string;
  cover_image_url?: string;
  cover_image_alt?: string;
  category_id?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  robots_noindex?: boolean;
  article_type?: ArticleType;
  audio_url?: string;
  video_url?: string;
  episode_number?: number;
  season?: number;
  scheduled_at?: string;
  visibility?: ArticleVisibility;
  allow_comments?: boolean;
  is_featured?: boolean;
  price?: number;
  currency?: string;
}

export interface UpdateArticleData extends Partial<CreateArticleData> {}

export interface ArticleVersionResponse {
  id: string;
  version_number: number;
  title: string;
  change_summary: string | null;
  created_by: string;
  created_at: string;
}

export interface ArticleListParams {
  page?: number;
  limit?: number;
  status?: ArticleStatus;
  q?: string;
  category_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: string | null;
    has_more: boolean;
    total: number | null;
  };
}

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface MediaItem {
  id: string;
  tenant_id: string;
  cloudinary_url: string;
  cloudinary_secure_url: string;
  cloudinary_public_id: string;
  cloudinary_resource_type: string;
  media_type: MediaType;
  original_filename: string;
  alt_text: string | null;
  caption: string | null;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  format: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface PlatformMediaItem {
  id: string;
  cloudinary_secure_url: string;
  media_type: MediaType;
  original_filename: string | null;
  created_at: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  cover_image_url?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  cover_image_url?: string | null;
  color?: string;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export type UserRole = 'TENANT_ADMIN' | 'EDITOR' | 'AUTHOR' | 'VIEWER';

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
  created_at: string;
  expires_at: string;
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
  countries: Record<string, number>;
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

export type SubscriberStatus = 'pending' | 'active' | 'unsubscribed' | 'bounced';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'canceled';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: SubscriberStatus;
  source: string | null;
  tags: string[];
  created_at: string;
}

export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  is_paid: boolean;
  price: number | null;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  opens_count: number;
  clicks_count: number;
  created_at: string;
}

// ─── Social ───────────────────────────────────────────────────────────────────

export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'pinterest' | 'youtube_community' | 'tiktok' | 'threads' | 'telegram' | 'whatsapp' | 'discord' | 'reddit' | 'upscrolled' | 'google_business';
export type SocialPostStatus = 'pending' | 'scheduled' | 'published' | 'failed' | 'canceled';

export interface SocialAccountInfo {
  id: string;
  platform: SocialPlatform;
  platform_username: string | null;
  platform_display_name: string | null;
  platform_avatar_url: string | null;
  platform_profile_url: string | null;
  is_active: boolean;
  auto_post_enabled: boolean;
  token_expires_at: string | null;
  created_at: string;
}

export interface SocialPostInfo {
  id: string;
  platform: SocialPlatform;
  content: string;
  status: SocialPostStatus;
  article_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_url: string | null;
  error_message: string | null;
  created_at: string;
}

// ─── Comment Bans ─────────────────────────────────────────────────────────────

export interface CommentBanInfo {
  id: string;
  email: string | null;
  ip_address: string | null;
  reason: string | null;
  created_at: string;
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

// ─── Engagement (likes, shares, commentaires anonymes) ────────────────────────

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'shadow_banned';
export type SharePlatform = 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'telegram' | 'pinterest' | 'copy';

export interface LikeResponse {
  article_id: string;
  likes_count: number;
  liked: boolean;
}

export interface ShareResponse {
  article_id: string;
  platform: SharePlatform;
  shares_count: number;
  by_platform: Record<string, number>;
}

export interface PublicCommentItem {
  id: string;
  content: string;
  status: CommentStatus;
  parent_id: string | null;
  author_name: string | null;
  author_email: string | null;
  author_website: string | null;
  likes_count: number;
  replies_count: number;
  created_at: string;
}

/** Item utilisé dans la page de modération (management) */
export interface CommentListItem {
  id: string;
  article_id: string;
  article_title: string;
  parent_id: string | null;
  author_name: string | null;
  author_email: string | null;
  author_website: string | null;
  content: string;
  status: CommentStatus;
  likes_count: number;
  replies_count: number;
  ip_address: string | null;
  created_at: string;
}

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  body: string;
  time: string;
  read: boolean;
  action_url: string | null;
}
