import CorporateArticle from '@/components/themes/corporate/CorporateArticle';
import { getUiTranslations } from '@/lib/platform-api';

interface TemplateArticleContent {
  blogDescription: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  categoryName: string;
  tags: string[];
  related1Title: string; related1Excerpt: string; related1Category: string; related1Tags: string[];
  related2Title: string; related2Excerpt: string; related2Category: string; related2Tags: string[];
  related3Title: string; related3Excerpt: string; related3Category: string; related3Tags: string[];
}

const EN_ARTICLE: TemplateArticleContent = {
  blogDescription: 'In-depth analysis, strategies and insights for ambitious professionals.',
  title: 'How to Build a Content Strategy That Drives Real Results in 2026',
  excerpt: "Content marketing has fundamentally changed. Discover the new rules that separate companies that succeed from those that stagnate, and how to put an effective strategy in place today.",
  content: `
    <h2>Why content strategy has changed</h2>
    <p>For years, content boiled down to a simple equation: publish a lot, optimize for keywords, and wait for traffic to arrive. That approach is <strong>over</strong>.</p>
    <p>In 2026, search engine and social media algorithms have evolved to reward above all <em>depth</em>, <em>relevance</em>, and <em>credibility</em>. A 500-word article written to please the bots no longer converts — it simply gets ignored.</p>
    <blockquote>
      <p>The content that performs isn't the one that's most optimized for search engines. It's the one that best answers a real question a real human being is asking.</p>
    </blockquote>
    <h2>The 3 pillars of a modern strategy</h2>
    <h3>1. Topical authority above all</h3>
    <p>Rather than covering 50 topics superficially, successful brands position themselves as the undisputed reference on a specific scope. This focus creates what SEO experts call <strong>topical authority</strong> — an authority Google rewards with lasting rankings.</p>
    <p>In concrete terms, this means:</p>
    <ul>
      <li>Choosing 3 to 5 core themes directly tied to your added value</li>
      <li>Creating a comprehensive pillar piece of content for each theme</li>
      <li>Weaving a dense network of supporting articles that go deeper on every aspect</li>
      <li>Intelligently linking all of this content together</li>
    </ul>
    <h3>2. Intentional distribution</h3>
    <p>Creating content without a distribution strategy is like writing a book and leaving it in a drawer. In 2026, every article must be designed for multiple formats and multiple channels from the moment it's conceived.</p>
    <pre><code>Example of a multi-channel distribution plan:
Long-form article (2000+ words)
  → Newsletter (excerpt + link)
  → LinkedIn (key insight reworded)
  → Twitter/X (10-point thread)
  → Podcast (interview based on the article)
  → Infographic (visual data)
  → Short video (60-second tip)</code></pre>
    <h3>3. Measuring real impact</h3>
    <p>Too many content teams measure <em>vanity metrics</em> — visits, likes, shares — without ever tracing the link to revenue. High-performing teams, on the other hand, track:</p>
    <ul>
      <li><strong>The content-to-lead conversion rate</strong></li>
      <li><strong>Content's contribution across the buyer's journey</strong></li>
      <li><strong>Cost per lead by channel</strong></li>
      <li><strong>Subscriber reader retention</strong></li>
    </ul>
    <h2>Where to start?</h2>
    <p>If you're starting from scratch or want to overhaul your existing strategy, here's the recommended action plan for the first 90 days:</p>
    <ol>
      <li><strong>Weeks 1-2:</strong> Audit of existing content and identification of topical gaps</li>
      <li><strong>Weeks 3-4:</strong> Defining personas and the questions they're asking</li>
      <li><strong>Weeks 5-8:</strong> Creating pillar content (one per theme)</li>
      <li><strong>Weeks 9-12:</strong> Building the network of supporting articles and setting up distribution</li>
    </ol>
    <p>The 90-day result won't be spectacular in terms of traffic — SEO takes time — but you'll have laid <strong>solid foundations</strong> that will pay off over 12 to 24 months.</p>
    <h2>Conclusion</h2>
    <p>An effective content strategy in 2026 isn't more complicated than before — it's different. It demands more discipline, more focus, and an obsession with quality over quantity. Brands that have understood this build loyal, lasting audiences that convert.</p>
    <p>If you want to go further, explore our other guides on <a href="#">content audits</a>, <a href="#">topical authority</a>, and <a href="#">multi-channel distribution</a>.</p>
  `,
  authorName: 'Marie Dupont',
  categoryName: 'Marketing',
  tags: ['strategy', 'content', 'SEO', 'digital marketing'],
  related1Title: 'AI Is Redefining the Rules of the Game for SMEs',
  related1Excerpt: 'SMEs that adopt AI now have a significant competitive advantage.',
  related1Category: 'Technology',
  related1Tags: ['AI', 'SMEs'],
  related2Title: 'Leadership 2026: The 7 Skills of High-Performing Executives',
  related2Excerpt: 'The best leaders share common habits. Discover the 7 key skills.',
  related2Category: 'Leadership',
  related2Tags: ['management', 'leadership'],
  related3Title: "Technical SEO: Google's New Requirements in 2026",
  related3Excerpt: "Core Web Vitals, generative AI, voice search... Here's what really matters.",
  related3Category: 'Marketing',
  related3Tags: ['SEO', 'Google'],
};

