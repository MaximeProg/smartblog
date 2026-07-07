'use client';
import { useCallback, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { BlogInfo, PublicCategory, PublicArticle } from '@/lib/public-api';
import { MagazineHeader, MagazineFooter } from './MagazineShared';
import { VideoCardThumb } from '../shared/VideoCardThumb';

interface CategoryPageProps {
  blog: BlogInfo;
  category: PublicCategory;
  articles: PublicArticle[];
  categories: PublicCategory[];
  basePath: string;
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MagazineCategoryPage({
  blog,
  category,
  articles,
  categories,
  basePath,
}: CategoryPageProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const primaryColor = blog.primary_color || '#e11d48';

  const aHref = useCallback(
    (s: string) => `/${locale}/${blog.slug}/${s}`,
    [locale, blog.slug],
  );

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <div className="border-t-4" style={{ borderColor: primaryColor }}>
        <div className="bg-zinc-950 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Link
              href={`${basePath}/categories`}
              className="text-zinc-400 hover:text-white text-sm transition-colors inline-block mb-3"
            >
              ← All Topics
            </Link>
            <h1 className="text-5xl font-black text-white mt-3 mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-zinc-400 text-base mt-2 max-w-xl">{category.description}</p>
            )}
            <p className="text-zinc-500 text-sm mt-3">
              {articles.length} article{articles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {articles.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-bold text-zinc-300">No articles in this topic yet.</p>
            <Link href={basePath} className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-900 transition-colors">
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center border-b-2 pb-3 mb-6" style={{ borderColor: primaryColor }}>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                {category.name}
              </span>
            </div>

            {featured && (
              <Link
                href={aHref(featured.slug)}
                className="group flex flex-col sm:flex-row gap-6 mb-10 border-b border-zinc-100 pb-10"
              >
                <div className="relative h-56 sm:h-56 sm:w-96 shrink-0 rounded overflow-hidden">
                  {featured.article_type === 'video' ? (
                    <VideoCardThumb videoUrl={featured.video_url} />
                  ) : featured.cover_image_url ? (
                    <Image
                      src={featured.cover_image_url}
                      alt={featured.title}
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 384px"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}66)` }} />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {featured.category_name && (
                    <span className="text-[10px] font-black uppercase tracking-wider block mb-2" style={{ color: primaryColor }}>
                      {featured.category_name}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 leading-tight mb-3 group-hover:text-[var(--cp)] transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-zinc-500 text-base leading-relaxed mb-4 line-clamp-3">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    {featured.author_name && <span>{featured.author_name}</span>}
                    {featured.author_name && <span>·</span>}
                    <span>{formatDate(featured.published_at)}</span>
                    {featured.reading_time_minutes && (
                      <><span>·</span><span>{featured.reading_time_minutes} min read</span></>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(a => (
                  <Link
                    key={a.id}
                    href={aHref(a.slug)}
                    className="group border border-zinc-200 rounded overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {a.article_type === 'video' ? (
                        <VideoCardThumb videoUrl={a.video_url} />
                      ) : a.cover_image_url ? (
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
                        <span className="text-[10px] font-black uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                          {a.category_name}
                        </span>
                      )}
                      <h3 className="font-bold text-zinc-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{a.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        {a.author_name && <span>{a.author_name}</span>}
                        {a.author_name && <span>·</span>}
                        <span>{formatDate(a.published_at)}</span>
                        {a.reading_time_minutes && (
                          <><span>·</span><span>{a.reading_time_minutes} min</span></>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
