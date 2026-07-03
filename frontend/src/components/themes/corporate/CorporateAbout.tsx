'use client';

import { type CSSProperties } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CorporateHeader, CorporateFooter, NewsletterSection } from './shared';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function CorporateAboutPage({ blog, categories, basePath }: Props) {
  const primaryColor = blog.primary_color || '#2563eb';
  const aboutConfig = blog.template_config?.about as Record<string, any> | undefined;

  const hero = aboutConfig?.hero ?? {};
  const heroTitle = hero.title || `À propos de ${blog.name}`;
  const heroSubtitle = hero.subtitle || 'À propos';
  const heroDesc = hero.description || blog.description || 'Découvrez notre histoire, notre mission et notre équipe.';

  const missionConfig = aboutConfig?.mission ?? {};
  const missionTitle = missionConfig.title || 'Notre mission';
  const missionDesc = missionConfig.description || 'Partager des insights de qualité avec nos lecteurs.';

  const statsItems: { value: string; label: string }[] = aboutConfig?.stats?.items ?? [];

  const valuesItems: { icon?: string; title: string; description: string }[] =
    aboutConfig?.values?.items ?? [
      { title: 'Qualité', description: 'Des contenus rédigés avec soin et expertise.' },
      { title: 'Transparence', description: 'Des informations vérifiées, sourcées, honnêtes.' },
      { title: 'Impact', description: 'Chaque article apporte une valeur actionnable.' },
    ];

  const ctaConfig = aboutConfig?.cta ?? {};
  const ctaTitle = ctaConfig.title || 'Rejoignez notre communauté';
  const ctaDesc = ctaConfig.description || 'Abonnez-vous pour ne rien manquer.';
  const ctaPrimary = ctaConfig.primaryLabel || "S'abonner";
  const ctaSecondary = ctaConfig.secondaryLabel || 'Nos articles';

  const cpStyle = { '--cp': primaryColor } as CSSProperties;

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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20"
          style={{ backgroundColor: primaryColor }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }}>
            {heroSubtitle}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">{heroTitle}</h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">{heroDesc}</p>
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-sm font-bold border border-white/20 text-white hover:bg-white/5 transition-colors"
          >
            Lire nos articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      {statsItems.length > 0 && (
        <section className="border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {statsItems.map((s: { value: string; label: string }) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-black mb-1" style={{ color: primaryColor }}>{s.value}</div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-6">{missionTitle}</h2>
        <p className="text-lg text-slate-500 leading-relaxed">{missionDesc}</p>
      </section>

      {/* Values */}
      {valuesItems.length > 0 && (
        <section className="bg-slate-50 border-y border-slate-100 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900 text-center mb-12">
              {aboutConfig?.values?.title || 'Nos valeurs'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {valuesItems.map((v: { title: string; description: string }) => (
                <div key={v.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <CheckCircle2 className="h-7 w-7 mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-black text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-slate-950 text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-4">{ctaTitle}</h2>
          <p className="text-slate-400 text-lg mb-8">{ctaDesc}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#newsletter"
              className="h-12 px-8 rounded-2xl text-sm font-bold text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <Mail className="h-4 w-4" /> {ctaPrimary}
            </a>
            <Link
              href={basePath}
              className="h-12 px-8 rounded-2xl text-sm font-bold border border-white/20 text-white flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              {ctaSecondary} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSection blog={blog} primaryColor={primaryColor} />
      <CorporateFooter blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} />
    </div>
  );
}
