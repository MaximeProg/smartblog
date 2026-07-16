import type { SectionDef, PageDef } from './types';

export const globalSections: SectionDef[] = [
  {
    id: 'global.identity',
    label: 'Identité',
    icon: 'Globe',
    fields: [
      { key: 'blog.name', type: 'text', label: 'Nom du blog' },
      { key: 'blog.description', type: 'textarea', label: 'Description' },
      { key: 'blog.logo_url', type: 'image', label: 'Logo', ratio: '1/1' },
      { key: 'blog.favicon_url', type: 'image', label: 'Favicon', ratio: '1/1' },
      { key: 'blog.cover_image_url', type: 'image', label: 'Image de couverture', ratio: '16/9' },
    ],
  },
  {
    id: 'global.design',
    label: 'Design',
    icon: 'Palette',
    fields: [
      { key: 'blog.primary_color', type: 'color', label: 'Couleur principale' },
      {
        key: 'blog.font_family',
        type: 'select',
        label: 'Police',
        options: [
          { value: 'Inter', label: 'Inter (Sans-serif)' },
          { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
          { value: 'Lora', label: 'Lora (Serif)' },
          { value: 'Merriweather', label: 'Merriweather (Serif)' },
          { value: 'Roboto', label: 'Roboto (Sans-serif)' },
          { value: 'Source Sans Pro', label: 'Source Sans Pro' },
          { value: 'Georgia', label: 'Georgia (Serif)' },
        ],
      },
    ],
  },
  {
    id: 'global.social',
    label: 'Réseaux sociaux',
    icon: 'Share2',
    fields: [
      { key: 'blog.social_links', type: 'socials', label: 'Liens sociaux' },
    ],
  },
  {
    id: 'header',
    label: 'En-tête',
    icon: 'PanelTop',
    fields: [
      { key: 'template_config.header.topBar.enabled', type: 'boolean', label: 'Barre supérieure' },
      { key: 'template_config.header.topBar.showDate', type: 'boolean', label: 'Afficher la date' },
      { key: 'template_config.header.topBar.showSocial', type: 'boolean', label: 'Icônes sociales' },
      { key: 'template_config.header.topBar.showNewsletter', type: 'boolean', label: 'Bouton newsletter' },
      { key: 'template_config.header.topBar.showRss', type: 'boolean', label: 'Lien RSS' },
      { key: 'template_config.header.subscribe.enabled', type: 'boolean', label: "Bouton S'abonner" },
      { key: 'template_config.header.subscribe.label', type: 'text', label: 'Libellé du bouton' },
      { key: 'template_config.header.nav.links', type: 'navlinks', label: 'Liens de navigation' },
    ],
  },
  {
    id: 'footer',
    label: 'Pied de page',
    icon: 'PanelBottom',
    fields: [
      { key: 'template_config.footer.description', type: 'textarea', label: 'Description' },
      { key: 'template_config.footer.copyrightText', type: 'text', label: 'Texte de copyright' },
      { key: 'template_config.footer.showCategories', type: 'boolean', label: 'Afficher les catégories' },
      { key: 'template_config.footer.showSocialLinks', type: 'boolean', label: 'Icônes sociales' },
      { key: 'template_config.footer.showNewsletterMini', type: 'boolean', label: 'Newsletter miniature' },
      { key: 'template_config.footer.newsletterMiniText', type: 'text', label: 'Texte newsletter' },
      { key: 'template_config.footer.navLinks', type: 'navlinks', label: 'Liens de navigation' },
      { key: 'template_config.footer.showPoweredBy', type: 'boolean', label: 'Afficher "Powered by"' },
    ],
  },
];

export const basePages: PageDef[] = [
  {
    id: 'home',
    label: 'Accueil',
    icon: 'Home',
    canvasPath: '/',
    sections: [
      {
        id: 'home.hero',
        label: 'Héro',
        icon: 'Layout',
        fields: [
          { key: 'template_config.home.hero.enabled', type: 'boolean', label: 'Activer la section héro' },
          { key: 'template_config.home.hero.sectionTitle', type: 'text', label: 'Titre de section', inplace: true },
          { key: 'template_config.content.heroHeadline', type: 'text', label: 'Titre principal', inplace: true },
          { key: 'template_config.content.heroSubheadline', type: 'textarea', label: 'Sous-titre', inplace: true },
          { key: 'template_config.content.heroCta', type: 'text', label: 'Bouton CTA', inplace: true },
        ],
      },
      {
        id: 'home.categories',
        label: 'Bandeau catégories',
        icon: 'Tag',
        fields: [
          { key: 'template_config.home.categoriesStrip.enabled', type: 'boolean', label: 'Afficher le bandeau' },
          { key: 'template_config.home.categoriesStrip.label', type: 'text', label: 'Libellé', inplace: true },
        ],
      },
      {
        id: 'home.latest',
        label: 'Derniers articles',
        icon: 'FileText',
        fields: [
          { key: 'template_config.home.latest.enabled', type: 'boolean', label: 'Afficher la section' },
          { key: 'template_config.home.latest.sectionTitle', type: 'text', label: 'Titre de section', inplace: true },
          { key: 'template_config.content.latestSectionTitle', type: 'text', label: 'Titre alternatif', inplace: true },
        ],
      },
      {
        id: 'home.newsletter',
        label: 'Newsletter',
        icon: 'Mail',
        fields: [
          { key: 'template_config.home.newsletter.enabled', type: 'boolean', label: 'Afficher' },
          { key: 'template_config.home.newsletter.title', type: 'text', label: 'Titre', inplace: true },
          { key: 'template_config.home.newsletter.description', type: 'textarea', label: 'Description', inplace: true },
          { key: 'template_config.home.newsletter.buttonLabel', type: 'text', label: 'Libellé bouton', inplace: true },
          { key: 'template_config.home.newsletter.placeholder', type: 'text', label: 'Placeholder email', inplace: true },
          { key: 'template_config.home.newsletter.disclaimer', type: 'text', label: 'Disclaimer', inplace: true },
        ],
      },
      {
        id: 'home.sidebar',
        label: 'Sidebar',
        icon: 'LayoutList',
        fields: [
          { key: 'template_config.home.sidebar.popularArticles', type: 'boolean', label: 'Articles populaires' },
          { key: 'template_config.home.sidebar.popularTitle', type: 'text', label: 'Titre articles populaires' },
          { key: 'template_config.home.sidebar.categories', type: 'boolean', label: 'Catégories' },
          { key: 'template_config.home.sidebar.categoriesTitle', type: 'text', label: 'Titre catégories' },
          { key: 'template_config.home.sidebar.tags', type: 'boolean', label: 'Tags' },
          { key: 'template_config.home.sidebar.tagsTitle', type: 'text', label: 'Titre tags' },
          { key: 'template_config.home.sidebar.newsletterMini', type: 'boolean', label: 'Newsletter mini' },
        ],
      },
    ],
  },
  {
    id: 'about',
    label: 'À propos',
    icon: 'Info',
    canvasPath: '/about',
    sections: [
      {
        id: 'about.hero',
        label: 'Héro',
        icon: 'Layout',
        fields: [
          { key: 'template_config.about.heroTitle', type: 'text', label: 'Titre principal', inplace: true },
          { key: 'template_config.about.heroSubtitle', type: 'text', label: 'Sous-titre', inplace: true },
          { key: 'template_config.about.heroCoverUrl', type: 'image', label: 'Image de fond', ratio: '16/9' },
        ],
      },
      {
        id: 'about.mission',
        label: 'Mission',
        icon: 'Target',
        fields: [
          { key: 'template_config.about.missionTitle', type: 'text', label: 'Titre', inplace: true },
          { key: 'template_config.about.missionText', type: 'richtext', label: 'Texte' },
          { key: 'template_config.about.missionImageUrl', type: 'image', label: 'Illustration', ratio: '4/3' },
        ],
      },
      {
        id: 'about.values',
        label: 'Valeurs',
        icon: 'Star',
        fields: [
          { key: 'template_config.about.valuesTitle', type: 'text', label: 'Titre de la section', inplace: true },
          {
            key: 'template_config.about.values',
            type: 'array',
            label: 'Valeurs',
            itemFields: [
              { key: 'emoji', type: 'text', label: 'Emoji' },
              { key: 'title', type: 'text', label: 'Titre' },
              { key: 'description', type: 'textarea', label: 'Description' },
            ],
          },
        ],
      },
      {
        id: 'about.team',
        label: 'Équipe',
        icon: 'Users',
        fields: [
          { key: 'template_config.about.teamTitle', type: 'text', label: 'Titre de la section', inplace: true },
          {
            key: 'template_config.about.team',
            type: 'array',
            label: 'Membres',
            itemFields: [
              { key: 'name', type: 'text', label: 'Nom' },
              { key: 'role', type: 'text', label: 'Rôle' },
              { key: 'bio', type: 'textarea', label: 'Biographie' },
              { key: 'avatar', type: 'image', label: 'Avatar', ratio: '1/1' },
            ],
          },
        ],
      },
      {
        id: 'about.cta',
        label: "Appel à l'action",
        icon: 'ArrowRight',
        fields: [
          { key: 'template_config.about.ctaTitle', type: 'text', label: 'Titre', inplace: true },
          { key: 'template_config.about.ctaButtonLabel', type: 'text', label: 'Libellé bouton', inplace: true },
          { key: 'template_config.about.ctaButtonUrl', type: 'text', label: 'URL du bouton' },
        ],
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'Phone',
    canvasPath: '/contact',
    sections: [
      {
        id: 'contact.hero',
        label: 'Héro',
        icon: 'Layout',
        fields: [
          { key: 'template_config.contact.heroTitle', type: 'text', label: 'Titre', inplace: true },
          { key: 'template_config.contact.heroSubtitle', type: 'text', label: 'Sous-titre', inplace: true },
        ],
      },
      {
        id: 'contact.info',
        label: 'Informations',
        icon: 'MapPin',
        fields: [
          { key: 'template_config.contact.email', type: 'text', label: 'Email' },
          { key: 'template_config.contact.address', type: 'text', label: 'Adresse' },
          { key: 'template_config.contact.phone', type: 'text', label: 'Téléphone' },
        ],
      },
      {
        id: 'contact.form',
        label: 'Formulaire',
        icon: 'Mail',
        fields: [
          { key: 'template_config.contact.formTitle', type: 'text', label: 'Titre du formulaire', inplace: true },
          { key: 'template_config.contact.formSubtitle', type: 'text', label: 'Sous-titre', inplace: true },
        ],
      },
    ],
  },
  {
    id: 'article',
    label: 'Article',
    icon: 'FileText',
    canvasPath: '/articles',
    sections: [
      {
        id: 'article.reading',
        label: 'Lecture',
        icon: 'BookOpen',
        fields: [
          { key: 'template_config.article.progressBar.enabled', type: 'boolean', label: 'Barre de progression' },
          { key: 'template_config.article.toc.enabled', type: 'boolean', label: 'Table des matières' },
          { key: 'template_config.article.toc.title', type: 'text', label: 'Titre de la TdM' },
          { key: 'template_config.article.toc.minHeadings', type: 'number', label: 'Titres min. pour afficher', min: 1, max: 10 },
        ],
      },
      {
        id: 'article.engagement',
        label: 'Engagement',
        icon: 'Heart',
        fields: [
          { key: 'template_config.article.social.enabled', type: 'boolean', label: 'Partage social' },
          { key: 'template_config.article.social.title', type: 'text', label: 'Titre "Partager"' },
          { key: 'template_config.article.authorBio.enabled', type: 'boolean', label: "Bio de l'auteur" },
          { key: 'template_config.article.authorBio.title', type: 'text', label: 'Titre bio' },
          { key: 'template_config.article.comments.enabled', type: 'boolean', label: 'Commentaires' },
        ],
      },
      {
        id: 'article.related',
        label: 'Articles similaires',
        icon: 'Layers',
        fields: [
          { key: 'template_config.article.relatedArticles.enabled', type: 'boolean', label: 'Afficher' },
          { key: 'template_config.article.relatedArticles.title', type: 'text', label: 'Titre de la section' },
          { key: 'template_config.article.relatedArticles.count', type: 'number', label: "Nombre d'articles", min: 1, max: 12 },
        ],
      },
    ],
  },
];
