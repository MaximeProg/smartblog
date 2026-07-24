import { getUiTranslations } from '@/lib/platform-api';
import AboutPageClient from './AboutPageClient';
import { EN_ABOUT, FR_ABOUT, type AboutLabels } from './labels';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let l: AboutLabels = locale === 'fr' ? FR_ABOUT : EN_ABOUT;
  if (locale !== 'en' && locale !== 'fr') {
    const translated = await getUiTranslations('marketing', locale);
    if (translated?.templateAbout) l = { ...EN_ABOUT, ...(translated.templateAbout as Partial<AboutLabels>) };
  }

  return <AboutPageClient l={l} locale={locale} />;
}
