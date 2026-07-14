import { useState, useEffect, useCallback } from 'react';

interface BookmarkItem {
  slug: string;
  title: string;
  blogSlug: string;
  savedAt: string;
}

const STORAGE_KEY = 'smarterbloggers_bookmarks';

function loadBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveBookmarks(items: BookmarkItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

/** Persists bookmarks to localStorage. */
export function useBookmark(slug: string, title: string, blogSlug: string) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const items = loadBookmarks();
    setBookmarked(items.some((i) => i.slug === slug && i.blogSlug === blogSlug));
  }, [slug, blogSlug]);

  const toggle = useCallback(() => {
    const items = loadBookmarks();
    const exists = items.some((i) => i.slug === slug && i.blogSlug === blogSlug);
    const next = exists
      ? items.filter((i) => !(i.slug === slug && i.blogSlug === blogSlug))
      : [...items, { slug, title, blogSlug, savedAt: new Date().toISOString() }];
    saveBookmarks(next);
    setBookmarked(!exists);
  }, [slug, title, blogSlug]);

  return { bookmarked, toggle };
}

/** Returns all saved bookmarks (for a bookmarks page). */
export function useAllBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  const remove = useCallback((slug: string, blogSlug: string) => {
    const next = loadBookmarks().filter(
      (i) => !(i.slug === slug && i.blogSlug === blogSlug),
    );
    saveBookmarks(next);
    setBookmarks(next);
  }, []);

  return { bookmarks, remove };
}
