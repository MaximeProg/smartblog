'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { MinimalHeader, MinimalFooter } from './MinimalShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

interface AboutProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function MinimalAbout({ blog, categories, basePath }: AboutProps) {
  const primaryColor = blog.primary_color || '#18181b';

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

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
      <MinimalHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-4">About</p>
        <h1 className="text-5xl font-bold text-zinc-950 mb-8">
          {blog.name}
        </h1>

        <div className="space-y-6 text-lg text-zinc-700 leading-[1.85]">
          <p>
            {blog.description
              ? blog.description
              : `Welcome to ${blog.name}.`}{' '}
            This is a place for thoughtful writing — essays, ideas, and perspectives that we believe
            are worth sharing. Every piece published here is written with care, edited with
            intention, and shared with the hope that it resonates with someone out there.
          </p>
          <p>
            {blog.name} was created with a simple belief: that good writing, given room to breathe,
            can change the way you think. We stay focused, we stay independent, and we try to say
            something true rather than something loud. You won&apos;t find click-bait titles or
            filler content here — just ideas that we think are worth your time.
          </p>
          <p>
            Whether you&apos;ve found us through a shared link or stumbled here on your own, we&apos;re
            glad you&apos;re here. Browse at your own pace, subscribe if something clicks, and feel free
            to reach out if you want to start a conversation.
          </p>
        </div>

        <div className="border-t border-zinc-100 mt-12 pt-12">
          <h2 className="text-base font-bold text-zinc-950 mb-6">Values</h2>
          <ul className="space-y-4">
            {[
              'Clarity over cleverness — we say what we mean.',
              'Depth over volume — fewer articles, more thought.',
              'Independence — no sponsors, no algorithms, just writing.',
            ].map((value, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="shrink-0 mt-0.5" style={{ color: primaryColor }}>✓</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>

        {categories.length > 0 && (
          <div className="border-t border-zinc-100 mt-12 pt-12">
            <h2 className="text-base font-bold text-zinc-950 mb-6">What we write about</h2>
            <div className="space-y-3">
              {categories.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`${basePath}/categories/${c.slug}`}
                      className="text-sm font-medium text-zinc-900 hover:text-[var(--cp)] transition-colors"
                    >
                      {c.name}
                    </Link>
                    {c.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">{c.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-300 shrink-0">
                    {c.articles_count} article{c.articles_count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-zinc-100 mt-16 pt-12">
          <h2 className="text-2xl font-bold text-zinc-950 mb-2">Stay in the loop</h2>
          <p className="text-zinc-500 text-sm mb-6">
            New articles, delivered to your inbox. No noise.
          </p>
          {subStatus === 'ok' ? (
            <p className="text-sm font-medium" style={{ color: primaryColor }}>
              You&apos;re subscribed. Thank you!
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors"
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = '')}
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>
          )}
        </div>
      </div>

      <MinimalFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
