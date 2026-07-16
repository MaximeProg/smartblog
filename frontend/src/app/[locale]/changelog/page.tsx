import { Zap, Shield, Bot, BarChart2, Globe2, Wrench, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getPlatformPage } from '@/lib/platform-api';

const ICONS: Record<string, LucideIcon> = { bot: Bot, zap: Zap, wrench: Wrench, barchart2: BarChart2, globe2: Globe2, shield: Shield };

const ICON_COLORS: Record<string, string> = {
  bot: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  zap: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  wrench: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  barchart2: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  globe2: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  shield: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  major: { label: 'Major Release', cls: 'bg-blue-600 text-white' },
  feature: { label: 'New Feature', cls: 'bg-violet-600 text-white' },
  fix: { label: 'Bug Fix', cls: 'bg-emerald-600 text-white' },
};

const FALLBACK = {
  hero: { title: 'Changelog', subtitle: 'All new features, improvements, and fixes to SmarterBloggers.' },
  releases: [
    { version: '2.1.0', date: 'June 20, 2025', type: 'feature', icon: 'bot', title: 'AI Writing Assistant', changes: ['AI-powered content generation for articles', 'Smart SEO title and meta description suggestions', 'Grammar and style improvements', 'Content outline generator'] },
    { version: '2.0.0', date: 'May 15, 2025', type: 'major', icon: 'zap', title: 'SmarterBloggers 2.0 — Multi-tenant Platform', changes: ['Complete platform rebuild with Next.js 15 and FastAPI', 'Multi-tenant architecture supporting unlimited blogs', 'Role-based access control (Owner, Admin, Editor, Author, Viewer)', 'New rich text editor with TipTap', 'Real-time analytics dashboard'] },
    { version: '1.8.2', date: 'April 3, 2025', type: 'fix', icon: 'wrench', title: 'Security & Performance Fixes', changes: ['Fixed JWT token refresh edge case', 'Improved image optimization pipeline', 'Rate limiting improvements', 'Database query optimization (40% faster)'] },
    { version: '1.8.0', date: 'March 12, 2025', type: 'feature', icon: 'barchart2', title: 'Advanced Analytics', changes: ['Real-time visitor tracking', 'Traffic source breakdown', 'Top articles report', 'Newsletter subscription analytics', 'Export to CSV'] },
    { version: '1.7.0', date: 'February 8, 2025', type: 'feature', icon: 'globe2', title: 'Multilingual Support', changes: ['Platform interface in English and French', 'RTL language support (Arabic, Hebrew)', 'Automatic locale detection', 'Per-article language setting'] },
    { version: '1.6.0', date: 'January 15, 2025', type: 'feature', icon: 'shield', title: 'Enterprise Security Features', changes: ['Two-factor authentication (2FA)', 'Comprehensive audit logs', 'IP allowlist for team access', 'Session management dashboard'] },
  ],
};

export default async function ChangelogPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('changelog', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-10">
            {(c.releases as typeof FALLBACK.releases).map((release) => {
              const Icon = ICONS[release.icon] ?? Bot;
              const badge = TYPE_BADGE[release.type] ?? TYPE_BADGE.feature;
              return (
                <div key={release.version} className="relative pl-14">
                  <div className={`absolute left-0 h-10 w-10 rounded-xl border ${ICON_COLORS[release.icon] ?? ''} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="font-black text-lg">{release.version}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">{release.date}</span>
                    </div>
                    <h3 className="font-bold text-base mb-4">{release.title}</h3>
                    <ul className="space-y-2">
                      {(release.changes as string[]).map((change) => (
                        <li key={change} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
