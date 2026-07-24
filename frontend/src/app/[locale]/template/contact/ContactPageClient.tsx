'use client';

import { useState, type FormEvent, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  Mail, Phone, MapPin, Send, Check, Twitter,
  Linkedin, Instagram, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CorporateHeader, CorporateFooter } from '@/components/themes/corporate/shared';
import { MOCK_BLOG, MOCK_CATEGORIES } from '@/components/themes/corporate/mock-data';
import { publicApi, type BlogInfo } from '@/lib/public-api';
import type { ContactLabels } from './labels';

function FaqItem({ faq, primaryColor }: { faq: { q: string; a: string }; primaryColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-bold text-slate-800 group-hover:text-[var(--cp)] transition-colors leading-snug"
          style={{ '--cp': primaryColor } as CSSProperties}>
          {faq.q}
        </span>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />}
      </button>
      {open && (
        <p className="text-sm text-slate-500 leading-relaxed pb-5 pr-8">{faq.a}</p>
      )}
    </div>
  );
}

export default function ContactPageClient({ l, locale }: { l: ContactLabels; locale: string }) {
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview');

  const { data: realBlog } = useQuery({
    queryKey: ['public-blog', preview],
    queryFn: () => publicApi.getBlogInfo(preview!),
    enabled: !!preview,
  });

  const blog = (preview ? realBlog : null) ?? (MOCK_BLOG as unknown as BlogInfo);
  const primaryColor = blog.primary_color || '#2563eb';
  const templateBasePath = `/${locale}/template`;

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', newsletter: false });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await new Promise(r => setTimeout(r, 1200));
    setStatus('done');
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const ring = { '--tw-ring-color': `${primaryColor}40` } as CSSProperties;
  const cpStyle = { '--cp': primaryColor, fontFamily: "'Inter', system-ui, sans-serif" } as CSSProperties;

  const FAQS = [
    { q: l.faq1Q, a: l.faq1A },
    { q: l.faq2Q, a: l.faq2A },
    { q: l.faq3Q, a: l.faq3A },
    { q: l.faq4Q, a: l.faq4A },
    { q: l.faq5Q, a: l.faq5A },
  ];

  const RESPONSE_TIMES: [string, string][] = [
    [l.responseTime1Label, '< 48h'],
    [l.responseTime2Label, '< 72h'],
    [l.responseTime3Label, '< 24h'],
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>
      <CorporateHeader
        blog={blog as any}
        categories={MOCK_CATEGORIES as any}
        primaryColor={primaryColor}
        minimal
        basePath={templateBasePath}
        previewSlug={preview ?? undefined}
      />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
            {l.heroTitleLine1}<br className="hidden sm:block" />
            <span style={{ color: primaryColor }}>{l.heroTitleHighlight}</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            {l.heroSubtitle}
          </p>
        </div>
      </section>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16">

        {/* Form */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{l.sendMessageHeading}</h2>
          <p className="text-slate-500 mb-8">{l.requiredFieldsNote}</p>

          {status === 'done' ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-black text-xl text-slate-900 mb-2">{l.successHeading}</h3>
              <p className="text-slate-500 mb-6">{l.successMessage}</p>
              <button onClick={() => setStatus('idle')}
                className="h-11 px-6 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}>
                {l.sendAnotherButton}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">{l.fullNameLabel} <span className="text-red-400">*</span></label>
                  <input value={form.name} onChange={set('name')} required
                    placeholder={l.fullNamePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-slate-50"
                    style={ring} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">{l.emailLabel} <span className="text-red-400">*</span></label>
                  <input type="email" value={form.email} onChange={set('email')} required
                    placeholder={l.emailPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-slate-50"
                    style={ring} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">{l.subjectLabel} <span className="text-red-400">*</span></label>
                <select value={form.subject} onChange={set('subject')} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-slate-50 appearance-none"
                  style={ring}>
                  <option value="">{l.subjectPlaceholder}</option>
                  <option value="editorial">{l.subjectOption1}</option>
                  <option value="contribution">{l.subjectOption2}</option>
                  <option value="partenariat">{l.subjectOption3}</option>
                  <option value="correction">{l.subjectOption4}</option>
                  <option value="abonnement">{l.subjectOption5}</option>
                  <option value="technique">{l.subjectOption6}</option>
                  <option value="autre">{l.subjectOption7}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">{l.messageLabel} <span className="text-red-400">*</span></label>
                <textarea value={form.message} onChange={set('message')} required rows={6}
                  placeholder={l.messagePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 bg-slate-50"
                  style={ring} />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.newsletter}
                  onChange={e => setForm(f => ({ ...f, newsletter: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-500">{l.newsletterCheckboxLabel}</span>
              </label>

              <div className="pt-2">
                <button type="submit" disabled={status === 'loading'}
                  className="flex items-center gap-2 h-12 px-8 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}>
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {l.submitLoading}
                    </>
                  ) : (
                    <><Send className="h-4 w-4" /> {l.submitButton}</>
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-3">{l.privacyNote}</p>
              </div>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          {/* Info cards */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h3 className="font-black text-slate-900 mb-5">{l.directContactHeading}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{l.emailLabel}</p>
                  <a href="mailto:hello@smarterbloggers.com" className="text-sm font-semibold text-slate-800 hover:text-[var(--cp)] transition-colors">hello@smarterbloggers.com</a>
                  <p className="text-xs text-slate-400 mt-0.5">{l.emailResponseNote}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{l.phoneLabel}</p>
                  <a href="tel:+33140000000" className="text-sm font-semibold text-slate-800 hover:text-[var(--cp)] transition-colors">+33 1 40 00 00 00</a>
                  <p className="text-xs text-slate-400 mt-0.5">{l.phoneResponseNote}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{l.addressLabel}</p>
                  <p className="text-sm font-semibold text-slate-800">{l.addressLine1}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{l.addressLine2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h3 className="font-black text-slate-900 mb-4">{l.followUsHeading}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Twitter className="h-5 w-5" />, label: 'Twitter', href: 'https://twitter.com', color: '#1d9bf0' },
                { icon: <Linkedin className="h-5 w-5" />, label: 'LinkedIn', href: 'https://linkedin.com', color: '#0077b5' },
                { icon: <Instagram className="h-5 w-5" />, label: 'Instagram', href: 'https://instagram.com', color: '#e1306c' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all text-slate-500 hover:text-white group"
                  style={{ '--hover-bg': s.color } as CSSProperties}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = s.color)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  {s.icon}
                  <span className="text-xs font-bold">{s.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Response times */}
          <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: primaryColor }}>
            <h3 className="font-black text-lg mb-4">{l.responseTimeHeading}</h3>
            <div className="space-y-3">
              {RESPONSE_TIMES.map(([type, time]) => (
                <div key={type} className="flex justify-between items-center border-b border-white/20 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm text-white/80">{type}</span>
                  <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-lg">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-slate-100 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900">{l.faqHeading}</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6">
            {FAQS.map(faq => <FaqItem key={faq.q} faq={faq} primaryColor={primaryColor} />)}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">
            {l.faqNotFoundText}{' '}
            <Link href="#" className="font-bold hover:underline" style={{ color: primaryColor }}>
              {l.faqHelpCenterLink}
            </Link>
          </p>
        </div>
      </section>

      <CorporateFooter blog={blog as any} categories={MOCK_CATEGORIES as any} primaryColor={primaryColor} basePath={templateBasePath} previewSlug={preview ?? undefined} />
    </div>
  );
}
