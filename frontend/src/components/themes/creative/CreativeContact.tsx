'use client';

import { useState, type CSSProperties } from 'react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { CreativeHeader, CreativeFooter } from './CreativeShared';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function CreativeContact({ blog, categories, basePath }: Props) {
  const primaryColor = blog.primary_color || '#7c3aed';
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <section className="bg-zinc-950 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <span
            className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 inline-block text-zinc-950"
            style={{ backgroundColor: primaryColor }}
          >
            Contact
          </span>
          <h1 className="text-5xl font-black text-white leading-tight">Let's Connect</h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="bg-zinc-950 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-black mb-4">Reach out</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Have a story to share, a collaboration in mind, or just want to say hello? We'd love to
              hear from you. Our team responds to every message.
            </p>

            {Object.entries(blog.social_links || {}).length > 0 ? (
              <div className="space-y-0">
                {Object.entries(blog.social_links || {}).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0 text-zinc-400 hover:text-white transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black uppercase shrink-0">
                      {platform[0]}
                    </span>
                    <span className="text-sm font-bold capitalize">{platform}</span>
                    <span className="ml-auto text-zinc-600">↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-8 text-center">
                <p className="text-zinc-600 text-sm w-full">
                  Use the form to get in touch with us directly.
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-800">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                Response time
              </p>
              <p className="text-sm text-zinc-300">Usually within 24–48 hours</p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 min-h-[360px]">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-zinc-950 text-2xl font-black"
                  style={{ backgroundColor: primaryColor }}
                >
                  ✓
                </div>
                <h3 className="text-2xl font-black text-zinc-950 mb-2">Message Sent!</h3>
                <p className="text-zinc-500 text-sm max-w-xs">
                  We'll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Your name"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none text-sm transition-all focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none text-sm transition-all focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="What is this about?"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none text-sm transition-all focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:outline-none text-sm transition-all resize-none focus:border-zinc-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-black text-sm text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
