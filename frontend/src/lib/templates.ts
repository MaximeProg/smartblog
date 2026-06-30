// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface TemplateTypography {
  headingFont: string;
  bodyFont: string;
  fontSize: 'sm' | 'md' | 'lg';
}

export interface TemplateSocialLinks {
  twitter: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  youtube: string;
  github: string;
  tiktok: string;
}

export interface TemplateSidebarWidgets {
  search: boolean;
  popularPosts: boolean;
  recentPosts: boolean;
  categories: boolean;
  tags: boolean;
  author: boolean;
  newsletter: boolean;
  socialLinks: boolean;
  advertisements: boolean;
}

export interface BlogTemplateConfig {
  // Style
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  fontSize: 'sm' | 'md' | 'lg';
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
  darkMode: 'light' | 'dark' | 'system';

  // Layout
  contentWidth: 'narrow' | 'standard' | 'wide' | 'full';
  sidebarEnabled: boolean;
  sidebarPosition: 'left' | 'right';
  stickyHeader: boolean;
  headerStyle: 'minimal' | 'classic' | 'magazine' | 'centered';
  headerShowSearch: boolean;
  headerShowSocial: boolean;

  // Sections
  heroEnabled: boolean;
  heroStyle: 'full-image' | 'compact' | 'text-only';
  featuredPostsEnabled: boolean;
  featuredPostsCount: number;
  featuredPostsLayout: 'grid' | 'list' | 'carousel';
  latestPostsLayout: 'grid' | 'list' | 'masonry';
  categoriesSectionEnabled: boolean;
  newsletterSectionEnabled: boolean;

  // Sidebar widgets
  widgets: TemplateSidebarWidgets;

  // Social
  social: TemplateSocialLinks;

  // SEO
  seoTitleTemplate: string;
  seoMetaDescription: string;

  // Footer
  footerColumns: 1 | 2 | 3 | 4;
  footerShowNewsletter: boolean;
  footerText: string;
}

export interface TemplateContent {
  blogName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroCta: string;
  featuredSectionTitle: string;
  categoriesSectionTitle: string;
  latestSectionTitle: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterCta: string;
  footerTagline: string;
  sectionOrder: string[];
}

export const DEFAULT_SECTION_ORDER = ['hero', 'featured', 'categories', 'latest', 'newsletter'];

export const DEFAULT_TEMPLATE_CONTENT: TemplateContent = {
  blogName: 'Mon Blog',
  tagline: 'Explorez le monde à travers mes histoires',
  heroHeadline: 'Bienvenue sur mon blog',
  heroSubheadline: 'Découvrez des articles de qualité sur les sujets qui vous passionnent.',
  heroCta: 'Lire les articles',
  featuredSectionTitle: 'Articles à la une',
  categoriesSectionTitle: 'Explorer par catégorie',
  latestSectionTitle: 'Derniers articles',
  newsletterTitle: 'Restez informé',
  newsletterDescription: 'Recevez les meilleurs articles directement dans votre boîte mail.',
  newsletterCta: "S'abonner",
  footerTagline: 'Créé avec passion.',
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: string;
  tags: string[];
  defaultConfig: BlogTemplateConfig;
  defaultContent: TemplateContent;
}

// ─── Default empty social links ───────────────────────────────────────────────

const emptySocial: TemplateSocialLinks = {
  twitter: '', instagram: '', facebook: '',
  linkedin: '', youtube: '', github: '', tiktok: '',
};

const defaultWidgets: TemplateSidebarWidgets = {
  search: true, popularPosts: true, recentPosts: true,
  categories: true, tags: true, author: true,
  newsletter: true, socialLinks: true, advertisements: false,
};

