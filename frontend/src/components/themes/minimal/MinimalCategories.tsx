'use client';
import { type CSSProperties } from 'react';
import Link from 'next/link';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { MinimalHeader, MinimalFooter } from './MinimalShared';

interface CategoriesProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  articles: PublicArticle[];
  basePath: string;
}

export default function MinimalCategories({ blog, categories, articles, basePath }: CategoriesProps) {
  const primaryColor = blog.primary_color || '#18181b';
  const totalArticles = articles.length;

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MinimalHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <h1 className="text-5xl font-bold text-zinc-950 mb-3">Topics</h1>
        <p className="text-zinc-400 text-base mb-10">
          {categories.length} topic{categories.length !== 1 ? 's' : ''} ·{' '}
          {totalArticles} article{totalArticles !== 1 ? 's' : ''}
        </p>

        {categories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-zinc-400">No topics yet.</p>
          </div>
        ) : (
          <div>
            {categories.map(c => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="group flex items-start justify-between py-6 border-b border-zinc-100 last:border-0"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-xl font-bold text-zinc-950 group-hover:text-[var(--cp)] transition-colors mb-1">
                    {c.name}
                  </h2>
                  {c.description && (
                    <p className="text-sm text-zinc-500 line-clamp-1">{c.description}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-zinc-200 group-hover:text-[var(--cp)] transition-colors leading-none">
                    {c.articles_count}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    article{c.articles_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
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
