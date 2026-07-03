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

const FAQS = [
  {
    q: "Comment puis-je proposer un article pour NexusBlog Insights ?",
    a: "Nous accueillons les contributions d'experts avec au moins 5 ans d'expérience dans leur domaine. Envoyez-nous un sujet + un plan + 2-3 références à contributors@nexusblog.io. Notre comité éditorial vous répond sous 5 jours ouvrés.",
  },
  {
    q: "Est-il possible de reprendre vos articles sur d'autres médias ?",
    a: "Nos contenus sont protégés par le droit d'auteur. Cependant, nous autorisons la republication partielle (jusqu'à 300 mots) avec attribution claire et lien vers l'article original. Pour une republication intégrale, contactez-nous pour obtenir une licence.",
  },
  {
    q: "Comment accéder aux contenus Premium ?",
    a: "Les articles Premium sont accessibles via un abonnement mensuel ou annuel. Vous pouvez vous abonner depuis n'importe quelle page article Premium. L'abonnement vous donne accès à l'intégralité du catalogue Premium + les archives.",
  },
  {
    q: "Proposez-vous des partenariats ou des contenus sponsorisés ?",
    a: "Nous travaillons avec un nombre limité de partenaires dont les produits et services sont pertinents pour notre audience. Tout contenu commercial est clairement identifié comme tel. Contactez-nous via le formulaire pour discuter des opportunités.",
  },
  {
    q: "Comment signaler une erreur dans un article ?",
    a: "La précision est notre priorité. Si vous relevez une inexactitude, contactez-nous en précisant l'article concerné, l'erreur identifiée et votre source. Nous vérifions et corrigeons sous 48h avec une note de correction transparente.",
  },
];

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

export default function ContactPage() {
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview');

  const { data: realBlog } = useQuery({
    queryKey: ['public-blog', preview],
    queryFn: () => publicApi.getBlogInfo(preview!),
    enabled: !!preview,
  });

  const blog = (preview ? realBlog : null) ?? (MOCK_BLOG as unknown as BlogInfo);
  const primaryColor = blog.primary_color || '#2563eb';

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

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>
      <CorporateHeader
        blog={blog as any}
        categories={MOCK_CATEGORIES as any}
        primaryColor={primaryColor}
        minimal
        basePath="/en/template"
        previewSlug={preview ?? undefined}
      />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
            Une question ?<br className="hidden sm:block" />
            <span style={{ color: primaryColor }}>Parlons-en.</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            Notre équipe répond à toutes les demandes sous 2 jours ouvrés. Nous sommes toujours heureux d'échanger avec nos lecteurs.
          </p>
        </div>
      </section>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16">

        {/* Form */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Envoyer un message</h2>
          <p className="text-slate-500 mb-8">Tous les champs marqués <span className="text-red-400">*</span> sont obligatoires.</p>

          {status === 'done' ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-black text-xl text-slate-900 mb-2">Message envoyé !</h3>
              <p className="text-slate-500 mb-6">Merci pour votre message. Notre équipe vous répondra sous 2 jours ouvrés.</p>
              <button onClick={() => setStatus('idle')}
                className="h-11 px-6 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}>
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Nom complet <span className="text-red-400">*</span></label>
                  <input value={form.name} onChange={set('name')} required
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-slate-50"
                    style={ring} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Email <span className="text-red-400">*</span></label>
                  <input type="email" value={form.email} onChange={set('email')} required
                    placeholder="jean@exemple.fr"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-slate-50"
                    style={ring} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Sujet <span className="text-red-400">*</span></label>
                <select value={form.subject} onChange={set('subject')} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-slate-50 appearance-none"
                  style={ring}>
                  <option value="">Sélectionnez un sujet…</option>
                  <option value="editorial">Question éditoriale</option>
                  <option value="contribution">Proposer un article</option>
                  <option value="partenariat">Partenariat / publicité</option>
                  <option value="correction">Signaler une erreur</option>
                  <option value="abonnement">Abonnement Premium</option>
                  <option value="technique">Problème technique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Message <span className="text-red-400">*</span></label>
                <textarea value={form.message} onChange={set('message')} required rows={6}
                  placeholder="Décrivez votre demande en détail…"
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
                <span className="text-sm text-slate-500">Je souhaite recevoir la newsletter NexusBlog Insights (1 email par semaine, désinscription en 1 clic)</span>
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
                      Envoi en cours…
                    </>
                  ) : (
                    <><Send className="h-4 w-4" /> Envoyer le message</>
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-3">Vos données sont traitées conformément à notre politique de confidentialité. Elles ne sont jamais vendues à des tiers.</p>
              </div>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          {/* Info cards */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h3 className="font-black text-slate-900 mb-5">Nous joindre directement</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Email</p>
                  <a href="mailto:hello@nexusblog.io" className="text-sm font-semibold text-slate-800 hover:text-[var(--cp)] transition-colors">hello@nexusblog.io</a>
                  <p className="text-xs text-slate-400 mt-0.5">Réponse sous 2 jours ouvrés</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Téléphone</p>
                  <a href="tel:+33140000000" className="text-sm font-semibold text-slate-800 hover:text-[var(--cp)] transition-colors">+33 1 40 00 00 00</a>
                  <p className="text-xs text-slate-400 mt-0.5">Lun–Ven, 9h–18h (CET)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Adresse</p>
                  <p className="text-sm font-semibold text-slate-800">15 rue de Rivoli</p>
                  <p className="text-xs text-slate-400 mt-0.5">75001 Paris, France</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h3 className="font-black text-slate-900 mb-4">Nous suivre</h3>
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
            <h3 className="font-black text-lg mb-4">Temps de réponse</h3>
            <div className="space-y-3">
              {[
                ['Questions générales', '< 48h'],
                ['Partenariats', '< 72h'],
                ['Urgences techniques', '< 24h'],
              ].map(([type, time]) => (
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
            <h2 className="text-3xl font-black text-slate-900">Questions fréquentes</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6">
            {FAQS.map(faq => <FaqItem key={faq.q} faq={faq} primaryColor={primaryColor} />)}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">
            Vous ne trouvez pas votre réponse ?{' '}
            <Link href="#" className="font-bold hover:underline" style={{ color: primaryColor }}>
              Consultez notre centre d'aide
            </Link>
          </p>
        </div>
      </section>

      <CorporateFooter blog={blog as any} categories={MOCK_CATEGORIES as any} primaryColor={primaryColor} basePath="/en/template" previewSlug={preview ?? undefined} />
    </div>
  );
}
