'use client';
import { useState, type CSSProperties, type FormEvent, type ChangeEvent } from 'react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { MinimalHeader, MinimalFooter } from './MinimalShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

interface ContactProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function MinimalContact({ blog, categories, basePath }: ContactProps) {
  const primaryColor = blog.primary_color || '#18181b';

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const set = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${blog.slug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'ok' : 'error');
      if (res.ok) setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputBase =
    'w-full border-0 border-b border-zinc-200 pb-3 text-zinc-900 focus:outline-none transition-colors text-base bg-transparent placeholder:text-zinc-300';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MinimalHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <h1 className="text-4xl font-bold text-zinc-950 mb-3">Contact</h1>
        <p className="text-zinc-500 mb-10">
          Have a question, an idea, or just want to say hello? We read every message.
        </p>

        {status === 'ok' ? (
          <div className="py-12 text-center">
            <p className="text-2xl font-bold text-zinc-950 mb-2">Message sent.</p>
            <p className="text-zinc-500 text-sm">
              Thank you for reaching out. We&apos;ll get back to you soon.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-sm underline text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Name
              </label>
              <input
                required
                value={form.name}
                onChange={set('name')}
                placeholder="Your name"
                className={inputBase}
                onFocus={e => (e.currentTarget.style.borderBottomColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderBottomColor = '')}
              />
            </div>

            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Email
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="your@email.com"
                className={inputBase}
                onFocus={e => (e.currentTarget.style.borderBottomColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderBottomColor = '')}
              />
            </div>

            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Subject
              </label>
              <input
                required
                value={form.subject}
                onChange={set('subject')}
                placeholder="What's this about?"
                className={inputBase}
                onFocus={e => (e.currentTarget.style.borderBottomColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderBottomColor = '')}
              />
            </div>

            <div className="mb-10">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={set('message')}
                placeholder="Write your message here…"
                className={`${inputBase} resize-none`}
                onFocus={e => (e.currentTarget.style.borderBottomColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderBottomColor = '')}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-500 mb-4">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="text-sm font-bold border border-zinc-900 rounded-full px-6 py-2.5 hover:bg-zinc-950 hover:text-white transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}

        {Object.keys(blog.social_links ?? {}).length > 0 && (
          <div className="border-t border-zinc-100 mt-12 pt-8 flex flex-wrap gap-5">
            {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-zinc-900 transition-colors capitalize"
              >
                {platform}
              </a>
            ))}
          </div>
        )}
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
