'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import { Shield, Star, Users } from 'lucide-react';
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
      icon: Shield,
      title: 'Independent',
      description:
        'We write for our readers, not for advertisers. Our editorial process is free from outside influence, keeping our voice authentic and honest.',
    },
    {
      icon: Star,
      title: 'Quality',
      description:
        'Every piece is written with care and edited with intention. We publish less, but we publish better — quality over volume, always.',
    },
    {
      icon: Users,
      title: 'Community',
      description:
        'We believe in conversation. Our readers are collaborators in the pursuit of good ideas. Every comment and letter matters to us.',
    },
  ];

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditorialHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">
          About
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold text-zinc-900 mb-6">About {blog.name}</h1>
        <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl mx-auto">
          {blog.description ||
            `${blog.name} is a publication dedicated to thoughtful writing and ideas worth sharing.`}
        </p>
        <div className="w-16 h-1 bg-zinc-200 mx-auto mt-10" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-zinc-50 rounded-3xl p-8 sm:p-12">
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-4"
            style={{ color: primaryColor }}
          >
            Our Mission
          </p>
          <p className="text-lg text-zinc-700 leading-relaxed mb-5">
            {blog.name} was built with a simple belief: that good writing, given room to breathe,
            can change the way you think. We stay focused, we stay independent, and we try to say
            something true rather than something loud.
          </p>
          <p className="text-lg text-zinc-700 leading-relaxed">
            You won&apos;t find click-bait titles or filler content here — just ideas and stories
            we think are worth your time. Every article is reviewed, every word is considered. We
            believe the reader&apos;s attention is a gift, and we take that seriously.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {values.map(v => (
            <div
              key={v.title}
              className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm"
            >
              <div className="mb-4" style={{ color: primaryColor }}>
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-zinc-900 text-lg mb-2">{v.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="newsletter" className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 mb-16">
        <div className="bg-zinc-950 rounded-3xl px-6 sm:px-16 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Never miss a story</h2>
          <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
            Get the best of {blog.name} delivered to your inbox every week.
          </p>
          {subStatus === 'ok' ? (
            <p className="text-sm font-medium text-emerald-400">
              You&apos;re subscribed. Thank you!
            </p>
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

      <EditorialFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
