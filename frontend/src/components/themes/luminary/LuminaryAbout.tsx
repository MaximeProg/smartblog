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

  const values = [
    {
      title: 'Depth over volume',
      description:
        'We publish less so we can publish better. Every piece is considered, edited, and worth your time — we never fill space for the sake of it.',
    },
    {
      title: 'Editorial integrity',
      description:
        'Our voice belongs to our readers, not advertisers. Independence is not a feature — it is the foundation everything else is built on.',
    },
    {
      title: 'Writing as craft',
      description:
        'We believe the sentence is the unit of thought. Clarity, precision, and rhythm are not luxuries — they are the minimum standard.',
    },
  ];

  return (
    <div
      className="bg-[#faf8f4] min-h-screen text-zinc-900"
      style={{ '--cp': primaryColor } as CSSProperties}
    >
      <LuminaryHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <section className="bg-zinc-950 text-white py-24 text-center px-4 sm:px-6">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-6">
          About
        </p>
        <h1 className="font-serif italic text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6">
          {blog.name}
        </h1>
        <p className="font-sans text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
          {blog.description ||
            `${blog.name} is a publication dedicated to ideas, craft, and writing that endures.`}
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Our Mission
          </span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>
        <p className="font-serif text-2xl leading-relaxed text-zinc-800 mb-8">
          {blog.name} was built on a simple conviction: that good writing, given room to breathe,
          can alter the way you see the world. We stay focused, we stay honest, and we try to say
          something true rather than something loud.
        </p>
        <p className="font-sans text-lg text-zinc-600 leading-relaxed">
          You will not find click-bait or filler here — only ideas and stories we believe are worth
          your attention. Every article is reviewed with care. We consider the reader&apos;s time a
          gift, and we take that seriously.
        </p>
      </section>

      <section className="bg-[#f0ede6] py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-zinc-300" />
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              What We Stand For
            </span>
            <div className="flex-1 h-px bg-zinc-300" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {values.map(v => (
              <div
                key={v.title}
                className="bg-[#faf8f4] p-8 border-t-2"
                style={{ borderColor: primaryColor }}
              >
                <h3 className="font-serif text-xl text-zinc-900 mb-4">{v.title}</h3>
                <p className="font-sans text-sm text-zinc-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
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
                <span className="font-serif text-lg text-zinc-900 group-hover:text-[var(--cp)] transition-colors">
                  {c.name}
                </span>
                <span className="font-sans text-xs text-zinc-400">
                  {c.articles_count} article{c.articles_count !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="newsletter" className="bg-zinc-950 py-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-4">
            Stay Connected
          </p>
          <h2 className="font-serif italic text-4xl text-white mb-4">
            The best of {blog.name}, in your inbox.
          </h2>
          <p className="font-sans text-sm text-zinc-400 mb-10">
            No noise. No spam. Just writing worth reading.
          </p>
          {subStatus === 'ok' ? (
            <p className="font-serif italic text-xl text-white">
              Thank you for subscribing.
            </p>
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

      <LuminaryFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
