'use client';
import { useState, useCallback, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { HomeProps } from '../ThemeRenderer';
import { MagazineHeader, MagazineFooter } from './MagazineShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MagazineHome({
  blog,
  articles,
  categories,
  currentCategory,
  searchQuery,
  getArticleHref,
  previewSlug,
}: HomeProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const basePath = `/${locale}/${blog.slug}`;
  const primaryColor = blog.primary_color || '#e11d48';

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const aHref = useCallback(
    (s: string) => {
      if (getArticleHref) return getArticleHref(s);
      if (previewSlug) return `/en/template/${s}?preview=${previewSlug}`;
      return `/${locale}/${blog.slug}/${s}`;
    },
    [getArticleHref, previewSlug, locale, blog.slug],
  );

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubStatus(res.ok ? 'ok' : 'error');
    } catch {
      setSubStatus('error');
    }
  };

  const isFiltered = !!currentCategory || !!searchQuery;
  const hero = articles[0];
  const trending = articles.slice(1, 6);

  const categoryGroups = categories
    .map(cat => ({
      cat,
      arts: articles.filter(a => a.category_slug === cat.slug),
    }))
    .filter(g => g.arts.length > 0)
    .slice(0, 3);

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {isFiltered ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 pb-4" style={{ borderColor: primaryColor }}>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>
              {currentCategory
                ? categories.find(c => c.slug === currentCategory)?.name ?? currentCategory
                : `Search: "${searchQuery}"`}
            </span>
            <span className="text-xs text-zinc-400">— {articles.length} article{articles.length !== 1 ? 's' : ''}</span>
            <Link href={basePath} className="ml-auto text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
              ← Clear filter
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-lg font-bold text-zinc-300">No articles found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(a => (
                <Link
                  key={a.id}
                  href={aHref(a.slug)}
                  className="group border border-zinc-200 rounded overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-44 overflow-hidden">
                    {a.cover_image_url ? (
                      <Image
                        src={a.cover_image_url}
                        alt={a.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)` }} />
                    )}
                  </div>
                  <div className="p-4">
                    {a.category_name && (
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: primaryColor }}>{a.category_name}</span>
                    )}
                    <h3 className="font-bold text-zinc-900 text-sm leading-snug mt-1 mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">{a.title}</h3>
                    <p className="text-xs text-zinc-400">{a.author_name} · {formatDate(a.published_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {articles.length === 0 ? (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
              <p className="text-lg font-bold text-zinc-300">No articles yet. Check back soon.</p>
            </div>
          ) : (
            <>
              <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {hero && (
                    <div className="lg:col-span-2">
                      <Link href={aHref(hero.slug)} className="block group relative h-72 sm:h-[420px] rounded overflow-hidden">
                        {hero.cover_image_url ? (
                          <Image
                            src={hero.cover_image_url}
                            alt={hero.title}
                            fill
                            priority
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 1024px) 100vw, 66vw"
                          />
                        ) : (
                          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}, #000)` }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          {hero.category_name && (
                            <span className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-sm mb-3 text-white" style={{ backgroundColor: primaryColor }}>
                              {hero.category_name}
                            </span>
                          )}
                          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3 hover:underline">
                            {hero.title}
                          </h2>
                          <div className="text-white/60 text-xs flex items-center gap-2 flex-wrap">
                            {hero.author_name && <span>{hero.author_name}</span>}
                            {hero.author_name && <span>·</span>}
                            <span>{formatDate(hero.published_at)}</span>
                            {hero.reading_time_minutes && <><span>·</span><span>{hero.reading_time_minutes} min read</span></>}
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  <div className="lg:col-span-1 bg-white border border-zinc-200 rounded overflow-hidden">
                    <div className="border-b-2 px-4 py-3" style={{ borderColor: primaryColor }}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Trending</span>
                    </div>
                    {trending.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-zinc-400">More articles coming soon.</p>
                    ) : (
                      trending.map((a, i) => (
                        <Link key={a.id} href={aHref(a.slug)} className="flex gap-3 items-start py-4 px-4 border-b border-zinc-100 last:border-0 group">
                          <span className="text-3xl font-black text-zinc-200 leading-none w-10 shrink-0 select-none">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            {a.category_name && (
                              <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: primaryColor }}>{a.category_name}</span>
                            )}
                            <p className="text-sm font-bold text-zinc-900 leading-snug group-hover:text-[var(--cp)] transition-colors line-clamp-2">{a.title}</p>
                            <p className="text-xs text-zinc-400 mt-1">{formatDate(a.published_at)}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {categoryGroups.map(({ cat, arts }) => {
                const featured = arts[0];
                const mini = arts.slice(1, 3);
                return (
                  <section key={cat.id} className="max-w-6xl mx-auto px-4 sm:px-6 py-8 border-t border-zinc-100">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black uppercase tracking-wider" style={{ color: primaryColor }}>{cat.name}</span>
                        {cat.description && (
                          <span className="text-xs text-zinc-400 hidden sm:inline">{cat.description}</span>
                        )}
                      </div>
                      <Link href={`${basePath}/categories/${cat.slug}`} className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
                        View all →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {featured && (
                        <Link href={aHref(featured.slug)} className="sm:col-span-2 group flex gap-4">
                          <div className="relative h-40 w-44 shrink-0 rounded overflow-hidden">
                            {featured.cover_image_url ? (
                              <Image
                                src={featured.cover_image_url}
                                alt={featured.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="176px"
                              />
                            ) : (
                              <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}66)` }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase" style={{ color: primaryColor }}>{featured.category_name}</span>
                            <h3 className="font-bold text-zinc-900 text-base leading-snug mb-2 mt-0.5 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">{featured.title}</h3>
                            {featured.excerpt && (
                              <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{featured.excerpt}</p>
                            )}
                            <p className="text-xs text-zinc-400">{featured.author_name} · {formatDate(featured.published_at)}</p>
                          </div>
                        </Link>
                      )}

                      <div className="flex flex-col gap-0">
                        {mini.map((a, idx) => (
                          <Link key={a.id} href={aHref(a.slug)} className={`group flex gap-3 pb-3 ${idx < mini.length - 1 ? 'border-b border-zinc-100 mb-3' : ''}`}>
                            <div className="relative h-14 w-14 rounded shrink-0 overflow-hidden">
                              {a.cover_image_url ? (
                                <Image
                                  src={a.cover_image_url}
                                  alt={a.title}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              ) : (
                                <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)` }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-black uppercase block" style={{ color: primaryColor }}>{a.category_name}</span>
                              <p className="text-sm font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-[var(--cp)] transition-colors">{a.title}</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{formatDate(a.published_at)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })}

              <div id="newsletter" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div
                  className="rounded-lg p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div>
                    <p className="text-xl font-black text-white">Stay in the know</p>
                    <p className="text-white/80 text-sm mt-1">Get {blog.name} delivered weekly.</p>
                  </div>
                  <div className="w-full sm:max-w-sm">
                    {subStatus === 'ok' ? (
                      <p className="text-white font-bold text-sm">You&apos;re subscribed. Thank you!</p>
                    ) : (
                      <form onSubmit={handleSubscribe} className="flex gap-0 w-full">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 bg-white/10 border border-white/20 rounded-l-lg px-4 py-2.5 text-white placeholder:text-white/50 text-sm focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={subStatus === 'loading'}
                          className="bg-white rounded-r-lg px-5 py-2.5 font-black text-sm hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
                          style={{ color: primaryColor }}
                        >
                          {subStatus === 'loading' ? '…' : 'Subscribe'}
                        </button>
                      </form>
                    )}
                    {subStatus === 'error' && (
                      <p className="text-white/70 text-xs mt-2">Something went wrong. Please try again.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
