'use client';

import { type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CorporateHeader, CorporateFooter, NewsletterSection } from './shared';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function CorporateAboutPage({ blog, categories, basePath }: Props) {
  const t = useTranslations('publicBlog');

  const primaryColor = blog.primary_color || '#2563eb';
  const aboutConfig = blog.template_config?.about as Record<string, any> | undefined;

  const hero = aboutConfig?.hero ?? {};
  const heroTitle = hero.title || `${t('aboutHeroSubtitle')} ${blog.name}`;
  const heroSubtitle = hero.subtitle || t('aboutHeroSubtitle');
  const heroDesc = hero.description || blog.description || t('aboutHeroDesc');

  const missionConfig = aboutConfig?.mission ?? {};
  const missionEnabled = missionConfig.enabled !== false;
  const missionTitle = missionConfig.title || t('aboutMissionTitle');
  const missionDesc = missionConfig.description || t('aboutMissionDesc');

  const statsItems: { value: string; label: string }[] = aboutConfig?.stats?.items ?? [];
  const statsEnabled = aboutConfig?.stats?.enabled !== false;

  const valuesEnabled = aboutConfig?.values?.enabled !== false;
  const valuesItems: { icon?: string; title: string; description: string }[] =
    aboutConfig?.values?.items ?? [
      { title: t('aboutValue1Title'), description: t('aboutValue1Desc') },
      { title: t('aboutValue2Title'), description: t('aboutValue2Desc') },
      { title: t('aboutValue3Title'), description: t('aboutValue3Desc') },
    ];

  const teamConfig = aboutConfig?.team ?? {};
  const teamEnabled = teamConfig.enabled === true;
  const teamTitle = teamConfig.title || t('aboutTeamTitle');
  const teamMembers: { name: string; role: string; bio: string; avatar_url?: string }[] =
    teamConfig.members ?? [];

  const ctaConfig = aboutConfig?.cta ?? {};
  const ctaEnabled = ctaConfig.enabled !== false;
  const ctaTitle = ctaConfig.title || t('aboutCtaTitle');
  const ctaDesc = ctaConfig.description || t('aboutCtaDesc');
  const ctaPrimary = ctaConfig.primaryLabel || t('aboutCtaPrimary');
  const ctaSecondary = ctaConfig.secondaryLabel || t('aboutCtaSecondary');

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
          <div className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10"
            dangerouslySetInnerHTML={{ __html: heroDesc }} />
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-sm font-bold border border-white/20 text-white hover:bg-white/5 transition-colors"
          >
            {t('readArticles')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      {statsEnabled && statsItems.length > 0 && (
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
      {missionEnabled && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-6">{missionTitle}</h2>
          <div className="text-lg text-slate-500 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: missionDesc }} />
        </section>
      )}

      {/* Values */}
      {valuesEnabled && valuesItems.length > 0 && (
        <section className="bg-slate-50 border-y border-slate-100 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900 text-center mb-12">
              {aboutConfig?.values?.title || t('aboutValuesTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {valuesItems.map((v: { icon?: string; title: string; description: string }, i: number) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  {v.icon ? (
                    <span className="text-3xl mb-4 block">{v.icon}</span>
                  ) : (
                    <CheckCircle2 className="h-7 w-7 mb-4" style={{ color: primaryColor }} />
                  )}
                  <h3 className="font-black text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {teamEnabled && teamMembers.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-4" style={{ backgroundColor: `${primaryColor}15` }}>
                <Users className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-3xl font-black text-slate-900">{teamTitle}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-slate-100">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white"
                        style={{ backgroundColor: primaryColor }}>
                        {member.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">{member.name}</h3>
                  {member.role && (
                    <p className="text-sm font-semibold mt-0.5" style={{ color: primaryColor }}>{member.role}</p>
                  )}
                  {member.bio && (
                    <p className="text-sm text-slate-500 leading-relaxed mt-2">{member.bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {ctaEnabled && (
        <section className="bg-slate-950 text-white py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-4">{ctaTitle}</h2>
            <div className="text-slate-400 text-lg mb-8"
              dangerouslySetInnerHTML={{ __html: ctaDesc }} />
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
      )}

      <NewsletterSection blog={blog} primaryColor={primaryColor} />
      <CorporateFooter blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} />
    </div>
  );
}