const FR_ARTICLE: TemplateArticleContent = {
  blogDescription: "Analyses approfondies, stratégies et insights pour les professionnels ambitieux.",
  title: 'Comment construire une stratégie de contenu qui génère des résultats concrets en 2026',
  excerpt: "Le marketing de contenu a fondamentalement changé. Découvrez les nouvelles règles qui séparent les entreprises qui réussissent de celles qui stagnent, et comment mettre en place une stratégie efficace dès aujourd'hui.",
  content: `
    <h2>Pourquoi la stratégie de contenu a changé</h2>
    <p>Pendant des années, le contenu s'est résumé à une simple équation : publier beaucoup, optimiser pour les mots-clés, et attendre que le trafic arrive. Cette approche est <strong>révolue</strong>.</p>
    <p>En 2026, les algorithmes des moteurs de recherche et des réseaux sociaux ont évolué pour valoriser avant tout la <em>profondeur</em>, la <em>pertinence</em> et la <em>crédibilité</em>. Un article de 500 mots écrit pour plaire aux robots ne convertit plus — il est simplement ignoré.</p>
    <blockquote>
      <p>Le contenu qui performe n'est pas celui qui est le plus optimisé pour les moteurs de recherche. C'est celui qui répond le mieux à une question réelle que se pose un vrai être humain.</p>
    </blockquote>
    <h2>Les 3 piliers d'une stratégie moderne</h2>
    <h3>1. L'autorité thématique avant tout</h3>
    <p>Plutôt que de couvrir 50 sujets superficiellement, les marques qui réussissent se positionnent comme la référence incontestable sur un périmètre précis. Cette concentration crée ce que les experts SEO appellent la <strong>topical authority</strong> — une autorité thématique que Google récompense avec des positions durables.</p>
    <p>Concrètement, cela signifie :</p>
    <ul>
      <li>Choisir 3 à 5 thématiques cœur en lien direct avec votre valeur ajoutée</li>
      <li>Créer un contenu pilier exhaustif pour chaque thématique</li>
      <li>Tisser un réseau dense d'articles de soutien qui approfondissent chaque aspect</li>
      <li>Lier intelligemment tous ces contenus entre eux</li>
    </ul>
    <h3>2. La distribution intentionnelle</h3>
    <p>Créer du contenu sans stratégie de distribution, c'est écrire un livre et le garder dans son tiroir. En 2026, chaque article doit être pensé pour plusieurs formats et plusieurs canaux dès sa conception.</p>
    <pre><code>Exemple de plan de distribution multi-canal :
Article long format (2000+ mots)
  → Newsletter (extrait + lien)
  → LinkedIn (insight clé reformulé)
  → Twitter/X (thread de 10 points)
  → Podcast (interview basée sur l'article)
  → Infographie (données visuelles)
  → Vidéo courte (tip en 60 secondes)</code></pre>
    <h3>3. La mesure de l'impact réel</h3>
    <p>Trop d'équipes contenu mesurent des <em>vanity metrics</em> — visites, likes, partages — sans jamais tracer le lien avec le chiffre d'affaires. Les équipes performantes, elles, traquent :</p>
    <ul>
      <li><strong>Le taux de conversion contenu → lead</strong></li>
      <li><strong>La contribution du contenu dans les parcours d'achat</strong></li>
      <li><strong>Le coût par lead par canal</strong></li>
      <li><strong>La rétention des lecteurs abonnés</strong></li>
    </ul>
    <h2>Par où commencer ?</h2>
    <p>Si vous partez de zéro ou voulez refondre votre stratégie existante, voici le plan d'action recommandé pour les 90 premiers jours :</p>
    <ol>
      <li><strong>Semaines 1-2 :</strong> Audit de l'existant et identification des lacunes thématiques</li>
      <li><strong>Semaines 3-4 :</strong> Définition des personas et des questions qu'ils se posent</li>
      <li><strong>Semaines 5-8 :</strong> Création des contenus piliers (un par thématique)</li>
      <li><strong>Semaines 9-12 :</strong> Construction du réseau d'articles de soutien et mise en place de la distribution</li>
    </ol>
    <p>Le résultat à 90 jours ne sera pas spectaculaire en termes de trafic — le SEO prend du temps — mais vous aurez posé des <strong>fondations solides</strong> qui paieront sur 12 à 24 mois.</p>
    <h2>Conclusion</h2>
    <p>La stratégie de contenu efficace en 2026 n'est pas plus compliquée qu'avant — elle est différente. Elle exige plus de discipline, plus de focus, et une obsession pour la qualité plutôt que la quantité. Les marques qui l'ont compris construisent des audiences fidèles, durables et qui convertissent.</p>
    <p>Si vous voulez aller plus loin, explorez nos autres guides sur l'<a href="#">audit de contenu</a>, la <a href="#">topical authority</a> et la <a href="#">distribution multi-canal</a>.</p>
  `,
  authorName: 'Marie Dupont',
  categoryName: 'Marketing',
  tags: ['stratégie', 'contenu', 'SEO', 'marketing digital'],
  related1Title: "L'IA redéfinit les règles du jeu pour les PME",
  related1Excerpt: "Les PME qui adoptent l'IA dès maintenant ont un avantage compétitif considérable.",
  related1Category: 'Technologie',
  related1Tags: ['IA', 'PME'],
  related2Title: 'Leadership 2026 : les 7 compétences des dirigeants performants',
  related2Excerpt: 'Les meilleurs dirigeants partagent des habitudes communes. Découvrez les 7 compétences clés.',
  related2Category: 'Leadership',
  related2Tags: ['management', 'leadership'],
  related3Title: 'SEO technique : les nouvelles exigences de Google en 2026',
  related3Excerpt: "Core Web Vitals, IA générative, recherche vocale... Voici ce qui compte vraiment.",
  related3Category: 'Marketing',
  related3Tags: ['SEO', 'Google'],
};

