'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { MagazineHeader, MagazineFooter } from './MagazineShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

interface AboutProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function MagazineAbout({ blog, categories, basePath }: AboutProps) {
  const primaryColor = blog.primary_color || '#e11d48';
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
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <div className="w-full border-t-4" style={{ borderColor: primaryColor }}>
        <div className="bg-zinc-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <span className="text-[10px] font-black uppercase tracking-widest mb-4 block" style={{ color: primaryColor }}>
              About
            </span>
            <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-6">{blog.name}</h1>
            {blog.description && (
              <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed">{blog.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {blog.cover_image_url && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="relative aspect-[21/9] overflow-hidden">
            <img src={blog.cover_image_url} alt={blog.name} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Stats — only real data */}
      {categories.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-b border-zinc-100">
          <div className="flex flex-wrap gap-10">
            <div>
              <p className="text-4xl font-black text-zinc-950">{categories.length}</p>
              <p className="text-sm text-zinc-400 mt-1">{categories.length === 1 ? 'Topic' : 'Topics'}</p>
            </div>
            {blog.category && (
              <div>
                <p className="text-4xl font-black text-zinc-950 capitalize">{blog.category}</p>
                <p className="text-sm text-zinc-400 mt-1">Category</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topics */}
      {categories.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-black text-zinc-950 mb-8">What We Cover</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(c => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="group flex items-start justify-between border border-zinc-200 rounded p-5 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-black text-zinc-950 group-hover:text-[var(--cp)] transition-colors">{c.name}</p>
                  {c.description && (
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed line-clamp-2">{c.description}</p>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider shrink-0 ml-4 mt-0.5" style={{ color: primaryColor }}>
                  {c.articles_count} {c.articles_count === 1 ? 'article' : 'articles'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Social links */}
      {socialEntries.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 border-t border-zinc-100">
          <h2 className="text-lg font-black text-zinc-950 mb-5">Follow {blog.name}</h2>
          <div className="flex flex-wrap gap-3">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-zinc-200 rounded px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all capitalize"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div className="border-t-4 mt-8" style={{ borderColor: primaryColor }}>
        <div id="newsletter" className="py-16" style={{ backgroundColor: primaryColor }}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-black text-white mb-3">Join the conversation</h2>
            <p className="text-white/80 mb-8">Get {blog.name} delivered to your inbox every week.</p>
            {subStatus === 'ok' ? (
              <p className="text-white font-black text-lg">You&apos;re in! Check your inbox.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-0 max-w-sm mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-white/10 border border-white/20 rounded-l-lg px-4 py-3 text-white placeholder:text-white/50 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subStatus === 'loading'}
                  className="bg-white rounded-r-lg px-6 py-3 font-black text-sm hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
                  style={{ color: primaryColor }}
                >
                  {subStatus === 'loading' ? '…' : 'Subscribe'}
                </button>
              </form>
            )}
            {subStatus === 'error' && (
              <p className="text-white/70 text-xs mt-3">Something went wrong. Please try again.</p>
            )}
          </div>
        </div>
      </div>

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
