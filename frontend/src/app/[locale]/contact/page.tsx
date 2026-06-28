'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Mail, MessageSquare, Headphones, ArrowRight, Check } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { siteConfig } from '@/config/site';

const CHANNELS = [
  {
    icon: MessageSquare,
    title: 'Sales',
    titleFr: 'Ventes',
    desc: 'Questions about plans, pricing, or custom enterprise contracts.',
    descFr: 'Questions sur les plans, tarifs ou contrats entreprise sur-mesure.',
    email: siteConfig.contact.sales,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Headphones,
    title: 'Support',
    titleFr: 'Support',
    desc: 'Technical help or questions about your account.',
    descFr: "Aide technique ou questions sur votre compte.",
    email: siteConfig.contact.support,
    color: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    icon: Mail,
    title: 'General',
    titleFr: 'Général',
    desc: 'Press, partnerships, or anything else.',
    descFr: 'Presse, partenariats ou autre.',
    email: siteConfig.contact.general,
    color: 'bg-violet-500/10 text-violet-500',
  },
];

export default function ContactPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isFr = locale === 'fr';

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      {/* Hero */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&w=1920&q=85"
          alt=""
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/70 to-slate-950/90" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight max-w-3xl">
            {isFr ? 'Contactez-nous' : 'Contact Us'}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            {isFr
              ? "Notre équipe est disponible du lundi au vendredi, de 9h à 18h (CET)."
              : "Our team is available Monday–Friday, 9am–6pm CET."}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: channels + response times */}
          <div>
            <h2 className="text-2xl font-bold mb-8">
              {isFr ? 'Trouver le bon canal' : 'Find the right channel'}
            </h2>
            <div className="space-y-4 mb-10">
              {CHANNELS.map(({ icon: Icon, title, titleFr, desc, descFr, email, color }) => (
                <div key={title} className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900">
                  <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold mb-0.5">{isFr ? titleFr : title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">{isFr ? descFr : desc}</p>
                    <a href={`mailto:${email}`} className="text-sm text-blue-500 hover:underline">{email}</a>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900">
              <p className="text-sm font-semibold mb-4">
                {isFr ? 'Temps de réponse moyen' : 'Average response time'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: isFr ? 'Support Pro' : 'Pro Support', value: '< 4h' },
                  { label: isFr ? 'Support Business' : 'Business Support', value: '< 1h' },
                  { label: isFr ? 'Support Starter' : 'Starter Support', value: '< 24h' },
                  { label: isFr ? 'Ventes' : 'Sales', value: '< 2h' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-white dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-base font-bold text-blue-500">{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Check className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {isFr ? 'Message envoyé !' : 'Message sent!'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {isFr
                    ? "Nous vous répondrons dans les plus brefs délais."
                    : "We'll get back to you as soon as possible."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-2xl font-bold mb-8">
                  {isFr ? 'Envoyer un message' : 'Send a message'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                      {isFr ? 'Nom' : 'Name'}
                    </label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder={isFr ? 'Votre nom' : 'Your name'}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      className={inputCls}
                      placeholder="vous@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                    {isFr ? 'Sujet' : 'Subject'}
                  </label>
                  <input
                    required
                    type="text"
                    className={inputCls}
                    placeholder={isFr ? 'Comment pouvons-nous vous aider ?' : 'How can we help?'}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                    {isFr ? 'Message' : 'Message'}
                  </label>
                  <textarea
                    required
                    rows={6}
                    className={`${inputCls} resize-none`}
                    placeholder={isFr ? 'Décrivez votre demande...' : 'Describe your request...'}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                >
                  {isFr ? 'Envoyer le message' : 'Send Message'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
