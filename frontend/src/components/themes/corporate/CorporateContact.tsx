'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { CorporateHeader, CorporateFooter } from './shared';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function CorporateContactPage({ blog, categories, basePath }: Props) {
  const primaryColor = blog.primary_color || '#2563eb';
  const contactConfig = blog.template_config?.contact as Record<string, any> | undefined;

  const hero = contactConfig?.hero ?? {};
  const heroTitle = hero.title || 'Contactez-nous';
  const heroSubtitle = hero.subtitle || 'Contact';
  const heroDesc = hero.description || 'Une question ? Une idée ? Nous sommes à votre écoute.';

  const info = contactConfig?.info ?? {};
  const infoEmail = info.email || null;
  const infoPhone = info.phone || null;
  const infoAddress = info.address || null;
  const formTitle = contactConfig?.form?.title || 'Envoyez-nous un message';
  const formDesc = contactConfig?.form?.description || null;

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
      const res = await fetch(`${API_URL}/api/v1/public/${blog.slug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'envoi');
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('L\'envoi a échoué. Veuillez réessayer ou nous contacter directement par email.');
    }
  }

  const cpStyle = { '--cp': primaryColor } as CSSProperties;
  const hasInfo = !!(infoEmail || infoPhone || infoAddress);

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>
      <CorporateHeader
        blog={blog}
        categories={categories}
        primaryColor={primaryColor}
        minimal
        basePath={basePath}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 px-4">
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 opacity-20"
          style={{ backgroundColor: primaryColor }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }}>
            {heroSubtitle}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">{heroTitle}</h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">{heroDesc}</p>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className={`grid gap-12 ${hasInfo ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl mx-auto'}`}>

          {/* Contact info column */}
          {hasInfo && (
            <aside className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-1">Informations</h2>
                <p className="text-sm text-slate-500">Comment nous joindre directement</p>
              </div>
              <div className="space-y-4">
                {infoEmail && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}18` }}>
                      <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</p>
                      <a href={`mailto:${infoEmail}`} className="text-sm font-semibold hover:underline"
                        style={{ color: primaryColor }}>{infoEmail}</a>
                    </div>
                  </div>
                )}
                {infoPhone && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}18` }}>
                      <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Téléphone</p>
                      <a href={`tel:${infoPhone}`} className="text-sm font-semibold hover:underline"
                        style={{ color: primaryColor }}>{infoPhone}</a>
                    </div>
                  </div>
                )}
                {infoAddress && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}18` }}>
                      <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Adresse</p>
                      <p className="text-sm font-semibold text-slate-700">{infoAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link href={basePath}
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: primaryColor }}>
                  <ArrowRight className="h-4 w-4 rotate-180" /> Retour aux articles
                </Link>
              </div>
            </aside>
          )}

          {/* Form column */}
          <div className={hasInfo ? 'lg:col-span-2' : ''}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 mb-2">{formTitle}</h2>
                {formDesc && <p className="text-slate-500 text-sm">{formDesc}</p>}
              </div>

              {status === 'success' ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-5"
                    style={{ backgroundColor: `${primaryColor}18` }}>
                    <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Message envoyé !</h3>
                  <p className="text-slate-500 text-sm mb-6">Nous vous répondrons dans les meilleurs délais.</p>
                  <button
                    onClick={() => { setStatus('idle'); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Nom complet *
                      </label>
                      <input
                        type="text" required value={name} onChange={e => setName(e.target.value)}
                        placeholder="Jean Dupont"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': primaryColor } as CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Email *
                      </label>
                      <input
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="jean@exemple.com"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': primaryColor } as CSSProperties}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Sujet
                    </label>
                    <input
                      type="text" value={subject} onChange={e => setSubject(e.target.value)}
                      placeholder="En quoi pouvons-nous vous aider ?"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': primaryColor } as CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Message *
                    </label>
                    <textarea
                      required value={message} onChange={e => setMessage(e.target.value)}
                      rows={6} placeholder="Décrivez votre demande..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                      style={{ '--tw-ring-color': primaryColor } as CSSProperties}
                    />
                  </div>

                  {status === 'error' && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {status === 'loading' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Envoyer le message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <CorporateFooter blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} />
    </div>
  );
}
