'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, CheckCircle2, Loader2, Send } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function LuminaryContact({ blog, categories, basePath }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#b8960c';
  const contactConfig = blog.template_config?.contact as Record<string, any> | undefined;

  const hero = contactConfig?.hero ?? {};
  const heroTitle = hero.title || t('contactTitle');
  const heroSubtitle = hero.subtitle || t('contactSubtitle');
  const heroDesc = hero.description || t('contactDesc');
  const heroCoverImage: string | undefined = hero.cover_image_url || undefined;

  const info = contactConfig?.info ?? {};
  const infoEmail = info.email || null;
  const infoPhone = info.phone || null;
  const infoAddress = info.address || null;
  const hasInfo = !!(infoEmail || infoPhone || infoAddress);

  const formTitle = contactConfig?.form?.title || t('contactFormTitle');
  const formDesc: string | null = contactConfig?.form?.description || null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/public-proxy/${blog.slug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error('send_failed');
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg(t('contactErrorMsg'));
    }
  }

  const inputBase =
    'w-full bg-transparent border-0 border-b border-zinc-300 px-0 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors font-sans';

  return (
    <div className="bg-[#faf8f4] min-h-screen text-zinc-900" style={{ '--cp': primaryColor } as CSSProperties}>
      <LuminaryHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <section className="bg-zinc-950 text-white py-24 relative overflow-hidden">
        {heroCoverImage && (
          <>
            <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 to-zinc-950/80" />
          </>
        )}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-6">{heroSubtitle}</p>
          <h1 className="font-serif italic text-5xl sm:text-6xl text-white mb-6">{heroTitle}</h1>
          <p className="font-sans text-zinc-400 text-lg max-w-xl mx-auto">{heroDesc}</p>
        </div>
      </section>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className={`grid gap-16 ${hasInfo ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl mx-auto'}`}>

          {/* Info panel */}
          {hasInfo && (
            <aside className="space-y-8">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 mb-3">{t('contactInfoSection')}</p>
                <p className="font-sans text-sm text-zinc-500">{t('contactInfoDesc')}</p>
              </div>
              <div className="space-y-6">
                {infoEmail && (
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Email</p>
                    <a href={`mailto:${infoEmail}`} className="font-serif text-zinc-900 hover:text-[var(--cp)] transition-colors">{infoEmail}</a>
                  </div>
                )}
                {infoPhone && (
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{t('contactPhone')}</p>
                    <a href={`tel:${infoPhone}`} className="font-serif text-zinc-900 hover:text-[var(--cp)] transition-colors">{infoPhone}</a>
                  </div>
                )}
                {infoAddress && (
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{t('contactAddress')}</p>
                    <p className="font-serif text-zinc-900">{infoAddress}</p>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Form */}
          <div className={hasInfo ? 'lg:col-span-2' : ''}>
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-zinc-200" />
                <h2 className="font-serif italic text-2xl text-zinc-900 whitespace-nowrap">{formTitle}</h2>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>
              {formDesc && <p className="font-sans text-sm text-zinc-500 text-center">{formDesc}</p>}
            </div>

            {status === 'success' ? (
              <div className="py-16 text-center">
                <p className="font-serif italic text-3xl text-zinc-900 mb-4">{t('contactMessageSent')}</p>
                <p className="font-sans text-sm text-zinc-500 mb-8">{t('contactMessageSentDesc')}</p>
                <button
                  onClick={() => { setStatus('idle'); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                  className="font-sans text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors underline underline-offset-4"
                >
                  {t('contactSendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">{t('contactNameLabel')} *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t('contactNamePlaceholder')} className={inputBase} />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">Email *</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('contactEmailPlaceholder')} className={inputBase} />
                  </div>
                </div>
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">{t('contactSubjectLabel')}</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('contactSubjectPlaceholder')} className={inputBase} />
                </div>
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 block mb-2">{t('contactMessageLabel')} *</label>
                  <textarea required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('contactMessagePlaceholder')} className={`${inputBase} resize-none`} />
                </div>
                {status === 'error' && (
                  <p className="font-sans text-xs text-red-500">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="font-sans text-xs uppercase tracking-widest py-3 px-8 text-white disabled:opacity-60 hover:opacity-90 transition-opacity flex items-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {status === 'loading' ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('contactSendingButton')}</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> {t('contactSendButton')}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <LuminaryFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
