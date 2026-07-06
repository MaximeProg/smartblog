# NexusBlog SaaS — Audit Fonctionnel Complet
**Cahier des charges v2.1 — État au 2026-07-06**

---

## Résumé global

| Statut | Fonctionnalités |
|--------|----------------|
| ✅ Fait | ~48 |
| ❌ À faire | ~190 |
| **Avancement** | **~20%** |

---

## M1 — Authentification & Identités

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Google Sign-In via Firebase |
| ✅ | Email / mot de passe via Firebase |
| ✅ | JWT Access Token (15 min) + Refresh Token rotatif |
| ✅ | RBAC : SUPER_ADMIN, TENANT_ADMIN, EDITOR, AUTHOR, VIEWER |
| ✅ | Onboarding wizard 4 étapes (template → config → preview → succès) |
| ❌ | 2FA TOTP via Google Authenticator (obligatoire Enterprise) |
| ❌ | Email de bienvenue automatique après inscription |
| ❌ | Checklist post-inscription (connecter domaine, inviter auteur, publier premier article, réseau social) |
| ❌ | Révocation immédiate tokens Redis lors suspension / changement mot de passe |

---

## M2 — Gestion des Tenants

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Isolation RLS PostgreSQL + middleware applicatif |
| ✅ | Sous-domaine {slug}.nexusblog.io (unique, immuable) |
| ✅ | Paramètres généraux : nom, description, logo, favicon, langue, fuseau horaire |
| ✅ | Paramètres SEO globaux (title template, Google Search Console) |
| ❌ | **Custom domains** : saisie domaine → CNAME → vérification auto → SSL Let's Encrypt |
| ❌ | Renouvellement automatique certificat SSL |
| ❌ | Redirection HTTP → HTTPS sur domaines personnalisés |
| ✅ | **Collaborateurs** : invitation par email avec rôle assigné (validité 48h) |
| ✅ | Modification / révocation de rôle en temps réel |
| ❌ | Historique des accès par membre |
| ❌ | Période d'essai 14 jours sur plan Pro (carte requise, pas de débit) |
| ❌ | Downgrade vers Starter à expiration du plan payant |
| ❌ | Suppression tenant : 30 jours grâce + export données + suppression définitive (RG-009) |
| ✅ | Intégrations GA4, Matomo, Facebook Pixel dans les paramètres |

---

## M3 — Types de Contenu

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Article texte riche (M3.1) |
| ✅ | Sélecteur de type dans l'éditeur (article/photo/video/audio/podcast/mixed) |
| ✅ | Champs spécifiques : URL vidéo (VIDEO), URL audio (AUDIO), numéro + saison (PODCAST) |
| ✅ | Badge type dans la liste des articles |
| ❌ | Photo / Galerie (M3.2) : galerie multi-images avec légendes |
| ❌ | Vidéo embed (M3.3) : YouTube, Vimeo, TikTok, Instagram, Facebook, DailyMotion |
| ❌ | Player audio avancé (progression + vitesse + chapitres) |
| ❌ | Transcription automatique IA des fichiers audio |
| ❌ | Flux RSS podcast (Apple Podcasts, Spotify, Google Podcasts) |
| ❌ | Page dédiée série podcast |
| ❌ | Rendu public des types : player vidéo/audio dans les 6 thèmes |

---

