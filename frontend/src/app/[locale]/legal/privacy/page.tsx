import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { LegalSections, type LegalSectionData } from '@/components/marketing/LegalSection';
import { getPlatformPage } from '@/lib/platform-api';

const FALLBACK = {
  hero: { title: 'Privacy Policy', subtitle: 'How we collect, use, and protect your personal information.' },
  sections: [
    { icon: 'eye', title: 'Information We Collect', body: 'We collect information you provide directly to us when creating an account, publishing content, or contacting support: name, email address, billing information, and the content you create.', items: ['Name and email address when you create an account', 'Article content and media you publish on your blogs', 'Billing information for paid subscriptions', 'Communications with our customer support team', 'Technical data: IP address, browser type, pages visited'] },
    { icon: 'shield', title: 'How We Use Your Information', body: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and analyze usage to enhance your experience.', items: ['Provide, maintain, and improve our services', 'Process transactions and send related confirmations', 'Send technical notifications and security alerts', 'Respond to your comments, questions, and support requests', 'Monitor and analyze trends to improve user experience', 'Detect and prevent fraudulent or abusive activity'] },
    { icon: 'users', title: 'Information Sharing', body: 'We do not sell or rent your personal information to third parties. We may share your information only in the following limited circumstances:', items: ['With service providers who help us operate our platform (hosting, payments, analytics)', 'When required by law or in response to valid legal process', 'To protect the rights, property, or safety of SmarterBloggers and our users', 'In connection with a merger, acquisition, or sale of assets (you will be notified)'] },
    { icon: 'lock', title: 'Data Security', body: 'We implement appropriate technical and organizational security measures to protect your information.', items: ['All data encrypted in transit using TLS 1.3', 'Data at rest encrypted using AES-256', 'Role-based access controls for our team', 'Regular third-party security audits and penetration testing', 'Automated threat detection and monitoring'] },
    { icon: 'globe2', title: 'Your Rights (GDPR)', body: 'If you are based in the EEA, you have the following rights regarding your personal data.', items: ['Right to access your personal data', 'Right to rectification of inaccurate data', 'Right to erasure (right to be forgotten)', 'Right to restriction of processing', 'Right to data portability', 'Right to object to processing'] },
    { icon: 'mail', title: 'Contact & Updates', body: 'For questions about this Privacy Policy, contact our Data Protection Officer at privacy@smarterbloggers.com.', items: ['DPO email: privacy@smarterbloggers.com', 'Last updated: January 1, 2025', 'Effective date: January 1, 2025'] },
  ] as LegalSectionData[],
};

export default async function PrivacyPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('legal-privacy', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />
      <PageHero
        image="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />
      <LegalSections sections={c.sections} />
      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