// ─── Template definitions ─────────────────────────────────────────────────────

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Épuré, centré sur la lecture',
    longDescription: 'Un design minimaliste inspiré de Medium. Contenu centré, typographie soignée, zéro distraction. Parfait pour les blogs personnels et les auteurs sérieux.',
    category: 'Blog personnel',
    tags: ['Lecture', 'Écriture', 'Blog perso', 'Minimalisme'],
    defaultContent: { ...DEFAULT_TEMPLATE_CONTENT, blogName: 'The Writer', tagline: 'Pensées, idées & réflexions', heroHeadline: 'Des mots qui résonnent', heroSubheadline: 'Un espace dédié à l\'écriture longue, aux idées qui comptent et aux histoires qui durent.', heroCta: 'Commencer à lire' },
    defaultConfig: {
      primaryColor: '#171717',
      secondaryColor: '#737373',
      backgroundColor: '#FFFFFF',
      headingFont: 'Georgia',
      bodyFont: 'Georgia',
      fontSize: 'lg',
      borderRadius: 'sm',
      darkMode: 'light',
      contentWidth: 'narrow',
      sidebarEnabled: false,
      sidebarPosition: 'right',
      stickyHeader: true,
      headerStyle: 'centered',
      headerShowSearch: true,
      headerShowSocial: false,
      heroEnabled: true,
      heroStyle: 'text-only',
      featuredPostsEnabled: false,
      featuredPostsCount: 3,
      featuredPostsLayout: 'list',
      latestPostsLayout: 'list',
      categoriesSectionEnabled: false,
      newsletterSectionEnabled: true,
      widgets: { ...defaultWidgets, advertisements: false },
      social: emptySocial,
      seoTitleTemplate: '{title} — {blog}',
      seoMetaDescription: '',
      footerColumns: 1,
      footerShowNewsletter: false,
      footerText: '',
    },
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Éditorial, visuel, dynamique',
    longDescription: 'Un design magazine moderne avec hero image, grille d\'articles et sidebar. Idéal pour les blogs lifestyle, culture, mode et actualités éditoriales.',
    category: 'Magazine',
    tags: ['Lifestyle', 'Culture', 'Mode', 'Editorial'],
    defaultContent: { ...DEFAULT_TEMPLATE_CONTENT, blogName: 'The Nexus Post', tagline: 'Lifestyle · Culture · Mode · Tendances', heroHeadline: 'La sélection de la semaine', heroSubheadline: 'Mode, culture, lifestyle : tout ce qui fait l\'actualité cette semaine.', heroCta: 'Découvrir', featuredSectionTitle: 'À la une', newsletterTitle: 'La newsletter du vendredi', newsletterDescription: 'Chaque vendredi, une sélection de 5 articles pour finir la semaine en beauté.' },
    defaultConfig: {
      primaryColor: '#DC2626',
      secondaryColor: '#FCA5A5',
      backgroundColor: '#FFFFFF',
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      fontSize: 'md',
      borderRadius: 'md',
      darkMode: 'light',
      contentWidth: 'wide',
      sidebarEnabled: true,
      sidebarPosition: 'right',
      stickyHeader: true,
      headerStyle: 'magazine',
      headerShowSearch: true,
      headerShowSocial: true,
      heroEnabled: true,
      heroStyle: 'full-image',
      featuredPostsEnabled: true,
      featuredPostsCount: 5,
      featuredPostsLayout: 'grid',
      latestPostsLayout: 'masonry',
      categoriesSectionEnabled: true,
      newsletterSectionEnabled: true,
      widgets: { ...defaultWidgets },
      social: emptySocial,
      seoTitleTemplate: '{title} | {blog}',
      seoMetaDescription: '',
      footerColumns: 4,
      footerShowNewsletter: true,
      footerText: '',
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professionnel, structuré, corporate',
    longDescription: 'Un design professionnel et structuré, idéal pour les entreprises, consultants et professionnels B2B. Header clair, mise en page propre, autorité immédiate.',
    category: 'Entreprise',
    tags: ['B2B', 'Corporate', 'Consulting', 'Professionnel'],
    defaultContent: { ...DEFAULT_TEMPLATE_CONTENT, blogName: 'NexusBlog Insights', tagline: 'Expertise · Stratégie · Innovation', heroHeadline: 'Les insights qui font la différence', heroSubheadline: 'Analyses approfondies, études de cas et stratégies pour les professionnels ambitieux.', heroCta: 'Explorer le blog', newsletterTitle: 'Insights hebdomadaires', newsletterDescription: 'Rejoignez 10 000+ professionnels qui reçoivent nos analyses chaque semaine.' },
    defaultConfig: {
      primaryColor: '#1D4ED8',
      secondaryColor: '#93C5FD',
      backgroundColor: '#F8FAFC',
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 'md',
      borderRadius: 'md',
      darkMode: 'light',
      contentWidth: 'standard',
      sidebarEnabled: true,
      sidebarPosition: 'right',
      stickyHeader: true,
      headerStyle: 'classic',
      headerShowSearch: true,
      headerShowSocial: false,
      heroEnabled: true,
      heroStyle: 'compact',
      featuredPostsEnabled: true,
      featuredPostsCount: 3,
      featuredPostsLayout: 'grid',
      latestPostsLayout: 'list',
      categoriesSectionEnabled: true,
      newsletterSectionEnabled: true,
      widgets: { ...defaultWidgets },
      social: emptySocial,
      seoTitleTemplate: '{title} — {blog}',
      seoMetaDescription: '',
      footerColumns: 3,
      footerShowNewsletter: true,
      footerText: '',
    },
  },
  {
    id: 'news',
    name: 'News',
    description: 'Journal, actualités, multi-colonnes',
    longDescription: 'Style journal traditionnel. Dense, multi-colonnes, informations en temps réel. Conçu pour les sites d\'actualités, la presse en ligne et les blogs d\'information.',
    category: 'Actualités',
    tags: ['Presse', 'Actualité', 'Information', 'Journal'],
    defaultContent: { ...DEFAULT_TEMPLATE_CONTENT, blogName: 'The Daily Post', tagline: 'L\'actualité en temps réel', heroHeadline: 'Restez informé, toujours', heroSubheadline: 'Toute l\'actualité nationale et internationale couverte par nos journalistes.', heroCta: 'Lire les actualités', featuredSectionTitle: 'Actualités principales', latestSectionTitle: 'Dernières nouvelles' },
    defaultConfig: {
      primaryColor: '#111827',
      secondaryColor: '#6B7280',
      backgroundColor: '#FFFFFF',
      headingFont: 'Merriweather',
      bodyFont: 'Merriweather',
      fontSize: 'md',
      borderRadius: 'none',
      darkMode: 'light',
      contentWidth: 'wide',
      sidebarEnabled: true,
      sidebarPosition: 'right',
      stickyHeader: true,
      headerStyle: 'classic',
      headerShowSearch: true,
      headerShowSocial: true,
      heroEnabled: true,
      heroStyle: 'full-image',
      featuredPostsEnabled: true,
      featuredPostsCount: 6,
      featuredPostsLayout: 'grid',
      latestPostsLayout: 'list',
      categoriesSectionEnabled: true,
      newsletterSectionEnabled: true,
      widgets: { ...defaultWidgets, advertisements: true },
      social: emptySocial,
      seoTitleTemplate: '{title} - {blog}',
      seoMetaDescription: '',
      footerColumns: 4,
      footerShowNewsletter: false,
      footerText: '',
    },
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Dark mode, développeurs, IA',
    longDescription: 'Un design sombre et moderne, pensé pour les développeurs et passionnés de tech. Code snippets mis en valeur, dark mode natif, typographie monospace.',
    category: 'Technologie',
    tags: ['Développement', 'IA', 'Open Source', 'Code'],
    defaultContent: { ...DEFAULT_TEMPLATE_CONTENT, blogName: 'DevBlog', tagline: 'Code · IA · Open Source', heroHeadline: '< Hello, World />', heroSubheadline: 'Tutoriels, deep-dives et réflexions sur le développement moderne, l\'IA et l\'open source.', heroCta: 'Explorer les articles', featuredSectionTitle: 'Tutoriels populaires', latestSectionTitle: 'Derniers articles', newsletterTitle: 'Dev Newsletter', newsletterDescription: 'Une newsletter hebdomadaire pour les développeurs curieux.' },
    defaultConfig: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#A78BFA',
      backgroundColor: '#09090B',
      headingFont: 'Inter',
      bodyFont: 'JetBrains Mono',
      fontSize: 'md',
      borderRadius: 'lg',
      darkMode: 'dark',
      contentWidth: 'standard',
      sidebarEnabled: true,
      sidebarPosition: 'right',
      stickyHeader: true,
      headerStyle: 'minimal',
      headerShowSearch: true,
      headerShowSocial: true,
      heroEnabled: true,
      heroStyle: 'compact',
      featuredPostsEnabled: true,
      featuredPostsCount: 3,
      featuredPostsLayout: 'grid',
      latestPostsLayout: 'grid',
      categoriesSectionEnabled: true,
      newsletterSectionEnabled: false,
      widgets: { ...defaultWidgets, newsletter: false },
      social: emptySocial,
      seoTitleTemplate: '{title} · {blog}',
      seoMetaDescription: '',
      footerColumns: 2,
      footerShowNewsletter: false,
      footerText: '',
    },
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Créatif, visuel, showcase',
    longDescription: 'Un design créatif et visuel pour les photographes, designers, artistes et créatifs. Galerie masonry, mise en avant des projets et identité forte.',
    category: 'Portfolio',
    tags: ['Créatif', 'Photo', 'Design', 'Art'],
    defaultContent: { ...DEFAULT_TEMPLATE_CONTENT, blogName: 'Creative Studio', tagline: 'Photographie · Design · Art', heroHeadline: 'J\'écris des histoires qui comptent', heroSubheadline: 'Créatif passionné, je partage mon regard sur le monde à travers la photo, le design et les mots.', heroCta: 'Voir mes créations', featuredSectionTitle: 'Projets récents', latestSectionTitle: 'Dernières publications' },
    defaultConfig: {
      primaryColor: '#E11D48',
      secondaryColor: '#FB7185',
      backgroundColor: '#FAFAFA',
      headingFont: 'DM Sans',
      bodyFont: 'DM Sans',
      fontSize: 'md',
      borderRadius: 'lg',
      darkMode: 'light',
      contentWidth: 'wide',
      sidebarEnabled: false,
      sidebarPosition: 'right',
      stickyHeader: true,
      headerStyle: 'minimal',
      headerShowSearch: false,
      headerShowSocial: true,
      heroEnabled: true,
      heroStyle: 'full-image',
      featuredPostsEnabled: true,
      featuredPostsCount: 4,
      featuredPostsLayout: 'grid',
      latestPostsLayout: 'masonry',
      categoriesSectionEnabled: false,
      newsletterSectionEnabled: false,
      widgets: { ...defaultWidgets, advertisements: false, newsletter: false },
      social: emptySocial,
      seoTitleTemplate: '{title} — {blog}',
      seoMetaDescription: '',
      footerColumns: 2,
      footerShowNewsletter: false,
      footerText: '',
    },
  },
];

