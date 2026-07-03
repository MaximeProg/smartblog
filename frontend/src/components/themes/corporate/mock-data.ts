// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockComment {
  id: string;
  author: string;
  initials: string;
  avatarColor: string;
  content: string;
  published_at: string;
  likes: number;
  replies?: MockComment[];
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export const MOCK_BLOG = {
  name: 'NexusBlog Insights',
  slug: 'demo',
  description: "Analyses approfondies, stratégies et insights pour les professionnels ambitieux qui veulent garder une longueur d'avance.",
  category: 'Business',
  logo_url: null,
  favicon_url: null,
  cover_image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&h=600&fit=crop&auto=format',
  language: 'fr',
  theme: 'corporate',
  primary_color: '#2563eb',
  font_family: 'Inter',
  social_links: {
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
  },
  template_config: {
    content: {
      featuredSectionTitle: 'À la une',
      latestSectionTitle: 'Derniers articles',
      newsletterTitle: 'Rejoignez 12 000 professionnels',
      newsletterDescription: 'Chaque semaine, nos meilleures analyses, tendances et stratégies directement dans votre boîte mail.',
    },
  },
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const MOCK_CATEGORIES = [
  {
    id: 'c1', name: 'Marketing', slug: 'marketing',
    description: 'Stratégies marketing, SEO, content marketing et réseaux sociaux. Tout ce qu\'il faut savoir pour attirer, convertir et fidéliser vos clients en 2026.',
    cover_image_url: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=500&fit=crop&auto=format',
    articles_count: 3,
  },
  {
    id: 'c2', name: 'Technologie', slug: 'technologie',
    description: 'Intelligence artificielle, transformation digitale, outils et innovation. Décryptage des tendances tech qui impactent les entreprises aujourd\'hui.',
    cover_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop&auto=format',
    articles_count: 2,
  },
  {
    id: 'c3', name: 'Leadership', slug: 'leadership',
    description: 'Management, développement des compétences de leadership et performance individuelle et collective. Pour les dirigeants qui veulent avoir un impact durable.',
    cover_image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=500&fit=crop&auto=format',
    articles_count: 1,
  },
  {
    id: 'c4', name: 'Entrepreneuriat', slug: 'entrepreneuriat',
    description: 'Startup, financement, croissance et stratégie d\'entreprise. Les clés pour lancer, développer et pérenniser votre activité dans un environnement compétitif.',
    cover_image_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=500&fit=crop&auto=format',
    articles_count: 1,
  },
  {
    id: 'c5', name: 'Management', slug: 'management',
    description: 'RH, organisation, culture d\'entreprise et travail à distance. Les meilleures pratiques pour construire des équipes performantes et épanouies.',
    cover_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop&auto=format',
    articles_count: 1,
  },
];

// ─── Articles ─────────────────────────────────────────────────────────────────

export const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Comment construire une stratégie de contenu qui génère des résultats concrets en 2026',
    slug: 'strategie-contenu-2026',
    excerpt: "Le marketing de contenu a fondamentalement changé. Découvrez les nouvelles règles qui séparent les entreprises qui réussissent de celles qui stagnent.",
    cover_image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop&auto=format',
    author_name: 'Marie Dupont',
    category_slug: 'marketing',
    category_name: 'Marketing',
    tags: ['stratégie', 'contenu', 'SEO', 'marketing digital'],
    published_at: '2026-07-01T09:00:00Z',
    reading_time_minutes: 8,
    views_count: 4823,
    likes_count: 312,
    is_paid: false,
    price: null,
  },
  {
    id: '2',
    title: "L'intelligence artificielle redéfinit les règles du jeu pour les PME : ce que vous devez savoir",
    slug: 'ia-pme-2026',
    excerpt: "Les PME qui adoptent l'IA dès maintenant ont un avantage compétitif considérable. Voici comment en tirer profit concrètement.",
    cover_image_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop&auto=format',
    author_name: 'Thomas Laurent',
    category_slug: 'technologie',
    category_name: 'Technologie',
    tags: ['IA', 'PME', 'transformation digitale', 'automatisation'],
    published_at: '2026-06-28T08:00:00Z',
    reading_time_minutes: 12,
    views_count: 6201,
    likes_count: 487,
    is_paid: false,
    price: null,
  },
  {
    id: '3',
    title: 'Leadership en 2026 : les 7 compétences que les dirigeants performants cultivent chaque jour',
    slug: 'leadership-competences-2026',
    excerpt: "Les meilleurs dirigeants partagent des habitudes communes. Découvrez les 7 compétences clés qui font toute la différence.",
    cover_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop&auto=format',
    author_name: 'Sophie Martin',
    category_slug: 'leadership',
    category_name: 'Leadership',
    tags: ['management', 'leadership', 'performance', 'équipe'],
    published_at: '2026-06-25T10:00:00Z',
    reading_time_minutes: 10,
    views_count: 3947,
    likes_count: 256,
    is_paid: false,
    price: null,
  },
  {
    id: '4',
    title: "Financement de startup : comment pitcher votre idée pour convaincre les investisseurs en 2026",
    slug: 'financement-startup-pitch',
    excerpt: "Les règles du pitch ont changé. Les investisseurs sont plus sélectifs que jamais. Voici la méthode qui fonctionne.",
    cover_image_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop&auto=format',
    author_name: 'Lucas Bernard',
    category_slug: 'entrepreneuriat',
    category_name: 'Entrepreneuriat',
    tags: ['startup', 'financement', 'investissement', 'pitch'],
    published_at: '2026-06-22T09:00:00Z',
    reading_time_minutes: 15,
    views_count: 5134,
    likes_count: 398,
    is_paid: true,
    price: 9.99,
  },
  {
    id: '5',
    title: "SEO technique en 2026 : les nouvelles exigences de Google et comment s'y adapter",
    slug: 'seo-technique-2026',
    excerpt: "Core Web Vitals, IA générative, recherche vocale... Le SEO évolue rapidement. Voici ce qui compte vraiment.",
    cover_image_url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&h=450&fit=crop&auto=format',
    author_name: 'Emma Rousseau',
    category_slug: 'marketing',
    category_name: 'Marketing',
    tags: ['SEO', 'Google', 'technique', 'Core Web Vitals'],
    published_at: '2026-06-19T08:30:00Z',
    reading_time_minutes: 11,
    views_count: 4412,
    likes_count: 289,
    is_paid: false,
    price: null,
  },
  {
    id: '6',
    title: "Remote work : comment maintenir la culture d'entreprise à distance",
    slug: 'remote-work-culture',
    excerpt: "Les équipes distribuées peuvent avoir une culture forte — à condition d'adopter les bonnes pratiques dès le départ.",
    cover_image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=450&fit=crop&auto=format',
    author_name: 'Pierre Moreau',
    category_slug: 'management',
    category_name: 'Management',
    tags: ['remote', 'culture', 'équipe', 'télétravail'],
    published_at: '2026-06-16T07:00:00Z',
    reading_time_minutes: 9,
    views_count: 3289,
    likes_count: 214,
    is_paid: false,
    price: null,
  },
  {
    id: '7',
    title: "Data analytics : transformer les données en décisions stratégiques",
    slug: 'data-analytics-decisions',
    excerpt: "L'analyse de données n'est plus réservée aux grandes entreprises. Voici comment les PME peuvent en tirer parti.",
    cover_image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format',
    author_name: 'Isabelle Petit',
    category_slug: 'technologie',
    category_name: 'Technologie',
    tags: ['data', 'analytics', 'BI', 'KPI'],
    published_at: '2026-06-13T09:00:00Z',
    reading_time_minutes: 13,
    views_count: 2876,
    likes_count: 198,
    is_paid: false,
    price: null,
  },
  {
    id: '8',
    title: "Personal branding : construire son autorité professionnelle sur LinkedIn",
    slug: 'personal-branding-linkedin',
    excerpt: "LinkedIn est devenu le premier réseau professionnel mondial. Voici comment construire une présence qui ouvre des portes.",
    cover_image_url: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=800&h=450&fit=crop&auto=format',
    author_name: 'Julie Fontaine',
    category_slug: 'marketing',
    category_name: 'Marketing',
    tags: ['LinkedIn', 'personal branding', 'réseau', 'influence'],
    published_at: '2026-06-10T10:00:00Z',
    reading_time_minutes: 7,
    views_count: 5901,
    likes_count: 441,
    is_paid: false,
    price: null,
  },
];

