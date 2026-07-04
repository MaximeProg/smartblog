'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ArrowRight, CheckCircle2, Globe, Palette, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { tenantsApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import type { TenantInfo } from '@/types';

const COLORS = [
  { hex: '#2563eb', label: 'Blue'   },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#db2777', label: 'Pink'   },
  { hex: '#dc2626', label: 'Red'    },
  { hex: '#ea580c', label: 'Orange' },
  { hex: '#16a34a', label: 'Green'  },
  { hex: '#0891b2', label: 'Cyan'   },
  { hex: '#334155', label: 'Slate'  },
];

export default function OnboardingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { user, addTenant, setCurrentTenant } = useAuthStore();
  const t = useTranslations('onboarding');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [color, setColor] = useState('#2563eb');
  const [slugError, setSlugError] = useState('');

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
      const tenant: TenantInfo = { id: data.id, name: data.name, slug: data.slug, plan: data.plan, role: 'tenant_admin' };
      addTenant(tenant);
      setCurrentTenant(data.id);
      router.push(`/${locale}/blogs/${data.id}/general`);
    },
    onError: (err: any) => {
      if (err?.response?.data?.detail?.includes('slug')) {
        setSlugError(t('quickSlugTaken'));
      }
    },
  });

  const canSubmit = name.trim().length >= 2 && slug.length >= 3 && !mutation.isPending;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-10">

            {/* Page header */}
            <div className="mb-8">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('backToDashboard') || 'Back to dashboard'}
              </Link>
              <h1 className="text-[22px] font-black text-slate-900 dark:text-slate-100">{t('quickTitle')}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                {t('quickGreeting', { name: user?.display_name?.split(' ')[0] ?? '' })}
              </p>
            </div>

            {/* Form card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">

              {/* Color preview banner */}
              <div className="h-2 w-full transition-colors" style={{ backgroundColor: color }} />

              <div className="p-8 space-y-6">

                {/* Blog name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    {t('quickNameLabel')} <span className="text-red-500 normal-case">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder={t('quickNamePlaceholder')}
                    autoFocus
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> {t('quickUrlLabel')} <span className="text-red-500 normal-case font-normal">*</span>
                  </label>
                  <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                    <span className="flex items-center px-3 text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 shrink-0 select-none font-mono">
                      nexusblog.io/
                    </span>
                    <input
                      value={slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      placeholder="my-blog"
                      className="flex-1 h-11 px-3 text-[13px] font-mono bg-transparent outline-none text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  {slugError && <p className="text-[11px] text-red-500 mt-1.5">{slugError}</p>}
                  {slug && !slugError && (
                    <p className="text-[11px] text-slate-400 mt-1.5 font-mono">nexusblog.io/{slug}</p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Palette className="h-3 w-3" /> {t('quickColorLabel')}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.label}
                        onClick={() => setColor(c.hex)}
                        className="h-9 w-9 rounded-xl transition-all hover:scale-110 shrink-0"
                        style={{
                          backgroundColor: c.hex,
                          outline: color === c.hex ? `3px solid ${c.hex}` : '3px solid transparent',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                    <label className="h-9 w-9 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors shrink-0" title="Custom color">
                      <input type="color" value={color} onChange={e => setColor(e.target.value)} className="sr-only" />
                      <span className="text-slate-400 text-xs font-bold">+</span>
                    </label>
                    <div className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0" style={{ backgroundColor: color }} />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* Submit */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={!canSubmit}
                    className="flex items-center gap-2 h-11 px-6 rounded-xl text-white font-bold text-[14px] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {mutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('quickCreating')}</>
                      : <>{t('quickCreate')} <ArrowRight className="h-4 w-4" /></>
                    }
                  </button>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="h-11 px-5 rounded-xl text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center transition-colors"
                  >
                    Cancel
                  </Link>
                </div>

                {mutation.isSuccess && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> {t('quickSuccess')}
                  </div>
                )}
              </div>
            </div>

            {/* Info box */}
            <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3">
              <p className="text-[12px] text-blue-600 dark:text-blue-400 leading-relaxed">
                You can customize your blog's appearance, pages, and settings after creation in the Studio.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
