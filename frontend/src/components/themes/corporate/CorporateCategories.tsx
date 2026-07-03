'use client';

import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import {
  CorporateHeader, CorporateFooter, NewsletterSection,
  CardMedium, fmtDateShort, grad,
} from './shared';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  articles: PublicArticle[];
  basePath: string;
}

export default function CorporateCategoriesPage({ blog, categories, articles, basePath }: Props) {
  const primaryColor = blog.primary_color || '#2563eb';
  const cpStyle = { '--cp': primaryColor } as CSSProperties;

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>
      <CorporateHeader
        blog={blog}
        categories={categories}
        primaryColor={primaryColor}
        minimal
        basePath={basePath}
      />

      {/* Hero */}
      <section className="bg-slate-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-8">
            <Link href={basePath} className="hover:text-slate-300 transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">Catégories</span>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Explorez nos thématiques
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              {articles.length} article{articles.length > 1 ? 's' : ''} répartis en {categories.length} domaine{categories.length > 1 ? 's' : ''}.
              Choisissez votre thématique et plongez dans les analyses de nos experts.
            </p>
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {categories.length === 0 ? (
          <div className="py-32 text-center">
            <BookOpen className="h-14 w-14 mx-auto mb-5 text-slate-200" />
            <p className="text-xl font-bold text-slate-400 mb-2">Aucune catégorie pour l'instant</p>
            <Link href={basePath}
              className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
              style={{ color: primaryColor }}>
              <ArrowRight className="h-4 w-4 rotate-180" /> Retour à l'accueil
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => {
              const catArticles = articles.filter(a => a.category_slug === cat.slug);
              return (
                <Link
                  key={cat.slug}
                  href={`${basePath}/categories/${cat.slug}`}
                  className="group relative flex flex-col rounded-3xl overflow-hidden border border-slate-100 bg-white hover:shadow-2xl hover:border-[var(--cp)]/20 transition-all duration-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                    {cat.cover_image_url ? (
                      <Image
                        src={cat.cover_image_url}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                        priority={i < 3}
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${grad(cat.id)}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/20">
                        <BookOpen className="h-3.5 w-3.5" />
                        {cat.articles_count} article{cat.articles_count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 h-8 w-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg"
                      style={{ backgroundColor: primaryColor }}>
                      {cat.name[0]}
                    </div>
                  </div>

                  <div className="flex-1 p-6">
                    <h2 className="text-xl font-black text-slate-900 mb-2 group-hover:text-[var(--cp)] transition-colors">
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p className="text-sm text-slate-500 leading-relaxed mb-5 line-clamp-3">{cat.description}</p>
                    )}
                    {catArticles.length > 0 && (
                      <div className="space-y-2 mb-5">
                        {catArticles.slice(0, 2).map(a => (
                          <div key={a.id} className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: primaryColor }} />
                            <span className="text-xs text-slate-500 line-clamp-1 leading-snug">{a.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-bold transition-colors group-hover:text-[var(--cp)]"
                      style={{ color: primaryColor }}>
                      Explorer la catégorie
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent articles */}
      {articles.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-100 py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Articles récents</h2>
              <div className="flex-1 h-px bg-slate-200" />
              <Link href={basePath} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>
                Voir tout
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {articles.slice(0, 4).map(a => (
                <CardMedium key={a.id} article={a} href={`${basePath}/${a.slug}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterSection blog={blog} primaryColor={primaryColor} />
      <CorporateFooter blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} />
    </div>
  );
}
