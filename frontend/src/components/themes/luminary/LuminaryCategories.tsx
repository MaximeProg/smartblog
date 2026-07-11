'use client';
import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';
import { AdRotator } from '../shared/AdRotator';

const GRADIENTS = [
  'from-zinc-800 to-zinc-950',
  'from-amber-900 to-zinc-900',
  'from-stone-800 to-zinc-900',
  'from-slate-800 to-zinc-950',
  'from-neutral-800 to-stone-900',
];

function grad(id: string): string {
  return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length];
}

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  articles: PublicArticle[];
  basePath: string;
}

export default function LuminaryCategories({ blog, categories, articles, basePath }: Props) {
  const primaryColor = blog.primary_color || '#b8960c';

  return (
    <div
      className="bg-[#faf8f4] min-h-screen text-zinc-900"
      style={{ '--cp': primaryColor } as CSSProperties}
    >
      <LuminaryHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <Link
          href={basePath}
          className="font-sans text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 mb-10"
        >
          &larr; Home
        </Link>

        <div className="text-center mb-12">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-400 mb-4">
            Index
          </p>
          <h1 className="font-serif italic text-5xl sm:text-6xl text-zinc-900 mb-4">
            Browse Topics
          </h1>
          <div className="w-16 h-px bg-zinc-300 mx-auto" />
        </div>

        {categories.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif italic text-3xl text-zinc-300 mb-4">No categories yet.</p>
            <p className="font-sans text-sm text-zinc-400 mb-8">
              Topics will appear here once they have been created.
            </p>
            <Link
              href={basePath}
              className="font-sans text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors underline underline-offset-4"
            >
              Return home
            </Link>
          </div>
        ) : (
          <>
            <p className="font-sans text-xs text-zinc-400 text-center mb-12">
              {categories.length} topic{categories.length !== 1 ? 's' : ''} &middot;{' '}
              {articles.length} article{articles.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((c, i) => (
                <Link
                  key={c.id}
                  href={`${basePath}/categories/${c.slug}`}
                  className="group relative block overflow-hidden aspect-[4/3]"
                >
                  {c.cover_image_url ? (
                    <Image
                      src={c.cover_image_url}
                      alt={c.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <h2 className="font-serif text-2xl sm:text-3xl text-white leading-tight mb-2 group-hover:opacity-90 transition-opacity">
                      {c.name}
                    </h2>
                    <p className="font-sans text-xs uppercase tracking-widest text-white/60">
                      {c.articles_count} article{c.articles_count !== 1 ? 's' : ''}
                    </p>
                    {c.description && (
                      <p className="font-sans text-xs text-white/50 mt-2 line-clamp-2 max-w-xs">
                        {c.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pb-20" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} variant="strip" />
      </div>

      <LuminaryFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
