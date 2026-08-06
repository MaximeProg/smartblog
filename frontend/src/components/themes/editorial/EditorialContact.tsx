'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, CheckCircle2, Loader2, Send } from 'lucide-react';
import type { ContactProps } from '@/components/themes/ThemeRenderer';
import { EditorialHeader, EditorialFooter } from './EditorialShared';
import { EditableSection } from '@/components/themes/shared/EditableSection';
import { InlineEditable } from '@/components/themes/shared/InlineEditable';
import { sanitizeHtml } from '@/components/themes/shared/renderContent';

export default function EditorialContact({ blog, categories, basePath, editMode, selectedSectionId, onSectionClick, onSectionHover }: ContactProps) {
  const editProps = { editMode, selectedSectionId, onSectionClick, onSectionHover };
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#18181b';
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
  const hasInfo = info.enabled !== false && !!(infoEmail || infoPhone || infoAddress);

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

  const inputCls =
    'w-full border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-sm transition-all';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditableSection id="header" {...editProps}>
        <EditorialHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
      </EditableSection>

      {/* Hero */}
      <EditableSection id="contact.hero" {...editProps}>
        <section className="relative overflow-hidden bg-zinc-950 text-white py-24 px-4">
          {heroCoverImage && (
            <>
              <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 to-zinc-950/80" />
            </>
          )}
          <div className="relative max-w-4xl mx-auto text-center">
            <InlineEditable path="template_config.contact.hero.subtitle" value={heroSubtitle} editMode={editMode} tag="p" className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }} />
            <InlineEditable path="template_config.contact.hero.title" value={heroTitle} editMode={editMode} tag="h1" className="text-4xl sm:text-5xl font-bold leading-tight mb-4" />
            <div className="text-zinc-400 text-lg max-w-xl mx-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(heroDesc) }} />
          </div>
        </section>
      </EditableSection>

      {/* Main */}
      <EditableSection id="contact.form" {...editProps}>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className={`grid gap-12 ${hasInfo ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl mx-auto'}`}>

          {/* Info panel */}
          {hasInfo && (
            <aside className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 mb-1">{t('contactInfoSection')}</h2>
                <p className="text-sm text-zinc-500">{t('contactInfoDesc')}</p>
              </div>
              <div className="space-y-4">
                {infoEmail && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}18` }}>
                      <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Email</p>
                      <a href={`mailto:${infoEmail}`} className="text-sm font-semibold hover:underline" style={{ color: primaryColor }}>{infoEmail}</a>
                    </div>
                  </div>
                )}
                {infoPhone && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}18` }}>
                      <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">{t('contactPhone')}</p>
                      <a href={`tel:${infoPhone}`} className="text-sm font-semibold hover:underline" style={{ color: primaryColor }}>{infoPhone}</a>
                    </div>
                  </div>
                )}
                {infoAddress && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}18` }}>
                      <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">{t('contactAddress')}</p>
                      <p className="text-sm font-semibold text-zinc-700">{infoAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Form */}
          <div className={hasInfo ? 'lg:col-span-2' : ''}>
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
              <div className="mb-8">
                <InlineEditable path="template_config.contact.form.title" value={formTitle} editMode={editMode} tag="h2" className="text-2xl font-bold text-zinc-900 mb-2" />
                {formDesc && <p className="text-zinc-500 text-sm">{formDesc}</p>}
              </div>

              {status === 'success' ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-5" style={{ backgroundColor: `${primaryColor}18` }}>
                    <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{t('contactMessageSent')}</h3>
                  <p className="text-zinc-500 text-sm mb-6">{t('contactMessageSentDesc')}</p>
                  <button
                    onClick={() => { setStatus('idle'); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {t('contactSendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{t('contactNameLabel')} *</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t('contactNamePlaceholder')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Email *</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('contactEmailPlaceholder')} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{t('contactSubjectLabel')}</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('contactSubjectPlaceholder')} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{t('contactMessageLabel')} *</label>
                    <textarea required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('contactMessagePlaceholder')} className={`${inputCls} resize-none`} />
                  </div>
                  {status === 'error' && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{errorMsg}</div>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
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
      </section>
      </EditableSection>

      <EditableSection id="footer" {...editProps}>
        <EditorialFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
      </EditableSection>
    </div>
  );
}
