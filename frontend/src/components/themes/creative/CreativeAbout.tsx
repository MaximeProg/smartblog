'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Mail } from 'lucide-react';
import type { AboutProps } from '@/components/themes/ThemeRenderer';
import { getFetchErrorMessage } from '@/lib/utils';
import { CreativeHeader, CreativeFooter } from './CreativeShared';
import { EditableSection } from '@/components/themes/shared/EditableSection';
import { InlineEditable } from '@/components/themes/shared/InlineEditable';
import { sanitizeHtml } from '@/components/themes/shared/renderContent';

export default function CreativeAbout({ blog, categories, basePath, editMode, selectedSectionId, onSectionClick, onSectionHover }: AboutProps) {
  const editProps = { editMode, selectedSectionId, onSectionClick, onSectionHover };
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#7c3aed';
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [subError, setSubError] = useState('');

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
    setSubError('');
    try {
      const res = await fetch(`/api/public-proxy/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubStatus('ok');
      } else {
        setSubError(await getFetchErrorMessage(res, t('subscribeError')));
        setSubStatus('error');
      }
    } catch {
      setSubError(t('subscribeError'));
      setSubStatus('error');
    }
  };

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditableSection id="header" {...editProps}>
        <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
      </EditableSection>

      <EditableSection id="about.hero" {...editProps}>
        <section className="bg-zinc-950 py-24 relative overflow-hidden">
          {heroCoverImage && (
            <>
              <img src={heroCoverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 to-zinc-950/80" />
            </>
          )}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <InlineEditable path="template_config.about.hero.subtitle" value={heroSubtitle} editMode={editMode} tag="span" className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-8 inline-block text-zinc-950" style={{ backgroundColor: primaryColor }} />
            <InlineEditable path="template_config.about.hero.title" value={heroTitle} editMode={editMode} tag="h1" className="text-6xl sm:text-8xl font-black text-white leading-none mb-6" />
            <div className="text-zinc-400 text-xl max-w-2xl leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(heroDesc) }} />
            <Link href={basePath || "/"} className="inline-flex items-center gap-2 mt-8 border border-white/20 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-white/5 transition-colors">
              {t('readArticles')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </EditableSection>

      {statsEnabled && (
        <EditableSection id="about.stats" {...editProps}>
          <section className="bg-zinc-50 border-b border-zinc-100 py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {statsItems.map((s) => (
                  <div key={s.label} className="bg-zinc-950 rounded-2xl p-8 text-center">
                    <p className="text-4xl font-black text-white mb-1">{s.value}</p>
                    <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </EditableSection>
      )}

      {missionEnabled && (
        <EditableSection id="about.mission" {...editProps}>
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
            <div className={missionImageUrl ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center' : 'max-w-3xl'}>
              <div>
                <InlineEditable path="template_config.about.mission.title" value={missionTitle} editMode={editMode} tag="h2" className="text-3xl font-black text-zinc-950 mb-6" />
                <div className="text-lg text-zinc-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(missionDesc) }} />
              </div>
              {missionImageUrl && (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img src={missionImageUrl} alt={missionTitle} className="w-full h-auto object-cover" />
                </div>
              )}
            </div>
          </section>
        </EditableSection>
      )}

      {valuesEnabled && valuesItems.length > 0 && (
        <EditableSection id="about.values" {...editProps}>
          <section className="bg-zinc-50 border-y border-zinc-100 py-20 px-4">
            <div className="max-w-5xl mx-auto">
              <InlineEditable path="template_config.about.values.title" value={aboutConfig?.values?.title || t('aboutValuesTitle')} editMode={editMode} tag="h2" className="text-3xl font-black text-zinc-950 text-center mb-12" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {valuesItems.map((v, i) => (
                  <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
                    {v.icon ? (
                      <span className="text-3xl mb-4 block">{v.icon}</span>
                    ) : (
                      <div className="h-8 w-8 rounded-xl mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
                        <div className="h-full w-full rounded-xl flex items-center justify-center">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: primaryColor }} />
                        </div>
                      </div>
                    )}
                    <h3 className="font-black text-zinc-950 mb-2">{v.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </EditableSection>
      )}

      {teamEnabled && teamMembers.length > 0 && (
        <EditableSection id="about.team" {...editProps}>
          <section className="py-20 px-4">
            <div className="max-w-5xl mx-auto">
              <InlineEditable path="template_config.about.team.title" value={teamTitle} editMode={editMode} tag="h2" className="text-3xl font-black text-zinc-950 text-center mb-14" />
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
                    <h3 className="font-black text-zinc-950 text-lg">{member.name}</h3>
                    {member.role && <p className="text-sm font-black mt-0.5" style={{ color: primaryColor }}>{member.role}</p>}
                    {member.bio && <p className="text-sm text-zinc-500 leading-relaxed mt-2">{member.bio}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </EditableSection>
      )}

      {ctaEnabled && (
        <EditableSection id="about.cta" {...editProps}>
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="bg-zinc-950 rounded-2xl px-8 sm:px-16 py-16 text-center">
              <InlineEditable path="template_config.about.cta.title" value={ctaTitle} editMode={editMode} tag="h2" className="text-4xl font-black text-white mb-4" />
              <div className="text-zinc-400 text-base mb-8 max-w-md mx-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ctaDesc) }} />
              <a href="#newsletter" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black text-zinc-950 hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
                <Mail className="h-4 w-4" /> {ctaConfig.primaryLabel || t('aboutCtaPrimary')}
              </a>
            </div>
          </section>
        </EditableSection>
      )}

      <EditableSection id="about.newsletter" {...editProps}>
        <section id="newsletter" className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="bg-zinc-950 rounded-2xl px-8 sm:px-16 py-16 text-center">
            <p className="text-4xl font-black text-white mb-2">{blog.name}</p>
            <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">Subscribe to stay updated.</p>
            {subStatus === 'ok' ? (
              <p className="text-emerald-400 font-bold">You&apos;re subscribed!</p>
            ) : (
              <form className="flex max-w-sm mx-auto gap-2" onSubmit={handleSubscribe}>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[var(--cp)]" />
                <button type="submit" disabled={subStatus === 'loading'} className="px-5 py-3 rounded-xl font-black text-sm text-zinc-950 hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60" style={{ backgroundColor: primaryColor }}>
                  {subStatus === 'loading' ? '…' : 'Subscribe'}
                </button>
              </form>
            )}
            {subStatus === 'error' && <p className="text-red-400 text-xs mt-3">{subError}</p>}
          </div>
        </section>
      </EditableSection>

      <EditableSection id="footer" {...editProps}>
        <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
      </EditableSection>
    </div>
  );
}
