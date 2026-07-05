'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { Twitter, Linkedin, Github, Instagram, ExternalLink } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

function socialIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === 'twitter' || p === 'x') return <Twitter className="h-4 w-4" />;
  if (p === 'linkedin') return <Linkedin className="h-4 w-4" />;
  if (p === 'github') return <Github className="h-4 w-4" />;
  if (p === 'instagram') return <Instagram className="h-4 w-4" />;
  return <ExternalLink className="h-4 w-4" />;
}

export default function LuminaryContact({ blog, categories, basePath }: Props) {
  const primaryColor = blog.primary_color || '#b8960c';

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await new Promise(r => setTimeout(r, 800));
    setStatus('ok');
  };

  const inputBase =
    'w-full bg-transparent border-0 border-b border-zinc-300 px-0 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors font-sans';

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <Link
          href={basePath}
          className="font-sans text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 mb-10"
        >
          &larr; Home
        </Link>
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px bg-zinc-200" />
          <h1 className="font-serif italic text-4xl sm:text-5xl text-zinc-900 whitespace-nowrap">
            Get in Touch
          </h1>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        <div>
          <p className="font-serif text-xl text-zinc-700 leading-relaxed mb-8">
            We read every message. Whether you have a story idea, a question about the publication,
            or simply want to say hello — we would be glad to hear from you.
          </p>
          <p className="font-sans text-sm text-zinc-500 leading-relaxed mb-12">
            Response times vary, but we aim to reply within two to three business days. For
            partnership and advertising inquiries, please mention it in the subject line.
          </p>

          {Object.entries(blog.social_links ?? {}).filter(([, v]) => v).length > 0 && (
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 mb-5">
                Find us online
              </p>
              <div className="space-y-4">
                {Object.entries(blog.social_links ?? {}).filter(([, v]) => v).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 font-sans text-sm text-zinc-600 hover:text-zinc-900 transition-colors group"
                  >
                    <span className="text-zinc-400 group-hover:text-[var(--cp)] transition-colors">
                      {socialIcon(platform)}
                    </span>
                    <span className="capitalize">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                    <span className="text-zinc-300 group-hover:text-zinc-400 transition-colors text-xs truncate">
                      {url.replace(/^https?:\/\/(www\.)?/, '')}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {status === 'ok' ? (
            <div className="py-16 text-center">
              <p className="font-serif italic text-3xl text-zinc-900 mb-4">
                Message received.
              </p>
              <p className="font-sans text-sm text-zinc-500">
                Thank you for writing. We will be in touch soon.
              </p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setForm({ name: '', email: '', subject: '', message: '' });
                }}
                className="mt-8 font-sans text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors underline underline-offset-4"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className={inputBase}
                />
              </div>

              <div>
                <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className={inputBase}
                />
              </div>

              <div>
                <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Story idea, feedback, hello..."
                  className={inputBase}
                />
              </div>

              <div>
                <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className={`${inputBase} resize-none`}
                />
              </div>

              {status === 'error' && (
                <p className="font-sans text-xs text-red-500">
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="font-sans text-xs uppercase tracking-widest py-3 px-8 text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                {status === 'loading' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      <LuminaryFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
