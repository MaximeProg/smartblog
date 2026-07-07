import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Rss, Mic, Clock, Play } from 'lucide-react';
import { publicApi } from '@/lib/public-api';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await publicApi.getBlogInfo(slug);
    return {
      title: `${blog.name} — Podcast`,
      description: blog.description ?? undefined,
    };
  } catch {
    return { title: 'Podcast' };
  }
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function EpisodeCard({
  article,
  href,
  primaryColor,
  index,
}: {
  article: Awaited<ReturnType<typeof publicApi.getArticles>>[number];
  href: string;
  primaryColor: string;
  index: number;
}) {
  const ep = (article as any).episode_number as number | null;
  const season = (article as any).season as number | null;

  return (
    <div className="group flex gap-4 py-5 border-b border-zinc-100 hover:bg-zinc-50/50 px-2 -mx-2 rounded-lg transition-colors">
      {/* Episode number badge */}
      <div
        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: primaryColor }}
      >
        {ep ? `#${ep}` : <Mic className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {season && <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">S{season}</span>}
          <span className="text-xs text-zinc-400">{formatDate(article.published_at)}</span>
          {article.reading_time_minutes && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.reading_time_minutes} min
              </span>
            </>
          )}
        </div>

        <Link href={href}>
          <h2 className="font-semibold text-zinc-900 leading-snug mb-1 group-hover:underline line-clamp-2">
            {article.title}
          </h2>
        </Link>

        {article.excerpt && (
          <p className="text-sm text-zinc-500 line-clamp-2">{article.excerpt}</p>
        )}
      </div>

      <Link
        href={href}
        className="shrink-0 self-center w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-colors"
      >
        <Play className="h-4 w-4 translate-x-0.5" />
      </Link>
    </div>
  );
}

export default async function PodcastPage({ params }: { params: Params }) {
  const { locale, slug } = await params;

  let blog: Awaited<ReturnType<typeof publicApi.getBlogInfo>>;
  let episodes: Awaited<ReturnType<typeof publicApi.getArticles>>;
  let categories: Awaited<ReturnType<typeof publicApi.getCategories>>;

  try {
    [blog, episodes, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticles(slug, { type: 'podcast', limit: 50 }),
      publicApi.getCategories(slug),
    ]);
  } catch {
    notFound();
  }

  const basePath = `/${locale}/${slug}`;
  const primaryColor = blog.primary_color || '#18181b';
  const rssUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io'}/api/v1/public/${slug}/podcast/rss`;

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as React.CSSProperties}>
      {/* Header — reuse blog nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={basePath} className="font-bold text-zinc-900 text-sm hover:opacity-70 transition-opacity">
            ← {blog.name}
          </Link>
          <a
            href={rssUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-orange-500 transition-colors"
          >
            <Rss className="h-4 w-4" />
            RSS Feed
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="flex items-start gap-5 mb-10">
          {blog.logo_url ? (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md">
              <Image src={blog.logo_url} alt={blog.name} fill className="object-cover" />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Mic className="h-9 w-9" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Podcast</p>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">{blog.name}</h1>
            {blog.description && (
              <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">{blog.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <a
                href={rssUrl}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-white"
                style={{ backgroundColor: '#f97316' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Rss className="h-3 w-3" />
                Subscribe via RSS
              </a>
            </div>
          </div>
        </div>

        {/* Episodes */}
        {episodes.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No episodes yet</p>
            <p className="text-sm mt-1">Check back soon.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
              {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
            </p>
            {episodes.map((ep, i) => (
              <EpisodeCard
                key={ep.id}
                article={ep}
                href={`${basePath}/${ep.slug}`}
                primaryColor={primaryColor}
                index={i}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
