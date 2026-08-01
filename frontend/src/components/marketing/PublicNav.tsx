import { getUiTranslations } from '@/lib/platform-api';
import { PublicNavClient, type NavLabels } from './PublicNavClient';

const EN_LABELS: NavLabels = {
  home: 'Home', blogs: 'Blogs', features: 'Features', pricing: 'Pricing',
  about: 'About', contact: 'Contact', advertise: 'Advertise', signIn: 'Sign In',
};

const FR_LABELS: NavLabels = {
  home: 'Accueil', blogs: 'Blogs', features: 'Fonctionnalités', pricing: 'Tarifs',
  about: 'À propos', contact: 'Contact', advertise: 'Annonceurs', signIn: 'Connexion',
};

interface PublicNavProps {
  locale: string;
  /** Langue du contenu CMS traduit par DeepL — toujours égale à `locale`
   * (un seul choix de langue pour toute l'app), passée explicitement par
   * chaque page pour éviter de la recalculer ici. */
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
