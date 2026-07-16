'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, CheckCircle2, Loader2, Send } from 'lucide-react';
import type { ContactProps } from '@/components/themes/ThemeRenderer';
import { CreativeHeader, CreativeFooter } from './CreativeShared';
import { EditableSection } from '@/components/themes/shared/EditableSection';
import { InlineEditable } from '@/components/themes/shared/InlineEditable';

export default function CreativeContact({ blog, categories, basePath, editMode, selectedSectionId, onSectionClick, onSectionHover }: ContactProps) {
  const editProps = { editMode, selectedSectionId, onSectionClick, onSectionHover };
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#7c3aed';
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
    'w-full border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-sm transition-all focus:border-zinc-400';

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditableSection id="header" {...editProps}>
        <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
      </EditableSection>

      <EditableSection id="contact.hero" {...editProps}>
        <section className="bg-zinc-950 py-20 relative overflow-hidden">
          {heroCoverImage && (
            <>
              <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 to-zinc-950/80" />
            </>
          )}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <InlineEditable path="template_config.contact.hero.subtitle" value={heroSubtitle} editMode={editMode} tag="span" className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 inline-block text-zinc-950" style={{ backgroundColor: primaryColor }} />
            <InlineEditable path="template_config.contact.hero.title" value={heroTitle} editMode={editMode} tag="h1" className="text-5xl font-black text-white leading-tight mb-4" />
            <div className="text-zinc-400 text-xl max-w-xl" dangerouslySetInnerHTML={{ __html: heroDesc }} />
          </div>
        </section>
      </EditableSection>

      <EditableSection id="contact.form" {...editProps}>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className={`grid gap-12 ${hasInfo ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl mx-auto'}`}>

          {/* Info panel */}
          {hasInfo && (
            <aside>
              <div className="bg-zinc-950 rounded-2xl p-8 text-white h-full">
                <h2 className="text-xl font-black mb-2">{t('contactInfoSection')}</h2>
                <p className="text-zinc-400 text-sm mb-8">{t('contactInfoDesc')}</p>
                <div className="space-y-5">
                  {infoEmail && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}30` }}>
                        <Mail className="h-4 w-4" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-0.5">Email</p>
                        <a href={`mailto:${infoEmail}`} className="text-sm font-bold text-white hover:text-[var(--cp)] transition-colors">{infoEmail}</a>
                      </div>
                    </div>
                  )}
                  {infoPhone && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}30` }}>
                        <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-0.5">{t('contactPhone')}</p>
                        <a href={`tel:${infoPhone}`} className="text-sm font-bold text-white hover:text-[var(--cp)] transition-colors">{infoPhone}</a>
                      </div>
                    </div>
                  )}
                  {infoAddress && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}30` }}>
                        <MapPin className="h-4 w-4" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-0.5">{t('contactAddress')}</p>
                        <p className="text-sm font-bold text-white">{infoAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Form */}
          <div className={hasInfo ? 'lg:col-span-2' : ''}>
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
              <div className="mb-8">
                <InlineEditable path="template_config.contact.form.title" value={formTitle} editMode={editMode} tag="h2" className="text-2xl font-black text-zinc-950 mb-2" />
                {formDesc && <p className="text-zinc-500 text-sm">{formDesc}</p>}
              </div>

              {status === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 min-h-[360px]">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: primaryColor }}>
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-950 mb-2">{t('contactMessageSent')}</h3>
                  <p className="text-zinc-500 text-sm max-w-xs mb-6">{t('contactMessageSentDesc')}</p>
                  <button
                    onClick={() => { setStatus('idle'); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                    className="text-sm font-black hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {t('contactSendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">{t('contactNameLabel')} *</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t('contactNamePlaceholder')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Email *</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('contactEmailPlaceholder')} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">{t('contactSubjectLabel')}</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('contactSubjectPlaceholder')} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">{t('contactMessageLabel')} *</label>
                    <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('contactMessagePlaceholder')} className={`${inputCls} resize-none`} />
                  </div>
                  {status === 'error' && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{errorMsg}</div>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-4 rounded-xl font-black text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
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
        <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
      </EditableSection>
    </div>
  );
}
