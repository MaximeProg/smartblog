import { useState, useEffect, useCallback } from 'react';
import { bookmarkApi } from '@/lib/api';

// ── localStorage fallback (utilisateurs non connectés) ──────────

interface BookmarkItem {
  slug: string;
  title: string;
  blogSlug: string;
  articleId?: string;
  savedAt: string;
}

const STORAGE_KEY = 'smarterbloggers_bookmarks';

function loadLocal(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function saveLocal(items: BookmarkItem[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  catch {}
}

// ── Hook principal ──────────────────────────────────────────────

export function useBookmark(
  slug: string,
  title: string,
  blogSlug: string,
  options?: { tenantId?: string; articleId?: string; userId?: string },
) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const { tenantId, articleId, userId } = options ?? {};
  const useApi = !!(tenantId && articleId && userId);

  useEffect(() => {
    if (useApi && tenantId && articleId) {
      bookmarkApi.list(tenantId).then(r => {
        setBookmarked(r.data.some(b => b.article_id === articleId));
      }).catch(() => {
        setBookmarked(loadLocal().some(i => i.slug === slug && i.blogSlug === blogSlug));
      });
    } else {
      setBookmarked(loadLocal().some(i => i.slug === slug && i.blogSlug === blogSlug));
    }
  }, [slug, blogSlug, tenantId, articleId, useApi]);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (useApi && tenantId && articleId) {
        if (bookmarked) {
          await bookmarkApi.remove(tenantId, articleId);
          setBookmarked(false);
        } else {
          await bookmarkApi.add(tenantId, articleId);
          setBookmarked(true);
        }
      } else {
        // localStorage fallback
        const items = loadLocal();
        const exists = items.some(i => i.slug === slug && i.blogSlug === blogSlug);
        const next = exists
          ? items.filter(i => !(i.slug === slug && i.blogSlug === blogSlug))
          : [...items, { slug, title, blogSlug, articleId, savedAt: new Date().toISOString() }];
        saveLocal(next);
        setBookmarked(!exists);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [slug, title, blogSlug, tenantId, articleId, useApi, bookmarked, loading]);

  return { bookmarked, toggle, loading };
}

// ── Hook liste (page bookmarks) ─────────────────────────────────

export function useAllBookmarks(options?: { tenantId?: string }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    if (options?.tenantId) {
      bookmarkApi.list(options.tenantId).then(r => {
        setBookmarks(r.data.map(b => ({
          slug: b.article_slug,
          title: b.article_title,
          blogSlug: '',
          articleId: b.article_id,
          savedAt: b.created_at,
        })));
      }).catch(() => setBookmarks(loadLocal()));
    } else {
      setBookmarks(loadLocal());
    }
  }, [options?.tenantId]);

  const remove = useCallback(async (slug: string, blogSlug: string, articleId?: string) => {
    if (options?.tenantId && articleId) {
      await bookmarkApi.remove(options.tenantId, articleId).catch(() => {});
    }
    const next = loadLocal().filter(i => !(i.slug === slug && i.blogSlug === blogSlug));
    saveLocal(next);
    setBookmarks(prev => prev.filter(i => !(i.slug === slug && i.blogSlug === blogSlug)));
  }, [options?.tenantId]);

  return { bookmarks, remove };
}