## M4 — Éditeur de Contenu Riche

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Éditeur Tiptap/ProseMirror de base (WYSIWYG) |
| ✅ | Titres H1-H4, paragraphes, gras, italique, souligné, barré |
| ✅ | Listes à puces ordonnées / non ordonnées |
| ✅ | Upload image via Cloudinary (depuis la sidebar article) |
| ✅ | Liens hypertextes, séparateurs horizontaux |
| ❌ | Autosave automatique toutes les 30 secondes |
| ❌ | Historique des versions : 30 dernières, comparaison côte à côte, restauration 1 clic |
| ❌ | Mode Focus : plein écran sans distractions |
| ❌ | Mode Markdown avec prévisualisation splitée |
| ❌ | Mode Drag & Drop de blocs (réorganisation par glisser-déposer) |
| ❌ | Tableaux : création inline, ajout/suppression lignes/colonnes |
| ❌ | To-do list avec cases à cocher |
| ❌ | Blocs de code avec coloration syntaxique (highlight.js, 50+ langages) + copie 1 clic |
| ❌ | Callouts : info / avertissement / danger / succès |
| ❌ | Boutons Call-to-Action (texte + URL + style configurable) |
| ❌ | Galerie d'images inline (grille configurable) |
| ❌ | Upload vidéo MP4/WebM dans l'éditeur avec player intégré |
| ❌ | Upload audio MP3/WAV dans l'éditeur avec player intégré |
| ❌ | Embeds vidéo par URL (YouTube, Vimeo, TikTok, Instagram, Facebook, DailyMotion) |
| ❌ | Iframes intégrées (tweets, posts LinkedIn) |
| ❌ | Picker émoji avec recherche |
| ❌ | Mentions @auteur |
| ❌ | Couleur de texte (palette + hex) + couleur d'arrière-plan du bloc |
| ❌ | Police de caractères (10 Google Fonts), taille 12px–72px |
| ❌ | Compteur mots / caractères / temps de lecture estimé |
| ❌ | Prévisualisation desktop / tablet / mobile depuis l'éditeur |
| ❌ | Commandes IA via `/` : complétion, reformulation, résumé, correction grammaire, améliorer style, introduction, conclusion, titre SEO, analyse SEO, plagiat, métadonnées |

---

## M5 — Métadonnées & Workflow de Publication

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Métadonnées : titre, slug auto, extrait, image à la une, catégorie, tags, SEO |
| ✅ | Open Graph : titre, description, image |
| ✅ | Statuts DRAFT → PUBLISHED (direct pour TENANT_ADMIN et EDITOR) |
| ✅ | Visibilité : public / privé depuis la sidebar article |
| ❌ | Statut IN_REVIEW : soumission par l'AUTHOR pour approbation |
| ❌ | Statut APPROVED : validé par EDITOR/ADMIN, prêt à publier |
| ❌ | Statut REJECTED : retour en DRAFT avec commentaire de refus visible par l'auteur |
| ❌ | Statut SCHEDULED → PUBLISHED : publication automatique à date/heure précise |
| ❌ | Statuts UNPUBLISHED et ARCHIVED |
| ❌ | File d'approbation : EDITOR voit les articles soumis en IN_REVIEW |
| ❌ | Journal d'approbation : qui a approuvé/refusé, quand, commentaire optionnel |
| ❌ | Notifications in-app + email aux Éditeurs lors soumission article |
| ❌ | Notification auteur après publication effective |
| ❌ | Fuseau horaire du tenant respecté pour la programmation |
| ❌ | JSON-LD automatique : Article, BreadcrumbList, Person, Organization, AudioObject, VideoObject |
| ❌ | Canonical URL (obligatoire avec domaine personnalisé — RG-011) |
| ❌ | Robots noindex configurable par article |

---

