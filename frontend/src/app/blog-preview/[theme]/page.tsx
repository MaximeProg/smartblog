/**
 * Theme preview page — shows each theme with mock data, no DB required.
 * Access: localhost:3000/blog-preview/minimal (or magazine, business, news, tech, portfolio)
 */
import { notFound } from 'next/navigation';
import type { BlogInfo, PublicArticle, PublicArticleFull, PublicCategory } from '@/lib/public-api';
import { ThemeHome, ThemeArticle } from '@/components/themes/ThemeRenderer';

const VALID_THEMES = ['minimal', 'magazine', 'business', 'news', 'tech', 'portfolio'] as const;
type ThemeName = (typeof VALID_THEMES)[number];

const THEME_CONFIG: Record<ThemeName, { color: string; font: string }> = {
  minimal:   { color: '#171717', font: 'Georgia' },
  magazine:  { color: '#DC2626', font: 'Playfair Display' },
  business:  { color: '#1D4ED8', font: 'Inter' },
  news:      { color: '#111827', font: 'Merriweather' },
  tech:      { color: '#8B5CF6', font: 'JetBrains Mono' },
  portfolio: { color: '#E11D48', font: 'DM Sans' },
};

function mockBlog(theme: ThemeName): BlogInfo {
  const cfg = THEME_CONFIG[theme];
  return {
    name: 'NexusBlog Demo',
    slug: `demo-${theme}`,
    description: 'Un blog de démonstration pour illustrer le thème ' + theme,
    category: 'Technology',
    logo_url: null,
    favicon_url: null,
    cover_image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80',
    language: 'fr',
    theme,
    primary_color: cfg.color,
    font_family: cfg.font,
    social_links: { twitter: 'https://twitter.com', linkedin: 'https://linkedin.com' },
  };
}

const MOCK_CATEGORIES: PublicCategory[] = [
  { id: '1', name: 'Technologie', slug: 'technologie', description: null, cover_image_url: null, articles_count: 12 },
  { id: '2', name: 'Design', slug: 'design', description: null, cover_image_url: null, articles_count: 8 },
  { id: '3', name: 'Business', slug: 'business', description: null, cover_image_url: null, articles_count: 5 },
  { id: '4', name: 'Tutoriels', slug: 'tutoriels', description: null, cover_image_url: null, articles_count: 15 },
];

const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
];

function mockArticle(i: number, full = false): PublicArticleFull {
  const categories = MOCK_CATEGORIES;
  const cat = categories[i % categories.length];
  return {
    id: `mock-${i}`,
    title: [
      "Comment l'IA révolutionne le développement web en 2026",
      'Les 10 meilleures pratiques de design pour votre blog',
      "Stratégie de contenu : comment attirer 10 000 visiteurs par mois",
      'Next.js 15 : toutes les nouveautés à connaître',
      'Monétiser son blog : guide complet pour les créateurs',
      "Accessibilité web : pourquoi c'est indispensable en 2026",
      'PostgreSQL vs MongoDB : quel choix pour votre SaaS',
      'Construire une audience fidèle sur les réseaux sociaux',
      'SEO technique : les erreurs qui tuent votre référencement',
      'Freelance vs salarié : le grand comparatif pour les devs',
    ][i % 10],
    slug: `article-demo-${i + 1}`,
    excerpt: "Découvrez dans cet article une analyse approfondie des meilleures stratégies et outils pour optimiser votre présence en ligne et développer votre audience de manière durable.",
    cover_image_url: STOCK_IMAGES[i % STOCK_IMAGES.length],
    author_name: ['Marie Dupont', 'Jean Martin', 'Sophie Lambert', 'Alex Fontaine'][i % 4],
    category_slug: cat.slug,
    category_name: cat.name,
    tags: (['web', 'design', 'seo', 'dev', 'ux'] as string[]).slice(0, (i % 3) + 1),
    published_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    reading_time_minutes: 4 + (i % 8),
    views_count: 1200 - i * 80,
    likes_count: 45 - i * 3,
    is_paid: false,
    price: null,
    content: full ? `
        <p>Cet article de démonstration illustre le rendu du contenu dans le thème sélectionné. Le texte ci-dessous représente un article typique avec différents éléments de formatage.</p>
        <h2>Introduction</h2>
        <p>Le contenu d'un blog de qualité doit être <strong>bien structuré</strong>, facile à lire et apporter une réelle valeur ajoutée au lecteur. Dans cet exemple, nous explorons les différentes possibilités offertes par notre système de thèmes.</p>
        <h2>Exemples de mise en forme</h2>
        <p>Voici quelques exemples de mise en forme supportés :</p>
        <ul>
          <li>Listes à puces pour organiser l'information</li>
          <li>Texte en <em>italique</em> et en <strong>gras</strong></li>
          <li>Liens <a href="#">cliquables</a></li>
        </ul>
        <blockquote>
          <p>"La qualité d'un contenu se mesure à sa capacité à répondre aux besoins du lecteur tout en étant agréable à lire."</p>
        </blockquote>
        <h2>Code et exemples techniques</h2>
        <p>Pour les articles techniques, le thème supporte l'affichage de code :</p>
        <pre><code>const blog = await publicApi.getBlogInfo(slug);\nreturn &lt;ThemeRenderer blog={blog} /&gt;;</code></pre>
        <p>Chaque thème est optimisé pour offrir la meilleure expérience de lecture possible, quelle que soit la nature du contenu.</p>
        <h2>Conclusion</h2>
        <p>Ce texte de démonstration vous permet d'évaluer le rendu typographique, l'espacement, et la lisibilité globale du thème avant de faire votre choix.</p>
      ` : null,
    audio_url: null,
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
  };
}

interface Props {
  params: Promise<{ theme: string }>;
  searchParams: Promise<{ article?: string }>;
}

export default async function ThemePreviewPage({ params, searchParams }: Props) {
  const { theme } = await params;
  const { article } = await searchParams;

  if (!VALID_THEMES.includes(theme as ThemeName)) notFound();

  const t = theme as ThemeName;
  const blog = mockBlog(t);
  const articles = Array.from({ length: 12 }, (_, i) => mockArticle(i));
  const categories = MOCK_CATEGORIES;

  // Preview banner (visible on all pages)
  const banner = (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', gap: 8, background: '#18181b', borderRadius: 100, padding: '8px 16px', boxShadow: '0 4px 24px #0006' }}>
      {VALID_THEMES.map((th) => (
        <a
          key={th}
          href={`/blog-preview/${th}`}
          style={{
            padding: '4px 12px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            background: th === t ? THEME_CONFIG[th].color : '#27272a',
            color: '#fff',
            transition: 'all .2s',
          }}
        >
          {th}
        </a>
      ))}
    </div>
  );

  // Show article view if ?article=1
  if (article) {
    const fullArticle = mockArticle(0, true);
    const related = articles.slice(1, 4);
    return (
      <>
        {banner}
        <ThemeArticle blog={blog} article={fullArticle} relatedArticles={related} getArticleHref={() => '?article=1'} />
      </>
    );
  }

  return (
    <>
      {banner}
      <ThemeHome
        blog={blog}
        articles={articles}
        categories={categories}
        getArticleHref={() => '?article=1'}
      />
    </>
  );
}
