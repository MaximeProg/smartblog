'use client';

import { type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Users, Target, Award, Globe, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CorporateHeader, CorporateFooter, NewsletterSection } from '@/components/themes/corporate/shared';
import { MOCK_BLOG, MOCK_CATEGORIES } from '@/components/themes/corporate/mock-data';
import { publicApi, type BlogInfo } from '@/lib/public-api';
import type { AboutLabels } from './labels';

const TEAM_PHOTOS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&auto=format',
];
const TEAM_NAMES = ['Sophie Martin', 'Thomas Laurent', 'Marie Dupont', 'Lucas Bernard'];

export default function AboutPageClient({ l, locale }: { l: AboutLabels; locale: string }) {
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview');

  const { data: realBlog } = useQuery({
    queryKey: ['public-blog', preview],
    queryFn: () => publicApi.getBlogInfo(preview!),
    enabled: !!preview,
  });

  const blog = (preview ? realBlog : null) ?? (MOCK_BLOG as unknown as BlogInfo);
  const primaryColor = blog.primary_color || '#2563eb';
  const templateBasePath = `/${locale}/template`;

  const cpStyle = {
    '--cp': primaryColor,
    fontFamily: "'Inter', system-ui, sans-serif",
  } as CSSProperties;

  const STATS = [
    { value: '450+', label: l.stat1Label },
    { value: '12 000', label: l.stat2Label },
    { value: '5', label: l.stat3Label },
    { value: '4 ans', label: l.stat4Label },
  ];

  const VALUES = [
    { icon: <Target className="h-6 w-6" />, title: l.value1Title, description: l.value1Desc },
    { icon: <CheckCircle2 className="h-6 w-6" />, title: l.value2Title, description: l.value2Desc },
    { icon: <Users className="h-6 w-6" />, title: l.value3Title, description: l.value3Desc },
    { icon: <Globe className="h-6 w-6" />, title: l.value4Title, description: l.value4Desc },
  ];

  const TEAM = [
    { name: TEAM_NAMES[0], role: l.member1Role, bio: l.member1Bio, image: TEAM_PHOTOS[0], linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
    { name: TEAM_NAMES[1], role: l.member2Role, bio: l.member2Bio, image: TEAM_PHOTOS[1], linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
    { name: TEAM_NAMES[2], role: l.member3Role, bio: l.member3Bio, image: TEAM_PHOTOS[2], linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
    { name: TEAM_NAMES[3], role: l.member4Role, bio: l.member4Bio, image: TEAM_PHOTOS[3], linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
  ];

  const MISSION_BULLETS = [l.missionBullet1, l.missionBullet2, l.missionBullet3, l.missionBullet4];

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>
      <CorporateHeader
        blog={blog as any}
        categories={MOCK_CATEGORIES as any}
        primaryColor={primaryColor}
        minimal
        basePath={templateBasePath}
        previewSlug={preview ?? undefined}
      />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 px-4">
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20"
          style={{ backgroundColor: primaryColor }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            {l.heroTitleLine1}<br />
            <span style={{ color: primaryColor }}>{l.heroTitleHighlight}</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            {l.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#team"
              className="h-12 px-8 rounded-2xl text-sm font-bold text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}>
              <Users className="h-4 w-4" /> {l.meetTeamButton}
            </a>
            <Link href=".."
              className="h-12 px-8 rounded-2xl text-sm font-bold border border-white/20 text-white flex items-center gap-2 hover:bg-white/5 transition-colors">
              {l.readArticlesButton} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black text-slate-900 mb-1" style={{ color: primaryColor }}>{s.value}</div>
              <div className="text-sm text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-6">
            {l.missionTitle}
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed mb-5">
            {l.missionPara1}
          </p>
          <p className="text-lg text-slate-500 leading-relaxed mb-8">
            {l.missionPara2}
          </p>
          <div className="space-y-3">
            {MISSION_BULLETS.map(item => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&auto=format"
              alt={l.missionImageAlt}
              fill className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 shrink-0" style={{ color: primaryColor }} />
              <div>
                <p className="font-black text-slate-900 text-sm">{l.missionBadgeTitle}</p>
                <p className="text-xs text-slate-400">{l.missionBadgeSubtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ──────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{l.valuesHeading}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5 text-white"
                  style={{ backgroundColor: primaryColor }}>
                  {v.icon}
                </div>
                <h3 className="font-black text-slate-900 mb-3">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ────────────────────────────────────────────────────────────── */}
      <section id="team" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">{l.teamHeading}</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            {l.teamSubheading}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TEAM.map(member => (
            <div key={member.name} className="group text-center">
              <div className="relative w-32 h-32 mx-auto mb-5 rounded-3xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="128px"
                />
              </div>
              <h3 className="font-black text-slate-900 text-lg">{member.name}</h3>
              <p className="text-xs font-bold uppercase tracking-wider mb-3 mt-1" style={{ color: primaryColor }}>{member.role}</p>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{member.bio}</p>
              <div className="flex items-center justify-center gap-2">
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                  className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors bg-white">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href={member.twitter} target="_blank" rel="noopener noreferrer"
                  className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-colors bg-white">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-4">{l.ctaHeading}</h2>
          <p className="text-slate-400 text-lg mb-8">{l.ctaSubheading}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#newsletter"
              className="h-12 px-8 rounded-2xl text-sm font-bold text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}>
              <Mail className="h-4 w-4" /> {l.ctaSubscribeButton}
            </a>
            <Link href=".."
              className="h-12 px-8 rounded-2xl text-sm font-bold border border-white/20 text-white flex items-center gap-2 hover:bg-white/5 transition-colors">
              {l.ctaReadButton} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSection blog={blog as any} primaryColor={primaryColor} />
      <CorporateFooter blog={blog as any} categories={MOCK_CATEGORIES as any} primaryColor={primaryColor} basePath={templateBasePath} previewSlug={preview ?? undefined} />
    </div>
  );
}
