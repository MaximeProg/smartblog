import Image from 'next/image';
import { Download, ExternalLink, Newspaper, Camera, Package, Users, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { siteConfig } from '@/config/site';
import { getPlatformPage } from '@/lib/platform-api';

const ICONS: Record<string, LucideIcon> = { package: Package, newspaper: Newspaper, camera: Camera, users: Users };

const FALLBACK = {
  hero: { title: 'Press', subtitle: 'Resources and information for journalists and media.' },
  press_contact: { title: 'Press Contact', description: 'For press inquiries, interviews, or additional information:' },
  key_facts: {
    title: 'Key Facts',
    items: [
      { value: '2024', label: 'Founded' },
      { value: '10K+', label: 'Active blogs' },
      { value: '25', label: 'Employees' },
      { value: '$5M', label: 'Raised' },
    ],
  },
  coverage: {
    title: 'Press Coverage',
    items: [
      { outlet: 'TechCrunch', logo: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=200&q=80', title: 'SmarterBloggers raises $5M to bring enterprise blogging to the masses', date: 'March 2025', href: '#' },
      { outlet: 'Product Hunt', logo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=200&q=80', title: '#1 Product of the Day — SmarterBloggers 2.0', date: 'May 2025', href: '#' },
      { outlet: 'The Verge', logo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80', title: 'The best new blogging platform for serious creators', date: 'April 2025', href: '#' },
    ],
  },
  brand_assets: {
    title: 'Brand Assets',
    items: [
      { icon: 'package', label: 'SmarterBloggers Logo (SVG, PNG)', size: '2.4 MB' },
      { icon: 'newspaper', label: 'Full Press Kit', size: '12 MB' },
      { icon: 'camera', label: 'Product Screenshots', size: '8.1 MB' },
      { icon: 'users', label: 'Team Photos', size: '5.3 MB' },
    ],
  },
};

export default async function PressPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('press', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
        <div className="rounded-2xl bg-blue-600 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-white mb-1">{c.press_contact.title}</h2>
            <p className="text-blue-100 text-sm">{c.press_contact.description}</p>
          </div>
          <a
            href={`mailto:${siteConfig.contact.press}`}
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors"
          >
            {siteConfig.contact.press}
          </a>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">{c.key_facts.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(c.key_facts.items as typeof FALLBACK.key_facts.items).map(({ value, label }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center">
                <p className="text-2xl font-black text-blue-500 mb-1">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">{c.coverage.title}</h2>
          <div className="space-y-3">
            {(c.coverage.items as typeof FALLBACK.coverage.items).map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="group flex items-center gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                  <Image src={item.logo} alt={item.outlet} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-500 font-semibold mb-0.5">{item.outlet} · {item.date}</p>
                  <p className="text-sm font-semibold group-hover:text-blue-500 transition-colors truncate">
                    {item.title}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">{c.brand_assets.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(c.brand_assets.items as typeof FALLBACK.brand_assets.items).map(({ icon, label, size }) => {
              const Icon = ICONS[icon] ?? Package;
              return (
                <button
                  key={label}
                  className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                    <span>{size}</span>
                    <Download className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
