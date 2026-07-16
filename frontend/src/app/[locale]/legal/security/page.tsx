import { AlertTriangle } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { LegalSections, type LegalSectionData } from '@/components/marketing/LegalSection';
import { getPlatformPage } from '@/lib/platform-api';
import { siteConfig } from '@/config/site';

const FALLBACK = {
  hero: { title: 'Enterprise-Grade Security', subtitle: 'Your content and data are protected by industry-leading security practices.' },
  sections: [
    { icon: 'lock', title: 'Data Encryption', body: 'All data exchanged with SmarterBloggers is encrypted in transit via TLS 1.3. Stored data is encrypted at rest using AES-256.', items: ['TLS 1.3 for all client-server communications', 'AES-256 for data at rest', 'Password hashing with bcrypt', 'Automatic encryption key rotation'] },
    { icon: 'shield', title: 'Access Control', body: 'Our role-based access control (RBAC) architecture ensures each user can only access what they need.', items: ['RBAC with 5 role levels', 'Complete data isolation between tenants', 'Multi-factor authentication available', 'Session management with forced invalidation'] },
    { icon: 'eye', title: 'Audit Logs', body: 'SmarterBloggers maintains comprehensive audit logs for all security-relevant events and data access.', items: ['All login and logout events recorded', 'Content modification tracking', 'Suspicious activity alerts', 'Log export available'] },
    { icon: 'server', title: 'Infrastructure Security', body: 'SmarterBloggers is hosted on SOC 2 Type II certified cloud infrastructure with automated backups and geographic redundancy.', items: ['SOC 2 Type II certified cloud infrastructure', 'Automated encrypted backups every hour', 'Multi-region geographic redundancy', 'Built-in DDoS protection'] },
    { icon: 'key', title: 'Testing & Audits', body: 'We conduct continuous security testing to identify and fix vulnerabilities before they can be exploited.', items: ['Quarterly third-party penetration testing', 'Static code analysis (SAST) in our CI/CD', 'Automated dependency scanning (SCA)', 'Responsible vulnerability disclosure program'] },
    { icon: 'zap', title: 'Rate Limiting & Protection', body: 'All our APIs are protected by rate limiting to prevent abuse, brute-force attacks, and DDoS attacks.', items: ['Rate limiting on all APIs and endpoints', 'Brute-force protection on login', 'Automatic suspicious IP blocking', '24/7 anomaly monitoring'] },
  ] as LegalSectionData[],
  report_vulnerability: {
    title: 'Report a Vulnerability',
    description: 'If you discover a security vulnerability, please report it to us responsibly. We commit to responding within 24 hours and acknowledging your contribution.',
  },
};

export default async function SecurityPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('legal-security', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />
      <PageHero
        image="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />
      <LegalSections sections={c.sections} checkBullets />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 md:pb-16">
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/5 p-8">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">{c.report_vulnerability.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                {c.report_vulnerability.description}
              </p>
              <a
                href={`mailto:${siteConfig.contact.security}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                {siteConfig.contact.security}
              </a>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
