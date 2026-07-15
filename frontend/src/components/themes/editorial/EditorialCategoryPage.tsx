'use client';
import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { EditorialHeader, EditorialFooter } from './EditorialShared';
import { VideoCardThumb } from '../shared/VideoCardThumb';

const cardGradients = [
  'from-zinc-100 to-zinc-200',
  'from-blue-50 to-blue-100',
  'from-emerald-50 to-emerald-100',
  'from-violet-50 to-violet-100',
  'from-amber-50 to-amber-100',
  'from-rose-50 to-rose-100',
];

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface CategoryPageProps {
  blog: BlogInfo;
  category: PublicCategory;
  articles: PublicArticle[];
  categories: PublicCategory[];
  basePath: string;
}

export default function EditorialCategoryPage({
  blog,
  category,
  articles,
  categories,
  basePath,
}: CategoryPageProps) {
  const primaryColor = blog.primary_color || '#18181b';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditorialHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <Link
          href={`${basePath}/categories`}
          className="text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-6 inline-flex items-center gap-2"
        >
          ← All Topics
        </Link>

        {category.cover_image_url && (
          <div className="relative h-48 rounded-2xl overflow-hidden mb-8 mt-4">
            <Image
              src={category.cover_image_url}
              alt={category.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <h1 className="text-5xl font-bold text-zinc-900 mt-3 mb-3">{category.name}</h1>
        {category.description && (
          <p className="text-zinc-400 text-lg">{category.description}</p>
        )}
        <div className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-bold text-zinc-600">
          <BookOpen className="h-4 w-4" />
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-8 mt-8">
          Articles in {category.name}
        </p>

        {articles.length === 0 ? (
          <div className="py-24 text-center">
            <BookOpen className="h-14 w-14 mx-auto mb-5 text-zinc-200" />
            <p className="text-xl font-bold text-zinc-400 mb-2">No articles yet</p>
            <p className="text-sm text-zinc-400 mb-6">
              Articles in this category will appear here once they&apos;ve been published.
            </p>
            <Link
              href={basePath || "/"}
              className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
              style={{ color: primaryColor }}
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a, i) => (
              <Link key={a.id} href={`${basePath}/${a.slug}`} className="group flex flex-col">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 ring-0 group-hover:ring-2 transition-all ring-offset-2 ring-[var(--cp)]">
                  {a.article_type === 'video' ? (
                    <VideoCardThumb videoUrl={a.video_url} coverImageUrl={a.cover_image_url} />
                  ) : a.cover_image_url ? (
                    <Image
                      src={a.cover_image_url}
                      alt={a.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${cardGradients[i % cardGradients.length]}`}
                    />
                  )}
                  {a.category_name && (
                    <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-zinc-700">
                      {a.category_name}
                    </span>
                  )}
                </div>

                {!a.cover_image_url && a.category_name && (
                  <p
                    className="text-[10px] font-black uppercase tracking-wider mb-1.5"
                    style={{ color: primaryColor }}
                  >
                    {a.category_name}
                  </p>
                )}

                <h3 className="text-base font-bold text-zinc-900 leading-snug mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
                  {a.title}
                </h3>
                {a.excerpt && (
                  <p className="text-sm text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                    {a.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto pt-2 border-t border-zinc-100 flex-wrap">
                  {a.author_name && <span>{a.author_name}</span>}
                  {a.author_name && <span>·</span>}
                  <span>{formatDate(a.published_at)}</span>
                  {a.reading_time_minutes && (
                    <>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{a.reading_time_minutes} min read</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <EditorialFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
