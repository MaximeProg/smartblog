import Image from 'next/image';
import { MapPin, ArrowRight, Heart, Globe2, Zap, Coffee, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { CmsLanguageSwitcher } from '@/components/marketing/CmsLanguageSwitcher';
import { getPlatformPage } from '@/lib/platform-api';

const ICONS: Record<string, LucideIcon> = { globe2: Globe2, heart: Heart, zap: Zap, coffee: Coffee };

const FALLBACK = {
  hero: {
    title: "Let's build the future of blogging together",
    subtitle: 'Join a passionate team helping thousands of creators share their ideas with the world.',
    cta_label: 'View open positions',
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80',
  },
  perks: {
    items: [
      { icon: 'globe2', title: '100% Remote', description: 'Work from anywhere in the world.' },
      { icon: 'heart', title: 'Health Benefits', description: 'Full medical, dental, and vision coverage.' },
      { icon: 'zap', title: 'Equity', description: 'Competitive equity package for all employees.' },
      { icon: 'coffee', title: 'Learning Budget', description: '$2,000/year for conferences and courses.' },
    ],
  },
  jobs: {
    title: 'Open Positions',
    items: [
      { title: 'Senior Full-Stack Engineer', department: 'Engineering', location: 'Remote (Europe/Americas)', type: 'Full-time', description: "Join our core platform team to build the next generation of SmarterBloggers's multi-tenant infrastructure." },
      { title: 'Product Designer (UX/UI)', department: 'Design', location: 'Remote (Worldwide)', type: 'Full-time', description: "Help shape the user experience for thousands of content creators using SmarterBloggers's editor and dashboard." },
      { title: 'Growth Marketing Manager', department: 'Marketing', location: 'Paris, France (Hybrid)', type: 'Full-time', description: 'Drive user acquisition and retention through data-driven marketing campaigns and partnerships.' },
      { title: 'Customer Success Specialist', department: 'Support', location: 'Remote (Europe)', type: 'Full-time', description: 'Help our users succeed with SmarterBloggers by providing world-class onboarding and support.' },
    ],
  },
  open_application: {
    title: "Don't see the right role?",
    description: 'Send us an open application — we love meeting passionate people.',
    cta_label: 'Send Open Application',
  },
};

export default async function CareersPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('careers', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <section className="relative pt-32 pb-20 overflow-hidden">
        <Image src={c.hero.image_url} alt="Team at work" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-5">{c.hero.title}</h1>
          <p className="text-lg text-slate-300 mb-8">{c.hero.subtitle}</p>
          <a href="#jobs" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all">
            {c.hero.cta_label}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(c.perks.items as typeof FALLBACK.perks.items).map(({ icon, title, description }) => {
            const Icon = ICONS[icon] ?? Globe2;
            return (
              <div key={title} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-3">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="jobs" className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-8">{c.jobs.title}</h2>
          <div className="space-y-4">
            {(c.jobs.items as typeof FALLBACK.jobs.items).map((job) => (
              <div key={job.title} className="group bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 p-6 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                        {job.department}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {job.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{job.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-2">{c.open_application.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{c.open_application.description}</p>
            <a
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all"
            >
              {c.open_application.cta_label}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="flex justify-center py-4 border-t border-slate-100 dark:border-slate-900">
        <CmsLanguageSwitcher currentLang={lang} />
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
