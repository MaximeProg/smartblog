'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { CreativeHeader, CreativeFooter } from './CreativeShared';
import { AdRotator } from '../shared/AdRotator';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  articles: PublicArticle[];
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

export default function CreativeCategories({ blog, categories, articles: _articles, basePath }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#7c3aed';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      <section className="bg-zinc-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span
            className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 inline-block text-zinc-950"
            style={{ backgroundColor: primaryColor }}
          >
            {t('explore')}
          </span>
          <h1 className="text-6xl font-black text-white leading-none">{t('categoriesHeroTitle')}</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {categories.length === 0 ? (
          <div className="bg-zinc-950 rounded-2xl p-20 text-center">
            <p className="text-5xl font-black text-white mb-4">{t('noCategoriesYet')}</p>
            <p className="text-zinc-500 text-lg">{t('noCategoriesYetDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="group relative h-64 rounded-xl overflow-hidden cursor-pointer block"
              >
                {c.cover_image_url ? (
                  <Image
                    src={c.cover_image_url}
                    alt={c.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % 6]}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70 transition-colors duration-300" />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-white/10 backdrop-blur-sm text-white text-xs font-black px-2.5 py-1 rounded-full">
                    {c.articles_count}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl font-black text-white mb-1">{c.name}</h2>
                  <p className="text-white/60 text-sm">
                    {c.articles_count !== 1 ? t('articleCountPlural', { count: c.articles_count }) : t('articleCount', { count: c.articles_count })}
                  </p>
                  {c.description && (
                    <p className="text-white/50 text-xs line-clamp-1 mt-1">{c.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="py-4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} variant="strip" />
      </div>

      <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
