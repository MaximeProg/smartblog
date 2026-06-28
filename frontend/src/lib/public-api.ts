const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface BlogInfo {
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
}

export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
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
  const timer = setTimeout(() => controller.abort(), 5000);
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
  getBlogInfo: (slug: string) =>
    fetchPublic<BlogInfo>(`/${slug}`),

  getArticles: (slug: string, params?: {
    category?: string;
    tag?: string;
    q?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.q) qs.set('q', params.q);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const query = qs.toString() ? `?${qs}` : '';
    return fetchPublic<PublicArticle[]>(`/${slug}/articles${query}`);
  },

  getArticle: (slug: string, articleSlug: string) =>
    fetchPublic<PublicArticleFull>(`/${slug}/articles/${articleSlug}`),

  getCategories: (slug: string) =>
    fetchPublic<PublicCategory[]>(`/${slug}/categories`),
};
