import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { LegalSections, type LegalSectionData } from '@/components/marketing/LegalSection';
import { getPlatformPage } from '@/lib/platform-api';

const FALLBACK = {
  hero: { title: 'Cookie Policy', subtitle: 'How and why we use cookies on SmarterBloggers.' },
  sections: [
    { icon: 'settings', title: 'Essential Cookies', body: 'These cookies are necessary for the site to function and cannot be disabled.', items: ['smarterbloggers-auth — Session authentication token (7 days)', 'smarterbloggers-theme — Your dark/light theme preference (persistent)', 'CSRF token — Security protection for form submissions'] },
    { icon: 'barchart2', title: 'Analytics Cookies', body: 'These cookies allow us to count visits and traffic sources to measure and improve site performance.', items: ['_ga — Google Analytics visitor ID (2 years)', '_gid — Google Analytics session ID (24 hours)', '_gat — Request throttle (1 minute)'] },
    { icon: 'star', title: 'Preference Cookies', body: 'These cookies allow the site to remember your choices, such as your language preference.', items: ['locale — Your chosen language (persistent)', 'sidebar-collapsed — Dashboard sidebar state (session)'] },
    { icon: 'globe2', title: 'Third-Party Cookies', body: 'Some of our third-party services may set their own cookies, including Firebase and Google Analytics.', items: ['Firebase (Google) — Authentication and security', 'Google Analytics — Usage statistics'] },
    { icon: 'cookie', title: 'Managing Cookies', body: 'You can control and/or delete cookies via your browser settings. Note that disabling certain cookies may affect site functionality.', items: [] },
    { icon: 'mail', title: 'Questions?', body: 'For questions about our use of cookies, contact us at privacy@smarterbloggers.com. Last updated: January 1, 2025.', items: [] },
  ] as LegalSectionData[],
};

export default async function CookiesPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('legal-cookies', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />
      <PageHero
        image="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />
      <LegalSections sections={c.sections} />
      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
