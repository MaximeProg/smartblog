'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, CheckCircle2, Loader2, Send } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { MagazineHeader, MagazineFooter } from './MagazineShared';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function MagazineContact({ blog, categories, basePath }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#e11d48';
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

  const inputClass =
    'w-full border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-sm transition-colors focus:border-zinc-500';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <div className="border-t-4" style={{ borderColor: primaryColor }}>
        <div className="bg-zinc-950 relative overflow-hidden">
          {heroCoverImage && (
            <>
              <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 to-zinc-950/90" />
            </>
          )}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <span className="text-[10px] font-black uppercase tracking-widest mb-4 block" style={{ color: primaryColor }}>{heroSubtitle}</span>
            <h1 className="text-5xl font-black text-white leading-tight mb-4">{heroTitle}</h1>
            <p className="text-zinc-400 text-xl max-w-xl">{heroDesc}</p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className={`grid gap-12 ${hasInfo ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl mx-auto'}`}>

          {/* Info panel */}
          {hasInfo && (
            <aside className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-zinc-950 mb-1">{t('contactInfoSection')}</h2>
                <p className="text-sm text-zinc-500">{t('contactInfoDesc')}</p>
              </div>
              <div className="space-y-5">
                {infoEmail && (
                  <div className="border-b border-zinc-100 pb-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Email</p>
                    <a href={`mailto:${infoEmail}`} className="text-zinc-900 font-bold hover:text-[var(--cp)] transition-colors">{infoEmail}</a>
                  </div>
                )}
                {infoPhone && (
                  <div className="border-b border-zinc-100 pb-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">{t('contactPhone')}</p>
                    <a href={`tel:${infoPhone}`} className="text-zinc-900 font-bold hover:text-[var(--cp)] transition-colors">{infoPhone}</a>
                  </div>
                )}
                {infoAddress && (
                  <div className="border-b border-zinc-100 pb-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">{t('contactAddress')}</p>
                    <p className="text-zinc-900 font-bold">{infoAddress}</p>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Form */}
          <div className={hasInfo ? 'lg:col-span-2' : ''}>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-zinc-950 mb-2">{formTitle}</h2>
              {formDesc && <p className="text-zinc-500 text-sm">{formDesc}</p>}
            </div>

            {status === 'success' ? (
              <div className="py-12 text-center border-t-4" style={{ borderColor: primaryColor }}>
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: primaryColor }} />
                <h3 className="text-xl font-black text-zinc-950 mb-2">{t('contactMessageSent')}</h3>
                <p className="text-zinc-500 text-sm mb-6">{t('contactMessageSentDesc')}</p>
                <button
                  onClick={() => { setStatus('idle'); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                  className="text-sm font-black hover:underline"
                  style={{ color: primaryColor }}
                >
                  {t('contactSendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">{t('contactNameLabel')} *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t('contactNamePlaceholder')} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">Email *</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('contactEmailPlaceholder')} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">{t('contactSubjectLabel')}</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('contactSubjectPlaceholder')} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">{t('contactMessageLabel')} *</label>
                  <textarea required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('contactMessagePlaceholder')} className={`${inputClass} resize-none`} />
                </div>
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-100 p-4 text-sm text-red-700">{errorMsg}</div>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-zinc-950 text-white py-4 font-black uppercase tracking-wider text-sm hover:bg-[var(--cp)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('contactSendingButton')}</>
                  ) : (
                    <><Send className="h-4 w-4" /> {t('contactSendButton')}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
