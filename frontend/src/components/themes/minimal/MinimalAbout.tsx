'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { MinimalHeader, MinimalFooter } from './MinimalShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.smarterbloggers.com';

interface AboutProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function MinimalAbout({ blog, categories, basePath }: AboutProps) {
  const primaryColor = blog.primary_color || '#18181b';
  const t = useTranslations('publicBlog');

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const aboutConfig = blog.template_config?.about as Record<string, any> | undefined;

  const hero = aboutConfig?.hero ?? {};
  const heroTitle = hero.title || blog.name;
  const heroDesc = hero.description || blog.description || `Welcome to ${blog.name}.`;

  const missionEnabled = aboutConfig?.mission?.enabled !== false;
  const missionTitle = aboutConfig?.mission?.title || t('aboutMissionTitle');
  const missionDesc = aboutConfig?.mission?.description || t('aboutMissionDesc');
  const missionImageUrl: string | undefined = aboutConfig?.mission?.image_url || undefined;

  const statsEnabled = aboutConfig?.stats?.enabled !== false && (aboutConfig?.stats?.items ?? []).length > 0;
  const statsItems: { value: string; label: string }[] = aboutConfig?.stats?.items ?? [];

  const valuesEnabled = aboutConfig?.values?.enabled !== false;
  const valuesTitle = aboutConfig?.values?.title || t('aboutValuesTitle');
  const valuesItems: { icon?: string; title: string; description: string }[] =
    aboutConfig?.values?.items ?? [
      { title: t('aboutValue1Title'), description: t('aboutValue1Desc') },
      { title: t('aboutValue2Title'), description: t('aboutValue2Desc') },
      { title: t('aboutValue3Title'), description: t('aboutValue3Desc') },
    ];

  const teamEnabled = aboutConfig?.team?.enabled === true;
  const teamTitle = aboutConfig?.team?.title || t('aboutTeamTitle');
  const teamMembers: { name: string; role: string; bio: string; avatar_url?: string }[] =
    aboutConfig?.team?.members ?? [];

  const ctaEnabled = aboutConfig?.cta?.enabled !== false;
  const ctaTitle = aboutConfig?.cta?.title || t('aboutCtaTitle');
  const ctaDesc = aboutConfig?.cta?.description || t('aboutCtaDesc');
  const ctaLabel = aboutConfig?.cta?.primaryLabel || t('aboutCtaPrimary');

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
      <MinimalHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-4">About</p>
        <h1 className="text-4xl font-bold text-zinc-950 mb-6">{heroTitle}</h1>
        <div
          className="text-lg text-zinc-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: heroDesc }}
        />
      </div>

      {statsEnabled && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 border-t border-zinc-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {statsItems.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black mb-1" style={{ color: primaryColor }}>{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {missionEnabled && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-950 mb-4">{missionTitle}</h2>
          <div
            className="text-zinc-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: missionDesc }}
          />
          {missionImageUrl && (
            <div className="mt-6 rounded-xl overflow-hidden">
              <img src={missionImageUrl} alt={missionTitle} className="w-full h-auto object-cover" />
            </div>
          )}
        </div>
      )}

      {valuesEnabled && valuesItems.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-100">
          <h2 className="text-base font-bold text-zinc-950 mb-6">{valuesTitle}</h2>
          <ul className="space-y-4">
            {valuesItems.map((v, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="shrink-0 mt-0.5 text-base" style={{ color: primaryColor }}>
                  {v.icon || '✓'}
                </span>
                <div>
                  <p className="font-semibold text-zinc-900">{v.title}</p>
                  {v.description && <p className="text-zinc-500 mt-0.5 leading-relaxed">{v.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {categories.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-100">
          <h2 className="text-base font-bold text-zinc-950 mb-6">What we write about</h2>
          <div className="space-y-3">
            {categories.map(c => (
              <div key={c.id} className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`${basePath}/categories/${c.slug}`}
                    className="text-sm font-medium text-zinc-900 hover:text-[var(--cp)] transition-colors"
                  >
                    {c.name}
                  </Link>
                  {c.description && (
                    <p className="text-xs text-zinc-400 mt-0.5">{c.description}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-300 shrink-0">
                  {c.articles_count} article{c.articles_count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamEnabled && teamMembers.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-100">
          <h2 className="text-base font-bold text-zinc-950 mb-8">{teamTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt={member.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white" style={{ backgroundColor: primaryColor }}>
                      {member.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{member.name}</p>
                  {member.role && <p className="text-xs font-semibold mt-0.5" style={{ color: primaryColor }}>{member.role}</p>}
                  {member.bio && <p className="text-xs text-zinc-500 leading-relaxed mt-1">{member.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ctaEnabled && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-950 mb-2">{ctaTitle}</h2>
          <div
            className="text-zinc-500 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: ctaDesc }}
          />
          <a
            href="#newsletter"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {ctaLabel}
          </a>
        </div>
      )}

      <div id="newsletter" className="max-w-2xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-100 mt-4">
        <h2 className="text-2xl font-bold text-zinc-950 mb-2">Stay in the loop</h2>
        <p className="text-zinc-500 text-sm mb-6">New articles, delivered to your inbox. No noise.</p>
        {subStatus === 'ok' ? (
          <p className="text-sm font-medium" style={{ color: primaryColor }}>
            You&apos;re subscribed. Thank you!
          </p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors"
              onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
              onBlur={e => (e.currentTarget.style.borderColor = '')}
            />
            <button
              type="submit"
              disabled={subStatus === 'loading'}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {subStatus === 'loading' ? '…' : 'Subscribe'}
            </button>
          </form>
        )}
        {subStatus === 'error' && (
          <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>
        )}
      </div>

      <MinimalFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
