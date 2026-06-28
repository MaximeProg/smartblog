import Image from 'next/image';
import { Metadata } from 'next';
import { Shield, Globe2, Zap, BarChart2, FileText, Bot, Check } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';

export const metadata: Metadata = {
  title: 'About — NexusBlog',
  description: 'A next-generation blogging platform built for creators who demand excellence.',
};

const PLATFORM_FEATURES = [
  {
    icon: Bot,
    title: 'AI-Powered',
    titleFr: 'IA intégrée',
    desc: 'From writing assistance to SEO optimization and content moderation, our AI engine helps you create better content faster.',
    descFr: "De l'aide à la rédaction à l'optimisation SEO, notre moteur IA vous aide à créer du meilleur contenu plus rapidement.",
    color: 'bg-violet-500/10 text-violet-400',
  },
  {
    icon: Globe2,
    title: 'Multilingual',
    titleFr: 'Multilingue',
    desc: 'Reach a global audience with support for 15+ languages including RTL languages like Arabic and Hebrew.',
    descFr: "Atteignez une audience mondiale avec le support de 15+ langues dont l'arabe et l'hébreu.",
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    titleFr: 'Sécurité entreprise',
    desc: 'Built with security-first architecture featuring RBAC, AI moderation, rate limiting, and comprehensive audit trails.',
    descFr: 'Architecture sécurisée avec RBAC, modération IA, rate limiting et pistes d\'audit complètes.',
    color: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    icon: Zap,
    title: 'High Performance',
    titleFr: 'Haute performance',
    desc: 'Optimized for speed with CDN-ready architecture, image optimization, lazy loading, and server-side rendering.',
    descFr: 'Optimisé pour la vitesse avec architecture CDN, optimisation des images et rendu côté serveur.',
    color: 'bg-amber-500/10 text-amber-400',
  },
  {
    icon: BarChart2,
    title: 'Advanced Analytics',
    titleFr: 'Analytics avancés',
    desc: 'Track every metric that matters with real-time analytics, visitor insights, and engagement reporting.',
    descFr: 'Suivez chaque métrique avec des analytics en temps réel, des insights visiteurs et des rapports d\'engagement.',
    color: 'bg-cyan-500/10 text-cyan-400',
  },
  {
    icon: FileText,
    title: 'Rich Editor',
    titleFr: 'Éditeur riche',
    desc: 'A powerful WYSIWYG editor with support for images, videos, code blocks, tables, and AI writing assistance.',
    descFr: 'Un éditeur WYSIWYG puissant avec images, vidéos, blocs de code, tableaux et assistance IA.',
    color: 'bg-pink-500/10 text-pink-400',
  },
];

const TECH_STACK = [
  'React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'TipTap Editor',
  'FastAPI', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Firebase', 'Cloudinary',
];

const TEAM = [
  {
    name: 'Alexandra Chen',
    role: 'CEO & Co-Founder',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    bio: 'Former Google engineer with 12 years of experience in scalable SaaS platforms.',
  },
  {
    name: 'Marcus Thompson',
    role: 'CTO & Co-Founder',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    bio: 'Full-stack architect who previously built systems serving 100M+ users at Meta.',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of Product',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    bio: 'Product leader passionate about creating tools that empower content creators worldwide.',
  },
  {
    name: 'James Okafor',
    role: 'Head of Design',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    bio: 'Award-winning designer with a focus on developer experience and accessibility.',
  },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-32 pb-16 md:pb-24 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80"
          alt="Team at work"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5 md:mb-6 text-white">
            {isFr
              ? 'Une plateforme nouvelle génération pour les créateurs'
              : 'A next-generation blogging platform built for creators who demand excellence'}
          </h1>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
            {isFr
              ? 'Propulsée par une IA de pointe, une sécurité de niveau entreprise et un design moderne.'
              : 'Powered by cutting-edge AI, enterprise-grade security, and modern design.'}
          </p>
        </div>
      </section>

      {/* ─── Mission ────────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              {isFr
                ? 'De grandes idées méritent une grande plateforme'
                : 'Great ideas deserve a great platform'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {isFr
                ? 'Nous croyons que les grandes idées méritent une grande plateforme. NexusBlog a été conçu pour donner aux écrivains, journalistes et créateurs de contenu les outils dont ils ont besoin pour atteindre efficacement leur audience.'
                : 'We believe that great ideas deserve a great platform. NexusBlog was built to empower writers, journalists, and content creators with the tools they need to reach their audience effectively.'}
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {isFr
                ? "De l'assistance à l'écriture par IA à l'analyse avancée et la prise en charge multilingue, chaque fonctionnalité est conçue avec un seul objectif : vous aider à créer du contenu percutant."
                : 'From AI-powered writing assistance to advanced analytics and multi-language support, every feature is designed with one goal in mind: helping you create impactful content.'}
            </p>
            <ul className="space-y-3 mt-8">
              {[
                isFr ? 'Fondé en 2024' : 'Founded in 2024',
                isFr ? '10,000+ blogs actifs' : '10,000+ active blogs',
                isFr ? '50+ pays' : '50+ countries',
                isFr ? 'Équipe de 25 personnes' : '25-person team',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
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
              {isFr ? 'Tout ce dont vous avez besoin' : 'Everything you need to create great content'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {PLATFORM_FEATURES.map(({ icon: Icon, title, titleFr, desc, descFr, color }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${color} mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{isFr ? titleFr : title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{isFr ? descFr : desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-6 md:mb-8">
            {isFr ? 'Construit avec des technologies modernes' : 'Built with Modern Technology'}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {TECH_STACK.map((tech) => (
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
              {isFr ? 'Les personnes derrière NexusBlog' : 'The people behind NexusBlog'}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center group">
                <div className="relative h-24 w-24 mx-auto rounded-2xl overflow-hidden mb-4 ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500 transition-all">
                  <Image src={member.image} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-0.5">{member.name}</h3>
                <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mb-2">{member.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  );
}
