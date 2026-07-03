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

const TEAM = [
  {
    name: 'Sophie Martin',
    role: 'Directrice éditoriale',
    bio: "Ancienne journaliste au Monde, Sophie dirige la stratégie éditoriale de NexusBlog depuis 2022. Elle veille à ce que chaque article apporte une valeur réelle aux professionnels.",
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&auto=format',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Thomas Laurent',
    role: 'Expert Technologie & IA',
    bio: "Ingénieur de formation reconverti en expert contenu, Thomas décrypte les transformations technologiques pour les rendre accessibles et actionnables.",
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Marie Dupont',
    role: 'Experte Marketing Digital',
    bio: "10 ans d'expérience en stratégie de contenu et SEO pour des entreprises du CAC 40 aux startups. Marie partage ce qui fonctionne vraiment sur le terrain.",
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&auto=format',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Lucas Bernard',
    role: 'Expert Entrepreneuriat',
    bio: "Fondateur de 3 startups dont une exitée en 2023, Lucas apporte une perspective de terrain sur l'entrepreneuriat, le financement et la croissance.",
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&auto=format',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
];

const VALUES = [
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Pertinence avant tout',
    description: "Chaque article que nous publions répond à une vraie question que se posent nos lecteurs. Pas de contenu générique, pas de remplissage.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: 'Exactitude rigoureuse',
    description: "Nos experts vérifient chaque fait, chaque statistique. Quand nous ne sommes pas certains, nous le disons clairement.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Indépendance éditoriale',
    description: "Aucun sponsor, aucune régie publicitaire n'influence notre ligne éditoriale. Nous écrivons ce que nous pensons, pas ce qui se vend.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Impact concret',
    description: "Notre objectif : que vous finissiez chaque article avec au moins une idée actionnable que vous pouvez appliquer dès aujourd'hui.",
  },
];

const STATS = [
  { value: '450+', label: 'Articles publiés' },
  { value: '12 000', label: 'Abonnés newsletter' },
  { value: '5', label: 'Domaines d\'expertise' },
  { value: '4 ans', label: "D'expérience éditoriale" },
];

export default function AboutPage() {
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview');

  const { data: realBlog } = useQuery({
    queryKey: ['public-blog', preview],
    queryFn: () => publicApi.getBlogInfo(preview!),
    enabled: !!preview,
  });

  const blog = (preview ? realBlog : null) ?? (MOCK_BLOG as unknown as BlogInfo);
  const primaryColor = blog.primary_color || '#2563eb';
  const templateBasePath = '/en/template';

  const cpStyle = {
    '--cp': primaryColor,
    fontFamily: "'Inter', system-ui, sans-serif",
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-white text-slate-900" style={cpStyle}>
      <CorporateHeader
        blog={blog as any}
        categories={MOCK_CATEGORIES as any}
        primaryColor={primaryColor}
        minimal
        basePath={templateBasePath}
      />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 px-4">
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20"
          style={{ backgroundColor: primaryColor }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Des insights qui font<br />
            <span style={{ color: primaryColor }}>vraiment la différence</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            NexusBlog Insights est le média de référence pour les professionnels ambitieux. Analyses approfondies, stratégies éprouvées, perspectives d'experts — sans le bruit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#team"
              className="h-12 px-8 rounded-2xl text-sm font-bold text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}>
              <Users className="h-4 w-4" /> Rencontrer l'équipe
            </a>
            <Link href=".."
              className="h-12 px-8 rounded-2xl text-sm font-bold border border-white/20 text-white flex items-center gap-2 hover:bg-white/5 transition-colors">
              Lire nos articles <ArrowRight className="h-4 w-4" />
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
            Démocratiser l'accès aux meilleures pratiques professionnelles
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed mb-5">
            Les grandes entreprises ont des équipes entières dédiées à la veille, la formation et la stratégie. Les professionnels indépendants et les PME n'ont pas toujours accès à ces ressources.
          </p>
          <p className="text-lg text-slate-500 leading-relaxed mb-8">
            NexusBlog Insights comble ce fossé. Nous synthétisons les meilleures recherches, les expériences terrain de nos experts et les tendances émergentes pour vous donner un avantage concurrentiel réel.
          </p>
          <div className="space-y-3">
            {["Contenu rédigé par des experts reconnus dans leur domaine",
              "Analyses basées sur des données réelles, pas des opinions",
              "Format actionnable : chaque article = au moins une idée applicable immédiatement",
              "Mise à jour régulière de nos contenus evergreen"].map(item => (
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
              alt="Notre équipe au travail"
              fill className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 shrink-0" style={{ color: primaryColor }} />
              <div>
                <p className="font-black text-slate-900 text-sm">Top 10 médias B2B</p>
                <p className="text-xs text-slate-400">France — 2025 & 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ──────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Ce qui nous guide chaque jour</h2>
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
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Des experts passionnés</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Chaque membre de notre équipe est un praticien — quelqu'un qui a fait, pas seulement quelqu'un qui sait.
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
          <h2 className="text-3xl font-black mb-4">Prêt à passer au niveau supérieur ?</h2>
          <p className="text-slate-400 text-lg mb-8">Rejoignez 12 000 professionnels qui reçoivent nos analyses chaque semaine.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#newsletter"
              className="h-12 px-8 rounded-2xl text-sm font-bold text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}>
              <Mail className="h-4 w-4" /> S'abonner à la newsletter
            </a>
            <Link href=".."
              className="h-12 px-8 rounded-2xl text-sm font-bold border border-white/20 text-white flex items-center gap-2 hover:bg-white/5 transition-colors">
              Lire les articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSection blog={blog as any} primaryColor={primaryColor} />
      <CorporateFooter blog={blog as any} categories={MOCK_CATEGORIES as any} primaryColor={primaryColor} basePath={templateBasePath} />
    </div>
  );
}
