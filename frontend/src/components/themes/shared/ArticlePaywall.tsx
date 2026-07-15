'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Lock, Clock, User, ArrowLeft } from 'lucide-react';
import type { BlogInfo, PublicArticleFull } from '@/lib/public-api';

interface ArticlePaywallProps {
  blog: BlogInfo;
  article: PublicArticleFull;
  basePath: string;
  locale: string;
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Extracts a plain-text preview from HTML content (~300 words max). */
function textPreview(html: string | null, maxChars = 500): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

export default function ArticlePaywall({
  blog,
  article,
  basePath,
  locale,
}: ArticlePaywallProps) {
  const primaryColor = blog.primary_color || '#3b82f6';
  const price = article.price ? `$${Number(article.price).toFixed(2)}` : null;
  const preview = textPreview(article.content);

  const loginUrl =
    `/${locale}/login?redirect=${encodeURIComponent(`${basePath}/${article.slug}`)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-zinc-100 bg-white/95 backdrop-blur-sm px-6 py-3.5">
        <Link
          href={basePath || "/"}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {blog.name}
        </Link>
      </div>

      {/* Article header */}
      <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-10 pb-0">
        {article.cover_image_url && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8 shadow-md">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
            />
          </div>
        )}

        {/* Category / tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight mb-4">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-zinc-500 leading-relaxed mb-6">{article.excerpt}</p>
        )}

        <div className="flex items-center gap-3 text-sm text-zinc-400 pb-6 border-b border-zinc-100 flex-wrap">
          {article.author_name && (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {article.author_name}
            </span>
          )}
          {article.published_at && (
            <>
              <span>·</span>
              <span>{formatDate(article.published_at)}</span>
            </>
          )}
          {article.reading_time_minutes && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {article.reading_time_minutes} min read
              </span>
            </>
          )}
        </div>

        {/* Blurred preview */}
        {preview && (
          <div className="relative mt-8 mb-2 overflow-hidden" style={{ maxHeight: '180px' }}>
            <p className="text-zinc-700 leading-[1.85] text-base">{preview}</p>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white" />
          </div>
        )}
      </div>

      {/* Paywall card */}
      <div className="max-w-md mx-auto px-5 sm:px-6 py-10">
        <div className="border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ backgroundColor: `${primaryColor}18` }}
          >
            <Lock className="h-6 w-6" style={{ color: primaryColor }} />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            {price ? `Unlock this article` : 'Members-only content'}
          </h2>

          {price && (
            <div
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
            >
              {price} one-time
            </div>
          )}

          <p className="text-zinc-500 text-sm leading-relaxed mb-7">
            {price
              ? `Purchase once, read anytime. No subscription required.`
              : `Sign in to access this exclusive content.`}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <Lock className="h-4 w-4" />
              {price ? `Buy for ${price}` : 'Sign in to read'}
            </Link>

            {price && (
              <Link
                href={loginUrl}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                Sign in (already purchased)
              </Link>
            )}

            <Link
              href={basePath || "/"}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors mt-1"
            >
              ← Back to {blog.name}
            </Link>
          </div>
        </div>

        {/* Social proof / trust */}
        <p className="text-xs text-zinc-400 text-center mt-5">
          Secure payment · Instant access · Read on any device
        </p>
      </div>
    </div>
  );
}
