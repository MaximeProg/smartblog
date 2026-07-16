import Image from 'next/image';
import { Metadata } from 'next';
import { Shield, Globe2, Zap, BarChart2, FileText, Bot, Check, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { getPlatformPage } from '@/lib/platform-api';

export const metadata: Metadata = {
  title: 'About — SmarterBloggers',
  description: 'A next-generation blogging platform built for creators who demand excellence.',
};

const ICONS: Record<string, LucideIcon> = {
  bot: Bot, globe2: Globe2, shield: Shield, zap: Zap, barchart2: BarChart2, filetext: FileText,
};

const ICON_COLORS: Record<string, string> = {
  bot: 'bg-violet-500/10 text-violet-400',
  globe2: 'bg-blue-500/10 text-blue-400',
  shield: 'bg-emerald-500/10 text-emerald-400',
  zap: 'bg-amber-500/10 text-amber-400',
  barchart2: 'bg-cyan-500/10 text-cyan-400',
  filetext: 'bg-pink-500/10 text-pink-400',
};

// Fallback EN codé en dur si le backend CMS est indisponible — jamais de page cassée.
const FALLBACK: any = {
  hero: {
    title: 'A next-generation blogging platform built for creators who demand excellence',
    subtitle: 'Powered by cutting-edge AI, enterprise-grade security, and modern design.',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',
  },
  mission: {
    title: 'Great ideas deserve a great platform',
    body_1: 'We believe that great ideas deserve a great platform. SmarterBloggers was built to empower writers, journalists, and content creators with the tools they need to reach their audience effectively.',
    body_2: 'From AI-powered writing assistance to advanced analytics and multi-language support, every feature is designed with one goal in mind: helping you create impactful content.',
    highlights: ['Founded in 2024', '10,000+ active blogs', '50+ countries', '25-person team'],
    image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
  },
  features: {
    title: 'Everything you need to create great content',
    items: [
      { icon: 'bot', title: 'AI-Powered', description: 'From writing assistance to SEO optimization and content moderation, our AI engine helps you create better content faster.' },
      { icon: 'globe2', title: 'Multilingual', description: 'Reach a global audience with support for 15+ languages including RTL languages like Arabic and Hebrew.' },
      { icon: 'shield', title: 'Enterprise Security', description: 'Built with security-first architecture featuring RBAC, AI moderation, rate limiting, and comprehensive audit trails.' },
      { icon: 'zap', title: 'High Performance', description: 'Optimized for speed with CDN-ready architecture, image optimization, lazy loading, and server-side rendering.' },
      { icon: 'barchart2', title: 'Advanced Analytics', description: 'Track every metric that matters with real-time analytics, visitor insights, and engagement reporting.' },
      { icon: 'filetext', title: 'Rich Editor', description: 'A powerful WYSIWYG editor with support for images, videos, code blocks, tables, and AI writing assistance.' },
    ],
  },
  tech_stack: {
    title: 'Built with Modern Technology',
    items: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'TipTap Editor', 'FastAPI', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Firebase', 'Cloudinary'],
  },
  team: {
    title: 'The people behind SmarterBloggers',
    members: [
      { name: 'Alexandra Chen', role: 'CEO & Co-Founder', photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', bio: 'Former Google engineer with 12 years of experience in scalable SaaS platforms.' },
      { name: 'Marcus Thompson', role: 'CTO & Co-Founder', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', bio: 'Full-stack architect who previously built systems serving 100M+ users at Meta.' },
      { name: 'Priya Sharma', role: 'Head of Product', photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', bio: 'Product leader passionate about creating tools that empower content creators worldwide.' },
      { name: 'James Okafor', role: 'Head of Design', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', bio: 'Award-winning designer with a focus on developer experience and accessibility.' },
    ],
  },
};

export default async function AboutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cmsLang?: string }>;
}) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('about', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-32 pb-16 md:pb-24 overflow-hidden">
        <Image
          src={c.hero.image_url}
          alt="Team at work"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5 md:mb-6 text-white">
            {c.hero.title}
          </h1>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
            {c.hero.subtitle}
          </p>
        </div>
      </section>

      {/* ─── Mission ────────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              {c.mission.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {c.mission.body_1}
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {c.mission.body_2}
            </p>
            <ul className="space-y-3 mt-8">
              {(c.mission.highlights as string[]).map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <Image
              src={c.mission.image_url}
              alt="Team collaboration"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ─── Platform Features ──────────────────────────────────────── */}
      <section id="features" className="py-12 md:py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {c.features.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {(c.features.items as { icon: string; title: string; description: string }[]).map(({ icon, title, description }) => {
              const Icon = ICONS[icon] ?? Bot;
              return (
                <div
                  key={title}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${ICON_COLORS[icon] ?? ''} mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-6 md:mb-8">
            {c.tech_stack.title}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {(c.tech_stack.items as string[]).map((tech) => (
              <span
                key={tech}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-slate-600 hover:text-blue-600 dark:hover:text-white transition-all"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team ───────────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {c.team.title}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {(c.team.members as { name: string; role: string; photo_url: string; bio: string }[]).map((member) => (
              <div key={member.name} className="text-center group">
                <div className="relative h-24 w-24 mx-auto rounded-2xl overflow-hidden mb-4 ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500 transition-all">
                  <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-0.5">{member.name}</h3>
                <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mb-2">{member.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
