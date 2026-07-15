'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Mail } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function LuminaryAbout({ blog, categories, basePath }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#b8960c';
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const aboutConfig = blog.template_config?.about as Record<string, any> | undefined;

  const hero = aboutConfig?.hero ?? {};
  const heroTitle = hero.title || `${t('aboutHeroSubtitle')} ${blog.name}`;
  const heroSubtitle = hero.subtitle || t('aboutHeroSubtitle');
  const heroDesc = hero.description || blog.description || t('aboutHeroDesc');
  const heroCoverImage: string | undefined = hero.cover_image_url || undefined;

  const missionConfig = aboutConfig?.mission ?? {};
  const missionEnabled = missionConfig.enabled !== false;
  const missionTitle = missionConfig.title || t('aboutMissionTitle');
  const missionDesc = missionConfig.description || t('aboutMissionDesc');
  const missionImageUrl: string | undefined = missionConfig.image_url || undefined;

  const statsItems: { value: string; label: string }[] = aboutConfig?.stats?.items ?? [];
  const statsEnabled = aboutConfig?.stats?.enabled !== false && statsItems.length > 0;

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

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubStatus(res.ok ? 'ok' : 'error');
    } catch {
      setSubStatus('error');
    }
  };

  return (
    <div className="bg-[#faf8f4] min-h-screen text-zinc-900" style={{ '--cp': primaryColor } as CSSProperties}>
      <LuminaryHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <section className="bg-zinc-950 text-white py-24 relative overflow-hidden">
        {heroCoverImage && (
          <>
            <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 to-zinc-950/80" />
          </>
        )}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-6">{heroSubtitle}</p>
          <h1 className="font-serif italic text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6">{heroTitle}</h1>
          <div className="font-sans text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: heroDesc }} />
          <Link href={basePath || "/"} className="inline-flex items-center gap-2 mt-8 border border-white/20 text-white px-6 py-3 text-sm font-sans hover:bg-white/5 transition-colors">
            {t('readArticles')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      {statsEnabled && (
        <section className="border-b border-zinc-200 bg-[#faf8f4]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {statsItems.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-serif italic text-4xl mb-1" style={{ color: primaryColor }}>{s.value}</div>
                <div className="font-sans text-sm text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mission */}
      {missionEnabled && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <div className={missionImageUrl ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center' : ''}>
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400">{missionTitle}</span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="font-serif text-xl text-zinc-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: missionDesc }} />
            </div>
            {missionImageUrl && (
              <div className="overflow-hidden">
                <img src={missionImageUrl} alt={missionTitle} className="w-full h-auto object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Values */}
      {valuesEnabled && valuesItems.length > 0 && (
        <section className="border-t border-zinc-200 py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                {aboutConfig?.values?.title || t('aboutValuesTitle')}
              </span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>
            <div className="space-y-0">
              {valuesItems.map((v, i) => (
                <div key={i} className="flex items-start gap-6 py-6 border-b border-zinc-100 last:border-0">
                  {v.icon ? (
                    <span className="text-2xl shrink-0 mt-1">{v.icon}</span>
                  ) : (
                    <span className="font-serif italic text-2xl shrink-0 mt-1" style={{ color: primaryColor }}>{String(i + 1).padStart(2, '0')}</span>
                  )}
                  <div>
                    <h3 className="font-serif text-lg text-zinc-900 mb-1">{v.title}</h3>
                    <p className="font-sans text-sm text-zinc-500 leading-relaxed">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {teamEnabled && teamMembers.length > 0 && (
        <section className="border-t border-zinc-200 py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400">{teamTitle}</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {teamMembers.map((member, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4 overflow-hidden bg-zinc-200">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-serif italic text-xl text-white" style={{ backgroundColor: primaryColor }}>
                        {member.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-lg text-zinc-900">{member.name}</h3>
                  {member.role && <p className="font-sans text-xs uppercase tracking-widest mt-0.5" style={{ color: primaryColor }}>{member.role}</p>}
                  {member.bio && <p className="font-sans text-sm text-zinc-500 leading-relaxed mt-2">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {ctaEnabled && (
        <section className="bg-zinc-950 py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif italic text-4xl text-white mb-4">{ctaTitle}</h2>
            <div className="font-sans text-zinc-400 mb-8" dangerouslySetInnerHTML={{ __html: ctaDesc }} />
            <a
              href="#newsletter"
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-sans text-zinc-950 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <Mail className="h-4 w-4" /> {ctaConfig.primaryLabel || t('aboutCtaPrimary')}
            </a>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section id="newsletter" className="bg-zinc-950 py-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-4">Stay Connected</p>
          <h2 className="font-serif italic text-4xl text-white mb-4">
            The best of {blog.name}, in your inbox.
          </h2>
          <p className="font-sans text-sm text-zinc-400 mb-10">No noise. No spam. Just writing worth reading.</p>
          {subStatus === 'ok' ? (
            <p className="font-serif italic text-xl text-white">Thank you for subscribing.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex items-end gap-0 max-w-sm mx-auto border-b border-zinc-600 pb-px">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent border-0 px-0 py-3 text-white placeholder:text-zinc-600 focus:outline-none text-sm min-w-0 font-sans"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="font-sans text-xs uppercase tracking-widest text-white hover:text-[var(--cp)] transition-colors shrink-0 pl-4 py-3 disabled:opacity-60"
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="font-sans text-xs text-red-400 mt-3">Something went wrong. Try again.</p>
          )}
          <p className="font-sans text-xs text-zinc-600 mt-6">Unsubscribe anytime.</p>
        </div>
      </section>

      <LuminaryFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
