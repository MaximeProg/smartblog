'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { EditorialHeader, EditorialFooter } from './EditorialShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

interface AboutProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function EditorialAbout({ blog, categories, basePath }: AboutProps) {
  const primaryColor = blog.primary_color || '#18181b';
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const socialEntries = Object.entries(blog.social_links ?? {}).filter(([, v]) => v);

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

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditorialHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">About</p>
        <h1 className="text-5xl sm:text-6xl font-bold text-zinc-900 mb-6">{blog.name}</h1>
        {blog.description && (
          <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl mx-auto">{blog.description}</p>
        )}
        <div className="w-16 h-1 bg-zinc-200 mx-auto mt-10" />
      </div>

      {/* Cover image */}
      {blog.cover_image_url && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-md">
            <img src={blog.cover_image_url} alt={blog.name} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Category / niche */}
      {blog.category && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-16 text-center">
          <span
            className="inline-block text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {blog.category}
          </span>
        </div>
      )}

      {/* Topics — only if real categories exist */}
      {categories.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-100">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map(c => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="group flex items-center justify-between border border-zinc-100 rounded-xl px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-semibold text-zinc-900 group-hover:text-[var(--cp)] transition-colors">{c.name}</p>
                  {c.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{c.description}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-400 shrink-0 ml-4">
                  {c.articles_count} {c.articles_count === 1 ? 'article' : 'articles'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Social links */}
      {socialEntries.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-100">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">Follow Us</h2>
          <div className="flex flex-wrap gap-3">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-all"
              >
                <span className="capitalize">{platform}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div id="newsletter" className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 mb-16">
        <div className="bg-zinc-950 rounded-3xl px-6 sm:px-16 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Never miss a story</h2>
          <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
            Get the best of {blog.name} delivered to your inbox every week.
          </p>
          {subStatus === 'ok' ? (
            <p className="text-sm font-medium text-emerald-400">You&apos;re subscribed. Thank you!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto gap-0">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-zinc-800 border-0 rounded-l-2xl px-5 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm min-w-0"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="px-6 py-3.5 rounded-r-2xl font-bold text-sm bg-white hover:bg-zinc-100 transition-colors disabled:opacity-60 shrink-0"
                style={{ color: primaryColor }}
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="text-xs text-red-400 mt-3">Something went wrong. Please try again.</p>
          )}
          <p className="text-xs text-zinc-600 mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </div>

      <EditorialFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
