'use client';
import { useCallback, type CSSProperties } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { MinimalHeader, MinimalFooter } from './MinimalShared';
import { AdRotator } from '../shared/AdRotator';

interface CategoryPageProps {
  blog: BlogInfo;
  category: PublicCategory;
  articles: PublicArticle[];
  categories: PublicCategory[];
  basePath: string;
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function MinimalCategoryPage({
  blog,
  category,
  articles,
  categories,
  basePath,
}: CategoryPageProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const primaryColor = blog.primary_color || '#18181b';

  const aHref = useCallback(
    (s: string) => `/${locale}/${blog.slug}/${s}`,
    [locale, blog.slug],
  );

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MinimalHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-24">
        <Link
          href={`${basePath}/categories`}
          className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 mb-5"
        >
          ← Topics
        </Link>

        <h1 className="text-4xl font-bold text-zinc-950 mt-2 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-zinc-400 text-base mb-2">{category.description}</p>
        )}
        <p className="text-sm text-zinc-400">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </p>

        <div className="mt-8">
          {articles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-400">No articles in this topic yet.</p>
            </div>
          ) : (
            <div>
              {articles.map(a => (
                <Link
                  key={a.id}
                  href={aHref(a.slug)}
                  className="group py-8 border-b border-zinc-100 last:border-0 flex items-start justify-between gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="text-[11px] text-zinc-400">{formatDate(a.published_at)}</span>
                      {a.reading_time_minutes && (
                        <>
                          <span className="text-zinc-300">·</span>
                          <span className="text-[11px] text-zinc-400">
                            {a.reading_time_minutes} min read
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 leading-snug mb-2 group-hover:text-[var(--cp)] transition-colors">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
                        {a.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 hidden sm:block text-right pt-1">
                    {a.views_count > 0 && (
                      <p className="text-xs text-zinc-300">{a.views_count.toLocaleString()} views</p>
                    )}
                    {a.likes_count > 0 && (
                      <p className="text-xs text-zinc-300 mt-0.5">♥ {a.likes_count}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} variant="strip" />
      </div>

      <MinimalFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
