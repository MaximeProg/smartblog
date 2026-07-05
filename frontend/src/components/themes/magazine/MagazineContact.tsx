'use client';
import { useState, type CSSProperties, type FormEvent, type ChangeEvent } from 'react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { MagazineHeader, MagazineFooter } from './MagazineShared';

interface ContactProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function MagazineContact({ blog, categories, basePath }: ContactProps) {
  const primaryColor = blog.primary_color || '#e11d48';
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await new Promise(r => setTimeout(r, 800));
    setStatus('ok');
  };

  const inputClass = 'border-0 border-b-2 border-zinc-200 rounded-none px-0 py-3 focus:outline-none text-zinc-900 bg-transparent w-full text-base transition-colors';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <div className="border-t-4" style={{ borderColor: primaryColor }}>
        <div className="bg-zinc-950 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <span className="text-[10px] font-black uppercase tracking-widest mb-4 block" style={{ color: primaryColor }}>Contact</span>
            <h1 className="text-5xl font-black text-white leading-tight">Get In Touch</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-black text-zinc-950 mb-6">Reach Out</h2>
          <p className="text-zinc-600 text-base leading-relaxed mb-8">
            Have a tip, a story idea, or feedback? We&apos;d love to hear from you. Our editorial team
            reads every message and responds to those we can.
          </p>

          <div className="space-y-6 mb-10">
            {[
              { label: 'Editorial', value: `editorial@${blog.slug}.io`, type: 'email' },
              { label: 'Tips & Leaks', value: `tips@${blog.slug}.io`, type: 'email' },
              { label: 'Partnerships', value: `partners@${blog.slug}.io`, type: 'email' },
            ].map(item => (
              <div key={item.label} className="border-b border-zinc-100 pb-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">{item.label}</p>
                <a href={`mailto:${item.value}`} className="text-zinc-900 font-bold hover:text-[var(--cp)] transition-colors">{item.value}</a>
              </div>
            ))}
          </div>

          {Object.entries(blog.social_links ?? {}).length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Follow Us</p>
              <div className="flex flex-wrap gap-4">
                {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-zinc-200 rounded px-4 py-2 text-sm font-bold text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 hover:bg-zinc-50 transition-colors capitalize"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {status === 'ok' ? (
            <div className="border-t-4 bg-zinc-50 rounded-b p-10 text-center" style={{ borderColor: primaryColor }}>
              <p className="text-2xl font-black text-zinc-950 mb-3">Message received.</p>
              <p className="text-zinc-500">We&apos;ll be in touch soon. Thank you for reaching out to {blog.name}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={inputClass}
                  onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                  onBlur={e => (e.currentTarget.style.borderColor = '')}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={inputClass}
                  onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                  onBlur={e => (e.currentTarget.style.borderColor = '')}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">Subject</label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What is this about?"
                  className={inputClass}
                  onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                  onBlur={e => (e.currentTarget.style.borderColor = '')}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">Message</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className={`${inputClass} resize-none`}
                  onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                  onBlur={e => (e.currentTarget.style.borderColor = '')}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-zinc-950 text-white py-4 font-black uppercase tracking-wider text-sm hover:bg-[var(--cp)] transition-colors disabled:opacity-60"
              >
                {status === 'loading' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
