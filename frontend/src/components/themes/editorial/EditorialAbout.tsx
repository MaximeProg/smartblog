'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Users, ArrowRight, Mail } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { EditorialHeader, EditorialFooter } from './EditorialShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function EditorialAbout({ blog, categories, basePath }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#18181b';
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
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditorialHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-950 text-white py-24 px-4 text-center">
        {heroCoverImage && (
          <>
            <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 to-zinc-950/80" />
          </>
        )}
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }}>{heroSubtitle}</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">{heroTitle}</h1>
          <div className="text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: heroDesc }} />
          <Link href={basePath} className="inline-flex items-center gap-2 mt-8 border border-white/20 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors">
            {t('readArticles')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      {statsEnabled && (
        <section className="border-b border-zinc-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {statsItems.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-black mb-1" style={{ color: primaryColor }}>{s.value}</div>
                <div className="text-sm text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mission */}
      {missionEnabled && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className={missionImageUrl ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center' : 'max-w-3xl'}>
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 mb-6">{missionTitle}</h2>
              <div className="text-lg text-zinc-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: missionDesc }} />
            </div>
            {missionImageUrl && (
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={missionImageUrl} alt={missionTitle} className="w-full h-auto object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Values */}
      {valuesEnabled && valuesItems.length > 0 && (
        <section className="bg-zinc-50 border-y border-zinc-100 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-zinc-900 text-center mb-12">
              {aboutConfig?.values?.title || t('aboutValuesTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {valuesItems.map((v, i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
                  {v.icon ? (
                    <span className="text-3xl mb-4 block">{v.icon}</span>
                  ) : (
                    <CheckCircle2 className="h-7 w-7 mb-4" style={{ color: primaryColor }} />
                  )}
                  <h3 className="font-bold text-zinc-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{v.description}</p>
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
              <Users className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold text-zinc-900">{teamTitle}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-zinc-100">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white" style={{ backgroundColor: primaryColor }}>
                        {member.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg">{member.name}</h3>
                  {member.role && <p className="text-sm font-semibold mt-0.5" style={{ color: primaryColor }}>{member.role}</p>}
                  {member.bio && <p className="text-sm text-zinc-500 leading-relaxed mt-2">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {ctaEnabled && (
        <section className="bg-zinc-950 text-white py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">{ctaTitle}</h2>
            <div className="text-zinc-400 text-lg mb-8" dangerouslySetInnerHTML={{ __html: ctaDesc }} />
            <a href="#newsletter" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
              <Mail className="h-4 w-4" /> {ctaConfig.primaryLabel || t('aboutCtaPrimary')}
            </a>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <div id="newsletter" className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 mb-16">
        <div className="bg-zinc-950 rounded-3xl px-6 sm:px-16 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Never miss a story</h2>
          <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
            Get the best of {blog.name} delivered to your inbox.
          </p>
          {subStatus === 'ok' ? (
            <p className="text-sm font-medium text-emerald-400">You&apos;re subscribed. Thank you!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto gap-0">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-zinc-800 border-0 rounded-l-2xl px-5 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none text-sm min-w-0"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="px-6 py-3.5 rounded-r-2xl font-bold text-sm bg-white hover:bg-zinc-100 transition-colors disabled:opacity-60 shrink-0"
                style={{ color: primaryColor }}
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="text-xs text-red-400 mt-3">Something went wrong. Please try again.</p>
          )}
          <p className="text-xs text-zinc-600 mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </div>

      <EditorialFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
