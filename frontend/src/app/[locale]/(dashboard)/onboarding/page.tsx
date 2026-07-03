'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ArrowRight, CheckCircle2, ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { tenantsApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import type { TenantInfo } from '@/types';

const COLORS = [
  { hex: '#2563eb', label: 'Bleu' },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#db2777', label: 'Rose' },
  { hex: '#dc2626', label: 'Rouge' },
  { hex: '#ea580c', label: 'Orange' },
  { hex: '#16a34a', label: 'Vert' },
  { hex: '#0891b2', label: 'Cyan' },
  { hex: '#334155', label: 'Ardoise' },
];

export default function OnboardingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { user, addTenant, setCurrentTenant } = useAuthStore();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [color, setColor] = useState('#2563eb');
  const [slugError, setSlugError] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImgError, setCoverImgError] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleSlugChange = (v: string) => {
    setSlugManual(true);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    setSlugError('');
  };

  const mutation = useMutation({
    mutationFn: () => tenantsApi.create({
      name: name.trim(),
      slug: slug.trim(),
      primary_color: color,
      theme: 'corporate',
      language: locale,
      cover_image_url: coverImageUrl.trim() || undefined,
      template_config: {
        header: {
          topBar: { enabled: true, showDate: true, showSocial: true, showNewsletter: true, showRss: true },
          subscribe: { enabled: true, label: "S'abonner" },
          nav: { links: [{ label: 'Accueil', url: '/' }, { label: 'À propos', url: '/about' }, { label: 'Contact', url: '/contact' }] },
        },
        footer: {
          description: `${name} — analyses et insights pour les professionnels.`,
          showCategories: true,
          navLinks: [{ label: 'Accueil', url: '/' }, { label: 'À propos', url: '/about' }, { label: 'Contact', url: '/contact' }, { label: 'Flux RSS', url: '/rss.xml' }],
          showSocialLinks: true,
          showNewsletterMini: true,
          newsletterMiniText: 'Recevez nos meilleurs articles chaque semaine.',
          copyrightText: 'Tous droits réservés.',
          showPoweredBy: true,
        },
        home: {
          hero: { enabled: true, sectionTitle: 'À la une' },
          categoriesStrip: { enabled: true, label: 'Explorer' },
          newsletter: { enabled: true, title: 'Restez toujours informé', description: 'Rejoignez nos abonnés et recevez chaque semaine nos meilleurs articles directement dans votre boîte mail.', buttonLabel: "S'abonner", placeholder: 'votre@email.com', disclaimer: 'Pas de spam · Désabonnement en un clic' },
          latest: { enabled: true, sectionTitle: 'Derniers articles' },
          sidebar: { popularArticles: true, popularTitle: 'Articles populaires', categories: true, categoriesTitle: 'Catégories', tags: true, tagsTitle: 'Tags', newsletterMini: true },
        },
        about: {
          hero: { enabled: true, title: `À propos de ${name}`, subtitle: 'À propos', description: 'Découvrez notre histoire, notre mission et notre équipe.' },
          stats: { enabled: true, items: [{ value: '0', label: 'Articles' }, { value: '0', label: 'Abonnés' }] },
          mission: { enabled: true, title: 'Notre mission', description: 'Partager des insights de qualité avec nos lecteurs.' },
          values: { enabled: true, title: 'Nos valeurs', items: [{ icon: '🎯', title: 'Expertise', description: 'Des contenus rédigés par des experts.' }] },
          team: { enabled: false, title: 'Notre équipe', members: [] },
          cta: { enabled: true, title: 'Rejoignez notre communauté', description: 'Abonnez-vous pour ne rien manquer.', primaryLabel: "S'abonner", secondaryLabel: 'Nos articles' },
        },
        contact: {
          hero: { enabled: true, title: 'Prenons contact', subtitle: 'Contact', description: 'Une question ? Contactez-nous.' },
          form: { enabled: true, title: 'Envoyez-nous un message', namePlaceholder: 'Votre nom', emailPlaceholder: 'votre@email.com', subjectPlaceholder: 'Sujet', messagePlaceholder: 'Votre message…', submitLabel: 'Envoyer', successMessage: 'Message envoyé, merci !' },
          info: { enabled: true, title: 'Contact', email: '', responseTime: 'Réponse sous 48h', showAddress: false, address: '' },
          faq: { enabled: false, title: 'FAQ', items: [] },
        },
        article: {
          progressBar: { enabled: true },
          tableOfContents: { enabled: true, title: 'Dans cet article', minHeadings: 3 },
          share: { enabled: true, title: 'Partager', platforms: { twitter: true, linkedin: true, facebook: true, copyLink: true } },
          authorBio: { enabled: true, title: "À propos de l'auteur" },
          comments: { enabled: false, provider: 'none' },
          relatedArticles: { enabled: true, title: 'Articles similaires', count: 3 },
        },
      } as any,
    } as any),
    onSuccess: ({ data }) => {
      const t: TenantInfo = { id: data.id, name: data.name, slug: data.slug, plan: data.plan, role: 'tenant_admin' };
      addTenant(t);
      setCurrentTenant(data.id);
      router.push(`/${locale}/blogs/${data.id}/general`);
    },
    onError: (err: any) => {
      if (err?.response?.data?.detail?.includes('slug')) {
        setSlugError('Ce slug est déjà utilisé, choisissez-en un autre.');
      }
    },
  });

  const canSubmit = name.trim().length >= 2 && slug.length >= 3 && !mutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header card */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl mx-auto mb-4">N</div>
          <h1 className="text-xl font-black text-slate-900">Créez votre premier blog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bonjour {user?.display_name?.split(' ')[0] ?? 'là'} 👋 — tout est prêt, donnez un nom à votre blog.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-5">

          {/* Nom */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom du blog <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Ex: NexusBlog Insights"
              autoFocus
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">URL du blog <span className="text-red-500">*</span></label>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
              <span className="flex items-center px-3 text-[11px] text-slate-400 bg-slate-100 border-r border-slate-200 shrink-0 select-none font-mono">
                nexusblog.io/
              </span>
              <input
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="mon-blog"
                className="flex-1 h-11 px-3 text-[13px] font-mono bg-transparent outline-none text-slate-900"
              />
            </div>
            {slugError && <p className="text-[11px] text-red-500 mt-1">{slugError}</p>}
          </div>

          {/* Couleur primaire */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Couleur principale</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className="h-8 w-8 rounded-xl transition-all hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    outline: color === c.hex ? `3px solid ${c.hex}` : '3px solid transparent',
                    outlineOffset: 2,
                  }}
                />
              ))}
              <label className="h-8 w-8 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors" title="Couleur personnalisée">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="sr-only" />
                <span className="text-slate-400 text-xs">+</span>
              </label>
              <div className="h-8 w-8 rounded-xl border border-slate-200 ml-1" style={{ backgroundColor: color }} />
            </div>
          </div>

          {/* Miniature du blog */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Miniature du blog <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={e => { setCoverImageUrl(e.target.value); setCoverImgError(false); }}
              placeholder="https://exemple.com/image.jpg"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
            {coverImageUrl && !coverImgError && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 relative">
                <img
                  src={coverImageUrl}
                  alt="Aperçu miniature"
                  className="w-full h-full object-cover"
                  onError={() => setCoverImgError(true)}
                />
              </div>
            )}
            {coverImageUrl && coverImgError && (
              <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 h-28 flex flex-col items-center justify-center gap-1 text-slate-400">
                <ImageIcon className="h-5 w-5" />
                <span className="text-[11px]">URL invalide ou image inaccessible</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="w-full h-12 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: color }}
          >
            {mutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Création en cours…</>
              : <>Créer mon blog <ArrowRight className="h-4 w-4" /></>
            }
          </button>

          {mutation.isSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium justify-center">
              <CheckCircle2 className="h-4 w-4" /> Blog créé ! Redirection…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