## M6 — Catégories & Tags

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Catégories : créer, éditer, supprimer, slug auto, description |
| ✅ | Tags : créer, gérer, assigner aux articles |
| ✅ | Pages de listing publiques par catégorie et par tag |
| ❌ | Hiérarchie catégories 2 niveaux (parent / enfant) |
| ❌ | Image de couverture pour les catégories |
| ❌ | Ordre configurable par drag & drop |
| ❌ | Protection suppression si articles publiés associés |
| ❌ | IA : suggestion automatique de catégorie basée sur le contenu |
| ❌ | IA : suggestion de tags à partir du contenu (jusqu'à 10 tags) |
| ❌ | Fusion, renommage de tags depuis l'administration |
| ❌ | Nuage de tags disponible comme widget sidebar |

---

## M7 — Gestion des Médias

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Page Médiathèque (galerie UI avec filtres type/date) |
| ✅ | Upload image via Cloudinary (intégration basique) |
| ❌ | Upload vidéo : MP4/WebM/MOV, max 500 MB, stockage Cloudinary |
| ❌ | Upload audio : MP3/WAV/OGG/M4A/FLAC, max 100 MB |
| ❌ | Upload PDF : max 50 MB (attachements articles) |
| ❌ | Pipeline auto : compression intelligente, srcset (400/800/1200/1600px), WebP/AVIF |
| ❌ | Génération thumbnail automatique pour les vidéos |
| ❌ | Alt text automatique IA pour chaque image (modifiable) |
| ❌ | Tagging IA automatique des images (objets, scènes, contenu) |
| ❌ | Scan sécurité upload : MIME type, magic bytes, anti-malware |
| ❌ | Transcodage vidéo multi-qualité : 360p / 720p / 1080p via Cloudinary |
| ❌ | Normalisation audio : volume + conversion MP3 320kbps |
| ❌ | Détection de droits IA : alerte si image potentiellement soumise à copyright |
| ❌ | Médiathèque : recherche par nom / alt text / tag IA |
| ❌ | Médiathèque : détails complets (dimensions, poids, format, URL, date) |
| ❌ | Avertissement suppression si media utilisé dans un article |

---

## M8 — Système de Commentaires

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Commentaires anonymes (prénom + email obligatoires) |
| ✅ | File de modération : approuver, refuser, marquer comme spam |
| ✅ | Suppression de commentaire |
| ✅ | Statistiques : total / pending / approved / rejected |
| ✅ | Filtres par statut + recherche |
| ❌ | Réponses imbriquées — 1 niveau de threading |
| ❌ | Upload image dans les commentaires (max 5 MB) |
| ❌ | Picker émoji dans les commentaires |
| ❌ | Formatage basique : gras, italique, lien |
| ❌ | Pipeline IA modération : score toxicité 0–100 (OpenAI Moderation API) |
| ❌ | Rejet automatique si score > 70 (RG-010 — non configurable) |
| ❌ | Score 31–70 : mise en file de modération manuelle avec raison IA visible |
| ❌ | Shadow ban (l'auteur croit publier, les autres ne voient pas) |
| ❌ | Bannissement par email ou IP (24h / 7j / permanent) |
| ❌ | Liste de blocage d'IP gérée dans l'admin |
| ❌ | Liste de mots-clés interdits personnalisable par tenant |
| ❌ | Bouton "Signaler" pour les lecteurs sur le blog public |
| ❌ | CAPTCHA automatique pour les IP suspectes |
| ❌ | Rate limiting : max 5 commentaires/heure par IP/compte |
| ❌ | Mode global : OPEN / MODERATED / CLOSED |
| ❌ | Override par article : activer/désactiver les commentaires |
| ❌ | Seuils de score IA ajustables par tenant |
| ❌ | Fermeture automatique après N jours de publication (configurable) |

---

## M9 — Newsletter & Abonnés

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Statistiques basiques : total abonnés, ce mois, cette semaine, désabonnements |
| ❌ | **Double opt-in obligatoire** — email de confirmation RGPD (RG-003) |
| ❌ | Widgets d'abonnement : inline article, popup, sidebar, footer, page dédiée |
| ❌ | Page de désabonnement depuis chaque email (lien footer) |
| ❌ | Consentement enregistré : timestamp, IP, source du formulaire |
| ❌ | Liste abonnés filtrable : statut (actif / désabonné / non confirmé), date, source |
| ❌ | Export CSV / Import CSV (double opt-in requis pour les importés) |
| ❌ | Segmentation par tags / listes (Business+) |
| ❌ | Métriques par abonné : taux ouverture moyen, dernier email, clics |
| ❌ | Éditeur de newsletter : email builder avec prévisualisation desktop / mobile |
| ❌ | Création depuis un article existant ou depuis zéro |
| ❌ | Test d'envoi à l'adresse admin |
| ❌ | Envoi immédiat ou programmé |
| ❌ | Gestion des bounces et désabonnements automatiques |
| ❌ | Statistiques campagne : taux envoi / ouverture / clics / désabonnements / bounces |
| ❌ | Newsletter payante : abonnement mensuel / annuel (Stripe — Business+) |

---

## M10 — Automatisation Réseaux Sociaux

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Page Réseaux Sociaux dans le dashboard (UI stub) |
| ❌ | OAuth : Facebook, Instagram, LinkedIn, X/Twitter, TikTok, Threads, Pinterest, Telegram, WhatsApp, YouTube Community, Discord, Reddit, Upscrolled |
| ❌ | Auto-post à la publication d'un article |
| ❌ | Délai de publication configurable par plateforme |
| ❌ | Template de caption personnalisable par plateforme |
| ❌ | Caption IA adaptée au ton de chaque plateforme |
| ❌ | Hashtags IA (5–15 par plateforme) |
| ❌ | Thumbnail IA aux bonnes dimensions par plateforme (DALL-E 3) |
| ❌ | UTM parameters automatiques sur tous les liens partagés |
| ❌ | Tableau de bord : impressions, clics, engagement par plateforme |
| ❌ | Comparaison inter-plateformes |
| ❌ | Meilleur moment de publication suggéré par IA |
| ❌ | Historique de toutes les publications (succès / échec / en attente) |
| ❌ | Retry automatique (3 tentatives à intervalles exponentiels) |
| ❌ | Notification admin si échec persistant |

---

## M11 — Système Multi-langues

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Détection langue navigateur (Accept-Language + géolocalisation IP) |
| ❌ | Redirection douce vers la langue détectée + cookie persistant |
| ❌ | Traduction automatique des articles (DeepL API / Google Translation) |
| ❌ | Cache Redis des traductions (éviter appels IA répétés) |
| ❌ | Traduction des commentaires à la lecture (bouton "Traduire ce commentaire") |
| ❌ | Traduction des métadonnées (meta title, og:description) |
| ❌ | Traduction de l'UI du blog public (menus, labels, boutons) |
| ❌ | Support RTL complet (arabe, hébreu, persan, ourdou) : layout miroir + typographie |
| ❌ | URLs multilingues SEO-friendly : /fr/, /ar/, /en/ |
| ❌ | Balises hreflang générées automatiquement |
| ❌ | Sitemap XML multilingue (1 entrée par langue) |
| ❌ | Switcher de langue : header / footer / flottant (configurable) |
| ❌ | Activation / désactivation des langues proposées par tenant |
| ❌ | Override de traduction manuelle possible |

---

## M12 — Système Publicitaire

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Formulaire de soumission d'annonces (email, entreprise, téléphone, image, texte, URL, budget) |
| ✅ | Liste des annonces avec statuts (All / Pending / Active / Paused / Rejected) |
| ✅ | Statistiques (impressions, clics, CTR) |
| ✅ | Pause / Resume d'une campagne (blog owner) |
| ❌ | **Interface SUPER_ADMIN** de validation / rejet des soumissions |
| ❌ | Intégration Google AdSense : script + blocs (header, sidebar, entre §, footer) |
| ❌ | Intégration Media.net |
| ❌ | Code publicitaire personnalisé (champ libre JS/iframe) |
| ❌ | Rotateur pondéré (Weighted Round Robin) : rotation toutes les 30s, pondération par budget |
| ❌ | Planification campagne : date début / date fin + expiration automatique |
| ❌ | Tracking impressions par bannière en temps réel |
| ❌ | Après approbation : lien de paiement Stripe / PayPal généré + envoyé à l'annonceur |
| ❌ | Webhook paiement → activation automatique campagne + facture PDF |
| ❌ | **Scan URL horaire** : Google Safe Browsing + VirusTotal + URLhaus + PhishTank (RG-002) |
| ❌ | Désactivation automatique immédiate si URL dangereuse (2+ sources négatives) |
| ❌ | Remboursement automatique si campagne désactivée avant la fin |
| ❌ | Notification email Tenant Admin + annonceur si désactivation sécurité |
| ❌ | Historique de sécurité : tous les scans horodatés (date, scores, décision) |
| ❌ | Rapport hebdomadaire de sécurité publicitaire envoyé au Tenant Admin |
| ❌ | Détection fraude : bots, IP farming, patterns d'affichage anormaux |
| ❌ | Budget minimum configurable par tenant (min plateforme : 10 USD, défaut : 50 USD) |
| ❌ | Lazy-loading des publicités (Core Web Vitals) |

---

## M13 — Analytics & Tableau de Bord

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Vues totales par période (7j / 30j / 90j) |
| ✅ | Sessions uniques (visiteurs) |
| ✅ | Durée moyenne de lecture |
| ✅ | Graphique vues par jour (bar chart interactif) |
| ✅ | Top 8 articles par vues |
| ✅ | Top 8 sources de trafic (referrers) |
| ❌ | Géolocalisation : pays, ville, langue du visiteur |
| ❌ | Appareils : desktop / mobile / tablet + navigateur + OS |
| ❌ | Taux de rebond |
| ❌ | Temps de lecture moyen par article |
| ❌ | Évolution sur périodes custom (1 an, custom range) |
| ❌ | Intégration Google Analytics 4 (ID configuré dans les paramètres) |
| ❌ | Intégration Matomo (self-hosted ou cloud) |
| ❌ | Heatmaps : zones les plus cliquées (intégration Microsoft Clarity — gratuit) |
| ❌ | Scroll depth : profondeur de défilement moyenne par article |
| ❌ | Taux de conversion newsletter (lecteur → abonné) |
| ❌ | Revenus par source (articles payants + newsletter + publicité) |
| ❌ | Export données brutes CSV |
| ❌ | Webhooks vers outils tiers (Segment, Mixpanel…) |
| ❌ | Analytics réseaux sociaux (par plateforme, comparaison cross-plateformes) |
| ❌ | Analytics publicitaires (impressions par bannière, revenus, CPM) |
| ❌ | Dashboard Super Admin : MRR / ARR / Churn / NPS / santé infra |

---

## M14 — SEO

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Meta title + meta description personnalisables par article |
| ✅ | Open Graph + Twitter Cards (titre, description, image) |
| ✅ | Page paramètres SEO globaux (title template) |
| ✅ | SEO par article dans la sidebar éditeur |
| ❌ | JSON-LD automatique : Article, BreadcrumbList, Person, Organization, AudioObject, VideoObject |
| ❌ | Canonical URL (obligatoire avec domaine personnalisé — RG-011) |
| ❌ | Balises hreflang (multilingue — dépend M11) |
| ❌ | Robots noindex par article |
| ❌ | Redirections 301 automatiques en cas de changement de slug |
| ❌ | Sitemap XML dynamique complet (articles + catégories + tags + pages + langues) |
| ❌ | robots.txt configurable par tenant |
| ❌ | Vérification Google Search Console via meta tag |
| ❌ | Score SEO IA : note globale + suggestions concrètes |
| ❌ | Suggestions de liens internes IA lors de la rédaction |
| ❌ | SSG pour pages stables (catégories, tags, pages statiques) |
| ❌ | ISR pour les articles populaires |
| ❌ | AMP (Accelerated Mobile Pages) — V2 |

---

## M15 — Recherche (Elasticsearch)

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Setup Elasticsearch (mapping, index : titre / contenu / extrait / tags / catégories) |
| ❌ | Indexation automatique à chaque publication / modification |
| ❌ | Barre de recherche sur le blog public (tous les thèmes) |
| ❌ | Barre de recherche dans le dashboard admin |
| ❌ | Résultats enrichis : titre, extrait, image, date, catégorie, type de contenu |
| ❌ | Highlighting des termes recherchés dans les extraits |
| ❌ | Filtres : type de contenu, catégorie, tag, date, langue |
| ❌ | Suggestions d'autocomplétion en temps réel |
| ❌ | Assistant de recherche IA (requêtes en langage naturel) |
| ❌ | Pages sans résultat avec suggestions d'articles similaires (similarité sémantique) |

---

## M16 — Notifications Push (FCM)

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Firebase Cloud Messaging : setup backend + frontend |
| ❌ | Prompt navigateur d'abonnement (non intrusif) |
| ❌ | Notification automatique à chaque nouvel article publié |
| ❌ | Notification manuelle par le Tenant Admin (message personnalisé) |
| ❌ | Segmentation : notifier uniquement les abonnés d'une catégorie spécifique |
| ❌ | Statistiques : taux d'ouverture, clics par notification |
| ❌ | Désabonnement depuis le navigateur ou le blog |

---

## M17 — Personnalisation du Blog

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | 5 templates actifs : editorial, magazine, creative, luminary, corporate |
| ✅ | Header / Footer entièrement personnalisables |
| ✅ | Personnalisation CSS custom, scripts, Google Fonts |
| ✅ | Logo, favicon, couleur primaire, couleur secondaire |
| ✅ | Page Widgets (UI de configuration) |
| ❌ | Dark mode toggle sur tous les thèmes du blog public (persistance localStorage) |
| ❌ | Respect de prefers-color-scheme pour le dark mode public |
| ❌ | Widgets : logique backend (config sauvegardée en BDD et lue par les thèmes) |
| ❌ | Widgets actifs sur le blog public : articles populaires, catégories, tags, newsletter, biographie auteur, réseaux sociaux |
| ❌ | Ordre des widgets configurable par drag & drop |
| ❌ | Nombre d'articles par page configurable (pagination) |
| ❌ | Page d'accueil : article vedette vs liste chronologique (configurable) |
| ❌ | Animations Framer Motion configurables (on/off) |
| ❌ | Transitions de page fluides |

---

## M18 — Expérience Lecteur

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Barre de progression de lecture en haut de chaque article |
| ❌ | Mode lecture : supprime nav, pub, sidebar — typographie optimisée |
| ❌ | Préférence lecteur : police + taille de texte personnalisable |
| ❌ | Lecture vocale TTS : bouton "Écouter", player pause / vitesse / avance |
| ❌ | Résumés IA : bloc "En résumé" auto (3–5 points clés) en haut d'article |
| ❌ | Résumé IA configurable par tenant (on/off, position) |
| ❌ | Marque-pages : lecteurs connectés sauvegardent des articles (en BDD) |
| ❌ | Page "Ma liste de lecture" dans le profil lecteur |
| ❌ | Recommandations IA en fin d'article (similarité sémantique + historique + popularité) |
| ❌ | PWA Offline : Service Worker cache les derniers articles lus |
| ❌ | Message indication article disponible hors ligne |
| ❌ | Page dédiée podcast (liste tous les épisodes) |
| ❌ | Player audio persistant (barre fixe en bas, actif lors de la navigation) |
| ❌ | Flux RSS podcast (Apple Podcasts, Spotify, Google Podcasts) |

---

## M19 — API REST Publique

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Génération d'API Keys par tenant (dans le dashboard) |
| ❌ | Rate limiting par clé selon le plan (Pro: 10k/mois, Business: 100k/mois) |
| ❌ | Documentation Swagger / OpenAPI à /api/v1/docs |
| ❌ | GET /articles, /articles/{slug}, /categories, /tags, /authors |
| ❌ | POST /articles, PUT /articles/{id} (Business+ uniquement) |
| ❌ | Webhooks entrants (Zapier, Make, etc.) |
| ❌ | CORS configurables par tenant |

---

## M20 — Facturation & Paiements (Stripe + PayPal)

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Checkout Stripe : upgrade plan Pro / Business depuis l'app |
| ❌ | PayPal : alternative pour abonnements SaaS |
| ❌ | Période d'essai 14 jours Pro (carte requise, pas de débit) |
| ❌ | Upgrade immédiat avec prorata / downgrade à la prochaine période |
| ❌ | Gestion des limites : blocage à 100% + CTA upgrade, email d'avertissement à 80% |
| ❌ | Factures PDF générées automatiquement à chaque paiement |
| ❌ | Informations de facturation modifiables (nom, société, adresse, TVA) |
| ❌ | Webhooks Stripe / PayPal (paiement réussi / échoué / remboursement) |
| ❌ | Articles payants : paywall par article, prix configurable (min 0.50 USD) |
| ❌ | Commission plateforme 5% sur articles payants |
| ❌ | Accès à vie après paiement article |
| ❌ | Newsletter payante : abonnement mensuel / annuel (Stripe Subscriptions) |
| ❌ | Paiement campagnes publicitaires (lien auto après approbation admin) |
| ❌ | Activation campagne pub au webhook de paiement confirmé |
| ❌ | Dashboard financier tenant : revenus, transactions, export CSV, info fiscale |
| ❌ | Dashboard financier Super Admin : MRR/ARR, commissions, churn, LTV |

---

## M21 — Intelligence Artificielle (IA Layer)

| Statut | Fonctionnalité |
|--------|----------------|
| ✅ | Page IA dans le dashboard (UI stub) |
| ❌ | Module central IA : routing vers le bon fournisseur selon la tâche |
| ❌ | Cache Redis des résultats IA |
| ❌ | Tracking consommation IA par tenant (limites de plan) |
| ❌ | Support clé API propre pour tenants Enterprise |
| ❌ | Complétion de rédaction contextuelle (GPT-4o / Claude) |
| ❌ | Reformulation : professionnel / décontracté / formel |
| ❌ | Résumé en N phrases |
| ❌ | Correction grammaire + style |
| ❌ | Génération introduction / conclusion à partir du titre |
| ❌ | Suggestions SEO + score IA par article |
| ❌ | Détection de plagiat (Copyscape API) |
| ❌ | Génération de métadonnées : meta title, meta description, tags |
| ❌ | Traduction de blocs dans l'éditeur |
| ❌ | Modération commentaires : score toxicité 0–100 (OpenAI Moderation API) |
| ❌ | Alt text automatique pour images (OpenAI Vision / Google Cloud Vision) |
| ❌ | Suggestion catégorie IA basée sur le contenu |
| ❌ | Suggestion de tags IA (jusqu'à 10) |
| ❌ | Bloc "En résumé" IA (3–5 points clés en haut d'article) |
| ❌ | Recommandations IA (embeddings, similarité sémantique) |
| ❌ | Caption + hashtags IA pour réseaux sociaux (par plateforme) |
| ❌ | Génération thumbnail IA (DALL-E 3 / Stability AI) |
| ❌ | Tagging IA automatique des images (objets, scènes, contenu) |
| ❌ | TTS lecture vocale (ElevenLabs / Google Cloud TTS) |
| ❌ | Transcription audio (OpenAI Whisper) |
| ❌ | Meilleur moment de publication suggéré par IA (analyse historique) |

---

## M22 — Administration Super Admin

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Interface /superadmin (accès exclusif SUPER_ADMIN) |
| ❌ | Liste complète des tenants : statut, plan, MRR, date création |
| ❌ | Accès en lecture auditée à tout tenant (chaque accès logué — RG-005) |
| ❌ | Suspension / réactivation / suppression forcée d'un tenant |
| ❌ | Validation / rejet des soumissions publicitaires de tous les blogs |
| ❌ | Gestion des signalements de contenu |
| ❌ | Logs d'audit immuables de toutes les actions |
| ❌ | Modification des plans et limites sans redéploiement |
| ❌ | Envoi d'emails broadcast vers tous les tenants |
| ❌ | Dashboard métriques plateforme : MRR, ARR, churn, NPS, santé infra |
| ❌ | Gestion des providers IA globaux (clés API plateforme) |
| ❌ | Remboursements et litiges en cours |

---

## Modules à zéro (priorité absolue)

| Module | Criticité |
|--------|-----------|
| M20 — Paiements (Stripe + PayPal) | 🔴 Bloquant commercial |
| M22 — Super Admin | 🔴 Bloquant opérationnel |
| M9 — Newsletter (envoi réel) | 🔴 Fonctionnalité core |
| M12 — Pub (scan URL + paiement) | 🔴 Fonctionnalité core |
| M11 — Multi-langues | 🟠 Différenciateur fort |
| M15 — Elasticsearch | 🟠 Différenciateur fort |
| M18 — Expérience Lecteur | 🟠 Valeur utilisateur |
| M16 — Push Notifications | 🟡 Engagement |
| M19 — API Publique | 🟡 Business+ / Enterprise |
