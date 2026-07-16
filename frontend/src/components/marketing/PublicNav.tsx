import { getUiTranslations } from '@/lib/platform-api';
import { PublicNavClient, type NavLabels } from './PublicNavClient';

const EN_LABELS: NavLabels = {
  home: 'Home', blogs: 'Blogs', features: 'Features', pricing: 'Pricing',
  about: 'About', contact: 'Contact', signIn: 'Sign In',
};

const FR_LABELS: NavLabels = {
  home: 'Accueil', blogs: 'Blogs', features: 'Fonctionnalités', pricing: 'Tarifs',
  about: 'À propos', contact: 'Contact', signIn: 'Connexion',
};

interface PublicNavProps {
  locale: string;
  /** Langue du contenu CMS (peut différer de `locale` via ?cmsLang=) — par
   * défaut, retombe sur `locale` pour les pages qui n'ont pas encore de
   * contenu traduisible (ex: liste des blogs, catégories). */
  lang?: string;
  transparent?: boolean;
}

export async function PublicNav({ locale, lang: langProp, transparent = false }: PublicNavProps) {
  const lang = (langProp ?? locale).toLowerCase();

  let labels: NavLabels = lang === 'fr' ? FR_LABELS : EN_LABELS;
  if (lang !== 'en' && lang !== 'fr') {
    const translated = await getUiTranslations('marketing', lang);
    if (translated?.nav) labels = { ...EN_LABELS, ...(translated.nav as Partial<NavLabels>) };
  }

  return <PublicNavClient locale={locale} lang={lang} labels={labels} transparent={transparent} />;
}
