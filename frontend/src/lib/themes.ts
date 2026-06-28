export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  defaultColor: string;
  defaultFont: string;
  tags: string[];
  preview: {
    // CSS class overrides for the preview card
    bg: string;
    accent: string;
    headerStyle: 'centered' | 'left' | 'magazine' | 'dense' | 'minimal';
    layout: 'single' | 'grid' | 'masonry' | 'list' | 'columns';
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Épuré et centré sur la lecture. Inspiré de Medium.',
    defaultColor: '#171717',
    defaultFont: 'Georgia',
    tags: ['Lecture', 'Blog perso', 'Écriture'],
    preview: {
      bg: 'bg-white',
      accent: 'border-black',
      headerStyle: 'centered',
      layout: 'single',
    },
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Visuel et dynamique. Hero image, grille d\'articles, sidebar.',
    defaultColor: '#DC2626',
    defaultFont: 'Playfair Display',
    tags: ['Lifestyle', 'Culture', 'Mode'],
    preview: {
      bg: 'bg-white',
      accent: 'border-red-600',
      headerStyle: 'magazine',
      layout: 'masonry',
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professionnel et structuré. Idéal pour les entreprises.',
    defaultColor: '#1D4ED8',
    defaultFont: 'Inter',
    tags: ['Entreprise', 'B2B', 'Corporate'],
    preview: {
      bg: 'bg-slate-50',
      accent: 'border-blue-700',
      headerStyle: 'left',
      layout: 'list',
    },
  },
  {
    id: 'news',
    name: 'News',
    description: 'Style journal. Dense, multi-colonnes, actualités en temps réel.',
    defaultColor: '#111827',
    defaultFont: 'Merriweather',
    tags: ['Actualité', 'Presse', 'Information'],
    preview: {
      bg: 'bg-white',
      accent: 'border-gray-900',
      headerStyle: 'dense',
      layout: 'columns',
    },
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Moderne et sombre. Parfait pour les devs et la tech.',
    defaultColor: '#8B5CF6',
    defaultFont: 'JetBrains Mono',
    tags: ['Développement', 'Tech', 'IA'],
    preview: {
      bg: 'bg-zinc-950',
      accent: 'border-violet-500',
      headerStyle: 'left',
      layout: 'grid',
    },
  },
];

export const BLOG_CATEGORIES = [
  { value: 'tech', label: 'Technologie & Développement' },
  { value: 'business', label: 'Business & Entrepreneuriat' },
  { value: 'lifestyle', label: 'Lifestyle & Bien-être' },
  { value: 'food', label: 'Cuisine & Gastronomie' },
  { value: 'travel', label: 'Voyage & Aventure' },
  { value: 'finance', label: 'Finance & Investissement' },
  { value: 'fashion', label: 'Mode & Beauté' },
  { value: 'health', label: 'Santé & Sport' },
  { value: 'education', label: 'Éducation & Formation' },
  { value: 'news', label: 'Actualités & Presse' },
  { value: 'entertainment', label: 'Divertissement & Culture' },
  { value: 'portfolio', label: 'Portfolio & Créatif' },
  { value: 'other', label: 'Autre' },
];

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', sample: 'Moderne & Clean' },
  { value: 'Georgia', label: 'Georgia', sample: 'Sérieux & Lisible' },
  { value: 'Playfair Display', label: 'Playfair', sample: 'Élégant & Éditorial' },
  { value: 'Merriweather', label: 'Merriweather', sample: 'Presse & Journaux' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', sample: 'Tech & Code' },
];

export const COLOR_PRESETS = [
  { color: '#171717', label: 'Noir' },
  { color: '#1D4ED8', label: 'Bleu' },
  { color: '#DC2626', label: 'Rouge' },
  { color: '#16A34A', label: 'Vert' },
  { color: '#7C3AED', label: 'Violet' },
  { color: '#D97706', label: 'Ambre' },
  { color: '#DB2777', label: 'Rose' },
  { color: '#0891B2', label: 'Cyan' },
];
