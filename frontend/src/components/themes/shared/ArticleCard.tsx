import Link from 'next/link';
import type { PublicArticle } from '@/lib/public-api';

function formatDate(iso: string | null, lang = 'fr'): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Standard card (horizontal or vertical)
export function ArticleCard({
  article,
  blogSlug,
  lang = 'fr',
  variant = 'vertical',
  getArticleHref,
}: {
  article: PublicArticle;
  blogSlug: string;
  lang?: string;
  variant?: 'vertical' | 'horizontal' | 'compact';
  getArticleHref?: (slug: string) => string;
}) {
  const href = getArticleHref ? getArticleHref(article.slug) : `./${article.slug}`;

  if (variant === 'compact') {
    return (
      <Link href={href} className="group flex items-start gap-3 py-3 border-b border-border last:border-0 hover:text-[var(--blog-primary)] transition-colors">
        {article.cover_image_url && (
          <img src={article.cover_image_url} alt={article.title} className="h-14 w-14 object-cover rounded shrink-0" />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-[var(--blog-primary)]">{article.title}</h3>
          <p className="text-xs text-gray-400 mt-1">{formatDate(article.published_at, lang)}</p>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="group flex gap-4 items-start hover:text-[var(--blog-primary)] transition-colors">
        {article.cover_image_url && (
          <img src={article.cover_image_url} alt={article.title} className="h-20 w-28 object-cover rounded-lg shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {article.category_name && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blog-primary)]">
              {article.category_name}
            </span>
          )}
          <h3 className="text-sm font-bold leading-snug line-clamp-2 mt-0.5 group-hover:text-[var(--blog-primary)]">
            {article.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{article.author_name} · {formatDate(article.published_at, lang)}</p>
        </div>
      </Link>
    );
  }

  // vertical (default)
  return (
    <Link href={href} className="group flex flex-col hover:text-[var(--blog-primary)] transition-colors">
      {article.cover_image_url ? (
        <div className="aspect-[16/9] overflow-hidden rounded-xl mb-3 bg-gray-100">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] rounded-xl mb-3 bg-gradient-to-br from-[var(--blog-primary)]/10 to-[var(--blog-primary)]/5 flex items-center justify-center text-[var(--blog-primary)] text-2xl font-black">
          {article.title[0]}
        </div>
      )}
      {article.category_name && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blog-primary)] mb-1">
          {article.category_name}
        </span>
      )}
      <h3 className="font-bold leading-snug line-clamp-2 group-hover:text-[var(--blog-primary)]">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
        {article.author_name && <span>{article.author_name}</span>}
        {article.author_name && <span>·</span>}
        <span>{formatDate(article.published_at, lang)}</span>
        {article.reading_time_minutes && (
          <><span>·</span><span>{article.reading_time_minutes} min</span></>
        )}
      </div>
    </Link>
  );
}

// ── Hero card (large, featured)
export function HeroCard({ article, blogSlug, lang = 'fr', getArticleHref }: { article: PublicArticle; blogSlug: string; lang?: string; getArticleHref?: (slug: string) => string }) {
  const href = getArticleHref ? getArticleHref(article.slug) : `./${article.slug}`;

  return (
    <Link href={href} className="group relative block overflow-hidden rounded-2xl">
      <div className="aspect-[21/9] bg-gray-200">
        {article.cover_image_url ? (
          <img src={article.cover_image_url} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[var(--blog-primary)] to-[var(--blog-primary)]/60" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {article.category_name && (
          <span className="inline-block bg-[var(--blog-primary)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2">
            {article.category_name}
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2 group-hover:text-[var(--blog-primary)] transition-colors">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-white/70 text-sm line-clamp-2">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-2 text-white/50 text-xs mt-3">
          {article.author_name && <span>{article.author_name}</span>}
          <span>·</span>
          <span>{new Date(article.published_at ?? '').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}</span>
        </div>
      </div>
    </Link>
  );
}
