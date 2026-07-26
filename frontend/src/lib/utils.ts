import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date | null | undefined, locale = 'en'): string {
  if (!date) return '–';
  const now = new Date();
  const then = new Date(date as string | Date);
  if (isNaN(then.getTime())) return '–';
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === 'fr' ? "À l'instant" : 'Just now';
  if (diffMins < 60) return locale === 'fr' ? `Il y a ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24) return locale === 'fr' ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  if (diffDays < 7) return locale === 'fr' ? `Il y a ${diffDays}j` : `${diffDays}d ago`;
  return formatDate(date, locale);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function estimateReadTime(content: string, locale = 'en'): string {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return locale === 'fr' ? `${minutes} min de lecture` : `${minutes} min read`;
}

/**
 * Extracts the real backend error message from an axios error, regardless of
 * which of the two response shapes this backend uses: the custom
 * `SmarterBloggersException` handler returns a flat `{ error, message,
 * trace_id }` body (most endpoints), while a few raw `HTTPException(...)`
 * call sites fall through to FastAPI's default `{ detail: "..." }` shape.
 * Checking only `.detail` (the common but wrong assumption) silently misses
 * the flat-shape message on most errors, which is why real backend error
 * text was going missing across the app and falling back to a generic
 * hardcoded string instead.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: any } })?.response?.data;
  if (!data) return fallback;
  if (typeof data.message === 'string' && data.message) return data.message;
  if (typeof data.detail === 'string' && data.detail) return data.detail;
  if (data.detail && typeof data.detail === 'object' && typeof data.detail.message === 'string') {
    return data.detail.message;
  }
  return fallback;
}
