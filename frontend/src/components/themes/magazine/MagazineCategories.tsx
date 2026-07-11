'use client';
import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { MagazineHeader, MagazineFooter } from './MagazineShared';
import { AdRotator } from '../shared/AdRotator';

interface CategoriesProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  articles: PublicArticle[];
  basePath: string;
}

export default function MagazineCategories({ blog, categories, articles, basePath }: CategoriesProps) {
  const primaryColor = blog.primary_color || '#e11d48';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      <div className="border-t-4" style={{ borderColor: primaryColor }}>
        <div className="bg-zinc-950 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <span className="text-[10px] font-black uppercase tracking-widest mb-4 block" style={{ color: primaryColor }}>All Topics</span>
            <h1 className="text-5xl font-black text-white leading-tight mb-3">Explore Our Coverage</h1>
            <p className="text-zinc-400 text-lg">{categories.length} topic{categories.length !== 1 ? 's' : ''} — {articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {categories.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-bold text-zinc-300">No topics yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => {
              const catArticles = articles.filter(a => a.category_slug === c.slug);
              const cover = catArticles.find(a => a.cover_image_url)?.cover_image_url || c.cover_image_url;
              return (
                <Link
                  key={c.id}
                  href={`${basePath}/categories/${c.slug}`}
                  className="group border-t-4 bg-white border border-zinc-200 hover:shadow-md transition-shadow rounded-b overflow-hidden flex flex-col"
                  style={{ borderTopColor: primaryColor }}
                >
                  {cover && (
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={cover}
                        alt={c.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-zinc-950 mb-2 group-hover:text-[var(--cp)] transition-colors">{c.name}</h3>
                    {c.description && (
                      <p className="text-sm text-zinc-500 leading-relaxed mb-4 line-clamp-2 flex-1">{c.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: primaryColor }}>
                        {c.articles_count} {c.articles_count === 1 ? 'article' : 'articles'}
                      </span>
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-900 transition-colors">Explore →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} variant="strip" />
      </div>

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
