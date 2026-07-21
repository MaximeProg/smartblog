import { defineRouting } from 'next-intl/routing';

// Même liste que CMS_SUPPORTED_LANGS (frontend/src/config/cms.ts), qui
// pilote déjà la traduction du contenu des blogs via DeepL — l'interface
// (dashboard/Studio) est désormais traduite dans les mêmes langues (voir
// backend/scripts/generate_ui_translations.py).
export const routing = defineRouting({
  locales: [
    'en', 'fr', 'es', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'ja', 'zh', 'ko',
    'tr', 'sv', 'da', 'nb', 'fi', 'cs', 'sk', 'ro', 'hu', 'bg', 'el', 'uk',
    'id', 'lt', 'lv', 'et', 'sl',
  ] as const,
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];
