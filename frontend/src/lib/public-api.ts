const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface TemplateContentFields {
  heroHeadline?: string;
  heroSubheadline?: string;
  heroCta?: string;
  tagline?: string;
  featuredSectionTitle?: string;
  latestSectionTitle?: string;
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterCta?: string;
  footerTagline?: string;
  sectionOrder?: string[];
}

export interface TemplateConfig {
  content?: TemplateContentFields;
  header?: {
    topBar?: { enabled?: boolean; showDate?: boolean; showSocial?: boolean; showNewsletter?: boolean; showRss?: boolean };
    subscribe?: { enabled?: boolean; label?: string };
    nav?: { links?: { label: string; url: string }[] };
  };
  footer?: {
    description?: string;
    showCategories?: boolean;
    navLinks?: { label: string; url: string }[];
    showSocialLinks?: boolean;
    showNewsletterMini?: boolean;
    newsletterMiniText?: string;
    copyrightText?: string;
    showPoweredBy?: boolean;
  };
  home?: {
    hero?: { enabled?: boolean; sectionTitle?: string };
    categoriesStrip?: { enabled?: boolean; label?: string };
    newsletter?: { enabled?: boolean; title?: string; description?: string; buttonLabel?: string; placeholder?: string; disclaimer?: string };
    latest?: { enabled?: boolean; sectionTitle?: string };
    sidebar?: { popularArticles?: boolean; popularTitle?: string; categories?: boolean; categoriesTitle?: string; tags?: boolean; tagsTitle?: string; newsletterMini?: boolean };
  };
  about?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  article?: Record<string, unknown>;
}

export interface BlogInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  cover_image_url: string | null;
  language: string;
  theme: string;
  primary_color: string;
  font_family: string;
  social_links: Record<string, string>;
  template_config: TemplateConfig | null;
  enabled_languages: string[];
  owner_affiliate_code: string | null;
}

export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  article_type: 'article' | 'photo' | 'video' | 'audio' | 'podcast' | 'mixed' | null;
  video_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  category_slug: string | null;
  category_name: string | null;
  tags: string[];
  published_at: string | null;
  reading_time_minutes: number | null;
  views_count: number;
  likes_count: number;
  is_paid: boolean;
  price: number | null;
}

export interface PublicArticleFull extends PublicArticle {
  content: string | null;
  audio_url: string | null;
  episode_number: number | null;
  season: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  articles_count: number;
}

async function fetchPublic<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${API_BASE}/api/v1/public${path}`, {
      ...options,
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Public API ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export const publicApi = {
  getBlogInfo: (slug: string, lang?: string) =>
    fetchPublic<BlogInfo>(`/${slug}${lang ? `?lang=${lang}` : ''}`),

  getArticles: (slug: string, params?: {
    category?: string;
    tag?: string;
    q?: string;
    type?: string;
    limit?: number;
    cursor?: string;
    lang?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.q) qs.set('q', params.q);
    if (params?.type) qs.set('type', params.type);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    if (params?.lang) qs.set('lang', params.lang);
    const query = qs.toString() ? `?${qs}` : '';
    return fetchPublic<PublicArticle[]>(`/${slug}/articles${query}`);
  },

  getArticle: (slug: string, articleSlug: string, lang?: string) =>
    fetchPublic<PublicArticleFull>(`/${slug}/articles/${articleSlug}${lang ? `?lang=${lang}` : ''}`),

  getCategories: (slug: string) =>
    fetchPublic<PublicCategory[]>(`/${slug}/categories`),

  search: (slug: string, params: {
    q?: string;
    category_id?: string;
    lang?: string;
    page?: number;
    size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.category_id) qs.set('category_id', params.category_id);
    if (params.lang) qs.set('lang', params.lang);
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    const query = qs.toString() ? `?${qs}` : '';
    return fetchPublic<{ total: number; hits: { id: string; title: string; slug: string; excerpt?: string; cover_image_url?: string; category_name?: string; published_at?: string; highlight?: Record<string, string[]> }[]; query: string | null }>(`/${slug}/search${query}`);
  },
};
