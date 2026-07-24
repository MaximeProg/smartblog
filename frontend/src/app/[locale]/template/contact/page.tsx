import { getUiTranslations } from '@/lib/platform-api';
import ContactPageClient from './ContactPageClient';
import { EN_CONTACT, FR_CONTACT, type ContactLabels } from './labels';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let l: ContactLabels = locale === 'fr' ? FR_CONTACT : EN_CONTACT;
  if (locale !== 'en' && locale !== 'fr') {
    const translated = await getUiTranslations('marketing', locale);
    if (translated?.templateContact) l = { ...EN_CONTACT, ...(translated.templateContact as Partial<ContactLabels>) };
  }

  return <ContactPageClient l={l} locale={locale} />;
}
