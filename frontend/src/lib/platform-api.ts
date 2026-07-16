const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const BLOG_SLUG = process.env.PLATFORM_BLOG_SLUG ?? 'smarterbloggers-official';

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
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_articles: number;
  max_storage_mb: number;
  max_members: number;
  max_ai_requests: number;
  max_custom_domains: number;
  features: string[];
  is_highlighted: boolean;
  is_default: boolean;
  sort_order: number;
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

export interface PlatformStats {
  active_blogs: number;
  published_articles: number;
  monthly_readers: number;
  uptime_pct: number | null;
}

export async function getPlatformStats(): Promise<PlatformStats | null> {
  try {
    return await apiFetch(`${API_URL}/api/v1/platform/stats`, 120);
  } catch {
    return null;
  }
}

export async function getPlatformPage(
  slug: string,
  lang: string,
): Promise<Record<string, unknown> | null> {
  try {
    const data = await apiFetch(`${API_URL}/api/v1/platform/pages/${slug}?lang=${lang}`, 300);
    return data?.content ?? null;
  } catch {
    return null;
  }
}

export async function getUiTranslations(
  namespace: string,
  lang: string,
): Promise<Record<string, unknown> | null> {
  try {
    const data = await apiFetch(`${API_URL}/api/v1/platform/ui-translations?namespace=${namespace}&lang=${lang}`, 300);
    return data?.messages ?? null;
  } catch {
    return null;
  }
}
