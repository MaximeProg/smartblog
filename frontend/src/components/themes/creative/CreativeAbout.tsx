'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { CreativeHeader, CreativeFooter } from './CreativeShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function CreativeAbout({ blog, categories, basePath }: Props) {
  const primaryColor = blog.primary_color || '#7c3aed';
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
      <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <section className="bg-zinc-950 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <span
            className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-8 inline-block text-zinc-950"
            style={{ backgroundColor: primaryColor }}
          >
            About
          </span>
          <h1 className="text-6xl sm:text-8xl font-black text-white leading-none mb-6">{blog.name}</h1>
          {blog.description && (
            <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed">{blog.description}</p>
          )}
        </div>
      </section>

      {/* Cover image */}
      {blog.cover_image_url && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden">
            <img src={blog.cover_image_url} alt={blog.name} className="w-full h-full object-cover" />
          </div>
        </section>
      )}

      {/* Stats — only real data */}
      {(categories.length > 0 || blog.category) && (
        <section className="bg-zinc-50 py-16 border-t border-zinc-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {categories.length > 0 && (
                <div className="bg-zinc-950 rounded-2xl p-8">
                  <p className="text-5xl font-black text-white mb-1">{categories.length}</p>
                  <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">
                    {categories.length === 1 ? 'Topic' : 'Topics'}
                  </p>
                </div>
              )}
              {blog.category && (
                <div className="bg-zinc-950 rounded-2xl p-8">
                  <p className="text-2xl font-black text-white mb-1 capitalize">{blog.category}</p>
                  <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Category</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Topics */}
      {categories.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-3xl font-black text-zinc-950 mb-8">Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(c => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="group flex items-center justify-between border border-zinc-200 rounded-xl p-5 hover:border-zinc-900 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-black text-zinc-950 group-hover:text-[var(--cp)] transition-colors">{c.name}</p>
                  {c.description && (
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{c.description}</p>
                  )}
                </div>
                <span className="text-xs font-black text-zinc-400 shrink-0 ml-4">
                  {c.articles_count} {c.articles_count === 1 ? 'piece' : 'pieces'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Social links */}
      {socialEntries.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 border-t border-zinc-100">
          <h2 className="text-xl font-black text-zinc-950 mb-6">Find Us</h2>
          <div className="flex flex-wrap gap-3">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-zinc-200 rounded-full px-5 py-2 text-sm font-black text-zinc-700 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white transition-all capitalize"
              >
                {platform}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-zinc-950 rounded-2xl px-8 sm:px-16 py-16 text-center">
          <p className="text-4xl font-black text-white mb-2">{blog.name}</p>
          <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
            Subscribe to stay updated.
          </p>
          {subStatus === 'ok' ? (
            <p className="text-emerald-400 font-bold">You&apos;re subscribed!</p>
          ) : (
            <form className="flex max-w-sm mx-auto gap-2" onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[var(--cp)]"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="px-5 py-3 rounded-xl font-black text-sm text-zinc-950 hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="text-red-400 text-xs mt-3">Something went wrong. Try again.</p>
          )}
        </div>
      </section>

      <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
