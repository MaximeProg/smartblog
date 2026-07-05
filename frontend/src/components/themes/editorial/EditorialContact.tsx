'use client';
import { useState, type CSSProperties, type FormEvent, type ChangeEvent } from 'react';
import { Clock } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { EditorialHeader, EditorialFooter } from './EditorialShared';

interface ContactProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function EditorialContact({ blog, categories, basePath }: ContactProps) {
  const primaryColor = blog.primary_color || '#18181b';

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'ok'>('idle');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');
    await new Promise(r => setTimeout(r, 700));
    setSubmitStatus('ok');
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = primaryColor;
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '';
  };

  const inputCls =
    'w-full border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-sm transition-all';

  const socialEntries = Object.entries(blog.social_links ?? {});

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditorialHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">Get in Touch</h1>
          <p className="text-zinc-500 leading-relaxed mb-8">
            Have a question, a story idea, or just want to say hello? We&apos;d love to hear from
            you. Fill out the form and we&apos;ll get back to you as soon as possible.
          </p>

          {socialEntries.length > 0 && (
            <div className="mb-8">
              {socialEntries.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 border-b border-zinc-100 text-sm text-zinc-700 hover:text-zinc-900 group"
                >
                  <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {platform[0]}
                  </div>
                  <span className="capitalize font-medium">{platform}</span>
                  <span className="ml-auto text-xs text-zinc-400 group-hover:underline truncate max-w-[180px]">
                    View profile
                  </span>
                </a>
              ))}
            </div>
          )}

          <p className="text-xs text-zinc-400 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            We typically respond within 24 hours
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          {submitStatus === 'ok' ? (
            <div className="text-center py-8">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"
                style={{ backgroundColor: primaryColor }}
              >
                ✓
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Message sent!</h3>
              <p className="text-zinc-500 text-sm">
                Thank you for reaching out. We&apos;ll be in touch shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className={inputCls}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={inputCls}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What's on your mind?"
                  className={inputCls}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  className={`${inputCls} resize-none`}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="w-full rounded-xl py-3.5 font-bold text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {submitStatus === 'loading' ? 'Sending…' : 'Send Message →'}
              </button>
            </form>
          )}
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
