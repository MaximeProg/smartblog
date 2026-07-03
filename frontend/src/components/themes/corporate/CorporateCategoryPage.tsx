'use client';

import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ChevronRight, Clock, Calendar, Heart, Eye, ArrowRight } from 'lucide-react';
import {
  CorporateHeader, CorporateFooter, NewsletterSection,
  CardMedium, fmtDate, grad,
} from './shared';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  category: PublicCategory;
  articles: PublicArticle[];
  basePath: string;
  previewSlug?: string;
}

export default function CorporateCategoryPage({ blog, categories, category, articles, basePath, previewSlug }: Props) {
  const primaryColor = blog.primary_color || '#2563eb';
  const otherCategories = categories.filter(c => c.slug !== category.slug);
  const cpStyle = { '--cp': primaryColor } as CSSProperties;
  const pq = previewSlug ? `?preview=${previewSlug}` : '';

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>
      <CorporateHeader
        blog={blog}
        categories={categories}
        primaryColor={primaryColor}
        minimal
        basePath={basePath}
        previewSlug={previewSlug}
      />

      {/* Category hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {category.cover_image_url && (
          <div className="absolute inset-0">
            <Image
              src={category.cover_image_url}
              alt={category.name}
              fill
              className="object-cover opacity-20"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href={basePath} className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`${basePath}/categories`} className="hover:text-white transition-colors">Catégories</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{category.name}</span>
          </div>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg"
                style={{ backgroundColor: primaryColor }}>
                {category.name[0]}
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-lg text-slate-300 leading-relaxed mb-6">{category.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{articles.length} article{articles.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles + sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">

          {/* Articles */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                Articles — {category.name}
              </h2>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">{articles.length} résultat{articles.length > 1 ? 's' : ''}</span>
            </div>

            {articles.length === 0 ? (
              <div className="py-24 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-5 text-slate-200" />
                <p className="text-xl font-bold text-slate-400 mb-2">Aucun article pour l'instant</p>
                <p className="text-slate-400 text-sm mb-6">Revenez bientôt pour de nouveaux contenus dans cette catégorie.</p>
                <Link href={basePath}
                  className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}>
                  <ArrowRight className="h-4 w-4 rotate-180" /> Voir tous les articles
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* First article: large featured */}
                {articles[0] && (
                  <Link href={`${basePath}/${articles[0].slug}`}
                    className="group flex flex-col sm:flex-row gap-6 rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-xl hover:border-[var(--cp)]/20 transition-all duration-300">
                    <div className="relative sm:w-72 aspect-[16/9] sm:aspect-auto sm:h-48 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {articles[0].cover_image_url ? (
                        <Image src={articles[0].cover_image_url} alt={articles[0].title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width:640px) 100vw, 288px" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${grad(articles[0].id)}`} />
                      )}
                      <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-white"
                        style={{ backgroundColor: primaryColor }}>
                        À la une
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-[var(--cp)] transition-colors leading-snug mb-3">
                        {articles[0].title}
                      </h3>
                      {articles[0].excerpt && (
                        <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{articles[0].excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        {articles[0].author_name && (
                          <span className="font-medium text-slate-600">{articles[0].author_name}</span>
                        )}
                        {articles[0].published_at && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(articles[0].published_at)}</span>
                        )}
                        {articles[0].reading_time_minutes && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{articles[0].reading_time_minutes} min</span>
                        )}
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{articles[0].views_count.toLocaleString('fr-FR')}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{articles[0].likes_count}</span>
                      </div>
                    </div>
                  </Link>
                )}

                {articles.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                    {articles.slice(1).map(a => (
                      <CardMedium key={a.id} article={a} href={`${basePath}/${a.slug}${pq}`} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {otherCategories.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-4">Autres catégories</h3>
                <div className="space-y-2">
                  {otherCategories.map(c => (
                    <Link key={c.slug} href={`${basePath}/categories/${c.slug}${pq}`}
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                        {c.cover_image_url ? (
                          <Image src={c.cover_image_url} alt={c.name} fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="48px" />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${grad(c.id)}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-[var(--cp)] transition-colors truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-400">{c.articles_count} article{c.articles_count > 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link href={`${basePath}/categories`}
                  className="flex items-center justify-center gap-2 mt-4 h-9 w-full rounded-xl text-xs font-bold border-2 transition-colors"
                  style={{ borderColor: primaryColor, color: primaryColor }}>
                  Toutes les catégories
                </Link>
              </div>
            )}

            <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/20 mb-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-black text-base mb-1.5">Newsletter {category.name}</h3>
              <p className="text-white/75 text-xs leading-relaxed mb-4">
                Recevez chaque semaine nos meilleurs articles directement dans votre boîte mail.
              </p>
              <a href="#newsletter"
                className="flex items-center justify-center gap-2 h-9 w-full rounded-xl bg-white text-xs font-bold hover:bg-white/90 transition-colors"
                style={{ color: primaryColor }}>
                S'abonner gratuitement
              </a>
            </div>
          </aside>
        </div>
      </section>

      <NewsletterSection blog={blog} primaryColor={primaryColor} />
      <CorporateFooter blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} previewSlug={previewSlug} />
    </div>
  );
}
