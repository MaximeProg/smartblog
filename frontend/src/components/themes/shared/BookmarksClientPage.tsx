'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bookmark, Trash2, ArrowLeft, BookOpen } from 'lucide-react';
import type { BlogInfo } from '@/lib/public-api';
import { useAllBookmarks } from '@/hooks/useBookmark';

interface Props {
  blog: BlogInfo;
  slug: string;
  locale: string;
  basePath?: string;
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BookmarksClientPage({ blog, slug, locale, basePath: baseProp }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#3b82f6';
  const basePath = baseProp !== undefined ? baseProp : `/${locale}/${slug}`;
  const { bookmarks, remove } = useAllBookmarks();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client to avoid hydration mismatch with localStorage
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--blog-font)' }}>
        <div className="max-w-2xl mx-auto px-5 pt-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--blog-font)' }}>
      {/* Header bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link
            href={basePath || "/"}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {blog.name}
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 py-10">
        {/* Page title */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{ backgroundColor: `${primaryColor}14`, color: primaryColor }}
          >
            <Bookmark className="h-3.5 w-3.5" />
            {t('savedArticlesLabel')}
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 leading-tight">
            {t('myBookmarks')}
          </h1>
          {bookmarks.length > 0 && (
            <p className="text-sm text-zinc-400 mt-2">
              {bookmarks.length > 1 ? t('savedCountPlural', { count: bookmarks.length }) : t('savedCount', { count: bookmarks.length })}
            </p>
          )}
        </div>

        {bookmarks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: `${primaryColor}14` }}
            >
              <BookOpen className="h-7 w-7" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-lg font-bold text-zinc-800 mb-2">
              {t('noBookmarksYet')}
            </h2>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-6">
              {t('noBookmarksDesc')}
            </p>
            <Link
              href={basePath || "/"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {t('exploreArticles')}
            </Link>
          </div>
        ) : (
          /* Bookmark list */
          <ul className="divide-y divide-zinc-100">
            {bookmarks.map((item) => (
              <li key={`${item.blogSlug}-${item.slug}`} className="py-5 flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
                  style={{ backgroundColor: `${primaryColor}14` }}
                >
                  <Bookmark className="h-4 w-4" style={{ color: primaryColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`${basePath}/${item.slug}`}
                    className="block text-[15px] font-semibold text-zinc-900 hover:text-[var(--cp)] leading-snug transition-colors line-clamp-2"
                    style={{ '--cp': primaryColor } as React.CSSProperties}
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-zinc-400 mt-1">
                    {t('savedOn', { date: formatDate(item.savedAt, locale) })}
                  </p>
                </div>

                <button
                  onClick={() => remove(item.slug, item.blogSlug)}
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title={t('deleteBookmark')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
