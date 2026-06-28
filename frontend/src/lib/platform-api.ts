const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const BLOG_SLUG = process.env.PLATFORM_BLOG_SLUG ?? 'nexusblog-official';

// ── Types ─────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  category_slug: string | null;
  category_name: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  articles_count: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  name_fr: string;
  slug: string;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  description: string | null;
  description_fr: string | null;
  features: string[];
  features_fr: string[];
  is_highlighted: boolean;
  badge: string | null;
  badge_fr: string | null;
}

// ── Fetchers ──────────────────────────────────────────────────────────

async function apiFetch(url: string, revalidate: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getPlatformArticles(): Promise<Article[]> {
  try {
    const data = await apiFetch(
      `${API_URL}/api/v1/public/${BLOG_SLUG}/articles?limit=50`,
      300,
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPlatformCategories(): Promise<Category[]> {
  try {
    const data = await apiFetch(
      `${API_URL}/api/v1/public/${BLOG_SLUG}/categories`,
      300,
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  try {
    const data = await apiFetch(`${API_URL}/api/v1/platform/pricing`, 3600);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
