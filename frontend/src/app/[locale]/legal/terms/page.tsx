import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { LegalSections, type LegalSectionData } from '@/components/marketing/LegalSection';
import { getPlatformPage } from '@/lib/platform-api';

const FALLBACK = {
  hero: { title: 'Terms of Service', subtitle: 'The rules governing your use of SmarterBloggers.' },
  sections: [
    { icon: 'filetext', title: 'Acceptance of Terms', body: 'By accessing or using SmarterBloggers, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our service.', items: [] },
    { icon: 'server', title: 'Description of Service', body: 'SmarterBloggers is a multi-tenant SaaS platform that enables content creators and businesses to create, manage, and publish professional blogs with editing, analytics, and monetization tools.', items: [] },
    { icon: 'user', title: 'User Accounts', body: 'To use certain features, you must create an account. You are responsible for the confidentiality of your credentials and all activities under your account.', items: ['You must be at least 16 years old to create an account', 'You must provide accurate and complete information', 'You are responsible for the security of your password', 'You must notify us immediately of any unauthorized access'] },
    { icon: 'edit3', title: 'User Content', body: 'You retain ownership of all content you publish. By publishing content, you grant us a non-exclusive license to use it in connection with our services.', items: ['Illegal, defamatory, hateful, or obscene content — prohibited', 'Infringing third-party intellectual property rights — prohibited', 'Malware, spam, or phishing — prohibited', 'Impersonating another person or entity — prohibited'] },
    { icon: 'creditcard', title: 'Plans and Billing', body: 'SmarterBloggers offers free and paid plans billed monthly or annually. You may cancel at any time; cancellation takes effect at the end of the current billing period.', items: [] },
    { icon: 'xcircle', title: 'Termination', body: 'We reserve the right to suspend or terminate your access for violations of these terms. You may also terminate your account at any time from your account settings.', items: [] },
    { icon: 'alerttriangle', title: 'Limitation of Liability', body: 'To the maximum extent permitted by applicable law, SmarterBloggers shall not be liable for indirect, incidental, special, or consequential damages arising from use or inability to use our service.', items: [] },
    { icon: 'mail', title: 'Contact', body: 'For questions about these Terms of Service, contact us at legal@smarterbloggers.com.', items: ['legal@smarterbloggers.com'] },
  ] as LegalSectionData[],
};

export default async function TermsPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('legal-terms', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />
      <PageHero
        image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />
      <LegalSections sections={c.sections} />
      <PublicFooter locale={locale} />
    </div>
  );
}
