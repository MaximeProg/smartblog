'use client';
import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';

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

function shortDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  blog: BlogInfo;
  category: PublicCategory;
  articles: PublicArticle[];
  categories: PublicCategory[];
  basePath: string;
}

export default function LuminaryCategoryPage({
  blog,
  category,
  articles,
  categories,
  basePath,
}: Props) {
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

      <div className="relative w-full h-[40vh] min-h-[280px]">
        {category.cover_image_url ? (
          <Image
            src={category.cover_image_url}
            alt={category.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${grad(category.id)}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 sm:px-10 pb-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/60 mb-2">
            Topic
          </p>
          <h1 className="font-serif italic text-4xl sm:text-5xl text-white leading-tight mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="font-sans text-sm text-white/70 max-w-xl leading-relaxed mb-2">
              {category.description}
            </p>
          )}
          <p className="font-sans text-xs text-white/50 uppercase tracking-widest">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`${basePath}/categories`}
          className="font-sans text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 mb-12"
        >
          &larr; All Topics
        </Link>

        {articles.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif italic text-3xl text-zinc-300 mb-4">No articles yet.</p>
            <p className="font-sans text-sm text-zinc-400 mb-8">
              Articles in {category.name} will appear here once published.
            </p>
            <Link
              href={`${basePath}/categories`}
              className="font-sans text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors underline underline-offset-4"
            >
              Browse all topics
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(a => (
              <Link
                key={a.id}
                href={`${basePath}/${a.slug}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden mb-4">
                  {a.cover_image_url ? (
                    <Image
                      src={a.cover_image_url}
                      alt={a.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${grad(a.id)}`} />
                  )}
                </div>
                <h3 className="font-serif text-base text-zinc-900 leading-snug mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
                  {a.title}
                </h3>
                {a.excerpt && (
                  <p className="font-sans text-sm text-zinc-500 leading-relaxed line-clamp-2 mb-3">
                    {a.excerpt}
                  </p>
                )}
                <p className="font-sans text-xs text-zinc-400 mt-auto">
                  {a.author_name && <span>{a.author_name} &middot; </span>}
                  {shortDate(a.published_at)}
                  {a.reading_time_minutes && (
                    <span> &middot; {a.reading_time_minutes} min read</span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="pb-20" />

      <LuminaryFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
