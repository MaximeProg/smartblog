'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function LuminaryAbout({ blog, categories, basePath }: Props) {
  const primaryColor = blog.primary_color || '#b8960c';
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
    <div className="bg-[#faf8f4] min-h-screen text-zinc-900" style={{ '--cp': primaryColor } as CSSProperties}>
      <LuminaryHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <section className="bg-zinc-950 text-white py-24 text-center px-4 sm:px-6">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-6">About</p>
        <h1 className="font-serif italic text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6">{blog.name}</h1>
        {blog.description && (
          <p className="font-sans text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">{blog.description}</p>
        )}
      </section>

      {/* Cover image */}
      {blog.cover_image_url && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="relative aspect-[21/9] overflow-hidden">
            <img src={blog.cover_image_url} alt={blog.name} className="w-full h-full object-cover" />
          </div>
        </section>
      )}

      {/* Category badge */}
      {blog.category && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
          <span
            className="font-sans text-[10px] uppercase tracking-[0.2em] px-5 py-2 border inline-block"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {blog.category}
          </span>
        </section>
      )}

      {/* Topics */}
      {categories.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 border-t border-zinc-200">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Topics We Cover
            </span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>
          <div className="space-y-0">
            {categories.map(c => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="flex items-center justify-between py-4 border-b border-zinc-100 group hover:bg-[#f0ede6] -mx-4 px-4 transition-colors"
              >
                <div>
                  <span className="font-serif text-lg text-zinc-900 group-hover:text-[var(--cp)] transition-colors">
                    {c.name}
                  </span>
                  {c.description && (
                    <p className="font-sans text-xs text-zinc-400 mt-0.5 line-clamp-1">{c.description}</p>
                  )}
                </div>
                <span className="font-sans text-xs text-zinc-400 shrink-0 ml-4">
                  {c.articles_count} article{c.articles_count !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Social links */}
      {socialEntries.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400">Follow</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-zinc-500 hover:text-zinc-900 transition-colors capitalize border-b border-zinc-300 hover:border-zinc-900 pb-px"
              >
                {platform}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section id="newsletter" className="bg-zinc-950 py-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-4">Stay Connected</p>
          <h2 className="font-serif italic text-4xl text-white mb-4">
            The best of {blog.name}, in your inbox.
          </h2>
          <p className="font-sans text-sm text-zinc-400 mb-10">No noise. No spam. Just writing worth reading.</p>
          {subStatus === 'ok' ? (
            <p className="font-serif italic text-xl text-white">Thank you for subscribing.</p>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex items-end gap-0 max-w-sm mx-auto border-b border-zinc-600 pb-px"
            >
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent border-0 px-0 py-3 text-white placeholder:text-zinc-600 focus:outline-none text-sm min-w-0 font-sans"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="font-sans text-xs uppercase tracking-widest text-white hover:text-[var(--cp)] transition-colors shrink-0 pl-4 py-3 disabled:opacity-60"
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="font-sans text-xs text-red-400 mt-3">Something went wrong. Try again.</p>
          )}
          <p className="font-sans text-xs text-zinc-600 mt-6">Unsubscribe anytime.</p>
        </div>
      </section>

      <LuminaryFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
