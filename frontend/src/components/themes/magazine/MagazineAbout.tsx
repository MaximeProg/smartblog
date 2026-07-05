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

      <div className="w-full border-t-4" style={{ borderColor: primaryColor }}>
        <div className="bg-zinc-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <span className="text-[10px] font-black uppercase tracking-widest mb-4 block" style={{ color: primaryColor }}>About</span>
            <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-4">{blog.name}</h1>
            <p className="text-zinc-400 text-xl max-w-xl">
              {blog.description || `Independent journalism and expert analysis from ${blog.name}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="border-l-4 pl-8 mb-12" style={{ borderColor: primaryColor }}>
          <p className="text-xl text-zinc-700 leading-relaxed">
            {blog.description
              ? `${blog.description} We are committed to independent, rigorous coverage that informs and challenges our readers. Every story is reported with care, every opinion grounded in expertise.`
              : `${blog.name} is an independent publication committed to rigorous reporting and sharp analysis. We believe that great journalism — fearless, fact-based, and deeply researched — is more important than ever. Our team covers the stories that matter, without corporate influence or clickbait.`}
          </p>
        </div>

        <p className="text-lg text-zinc-600 leading-relaxed mb-6">
          Founded with a simple mission: to produce the kind of journalism readers can trust. We stay
          independent so we can tell the truth. We stay focused so every story earns its place. We
          stay curious so we never stop asking the harder questions.
        </p>

        <p className="text-lg text-zinc-600 leading-relaxed">
          Whether you&apos;re a longtime reader or discovering us for the first time, we&apos;re glad you&apos;re
          here. Explore our coverage, subscribe to the newsletter, and join a community that values
          depth over noise.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 gap-6 text-center border-t border-zinc-100">
        <div>
          <p className="text-4xl font-black text-zinc-950">Est. 2024</p>
          <p className="text-sm text-zinc-400 mt-2">Founded</p>
        </div>
        <div>
          <p className="text-4xl font-black text-zinc-950">{categories.length} Topics</p>
          <p className="text-sm text-zinc-400 mt-2">Areas of coverage</p>
        </div>
        <div>
          <p className="text-4xl font-black text-zinc-950">Independent</p>
          <p className="text-sm text-zinc-400 mt-2">No corporate owners</p>
        </div>
      </div>

      <div className="bg-zinc-50 border-t border-zinc-100 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-black text-zinc-950 mb-8">Editorial Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { title: 'Accuracy first', desc: 'Every claim is verified. We correct mistakes promptly and transparently.' },
              { title: 'Independence', desc: 'No advertisers, no owners, no political affiliations shaping our coverage.' },
              { title: 'Depth over volume', desc: 'We publish fewer stories so every one can be done properly.' },
            ].map(v => (
              <div key={v.title} className="border-t-4 pt-5" style={{ borderColor: primaryColor }}>
                <p className="font-black text-zinc-950 mb-2">{v.title}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-100">
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
                  {c.description && <p className="text-sm text-zinc-400 mt-1 leading-relaxed line-clamp-2">{c.description}</p>}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider shrink-0 ml-4 mt-0.5" style={{ color: primaryColor }}>
                  {c.articles_count} {c.articles_count === 1 ? 'article' : 'articles'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t-4" style={{ borderColor: primaryColor }}>
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