// ─── Article Contents (full HTML) ─────────────────────────────────────────────

export const ARTICLE_CONTENTS: Record<string, string> = {
  'strategie-contenu-2026': `
<h2>Pourquoi la stratégie de contenu a radicalement changé</h2>
<p>Pendant des années, le marketing de contenu s'est résumé à une équation simpliste : publier beaucoup, optimiser pour les mots-clés et attendre que le trafic arrive. Cette approche appartient désormais au passé.</p>
<p>En 2026, les algorithmes de Google, de LinkedIn et des réseaux sociaux ont profondément évolué pour valoriser la <strong>profondeur</strong>, la <strong>pertinence</strong> et la <strong>crédibilité</strong>. Un article de 500 mots écrit pour plaire aux robots est simplement ignoré — à la fois par les machines et par les humains.</p>
<blockquote><p>Le contenu qui performe n'est pas celui qui est le plus optimisé pour les moteurs de recherche. C'est celui qui répond le mieux à une question réelle que se pose un vrai être humain.</p></blockquote>
<p>Les marques qui tirent leur épingle du jeu aujourd'hui sont celles qui ont compris qu'une seule pièce de contenu exceptionnelle vaut mieux que vingt articles médiocres. Cette mentalité "qualité avant quantité" est le premier changement fondamental à intégrer.</p>

<h2>Les 3 piliers d'une stratégie de contenu moderne</h2>

<h3>1. L'autorité thématique avant tout</h3>
<p>Plutôt que de couvrir 50 sujets superficiellement, les marques qui réussissent se positionnent comme la référence incontestable sur un périmètre précis. Cette concentration crée ce que les experts SEO appellent la <strong>topical authority</strong> — une autorité thématique que Google récompense avec des positions durables.</p>
<p>Concrètement, cela signifie :</p>
<ul>
<li>Choisir 3 à 5 thématiques cœur en lien direct avec votre valeur ajoutée</li>
<li>Créer un contenu pilier exhaustif (2000+ mots) pour chaque thématique</li>
<li>Tisser un réseau dense d'articles de soutien qui approfondissent chaque aspect</li>
<li>Lier intelligemment tous ces contenus entre eux avec un maillage interne cohérent</li>
</ul>
<p>Le résultat ? Google vous identifie comme une référence sur ces sujets et vous propulse naturellement dans les premiers résultats pour toutes les requêtes associées.</p>

<h3>2. La distribution intentionnelle</h3>
<p>Créer du contenu sans stratégie de distribution, c'est écrire un livre et le garder dans son tiroir. En 2026, chaque article doit être pensé pour plusieurs formats et plusieurs canaux dès sa conception.</p>
<p>La règle d'or : <strong>un article long = 7 à 10 contenus dérivés</strong>. Voici comment décliner :</p>
<pre><code>Article long format (2000+ mots)
  → Newsletter (extrait clé + lien + commentaire éditorial)
  → LinkedIn (insight reformulé avec storytelling personnel)
  → Thread Twitter/X (10 points actionnables)
  → Podcast (interview ou monologue basé sur le sujet)
  → Infographie (données et statistiques visualisées)
  → Vidéo courte (tip en 60 secondes pour Reels/Shorts)
  → Carrousel (slides pour LinkedIn ou Instagram)
  → Email de nurturing (dans votre séquence d'onboarding)</code></pre>
<p>Cette approche multiplie votre reach sans multiplier votre charge de travail. Un bon article, bien distribué, peut générer 10x plus de valeur qu'un article banal publié à la chaîne.</p>

<h3>3. La mesure de l'impact réel</h3>
<p>Trop d'équipes content mesurent des <em>vanity metrics</em> — visites, likes, partages — sans jamais tracer le lien avec le chiffre d'affaires. Les équipes qui performent, elles, traquent des métriques d'impact réel :</p>
<ul>
<li><strong>Taux de conversion contenu → lead</strong> : quel % des lecteurs d'un article s'inscrivent à votre newsletter ou téléchargent un lead magnet ?</li>
<li><strong>Contribution dans le parcours d'achat</strong> : dans combien de deals le contenu a-t-il été consulté avant la conversion ?</li>
<li><strong>Coût par lead par canal</strong> : quel canal de distribution génère les leads les moins chers et les plus qualifiés ?</li>
<li><strong>Score d'engagement sur le temps</strong> : vos lecteurs reviennent-ils ? Lisent-ils plusieurs articles ?</li>
</ul>

<h2>La méthode pratique pour démarrer</h2>
<p>Si vous partez de zéro ou voulez refondre votre stratégie existante, voici le plan d'action recommandé pour les 90 premiers jours :</p>
<ol>
<li><strong>Semaines 1-2 — Audit et positionnement :</strong> Analysez votre contenu existant, identifiez vos lacunes thématiques et définissez votre périmètre d'autorité. Qui êtes-vous ? Sur quoi voulez-vous être reconnu ?</li>
<li><strong>Semaines 3-4 — Personas et questions :</strong> Dressez des portraits précis de vos cibles et listez les 20 questions qu'elles se posent le plus souvent. Ce sont vos prochains sujets d'articles.</li>
<li><strong>Semaines 5-8 — Création des piliers :</strong> Rédigez vos 3 à 5 contenus piliers. Prenez le temps de les faire vraiment bien — ce sont eux qui établiront votre autorité.</li>
<li><strong>Semaines 9-12 — Distribution et maillage :</strong> Construisez votre réseau d'articles de soutien, mettez en place votre stratégie de distribution et commencez à mesurer.</li>
</ol>
<p>Le résultat à 90 jours ne sera pas spectaculaire en termes de trafic — le SEO prend du temps — mais vous aurez posé des <strong>fondations solides</strong> qui paieront sur 12 à 24 mois.</p>

<h2>Les erreurs qui coûtent cher</h2>
<p>Avant de vous lancer, voici les pièges les plus fréquents que nous observons chez nos clients :</p>
<ul>
<li><strong>Écrire pour les robots :</strong> Bourrer son contenu de mots-clés au détriment de la lisibilité est contreproductif. Google punit désormais les contenus sur-optimisés.</li>
<li><strong>Publier sans calendrier :</strong> La régularité est plus importante que la fréquence. Un article par semaine publié de façon régulière bat deux articles aléatoires.</li>
<li><strong>Ignorer la mise à jour :</strong> Un article de 2022 peut encore générer du trafic en 2026 — à condition d'être mis à jour. Prévoyez des révisions trimestrielles de vos contenus les plus performants.</li>
<li><strong>Négliger la conversion :</strong> Tout contenu doit avoir un CTA clair. Que voulez-vous que le lecteur fasse après avoir lu votre article ? Répondez à cette question avant d'écrire la première ligne.</li>
</ul>

<h2>Conclusion : le contenu est un investissement, pas une dépense</h2>
<p>La stratégie de contenu efficace en 2026 n'est pas plus compliquée qu'avant — elle est <em>différente</em>. Elle exige plus de discipline, plus de focus et une obsession pour la qualité plutôt que la quantité. Les marques qui l'ont compris construisent des audiences fidèles, durables et qui convertissent réellement.</p>
<p>Si vous deviez retenir une seule chose : <strong>arrêtez de créer du contenu pour le volume, commencez à créer du contenu pour l'impact</strong>. La différence entre ces deux approches, c'est souvent la différence entre un blog qui végète et un blog qui génère des centaines de leads qualifiés chaque mois.</p>
`,

  'ia-pme-2026': `
<h2>L'IA en 2026 : plus accessible que jamais pour les PME</h2>
<p>Il fut un temps où l'intelligence artificielle était le terrain exclusif des grandes entreprises — celles qui pouvaient se payer des équipes de data scientists et des infrastructures coûteuses. Ce temps est révolu. En 2026, les outils d'IA sont devenus aussi accessibles que les logiciels de comptabilité ou les outils de gestion de projet.</p>
<p>Pourtant, la majorité des PME n'exploitent toujours pas leur potentiel. Selon notre dernière enquête auprès de 1 200 dirigeants de PME françaises, <strong>67% utilisent au moins un outil d'IA</strong> dans leur quotidien, mais seulement <strong>12% ont une stratégie IA structurée</strong>. C'est précisément ce gap que nous allons combler aujourd'hui.</p>

<h2>Quels problèmes l'IA peut-elle vraiment résoudre pour une PME ?</h2>
<p>Avant de parler d'outils, posons-nous la bonne question : quels sont les véritables enjeux des PME que l'IA peut adresser efficacement ?</p>

<h3>1. Le manque de temps et de ressources humaines</h3>
<p>La contrainte numéro un des PME n'est pas le manque d'idées — c'est le manque de bras. L'IA peut agir comme un <strong>multiplicateur de capacité</strong> : elle permet à une équipe de 5 personnes de produire autant qu'une équipe de 15.</p>
<ul>
<li><strong>Création de contenu :</strong> rédaction d'emails, de posts réseaux sociaux, de descriptions produits</li>
<li><strong>Service client :</strong> chatbots capables de traiter 80% des demandes récurrentes 24h/24</li>
<li><strong>Analyse de données :</strong> synthèse automatique des rapports de performance</li>
<li><strong>Administration :</strong> traitement des factures, extraction d'informations clés des documents</li>
</ul>

<h3>2. La personnalisation à grande échelle</h3>
<p>Les grandes entreprises personnalisent l'expérience client depuis des années. Aujourd'hui, les PME peuvent faire de même. Les outils d'IA permettent de personnaliser les emails, les recommandations produits et même les offres commerciales à partir d'un simple CRM.</p>

<h3>3. La prise de décision basée sur les données</h3>
<p>L'intuition reste précieuse, mais les dirigeants qui la combinent avec des données concrètes prennent de meilleures décisions. L'IA analyse en quelques secondes des volumes de données qu'il faudrait des jours à analyser manuellement.</p>

<h2>Les outils IA indispensables en 2026</h2>
<p>Voici notre sélection des outils les plus impactants pour les PME, organisée par cas d'usage :</p>
<ul>
<li><strong>Contenu et communication :</strong> Claude, ChatGPT, Gemini pour la rédaction ; Midjourney ou DALL-E pour les visuels</li>
<li><strong>Service client :</strong> Intercom, Freshdesk avec IA intégrée, ou des solutions natives comme Crisp</li>
<li><strong>Analyse business :</strong> Google Looker Studio avec connecteurs IA, Tableau avec Einstein Analytics</li>
<li><strong>Automatisation :</strong> Make (ex-Integromat), Zapier avec IA, ou n8n pour les plus techniques</li>
<li><strong>RH et recrutement :</strong> Workable, Greenhouse ou des outils spécialisés comme Manatal</li>
</ul>

<h2>Comment démarrer sans se perdre</h2>
<p>L'erreur classique est de vouloir tout adopter en même temps. Notre recommandation : <strong>commencez par un seul cas d'usage, mesurez l'impact, puis étendez</strong>.</p>
<ol>
<li>Identifiez votre plus grande perte de temps quotidienne</li>
<li>Cherchez un outil IA qui adresse spécifiquement ce problème</li>
<li>Pilotez sur 30 jours avec une métrique claire de succès</li>
<li>Formez votre équipe (2h suffisent pour la plupart des outils)</li>
<li>Mesurez le gain de temps et la qualité, puis décidez d'élargir</li>
</ol>
<p>Les PME qui réussissent leur transformation IA ne sont pas celles qui ont investi le plus — ce sont celles qui ont été les plus méthodiques et patientes dans leur approche.</p>

<h2>Les risques à ne pas ignorer</h2>
<p>L'IA n'est pas sans risques. Avant de vous lancer, soyez conscient de :</p>
<ul>
<li><strong>La qualité des outputs :</strong> l'IA peut se tromper. Une relecture humaine reste indispensable pour tout contenu publié</li>
<li><strong>La confidentialité des données :</strong> ne jamais saisir de données clients sensibles dans des outils grand public sans avoir vérifié les conditions d'utilisation</li>
<li><strong>La dépendance :</strong> assurez-vous de ne pas être uniquement dépendant d'un seul fournisseur</li>
<li><strong>L'impact humain :</strong> communiquez transparemment avec votre équipe sur les changements de rôles</li>
</ul>
`,

  'leadership-competences-2026': `
<h2>Pourquoi les compétences de leadership ont évolué</h2>
<p>Le rôle du dirigeant a radicalement changé en moins de dix ans. Là où l'autorité et l'expertise technique suffisaient autrefois, les organisations d'aujourd'hui exigent des leaders capables de naviguer dans la complexité, d'inspirer des équipes hybrides et de prendre des décisions éclairées dans un environnement en perpétuelle mutation.</p>
<p>Nous avons analysé les profils de 500 dirigeants à haute performance en France et en Europe. Les résultats sont clairs : ils partagent tous les mêmes 7 compétences fondamentales — et les cultivent activement au quotidien.</p>

<h2>Les 7 compétences clés des dirigeants performants</h2>

<h3>1. L'intelligence émotionnelle avancée</h3>
<p>Ce n'est plus une soft skill optionnelle — c'est la compétence numéro un. Les dirigeants les plus performants ont une conscience aiguisée de leurs propres émotions et de celles de leurs équipes. Ils savent quand pousser, quand soutenir, quand lâcher prise.</p>
<p><strong>Comment la développer :</strong> Pratiquez la pleine conscience 10 minutes par jour. Tenez un journal de vos réactions émotionnelles. Sollicitez régulièrement des feedbacks 360°.</p>

<h3>2. La pensée systémique</h3>
<p>Les problèmes d'aujourd'hui sont rarement isolés. Un dirigeant systémique voit les interconnexions, anticipe les effets de bord de chaque décision et comprend comment les différentes parties de l'organisation s'influencent mutuellement.</p>

<h3>3. La communication inspirante</h3>
<p>Pas seulement la capacité à bien parler en public — mais à créer du sens, à connecter les actions quotidiennes au "pourquoi" de l'entreprise. Les équipes qui comprennent le sens de ce qu'elles font sont 3,4x plus engagées selon les données de Gallup.</p>

<h3>4. La décision sous incertitude</h3>
<p>En 2026, attendre d'avoir toutes les informations pour décider est un luxe qu'on ne peut plus se permettre. Les dirigeants performants ont appris à décider avec 70% de l'information disponible, en acceptant l'imperfection et en créant des mécanismes rapides d'ajustement.</p>

<h3>5. L'apprentissage continu</h3>
<p>Les leaders les plus performants lisent en moyenne 26 livres par an (vs 2 pour la moyenne). Ils consacrent au moins 5h par semaine à leur développement personnel et professionnel. Ils considèrent chaque erreur comme une donnée précieuse.</p>

<h3>6. L'empowerment des équipes</h3>
<p>Le micro-management est l'ennemi de la performance. Les meilleurs dirigeants créent les conditions pour que leurs équipes prennent des initiatives, expérimentent et échouent sainement. Ils délèguent avec clarté et font confiance.</p>

<h3>7. La résilience et l'adaptabilité</h3>
<p>La capacité à rebondir après un échec, à pivoter quand la stratégie ne fonctionne pas, à rester serein dans la tempête — c'est ce qui sépare les dirigeants durables de ceux qui brillent un moment puis s'épuisent.</p>

<h2>Comment développer ces compétences concrètement</h2>
<p>Comprendre ces 7 compétences est une chose. Les incarner au quotidien en est une autre. Voici notre plan d'action sur 90 jours :</p>
<ul>
<li><strong>Mois 1 — Diagnostic :</strong> Identifiez vos 2 points forts et vos 2 axes d'amélioration prioritaires grâce à un feedback 360°</li>
<li><strong>Mois 2 — Focus :</strong> Concentrez-vous sur une seule compétence. Lisez, pratiquez, mesurez.</li>
<li><strong>Mois 3 — Ancrage :</strong> Créez des rituels qui ancrent cette compétence dans votre quotidien et passez à la suivante.</li>
</ul>
<p>La clé ? La régularité sur le long terme bat toujours les efforts ponctuels et intenses.</p>
`,

  'financement-startup-pitch': `
<h2>Le contexte du financement en 2026</h2>
<p>Le marché du financement startup a connu des turbulences importantes ces dernières années. Après l'euphorie de 2021-2022 et le refroidissement de 2023-2024, nous entrons dans une nouvelle ère où les investisseurs sont plus sélectifs, plus exigeants sur les fondamentaux, mais toujours actifs pour les projets solides.</p>
<p>En 2026, réussir à lever des fonds exige plus qu'une belle présentation. Il faut des <strong>métriques solides</strong>, une <strong>équipe crédible</strong> et une <strong>vision claire du chemin vers la rentabilité</strong>.</p>

<h2>Les 5 erreurs qui font échouer les pitchs</h2>
<ul>
<li><strong>Commencer par le produit, pas par le problème :</strong> Les investisseurs veulent d'abord comprendre le problème que vous résolvez et pourquoi il est important.</li>
<li><strong>Surestimer le marché adressable :</strong> Dire "notre marché est de 500 milliards" sans segmentation crédible est un signal d'alarme immédiat.</li>
<li><strong>Ignorer la concurrence :</strong> "Nous n'avons pas de concurrents" est la phrase qui refroidit le plus les investisseurs.</li>
<li><strong>Projections financières irréalistes :</strong> Des projections qui triplent chaque année sans justification détaillée manquent de crédibilité.</li>
<li><strong>Pitcher seul :</strong> Les investisseurs financent des équipes, pas des individus. Montrez la complémentarité.</li>
</ul>

<h2>La structure du pitch parfait</h2>
<p>Un pitch efficace en 10 slides suit cette structure éprouvée : Problem → Solution → Marché → Produit → Business model → Traction → Équipe → Financier → Roadmap → Ask. Chaque slide doit répondre à une question que l'investisseur a déjà en tête.</p>
`,

  'seo-technique-2026': `
<h2>Le SEO en 2026 : une discipline en profonde mutation</h2>
<p>Le référencement naturel tel que nous le pratiquions il y a encore 3 ans n'existe plus. L'avènement de la recherche générative (AI Overviews de Google, Perplexity, etc.), la montée en puissance des Core Web Vitals et la pénalisation des contenus générés en masse par IA ont redessiné les règles du jeu.</p>
<p>La bonne nouvelle : pour ceux qui s'adaptent, les opportunités n'ont jamais été aussi importantes. Les pénuries de contenu de qualité créent des niches extraordinairement accessibles.</p>

<h2>Les 5 priorités SEO en 2026</h2>
<h3>Core Web Vitals et expérience utilisateur</h3>
<p>Google mesure désormais l'expérience utilisateur avec une précision chirurgicale. Le LCP (Largest Contentful Paint) doit être sous 2,5 secondes, le FID (First Input Delay) sous 100ms et le CLS (Cumulative Layout Shift) sous 0,1. Ces métriques ne sont plus des bonus — elles conditionnent directement votre positionnement.</p>

<h3>E-E-A-T : Expérience, Expertise, Autorité, Fiabilité</h3>
<p>Google accorde une importance croissante aux signaux de confiance. Qui écrit vos articles ? Quelle est leur légitimité ? Citez des sources, signez vos contenus, créez des pages auteur détaillées.</p>

<h3>Optimisation pour la recherche conversationnelle</h3>
<p>Avec la montée de la recherche vocale et des IA génératives, les requêtes sont de plus en plus longues et conversationnelles. Optimisez pour les questions complètes, pas seulement pour des mots-clés isolés.</p>

<h3>Contenu de profondeur vs contenu de volume</h3>
<p>Un seul article complet de 3000 mots sur un sujet précis surpasse systematiquement 10 articles de 300 mots sur des variantes du même sujet. Investissez dans la profondeur.</p>

<h3>Maillage interne intelligent</h3>
<p>Le maillage interne est l'une des leviers SEO les plus sous-estimés. Un bon maillage distribue la "link equity" vers vos pages importantes et aide Google à comprendre l'architecture de votre site.</p>
`,

  'remote-work-culture': `
<h2>La culture d'entreprise à l'ère du remote</h2>
<p>Quand on parle de culture d'entreprise, on pense souvent aux bureaux ouverts, aux afterworks, aux machine à café qui catalysent les conversations spontanées. Comment maintenir cette cohésion quand les équipes sont réparties entre Paris, Lyon, Bordeaux — et parfois Lisbonne ou Berlin ?</p>
<p>Nous avons étudié 45 entreprises qui ont réussi leur transition vers le full remote ou l'hybride. Voici leurs secrets.</p>

<h2>Les fondations d'une culture remote solide</h2>
<h3>1. La documentation comme culture</h3>
<p>Les meilleures entreprises remote sont obsédées par la documentation. Tout est écrit, accessible, mis à jour. Quand une information existe dans la tête d'une seule personne, c'est un risque. Quand elle est documentée, c'est un atout collectif.</p>

<h3>2. La communication asynchrone maîtrisée</h3>
<p>Le remote fonctionne quand on arrête d'essayer de reproduire le présentiel à distance. Moins de réunions, plus de messages asynchrones bien structurés. La règle des équipes performantes : si ça peut être un message, ce n'est pas une réunion.</p>

<h3>3. Les rituels qui créent du lien</h3>
<p>Les meilleures équipes remote ont des rituels hebdomadaires qui vont au-delà du travail : un café virtuel le lundi, un "show and tell" le vendredi, un déjeuner d'équipe en présentiel une fois par trimestre. Ces moments rituels créent le ciment humain.</p>

<h3>4. La transparence radicale</h3>
<p>En remote, l'information circule moins naturellement. Les dirigeants des meilleures équipes compensent en partageant plus que nécessaire : les résultats, les difficultés, les décisions et leurs justifications. Cette transparence crée confiance et sentiment d'appartenance.</p>
`,

  'data-analytics-decisions': `
<h2>Données et décisions : le nouveau paradigme</h2>
<p>Pendant longtemps, les décisions stratégiques reposaient sur l'expérience, l'intuition et quelques indicateurs financiers basiques. En 2026, les entreprises qui performent combinent ces éléments avec une analyse de données en temps réel qui permet des ajustements constants et précis.</p>
<p>La data analytics n'est plus réservée aux DSI des CAC 40. Des outils accessibles et abordables mettent aujourd'hui la puissance de l'analyse à la portée de toutes les PME.</p>

<h2>Par où commencer : les 4 niveaux d'analyse</h2>
<h3>Niveau 1 — Descriptif : Que s'est-il passé ?</h3>
<p>C'est le premier niveau : comprendre ce qui s'est produit. Dashboards de ventes, rapports de performance, suivi des KPI. La plupart des entreprises sont à ce niveau.</p>

<h3>Niveau 2 — Diagnostic : Pourquoi cela s'est-il passé ?</h3>
<p>Aller au-delà du "quoi" pour comprendre le "pourquoi". Analyse des corrélations, segmentation, comparaisons. C'est ici que la valeur commence à se créer réellement.</p>

<h3>Niveau 3 — Prédictif : Que va-t-il probablement se passer ?</h3>
<p>Utiliser les données historiques pour anticiper les tendances futures. Prévisions de ventes, scoring clients, détection des risques de churn. Les outils IA rendent ce niveau accessible sans équipe de data scientists.</p>

<h3>Niveau 4 — Prescriptif : Que devons-nous faire ?</h3>
<p>Le niveau ultime : l'analyse recommande des actions concrètes. Les algorithmes d'optimisation prix, les recommandations de cross-selling automatisées ou l'optimisation dynamique des stocks appartiennent à cette catégorie.</p>

<h2>Les outils à connaître en 2026</h2>
<p>Pour commencer simplement : Google Analytics 4, Google Looker Studio et un bon CRM (HubSpot, Salesforce). Pour aller plus loin : Power BI, Tableau, Metabase (open-source). Pour l'IA : les connecteurs d'analyse prédictive intégrés dans la plupart de ces outils désormais.</p>
`,

  'personal-branding-linkedin': `
<h2>LinkedIn en 2026 : le premier réseau professionnel mondial</h2>
<p>Avec plus d'un milliard de membres actifs et une audience ultra-ciblée de professionnels et décideurs, LinkedIn est devenu incontournable pour quiconque veut construire son autorité professionnelle. Et pourtant, 90% des utilisateurs se contentent de consommer du contenu sans jamais en créer.</p>
<p>C'est précisément là que réside l'opportunité. Ceux qui osent publier régulièrement capturent une visibilité disproportionnée par rapport à leur effort.</p>

<h2>Les 6 piliers d'un personal branding LinkedIn efficace</h2>
<h3>1. Un profil qui convertit</h3>
<p>Votre profil est votre page de vente. Photo professionnelle, titre percutant (pas juste votre poste), summary qui raconte votre histoire et explique la valeur que vous apportez. 90% des profils LinkedIn sont génériques et interchangeables — le vôtre doit se distinguer dès la première seconde.</p>

<h3>2. Une niche claire</h3>
<p>Le personal branding fonctionne sur la spécialisation. "Expert en marketing digital" est trop vague. "Je forme les dirigeants de PME à générer des leads qualifiés avec LinkedIn" est précis, mémorable et actionnable.</p>

<h3>3. La régularité avant tout</h3>
<p>L'algorithme LinkedIn récompense la régularité. 3 publications par semaine pendant 6 mois battent 20 publications en un mois puis le silence. Créez un calendrier éditorial et tenez-vous-y.</p>

<h3>4. Des formats variés</h3>
<p>LinkedIn favorise différents formats à différents moments : posts texte pour les insights, carrousels pour les how-to, vidéos pour le storytelling, sondages pour l'engagement. Variez pour toucher différents segments de votre audience.</p>

<h3>5. L'engagement authentique</h3>
<p>Commenter les publications des autres avec des avis construits est souvent plus efficace que de publier vous-même. Un commentaire de qualité sur un post viral peut vous apporter des centaines de vues et des dizaines de connexions qualifiées.</p>

<h3>6. La mesure et l'optimisation</h3>
<p>Utilisez les analytics LinkedIn Creator pour identifier vos contenus les plus performants. Doublez sur ce qui fonctionne, abandonnez ce qui ne fonctionne pas. Le personal branding est une discipline empirique.</p>

<h2>En 90 jours : de 0 à une audience engagée</h2>
<p>Si vous partez de zéro, voici ce que vous pouvez réalistement atteindre en 90 jours avec un investissement de 2 à 3 heures par semaine : 500 à 2000 nouveaux abonnés qualifiés, plusieurs dizaines de prises de contact entrantes et une visibilité significative dans votre secteur. C'est modeste, mais c'est concret — et c'est exponentiel.</p>
`,
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const MOCK_COMMENTS: Record<string, MockComment[]> = {
  '1': [
    {
      id: 'c1-1',
      author: 'Sophie Renard',
      initials: 'SR',
      avatarColor: '#7c3aed',
      content: "Excellent article ! La partie sur l'autorité thématique m'a particulièrement parlé. Nous avons implémenté une stratégie similaire il y a 6 mois et les résultats sont impressionnants — notre trafic organique a augmenté de 340%. La clé selon moi est vraiment la patience : il faut accepter de ne rien voir pendant les 3 premiers mois.",
      published_at: '2026-07-01T14:23:00Z',
      likes: 47,
      replies: [
        {
          id: 'c1-1-r1',
          author: 'Marie Dupont',
          initials: 'MD',
          avatarColor: '#2563eb',
          content: "Merci Sophie ! 340% c'est un excellent résultat. Avez-vous aussi travaillé sur le maillage interne entre vos articles ? C'est souvent l'étape oubliée qui démultiplie les résultats.",
          published_at: '2026-07-01T15:45:00Z',
          likes: 23,
        },
        {
          id: 'c1-1-r2',
          author: 'Jean-Paul Vidal',
          initials: 'JV',
          avatarColor: '#059669',
          content: "Sophie, quelle thématique avez-vous choisie comme pilier principal ? Je cherche à faire le même exercice pour notre secteur (B2B SaaS).",
          published_at: '2026-07-01T16:30:00Z',
          likes: 8,
        },
      ],
    },
    {
      id: 'c1-2',
      author: 'Marc Beauchamp',
      initials: 'MB',
      avatarColor: '#dc2626',
      content: "La structure en 3 piliers (autorité, distribution, mesure) est vraiment actionnable. Je vais l'utiliser pour refondre notre stratégie Q3. Une question : comment recommandez-vous de gérer le contenu evergreen vs. l'actualité dans la même stratégie ?",
      published_at: '2026-07-01T16:12:00Z',
      likes: 31,
      replies: [
        {
          id: 'c1-2-r1',
          author: 'Marie Dupont',
          initials: 'MD',
          avatarColor: '#2563eb',
          content: "Bonne question Marc ! Notre recommandation : 70% evergreen + 30% actualité. L'evergreen construit l'autorité dans la durée, l'actualité génère des pics de trafic. Les deux se nourrissent mutuellement.",
          published_at: '2026-07-01T17:00:00Z',
          likes: 19,
        },
      ],
    },
    {
      id: 'c1-3',
      author: 'Amélie Fontaine',
      initials: 'AF',
      avatarColor: '#d97706',
      content: "Le point sur les vanity metrics touche juste. Notre direction nous demande encore du trafic brut alors qu'on devrait mesurer les conversions. Comment convaincre un dirigeant peu familier avec le marketing digital de changer ses KPIs ?",
      published_at: '2026-07-02T08:44:00Z',
      likes: 15,
      replies: [],
    },
    {
      id: 'c1-4',
      author: 'Romain Chevalier',
      initials: 'RC',
      avatarColor: '#0284c7',
      content: "Super article, vraiment complet. Je partage avec mon équipe marketing. Une chose que j'ajouterais : l'importance des interviews d'experts dans la stratégie de contenu. Un article qui cite 5 professionnels reconnus génère en moyenne 3x plus de partages que celui qui ne cite que des études.",
      published_at: '2026-07-02T10:15:00Z',
      likes: 28,
      replies: [],
    },
  ],

  '2': [
    {
      id: 'c2-1',
      author: 'Claire Dupuis',
      initials: 'CD',
      avatarColor: '#0891b2',
      content: "Très bon panorama ! Nous avons adopté Make + Claude pour automatiser notre création de contenu LinkedIn. Le gain de temps est réel : on est passé de 4h à 45min par semaine. La qualité reste bonne à condition de toujours relire.",
      published_at: '2026-06-28T11:30:00Z',
      likes: 38,
      replies: [
        {
          id: 'c2-1-r1',
          author: 'Thomas Laurent',
          initials: 'TL',
          avatarColor: '#7c3aed',
          content: "Excellent retour d'expérience Claire ! 45min vs 4h c'est exactement le type de gain que l'IA permet. La relecture humaine est effectivement non-négociable, surtout pour le ton et les nuances.",
          published_at: '2026-06-28T14:00:00Z',
          likes: 15,
        },
      ],
    },
    {
      id: 'c2-2',
      author: 'Patrick Lemaire',
      initials: 'PL',
      avatarColor: '#16a34a',
      content: "Le point sur la confidentialité des données est crucial et souvent ignoré. Dans mon secteur (santé), on ne peut pas utiliser n'importe quel outil IA avec des données patients. Il faudrait un article dédié sur les solutions IA conformes RGPD/HDS.",
      published_at: '2026-06-29T09:20:00Z',
      likes: 52,
      replies: [],
    },
  ],

  '3': [
    {
      id: 'c3-1',
      author: 'Nathalie Morin',
      initials: 'NM',
      avatarColor: '#b45309',
      content: "La compétence 4 (décision sous incertitude) est celle qui m'a le plus coûté à développer. J'ai longtemps attendu d'avoir 100% de l'information avant de décider — ce qui me paralysait. Le framework 70% que vous citez a changé ma façon de travailler.",
      published_at: '2026-06-25T13:45:00Z',
      likes: 41,
      replies: [
        {
          id: 'c3-1-r1',
          author: 'Sophie Martin',
          initials: 'SM',
          avatarColor: '#2563eb',
          content: "C'est probablement la compétence la plus difficile à acquérir Nathalie, parce qu'elle va à l'encontre de notre instinct de perfection. Avec la pratique, on développe des heuristiques qui rendent ça plus naturel.",
          published_at: '2026-06-25T15:00:00Z',
          likes: 22,
        },
      ],
    },
    {
      id: 'c3-2',
      author: 'Bertrand Lacroix',
      initials: 'BL',
      avatarColor: '#9333ea',
      content: "Article très pertinent. Je dirais que la 8ème compétence manquante est la capacité à créer de la sécurité psychologique dans l'équipe — condition sine qua non pour que les 7 autres compétences puissent s'exprimer collectivement.",
      published_at: '2026-06-26T08:00:00Z',
      likes: 34,
      replies: [],
    },
  ],

  '4': [
    {
      id: 'c4-1',
      author: 'Élodie Garnier',
      initials: 'EG',
      avatarColor: '#0369a1',
      content: "La structure Problem → Solution → Marché → Produit est exactement ce que j'aurais voulu avoir avant mon premier pitch. J'ai fait l'erreur de commencer par le produit — les investisseurs ont décroché en 2 minutes.",
      published_at: '2026-06-22T12:00:00Z',
      likes: 29,
      replies: [],
    },
  ],

  '5': [
    {
      id: 'c5-1',
      author: 'Vincent Perrin',
      initials: 'VP',
      avatarColor: '#b91c1c',
      content: "L'impact des AI Overviews de Google sur le trafic organique est réel et massif. Nous avons perdu 25% de trafic sur nos pages FAQ en 6 mois à cause des réponses directes dans les SERP. Il faut vraiment repenser sa stratégie SEO pour l'ère IA.",
      published_at: '2026-06-19T10:30:00Z',
      likes: 44,
      replies: [
        {
          id: 'c5-1-r1',
          author: 'Emma Rousseau',
          initials: 'ER',
          avatarColor: '#2563eb',
          content: "Vous avez raison Vincent. La contre-stratégie est de créer du contenu suffisamment pointu et spécialisé pour que les IA génériques ne puissent pas le synthétiser correctement. Les experts de niche s'en sortent mieux.",
          published_at: '2026-06-19T14:00:00Z',
          likes: 31,
        },
      ],
    },
  ],

  '6': [
    {
      id: 'c6-1',
      author: 'Sandrine Blanc',
      initials: 'SB',
      avatarColor: '#047857',
      content: "La culture remote réussie repose surtout sur la confiance, et la confiance se construit sur la transparence. Chez nous, on publie toutes les semaines un rapport d'avancement accessible à toute l'équipe. Ça a complètement changé la dynamique.",
      published_at: '2026-06-16T09:00:00Z',
      likes: 37,
      replies: [],
    },
  ],

  '7': [
    {
      id: 'c7-1',
      author: 'Damien Faure',
      initials: 'DF',
      avatarColor: '#4f46e5',
      content: "La distinction en 4 niveaux est très claire. La plupart des PME que j'accompagne sont bloquées au niveau 1 (descriptif) parce qu'elles n'ont pas encore de source de données fiable et centralisée. C'est souvent le vrai premier obstacle.",
      published_at: '2026-06-13T11:00:00Z',
      likes: 26,
      replies: [],
    },
  ],

  '8': [
    {
      id: 'c8-1',
      author: 'Laure Mercier',
      initials: 'LM',
      avatarColor: '#be185d',
      content: "Je publie sur LinkedIn depuis 8 mois et je confirme : la régularité est la clé. Les premières semaines sont décourageantes (peu de vues, peu de réactions) mais à partir du 3ème mois quelque chose se passe. Mon audience a triplé en 2 mois et je reçois maintenant des propositions de collaboration.",
      published_at: '2026-06-10T12:30:00Z',
      likes: 58,
      replies: [
        {
          id: 'c8-1-r1',
          author: 'Julie Fontaine',
          initials: 'JF',
          avatarColor: '#2563eb',
          content: "Merci Laure pour ce retour d'expérience authentique ! Le 3ème mois est effectivement souvent le déclic. L'algorithme vous 'reconnaît' comme créateur régulier et commence à vous distribuer plus largement.",
          published_at: '2026-06-10T14:00:00Z',
          likes: 33,
        },
      ],
    },
    {
      id: 'c8-2',
      author: 'Tristan Garau',
      initials: 'TG',
      avatarColor: '#0284c7',
      content: "Excellent article mais attention : le personal branding n'est pas pour tout le monde. Certains secteurs (droit, finance réglementée) ont des contraintes de communication strictes. Vérifiez toujours les règles de votre ordre ou de votre employeur avant de publier.",
      published_at: '2026-06-11T08:45:00Z',
      likes: 19,
      replies: [],
    },
  ],
};
