'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Mail } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { MagazineHeader, MagazineFooter } from './MagazineShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function MagazineAbout({ blog, categories, basePath }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#e11d48';
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
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero */}
      <div className="w-full border-t-4" style={{ borderColor: primaryColor }}>
        <div className="bg-zinc-950 relative overflow-hidden">
          {heroCoverImage && (
            <>
              <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 to-zinc-950/90" />
            </>
          )}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <span className="text-[10px] font-black uppercase tracking-widest mb-4 block" style={{ color: primaryColor }}>{heroSubtitle}</span>
            <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-6">{heroTitle}</h1>
            <div className="text-zinc-400 text-xl max-w-2xl leading-relaxed" dangerouslySetInnerHTML={{ __html: heroDesc }} />
            <Link href={basePath || "/"} className="inline-flex items-center gap-2 mt-8 border border-white/20 text-white px-6 py-3 text-sm font-black hover:bg-white/5 transition-colors">
              {t('readArticles')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      {statsEnabled && (
        <div className="border-b border-zinc-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-wrap gap-10">
              {statsItems.map((s) => (
                <div key={s.label}>
                  <p className="text-4xl font-black" style={{ color: primaryColor }}>{s.value}</p>
                  <p className="text-sm text-zinc-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mission */}
      {missionEnabled && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className={missionImageUrl ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center' : ''}>
            <div>
              <h2 className="text-3xl font-black text-zinc-950 mb-6">{missionTitle}</h2>
              <div className="text-lg text-zinc-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: missionDesc }} />
            </div>
            {missionImageUrl && (
              <div className="overflow-hidden shadow-lg">
                <img src={missionImageUrl} alt={missionTitle} className="w-full h-auto object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Values */}
      {valuesEnabled && valuesItems.length > 0 && (
        <div className="bg-zinc-50 border-y border-zinc-100 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-zinc-950 text-center mb-12">
              {aboutConfig?.values?.title || t('aboutValuesTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {valuesItems.map((v, i) => (
                <div key={i} className="bg-white border border-zinc-100 p-6 shadow-sm">
                  {v.icon ? (
                    <span className="text-3xl mb-4 block">{v.icon}</span>
                  ) : (
                    <div className="h-1 w-8 mb-4" style={{ backgroundColor: primaryColor }} />
                  )}
                  <h3 className="font-black text-zinc-950 mb-2">{v.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team */}
      {teamEnabled && teamMembers.length > 0 && (
        <div className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-zinc-950 text-center mb-14">{teamTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4 overflow-hidden bg-zinc-100">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white" style={{ backgroundColor: primaryColor }}>
                        {member.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-zinc-950 text-lg">{member.name}</h3>
                  {member.role && <p className="text-sm font-bold mt-0.5" style={{ color: primaryColor }}>{member.role}</p>}
                  {member.bio && <p className="text-sm text-zinc-500 leading-relaxed mt-2">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {ctaEnabled && (
        <div className="border-t-4 mt-8" style={{ borderColor: primaryColor }}>
          <div className="py-16" style={{ backgroundColor: primaryColor }}>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-3xl font-black text-white mb-3">{ctaTitle}</h2>
              <div className="text-white/80 mb-8" dangerouslySetInnerHTML={{ __html: ctaDesc }} />
              <a href="#newsletter" className="inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-black hover:opacity-90 transition-opacity" style={{ color: primaryColor }}>
                <Mail className="h-4 w-4" /> {ctaConfig.primaryLabel || t('aboutCtaPrimary')}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div id="newsletter" className="py-16" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Join the conversation</h2>
          <p className="text-white/80 mb-8">Get {blog.name} delivered to your inbox every week.</p>
          {subStatus === 'ok' ? (
            <p className="text-white font-black text-lg">You&apos;re in! Check your inbox.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-0 max-w-sm mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-white/10 border border-white/20 rounded-l-lg px-4 py-3 text-white placeholder:text-white/50 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="bg-white rounded-r-lg px-6 py-3 font-black text-sm hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
                style={{ color: primaryColor }}
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="text-white/70 text-xs mt-3">Something went wrong. Please try again.</p>
          )}
        </div>
      </div>

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