export default async function TemplateArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let c: TemplateArticleContent = locale === 'fr' ? FR_ARTICLE : EN_ARTICLE;
  if (locale !== 'en' && locale !== 'fr') {
    const translated = await getUiTranslations('marketing', locale);
    if (translated?.templateArticle) c = { ...EN_ARTICLE, ...(translated.templateArticle as Partial<TemplateArticleContent>) };
  }

  const BLOG = {
    name: 'SmarterBloggers Insights',
    slug: 'demo',
    description: c.blogDescription,
    category: 'Business',
    logo_url: null,
    favicon_url: null,
    cover_image_url: null,
    language: locale,
    theme: 'corporate',
    primary_color: '#2563eb',
    font_family: 'Inter',
    social_links: {
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com',
    },
    template_config: null,
  };

  const ARTICLE = {
    id: '1',
    title: c.title,
    slug: 'strategie-contenu-2026',
    excerpt: c.excerpt,
    content: c.content,
    cover_image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=675&fit=crop&auto=format',
    author_name: c.authorName,
    category_slug: 'marketing',
    category_name: c.categoryName,
    tags: c.tags,
    published_at: '2026-07-01T09:00:00Z',
    reading_time_minutes: 8,
    views_count: 4823,
    likes_count: 312,
    is_paid: false,
    price: null,
  };

  const RELATED = [
    {
      id: '2',
      title: c.related1Title,
      slug: 'ia-pme-2026',
      excerpt: c.related1Excerpt,
      cover_image_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=340&fit=crop&auto=format',
      author_name: 'Thomas Laurent',
      category_slug: 'technologie',
      category_name: c.related1Category,
      tags: c.related1Tags,
      published_at: '2026-06-28T08:00:00Z',
      reading_time_minutes: 12,
      views_count: 6201,
      likes_count: 487,
      is_paid: false,
      price: null,
    },
    {
      id: '3',
      title: c.related2Title,
      slug: 'leadership-competences-2026',
      excerpt: c.related2Excerpt,
      cover_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=340&fit=crop&auto=format',
      author_name: 'Sophie Martin',
      category_slug: 'leadership',
      category_name: c.related2Category,
      tags: c.related2Tags,
      published_at: '2026-06-25T10:00:00Z',
      reading_time_minutes: 10,
      views_count: 3947,
      likes_count: 256,
      is_paid: false,
      price: null,
    },
    {
      id: '5',
      title: c.related3Title,
      slug: 'seo-technique-2026',
      excerpt: c.related3Excerpt,
      cover_image_url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=600&h=340&fit=crop&auto=format',
      author_name: 'Emma Rousseau',
      category_slug: 'marketing',
      category_name: c.related3Category,
      tags: c.related3Tags,
      published_at: '2026-06-19T08:30:00Z',
      reading_time_minutes: 11,
      views_count: 4412,
      likes_count: 289,
      is_paid: false,
      price: null,
    },
  ];

  return (
    <CorporateArticle
      blog={BLOG as any}
      article={ARTICLE as any}
      relatedArticles={RELATED as any}
    />
  );
}
