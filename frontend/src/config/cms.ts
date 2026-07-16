/**
 * Langues disponibles pour le contenu CMS des pages marketing pilotes
 * (Home/About/Contact), indépendamment des locales next-intl (routing.ts,
 * qui restent en/fr pour l'UI fixe — voir la décision actée en phase 1 de
 * dynamisation des pages publiques). Ajouter une langue = ajouter une entrée
 * ici, DeepL gère la traduction automatiquement, aucun code supplémentaire.
 */
export const CMS_SUPPORTED_LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
] as const;

export type CmsLang = (typeof CMS_SUPPORTED_LANGS)[number]['code'];
