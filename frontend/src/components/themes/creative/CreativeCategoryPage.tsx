'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { CreativeHeader, CreativeFooter } from './CreativeShared';
import { VideoCardThumb } from '../shared/VideoCardThumb';

interface Props {
  blog: BlogInfo;
  category: PublicCategory;
  articles: PublicArticle[];
  categories: PublicCategory[];
  basePath: string;
}

const GRADIENTS = [
  'from-violet-900 to-indigo-900',
  'from-rose-900 to-pink-800',
  'from-blue-900 to-cyan-800',
  'from-emerald-900 to-teal-800',
  'from-amber-900 to-orange-800',
  'from-zinc-800 to-zinc-700',
];

function formatDate(d: string | null, locale: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CreativeCategoryPage({
  blog,
  category,
  articles,
  categories,
  basePath,
}: Props) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#7c3aed';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <section className="bg-zinc-950 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link
            href={`${basePath}/categories`}
            className="text-zinc-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
          >
            ← {t('allCategoriesLink')}
          </Link>
          <h1 className="text-5xl font-black text-white mt-4 mb-3">{category.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {category.description && (
              <p className="text-zinc-400 text-sm">{category.description}</p>
            )}
            <span
              className="text-xs font-black px-3 py-1 rounded-full text-zinc-950"
              style={{ backgroundColor: primaryColor }}
            >
              {category.articles_count !== 1 ? t('articleCountPlural', { count: category.articles_count }) : t('articleCount', { count: category.articles_count })}
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {articles.length === 0 ? (
          <div className="bg-zinc-950 rounded-2xl p-20 text-center">
            <p className="text-5xl font-black text-white mb-4">{t('noArticles')}</p>
            <p className="text-zinc-500 text-lg">
              {t('noArticlesInCategoryDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((a, i) => {
              const isWide = i % 7 === 0;
              const isPortrait = i % 2 === 0;
              const aspectClass = isWide
                ? 'aspect-[16/7]'
                : isPortrait
                ? 'aspect-[3/4]'
                : 'aspect-[4/3]';
              return (
                <Link
                  key={a.id}
                  href={`${basePath}/${a.slug}`}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer block ${isWide ? 'sm:col-span-2' : ''} ${aspectClass}`}
                >
                  {a.article_type === 'video' ? (
                    <VideoCardThumb videoUrl={a.video_url} coverImageUrl={a.cover_image_url} />
                  ) : a.cover_image_url ? (
                    <Image
                      src={a.cover_image_url}
                      alt={a.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % 6]}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/0 group-hover:from-black/80 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {a.category_name && (
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 text-zinc-950 inline-block"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {a.category_name}
                      </span>
                    )}
                    <p className="text-base sm:text-lg font-black text-white leading-tight line-clamp-2">
                      {a.title}
                    </p>
                    <p className="text-white/50 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {a.author_name && <span>{a.author_name}</span>}
                      {a.author_name && a.published_at && <span> · </span>}
                      {a.published_at && <span>{formatDate(a.published_at, locale)}</span>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="py-4" />

      <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
