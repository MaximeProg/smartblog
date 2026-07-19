import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { LegalSections, type LegalSectionData } from '@/components/marketing/LegalSection';
import { getPlatformPage } from '@/lib/platform-api';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  hero: { title: 'Data Deletion Instructions', subtitle: 'How to request the deletion of your account and personal data from SmarterBloggers.' },
  sections: [
    { icon: 'trash2', title: 'Data Deletion Request', body: 'At SmarterBloggers, we respect your privacy and your right to request the deletion of your personal data. If you would like us to delete your account or any personal information associated with your use of SmarterBloggers, please follow one of the methods below.', items: [] },
    { icon: 'user', title: 'Option 1 – Delete Your Account (Recommended)', body: 'If you have access to your SmarterBloggers account, you can delete it directly from your settings. Your account and associated personal data will be permanently deleted according to our data retention policy.', items: ['Log in to your account', 'Navigate to Settings → Account', 'Click Delete Account', 'Confirm your request'] },
    { icon: 'mail', title: 'Option 2 – Submit a Data Deletion Request', body: 'If you cannot access your account, please contact us at support@myhigh5.com. Please include the following information in your request:', items: ['Your full name', 'Email address associated with your account', 'The social platform connected (Facebook, Instagram, Threads, X, LinkedIn, etc.)', 'A brief request to delete your data'] },
    { icon: 'xcircle', title: 'What Data Will Be Deleted', body: 'When your request is processed, we will permanently delete or anonymize, where applicable:', items: ['Your SmarterBloggers account', 'Connected social media account information', 'OAuth access and refresh tokens', 'Scheduled posts', 'Draft posts', 'Uploaded media (where applicable)', 'Analytics associated with your account', 'Profile information stored by SmarterBloggers'] },
    { icon: 'shield', title: 'Data We May Retain', body: 'Certain information may be retained if required by law, fraud prevention, security investigations, tax regulations, or other legal obligations.', items: [] },
    { icon: 'zap', title: 'Processing Time', body: 'Most deletion requests are processed within 30 days after successful identity verification.', items: [] },
    { icon: 'mail', title: 'Contact', body: 'SmarterBloggers — Email: support@myhigh5.com', items: ['Privacy Policy: https://www.smarterbloggers.com/en/legal/privacy', 'Terms of Service: https://www.smarterbloggers.com/en/legal/terms', 'Last updated: July 18, 2026'] },
  ] as LegalSectionData[],
};

export default async function DataDeletionPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('legal-data-deletion', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />
      <PageHero
        image="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />
      <LegalSections sections={c.sections} />
      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