// ─── Utils ────────────────────────────────────────────────────────────────────

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// ─── Legacy re-exports (backward compat) ─────────────────────────────────────

export { BLOG_CATEGORIES, FONT_OPTIONS, COLOR_PRESETS } from './themes';

export const HEADING_FONTS = [
  { value: 'Inter',            label: 'Inter',            sample: 'Moderne & Clean' },
  { value: 'Georgia',          label: 'Georgia',          sample: 'Sérieux & Lisible' },
  { value: 'Playfair Display', label: 'Playfair Display', sample: 'Élégant & Éditorial' },
  { value: 'Merriweather',     label: 'Merriweather',     sample: 'Presse & Journaux' },
  { value: 'DM Sans',          label: 'DM Sans',          sample: 'Créatif & Moderne' },
  { value: 'Poppins',          label: 'Poppins',          sample: 'Arrondi & Doux' },
];

export const BODY_FONTS = [
  { value: 'Inter',            label: 'Inter',            sample: 'Polyvalent' },
  { value: 'Georgia',          label: 'Georgia',          sample: 'Serif classique' },
  { value: 'Merriweather',     label: 'Merriweather',     sample: 'Longue lecture' },
  { value: 'JetBrains Mono',   label: 'JetBrains Mono',  sample: 'Code & Tech' },
  { value: 'DM Sans',          label: 'DM Sans',          sample: 'Clean & Lisible' },
  { value: 'Lato',             label: 'Lato',             sample: 'Universel' },
];

export const EXTENDED_COLOR_PRESETS = [
  { color: '#171717', label: 'Noir' },
  { color: '#1D4ED8', label: 'Bleu' },
  { color: '#DC2626', label: 'Rouge' },
  { color: '#16A34A', label: 'Vert' },
  { color: '#7C3AED', label: 'Violet' },
  { color: '#D97706', label: 'Ambre' },
  { color: '#DB2777', label: 'Rose' },
  { color: '#0891B2', label: 'Cyan' },
  { color: '#E11D48', label: 'Carmin' },
  { color: '#EA580C', label: 'Orange' },
  { color: '#0F766E', label: 'Teal' },
  { color: '#4F46E5', label: 'Indigo' },
];
