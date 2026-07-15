'use client';
import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { EditorialHeader, EditorialFooter } from './EditorialShared';
import { AdRotator } from '../shared/AdRotator';

const catGradients = [
  'from-zinc-600 to-zinc-800',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
];

interface CategoriesProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  articles: PublicArticle[];
  basePath: string;
}

export default function EditorialCategories({
  blog,
  categories,
  articles,
  basePath,
}: CategoriesProps) {
  const primaryColor = blog.primary_color || '#18181b';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditorialHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <h1 className="text-5xl font-bold text-zinc-900 mb-3">Explore Topics</h1>
        <p className="text-zinc-400 text-lg">Discover stories across all our categories</p>
        <p className="text-sm text-zinc-400 mt-2">
          {categories.length} topic{categories.length !== 1 ? 's' : ''} &middot;{' '}
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {categories.length === 0 ? (
          <div className="py-24 text-center">
            <BookOpen className="h-14 w-14 mx-auto mb-5 text-zinc-200" />
            <p className="text-xl font-bold text-zinc-400 mb-2">No topics yet</p>
            <p className="text-sm text-zinc-400 mb-6">
              Categories will appear here once they&apos;ve been created.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="group relative h-52 rounded-2xl overflow-hidden block"
              >
                {c.cover_image_url ? (
                  <Image
                    src={c.cover_image_url}
                    alt={c.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${catGradients[i % catGradients.length]}`}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-bold text-xl leading-snug mb-1">{c.name}</p>
                  <p className="text-white/70 text-sm">
                    {c.articles_count} article{c.articles_count !== 1 ? 's' : ''}
                  </p>
                  {c.description && (
                    <p className="text-white/50 text-xs line-clamp-1 mt-1">{c.description}</p>
                  )}
                </div>

                <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-bold">
                  {c.articles_count}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} variant="strip" />
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
