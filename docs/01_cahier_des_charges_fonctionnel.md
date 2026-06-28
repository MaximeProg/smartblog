# NexusBlog SaaS — Cahier des Charges Fonctionnel

**Version :** 2.1 — Édition Avancée  
**Date :** 2026-06-26  
**Statut :** Document de référence — validé  
**Remplace :** Version 2.0  

> **ÉDITION AVANCÉE** — Ce document décrit la version complète et sans compromis de NexusBlog SaaS.
> Toutes les fonctionnalités sont ciblées pour la V1. Il n'y a pas de MVP réduit — chaque module
> est conçu à son niveau de maturité maximale dès le départ.
> Le paiement en ligne est intégré en V1 (Stripe + PayPal).

---

## Table des matières

1. [Vision produit](#1-vision-produit)
2. [Objectifs stratégiques](#2-objectifs-stratégiques)
3. [Périmètre du projet](#3-périmètre-du-projet)
4. [Personas et parties prenantes](#4-personas-et-parties-prenantes)
5. [Plans tarifaires](#5-plans-tarifaires)
6. [Modules fonctionnels](#6-modules-fonctionnels)
7. [User Stories](#7-user-stories)
8. [Règles métier](#8-règles-métier)
9. [Exigences non fonctionnelles (synthèse)](#9-exigences-non-fonctionnelles-synthèse)
10. [Contraintes et hypothèses](#10-contraintes-et-hypothèses)
11. [Questions ouvertes à valider](#11-questions-ouvertes-à-valider)
12. [Glossaire](#12-glossaire)

---

## 1. Vision produit

**NexusBlog SaaS** est une plateforme de publication multimédia multi-tenant de niveau entreprise.
Elle permet à toute organisation de créer, gérer et monétiser un blog professionnel — texte, images,
vidéo, audio, podcast — sans infrastructure propre, avec des capacités IA intégrées, une automatisation
des réseaux sociaux, un système publicitaire complet et un support multilingue mondial.

### Proposition de valeur différenciante

| Axe | Ce que NexusBlog offre |
|---|---|
| **Contenu riche** | Texte, images, vidéo uploadée, audio, podcast, embeds multi-plateformes |
| **IA intégrée** | Rédaction, modération, SEO, traduction, recommandations, détection de plagiat |
| **Automatisation sociale** | Publication automatique sur 13 plateformes avec IA captions + thumbnails |
| **Monétisation complète** | Ads réseau + rotateur personnalisé + articles payants + newsletter payante |
| **Multi-tenant natif** | Chaque client dispose d'un espace isolé, personnalisable, avec son domaine propre |
| **Enterprise-ready** | SSO, SLA 99.9%, RLS PostgreSQL, audit logs, multi-région |

---

## 2. Objectifs stratégiques

### Objectifs produit
- O1 — Onboarding d'un nouveau tenant en < 5 minutes
- O2 — Supporter 10 000 tenants actifs simultanément sans dégradation
- O3 — Chargement des pages publiques < 1.5s (P95) — CDN + SSR/SSG Next.js
- O4 — Disponibilité 99.9% hors maintenance planifiée
- O5 — Expérience mobile-first sur toutes les interfaces publiques (PWA)

### Objectifs commerciaux
- O6 — Revenus via abonnements freemium → Enterprise
- O7 — Revenus supplémentaires via API publique monétisée
- O8 — Permettre aux tenants de monétiser leur contenu (articles payants, newsletter, publicité)

---

## 3. Périmètre du projet

### Dans le périmètre — V1

**Contenu & Édition**
- Blog multi-tenant avec isolation complète des données
- Publication de tous types de contenu : texte riche, images, vidéo (upload + embed), audio, podcast
- Éditeur WYSIWYG avancé + Markdown + Drag & Drop
- Workflow d'approbation éditoriale configurable
- Versioning des articles

**IA**
- Assistant rédaction (complétion, reformulation)
- Correction grammaticale IA
- Suggestions SEO IA
- Modération automatique des commentaires (toxicité, spam, malware)
- Traduction automatique IA (multilingue)
- Génération de résumés automatiques
- Génération de captions et hashtags pour réseaux sociaux
- Génération automatique de thumbnails
- Génération de métadonnées (alt text images, catégorisation)
- Détection de plagiat

**Automatisation & Distribution**
- Publication automatique sur 13 plateformes sociales
- Système newsletter + abonnés
- Notifications push (FCM)

**Monétisation**
- Système publicitaire intégré (rotateur + AdSense + soumission annonceurs)
- Articles payants (paywall)
- Newsletter payante

**Analytics & SEO**
- Analytics détaillés (visiteurs, géolocalisation, heatmaps, scroll depth)
- Intégration GA4 + Matomo
- SEO avancé (schema markup, AMP, sitemaps dynamiques)

**Expérience lecteur**
- Dark mode / Light mode
- Mode lecture, marque-pages, liste de lecture
- Lecture vocale des articles
- Lecture hors ligne (PWA)
- Barre de progression de lecture
- Recommandations IA

**Infrastructure**
- Custom domains + SSL automatique
- CDN-ready
- Docker + Kubernetes
- CI/CD pipeline

### Hors périmètre — V1

- Application mobile native (iOS/Android)
- Marketplace de plugins tiers
- Réseau social / forum intégré
- Streaming vidéo en direct (live)
- Multi-région déploiement (architecture préparée, implémentation V2)

---

## 4. Personas et parties prenantes

### P1 — Super Admin (Opérateur de la plateforme)

**Qui :** L'équipe NexusBlog — propriétaires de la plateforme.

**Responsabilités :**
- Superviser tous les tenants et l'activité globale
- Gérer les plans, limites, et configurations plateforme
- Traiter les signalements de contenu et suspendre les comptes abusifs
- Monitorer la santé infrastructure et les métriques business (MRR, churn)
- Gérer les annonces et communications vers les tenants

---

### P2 — Tenant Admin (Propriétaire du blog)

**Qui :** Entreprise, média, agence, créateur de contenu abonné à NexusBlog.

**Objectifs :**
- Publier et gérer du contenu multimédia de qualité
- Gérer son équipe éditoriale (workflow d'approbation)
- Connecter et automatiser ses réseaux sociaux
- Monétiser son contenu via publicité et articles payants
- Analyser les performances de son blog
- Personnaliser l'apparence et connecter son domaine

---

### P3 — Éditeur (Editor)

**Qui :** Collaborateur senior — peut créer, éditer, publier, modérer.

**Objectifs :**
- Rédiger et publier des articles sans validation supplémentaire
- Valider les articles soumis par les auteurs
- Modérer les commentaires et la file d'attente publicitaire

---

### P4 — Auteur (Author)

**Qui :** Collaborateur rédactionnel — crée du contenu, ne publie pas directement.

**Objectifs :**
- Rédiger des articles en brouillon avec l'aide de l'IA
- Soumettre des articles pour relecture et validation
- Suivre les performances de ses propres articles

---

### P5 — Lecteur / Abonné

**Qui :** Utilisateur final du blog public.

**Objectifs :**
- Consommer du contenu multimédia (articles, podcasts, vidéos)
- Commenter, partager, interagir
- S'abonner à la newsletter et aux notifications push
- Retrouver facilement du contenu via la recherche IA
- Lire dans sa langue native (traduction automatique)

---

### P6 — Annonceur

**Qui :** Entreprise ou particulier souhaitant diffuser une publicité sur un blog NexusBlog.

**Objectifs :**
- Soumettre une annonce publicitaire facilement
- Suivre les impressions et les performances
- Renouveler les campagnes

---

### P7 — Développeur Intégrateur

**Qui :** Développeur tiers consommant l'API publique.

**Objectifs :**
- Accéder au contenu via une API REST propre et documentée
- Intégrer NexusBlog comme headless CMS
- Automatiser la publication

---

## 5. Plans tarifaires

### Tier 0 — Starter (Gratuit)

| Fonctionnalité | Limite |
|---|---|
| Articles publiés | 10 |
| Types de contenu | Texte + Images uniquement |
| Auteurs | 1 (Admin uniquement) |
| Stockage médias | 500 MB |
| Abonnés newsletter | 100 |
| Domaine personnalisé | Non (sous-domaine .nexusblog.io) |
| Réseaux sociaux connectés | 0 |
| AI features | Non |
| Système publicitaire | Non |
| Multilingue | Non |
| Analytics | Basiques (vues, lecteurs) |
| API Access | Non |
| Dark mode | Oui |
| PWA | Oui |
| Branding NexusBlog | Affiché |

---

### Tier 1 — Pro (9€/mois ou 90€/an)

| Fonctionnalité | Limite |
|---|---|
| Articles publiés | Illimités |
| Types de contenu | Tous (texte, images, vidéo, audio, podcast) |
| Auteurs | 3 |
| Stockage médias | 5 GB |
| Abonnés newsletter | 1 000 |
| Domaine personnalisé | 1 domaine |
| Réseaux sociaux connectés | 3 plateformes |
| AI features | Basiques (rédaction, correction, SEO suggestions) |
| Système publicitaire | AdSense uniquement |
| Multilingue | 5 langues |
| Analytics | Avancés (sources, temps lecture, géolocalisation) |
| API Access | 10 000 req/mois |
| Support | Email (48h) |
| Branding NexusBlog | Supprimable |

---

### Tier 2 — Business (29€/mois ou 290€/an)

| Fonctionnalité | Limite |
|---|---|
| Articles publiés | Illimités |
| Types de contenu | Tous |
| Auteurs | 10 |
| Stockage médias | 20 GB |
| Abonnés newsletter | 10 000 |
| Domaines personnalisés | 3 domaines |
| Réseaux sociaux connectés | Toutes les 13 plateformes |
| AI features | Toutes (modération, traduction, plagiat, thumbnails IA) |
| Système publicitaire | Complet (AdSense + rotateur + soumission annonceurs) |
| Multilingue | Illimité |
| Analytics | Premium (heatmaps, scroll depth, conversions, export) |
| API Access | 100 000 req/mois + Webhooks |
| Articles payants | Oui |
| Newsletter payante | Oui |
| Support | Email prioritaire (24h) |

---

### Tier 3 — Enterprise (Sur devis)

| Fonctionnalité | Limite |
|---|---|
| Tout ce qui précède | Illimité |
| Stockage | 100 GB+ (négociable) |
| API Access | Illimité + SLA garanti |
| SSO / SAML | Oui |
| Déploiement dédié | Option disponible |
| SLA | 99.9% garanti contractuellement |
| Support | Dédié + gestionnaire de compte |
| Audit logs exportables | Oui |
| Configuration AI personnalisée | Clé API propre (OpenAI, Anthropic…) |

---

## 6. Modules fonctionnels

---

### M1 — Authentification & Gestion des identités

#### M1.1 — Méthodes d'authentification

- **Google Sign-In** via Firebase Authentication
- **Email / mot de passe** via Firebase Auth (optionnel, activable par tenant)
- JWT (Access Token : 15 min) + Refresh Token rotatif (7 jours) émis par le backend FastAPI
- Refresh Token stocké en cookie **HttpOnly + Secure + SameSite=Strict**
- Révocation immédiate de tous les tokens actifs lors de suspension de compte ou changement de mot de passe (blacklist Redis)
- **2FA (TOTP)** via Google Authenticator — Tiers Pro+ (obligatoire pour les Tenant Admins Enterprise)

#### M1.2 — RBAC (Role-Based Access Control)

**Niveau plateforme :**
- `SUPER_ADMIN` — accès total à toute la plateforme

**Niveau tenant :**

| Rôle | Créer article | Publier | Approuver | Gérer équipe | Gérer facturation | Accéder analytics |
|---|---|---|---|---|---|---|
| `TENANT_ADMIN` | Oui | Oui (direct) | Oui | Oui | Oui | Oui |
| `EDITOR` | Oui | Oui (direct) | Oui | Non | Non | Oui (partiels) |
| `AUTHOR` | Oui | Non (soumission) | Non | Non | Non | Ses articles |
| `VIEWER` | Non | Non | Non | Non | Non | Lecture seule |

#### M1.3 — Onboarding

- Wizard 3 étapes pour nouveau Tenant Admin : (1) Nom du blog, (2) Sous-domaine, (3) Thème initial
- Email de bienvenue automatique
- Checklist post-inscription : connecter domaine, inviter auteur, publier premier article, connecter réseau social

---

### M2 — Gestion des Tenants

#### M2.1 — Isolation et configuration

- Espace entièrement isolé (RLS PostgreSQL + middleware applicatif)
- Sous-domaine `{slug}.nexusblog.io` — unique, immuable après création
- Paramètres généraux : nom, description, logo, favicon, langue principale, fuseau horaire
- Paramètres SEO globaux, intégrations GA4 / Matomo / Facebook Pixel
- Configuration IA : clé API IA propre pour les tenants Enterprise (sinon clé plateforme mutualisée)

#### M2.2 — Domaines personnalisés

- Connexion de domaine propre (Tiers Pro+)
- Processus : saisie domaine → CNAME à ajouter → vérification automatique → SSL Let's Encrypt
- Renouvellement automatique du certificat SSL
- Redirection HTTP → HTTPS

#### M2.3 — Équipe et invitations

- Invitation par email avec rôle assigné — validité 48h
- Modification / révocation de rôle immédiate
- Historique des accès par membre

#### M2.4 — Cycle de vie du tenant

- Période d'essai : 14 jours sur plan Pro
- Downgrade vers Starter à expiration du plan payant
- Suppression demandée → grâce 30 jours → export des données → suppression définitive

---

### M3 — Types de contenu

Le blog supporte **5 types de posts** distincts, chacun avec ses propres champs et rendu :

#### M3.1 — Article texte riche (Article)
Contenu principal : texte WYSIWYG + Markdown. Peut inclure des images, embeds, blocs de code.

#### M3.2 — Post image / galerie (Photo)
Contenu principal : une image ou une galerie d'images avec légendes. Texte court optionnel.

#### M3.3 — Post vidéo (Video)
Deux sous-types :
- **Vidéo uploadée** : fichier vidéo mp4/webm stocké sur Cloudinary, player natif intégré
- **Vidéo embarquée** : URL YouTube, Vimeo, TikTok, Instagram, Facebook, DailyMotion → embed responsive

#### M3.4 — Post audio (Audio)
- Fichier audio mp3/wav/ogg uploadé sur Cloudinary
- Player audio intégré avec barre de progression, volume, vitesse de lecture
- Support des chapitres (timestamps)
- Transcription automatique IA (optionnelle)

#### M3.5 — Episode Podcast (Podcast)
Extension du post audio avec :
- Titre d'épisode, numéro d'épisode, saison
- Description de l'épisode
- Image de couverture du podcast
- Durée totale calculée automatiquement
- Flux RSS généré automatiquement (compatible Apple Podcasts, Spotify, etc.)
- Page dédiée de la série podcast

#### M3.6 — Post mixte (Mixed Media)
Combinaison libre de tous les types ci-dessus dans un même article via l'éditeur de blocs.

---

### M4 — Éditeur de contenu riche

L'éditeur est le cœur de la plateforme. Il est basé sur **Tiptap / ProseMirror** avec extensions personnalisées.

#### M4.1 — Modes d'édition

- **Mode WYSIWYG** — rendu visuel en temps réel
- **Mode Markdown** — saisie Markdown avec prévisualisation splitée
- **Mode Drag & Drop** — réorganisation des blocs par glisser-déposer
- **Mode Focus** — plein écran sans distractions

#### M4.2 — Blocs de contenu disponibles

**Typographie et mise en forme**
- Titres H1 à H4
- Paragraphes
- Gras, italique, souligné, barré, exposant, indice
- Police de caractères (sélection parmi 10 polices Google Fonts)
- Taille de police (12px à 72px)
- Couleur de texte (palette + saisie hexadécimale)
- Couleur d'arrière-plan du bloc
- Alignement : gauche, centré, droite, justifié

**Listes et organisation**
- Listes à puces (ordonnées / non ordonnées)
- Listes de tâches (to-do list avec cases à cocher)
- Tableaux (édition inline, ajout/suppression de lignes/colonnes)

**Médias**
- Images : upload direct via Cloudinary, alt text, légende, alignement, redimensionnement inline
- Vidéos uploadées : upload mp4/webm avec player intégré
- Embeds vidéo : YouTube, Vimeo, TikTok, Instagram, Facebook, DailyMotion (par URL)
- Audio : upload mp3/wav avec player intégré
- Galerie d'images (grille configurable)

**Contenu structuré**
- Citations (blockquote) avec auteur optionnel
- Blocs de code avec coloration syntaxique (50+ langages via highlight.js) et copie en un clic
- Séparateurs horizontaux (styles variés)
- Blocs info / avertissement / danger / succès (callout)
- Boutons Call-to-Action (texte + URL + style)
- Iframes intégrées (tweets, posts LinkedIn, etc.)

**Interactivité**
- Émojis (picker intégré + recherche)
- Mentions `@auteur`
- Liens hypertextes (sur texte, images, boutons) — ouverture nouvel onglet par défaut pour liens externes

#### M4.3 — Fonctionnalités d'édition avancées

- **Sauvegarde automatique** toutes les 30 secondes (brouillon auto)
- **Sauvegarde manuelle** avec création de version numérotée
- **Historique des versions** — 30 dernières versions — comparaison côte à côte, restauration en un clic
- **Prévisualisation** du rendu final (desktop / tablet / mobile)
- Correction orthographique et grammaticale navigateur
- Compteur de mots / caractères / temps de lecture estimé

#### M4.4 — Assistant IA intégré à l'éditeur

Accessible via commande `/` ou bouton IA flottant :

| Commande IA | Description |
|---|---|
| `Continuer la rédaction` | Complétion contextuelle du texte en cours |
| `Reformuler` | Réécriture du texte sélectionné (ton : professionnel, décontracté, formel) |
| `Résumer` | Résumé du contenu sélectionné en N phrases |
| `Corriger la grammaire` | Correction grammaticale et syntaxique |
| `Améliorer le style` | Suggestions de style et de clarté |
| `Traduire` | Traduction du bloc sélectionné dans une langue cible |
| `Générer une introduction` | Rédige une introduction à partir du titre |
| `Générer une conclusion` | Rédige une conclusion à partir du contenu |
| `Suggérer un titre SEO` | Propose 3 variantes de titre optimisé SEO |
| `Analyser le SEO` | Score SEO de l'article + suggestions concrètes |
| `Détecter le plagiat` | Vérification du contenu contre les sources connues |
| `Générer des métadonnées` | Propose meta title, meta description, tags automatiquement |

---

### M5 — Métadonnées et workflow de publication

#### M5.1 — Métadonnées de l'article

- Titre (obligatoire, max 160 caractères)
- Slug URL (auto-généré, modifiable)
- Extrait / résumé (max 300 caractères)
- Image à la une (upload Cloudinary, recadrage intégré)
- Type de contenu (voir M3)
- Catégorie (obligatoire, une principale + catégories secondaires)
- Tags (jusqu'à 10, avec auto-complétion et suggestion IA)
- Auteur(s) assignés
- Date de publication (immédiate / programmée)
- Langue de l'article
- Statut de confidentialité (public / privé / payant)
- SEO : meta title, meta description, canonical URL, robots (noindex optionnel)
- Open Graph : titre, description, image dédiée
- JSON-LD : Article, BreadcrumbList, Person, Organization

#### M5.2 — Workflow de publication

```
DRAFT → IN_REVIEW → APPROVED → PUBLISHED
  ↑         ↓           ↓           ↓
  └─────────┘      REJECTED    SCHEDULED
                                    ↓
                               PUBLISHED
                                    ↓
                              UNPUBLISHED
                                    ↓
                               ARCHIVED
```

**Règles du workflow par rôle :**
- `TENANT_ADMIN` : publie directement (DRAFT → PUBLISHED)
- `EDITOR` : publie directement (DRAFT → PUBLISHED)
- `AUTHOR` : soumet pour relecture (DRAFT → IN_REVIEW) — nécessite approbation d'un EDITOR ou TENANT_ADMIN

**Approbation :**
- Notification en temps réel (in-app + email) aux Éditeurs/Admins quand un article est soumis
- Journal d'approbation : qui a approuvé, quand, commentaire optionnel
- Un article refusé (REJECTED) retourne en DRAFT avec le commentaire de refus visible par l'auteur

#### M5.3 — Programmation de la publication

- Date et heure précises de publication automatique
- Fuseau horaire du tenant respecté
- Possibilité d'annuler la programmation tant que non publié
- Notification de confirmation à l'auteur après publication

---

### M6 — Gestion des catégories et tags

#### M6.1 — Catégories

- Hiérarchie 2 niveaux (parent / enfant)
- Nom, slug, description, image de couverture
- Page de listing automatique par catégorie (SEO-friendly)
- Ordre configurable (drag & drop)
- Protection contre la suppression si articles publiés associés
- **IA auto-catégorisation** : suggestion de catégorie basée sur le contenu de l'article

#### M6.2 — Tags

- Création libre à la rédaction
- Administration : fusion, renommage, suppression
- Page de listing par tag
- **IA suggestion de tags** à partir du contenu
- Nuage de tags dans les widgets sidebar

---

### M7 — Gestion des médias

#### M7.1 — Upload et stockage (Cloudinary)

**Images :** JPEG, PNG, WebP, GIF, SVG, AVIF — max 10 MB par fichier
**Vidéos :** MP4, WebM, MOV — max 500 MB par fichier
**Audio :** MP3, WAV, OGG, M4A, FLAC — max 100 MB par fichier
**Documents :** PDF — max 50 MB (attachements)

Pipeline de traitement automatique à l'upload :
- Compression intelligente sans perte de qualité visible
- Génération automatique de formats responsifs (srcset)
- Conversion WebP / AVIF pour les images
- Génération de thumbnail pour les vidéos
- **Alt text automatique IA** pour les images (modifiable par l'auteur)
- **Tagging automatique IA** des images (contenu, objets, scènes détectés)
- Vérification de sécurité : MIME type, magic bytes, scan anti-malware

#### M7.2 — Médiathèque centralisée

- Galerie avec filtres : type (image/vidéo/audio), date, taille, tags IA
- Recherche par nom, alt text, ou tag
- Prévisualisation inline
- Détails : dimensions, poids, format, URL Cloudinary, date d'upload
- Renommage, suppression (avec avertissement si utilisé dans un article)
- **Détection de droits** IA : alerte si image potentiellement soumise à copyright

#### M7.3 — Pipeline de compression

- Images : optimisation progressive, génération automatique en plusieurs résolutions (400px, 800px, 1200px, 1600px)
- Vidéos : transcodage automatique via Cloudinary en plusieurs qualités (360p, 720p, 1080p)
- Audio : normalisation du volume, conversion en MP3 320kbps

---

### M8 — Système de commentaires

#### M8.1 — Publication de commentaires

- **Commentaires sans inscription** activés par défaut (configurable par tenant et par article)
- Commentaires authentifiés (via compte NexusBlog ou Google)
- Champs pour commentaires anonymes : prénom + email (obligatoires)
- **Réponses imbriquées** (1 niveau de threading)
- **Upload d'images** dans les commentaires (max 5 MB, formats image uniquement)
- **Support des émojis** (picker natif)
- Formatage basique : gras, italique, lien

#### M8.2 — Modération IA automatique

Chaque commentaire passe par une pipeline de modération IA avant publication (ou en parallèle selon le mode) :

| Vérification | Moteur | Action si détecté |
|---|---|---|
| Toxicité / insultes | Modèle IA classification | Score 0-100, seuil configurable |
| Discours haineux | Modèle IA | Rejet automatique si score > seuil critique |
| Contenu adulte | Modèle IA | Rejet automatique |
| Spam | Règles + IA | Rejet automatique |
| Liens malveillants | Base de données URL malveillantes | Rejet automatique |
| Score de risque global | Agrégation des scores | Mise en file de modération si ambigu |

**Score de risque global :**
- 0-30 : Publication automatique (mode OPEN)
- 31-70 : Mise en file de modération manuelle
- 71-100 : Rejet automatique + notification admin

#### M8.3 — Outils de modération admin

- File de modération avec visualisation du score IA + raison de blocage
- Actions : approuver, refuser, modifier, supprimer, cacher (visible uniquement de l'auteur)
- **Shadow ban** : l'utilisateur pense que son commentaire est publié, les autres ne le voient pas
- **Bannissement** par email ou IP (durée configurable : 24h / 7j / permanent)
- **Blocage d'IP** avec liste de blocage gérée dans l'admin
- Liste de mots-clés interdits personnalisable
- Système de signalement par les lecteurs (bouton "signaler")
- **CAPTCHA** déclenché automatiquement pour les IP suspectes (trop de soumissions rapides)
- Rate limiting : max 5 commentaires par heure par IP/compte

#### M8.4 — Configuration par tenant

- Mode global : OPEN / MODERATED / CLOSED
- Override par article : activer/désactiver les commentaires sur un article spécifique
- Seuils de score IA ajustables
- Mots interdits personnalisés
- Durée de fermeture automatique des commentaires après N jours de publication (configurable)

---

### M9 — Newsletter et gestion des abonnés

#### M9.1 — Formulaires d'abonnement

- Widgets intégrables : inline dans article, popup, sidebar, footer, page dédiée
- Champs : email (obligatoire), prénom (optionnel)
- **Double opt-in obligatoire** (email de confirmation — non contournable, conformité RGPD)
- Page de désabonnement accessible depuis chaque email (lien en footer)
- Consentement enregistré : timestamp, IP, source du formulaire

#### M9.2 — Gestion des abonnés

- Liste filtrable : statut (actif, désabonné, non confirmé), date, source
- Export CSV / Import CSV (double opt-in requis pour les importés)
- Segmentation par tags/listes (Tiers Business+)
- Métriques par abonné : taux d'ouverture moyen, dernier email ouvert, clics

#### M9.3 — Création et envoi de newsletters

- Éditeur d'email avec prévisualisation desktop/mobile
- Création depuis un article existant ou depuis zéro
- Test d'envoi à l'adresse admin
- Envoi immédiat ou programmé
- Gestion des bounces et des désinscriptions automatiques
- Statistiques : taux d'envoi, ouverture, clics, désabonnements, bounces

#### M9.4 — Newsletter payante (Tiers Business+)

- Niveaux d'accès : gratuit / payant mensuel / payant annuel
- Gestion des abonnés payants (intégration Stripe V2)
- Accès au contenu exclusif réservé aux abonnés payants

---

### M10 — Automatisation Réseaux Sociaux

Module central de distribution automatique de contenu vers les plateformes sociales.

#### M10.1 — Plateformes supportées

| Plateforme | Auto-post | Scheduling | Format |
|---|---|---|---|
| Facebook Page | Oui | Oui | Texte + image + lien |
| Instagram | Oui | Oui | Image + caption (lien en bio) |
| LinkedIn | Oui | Oui | Texte + image + lien |
| X / Twitter | Oui | Oui | Texte court + image + lien |
| TikTok | Oui | Oui | Vidéo (upload requis) |
| Threads | Oui | Oui | Texte + image + lien |
| Pinterest | Oui | Oui | Image + description + lien |
| Telegram Channel | Oui | Oui | Texte + image + lien |
| WhatsApp Channel | Oui | Oui | Texte + image |
| YouTube Community | Oui | Oui | Texte + image |
| Discord | Oui | Oui | Webhook texte + embed |
| Reddit | Oui | Oui | Texte + lien (subreddit configurable) |
| Upscrolled | Oui | Oui | Texte + lien |

#### M10.2 — Configuration par tenant

- Connexion OAuth des comptes sociaux (par plateforme)
- Activation/désactivation de chaque plateforme
- Délai de publication configurable par plateforme (ex : publier sur LinkedIn 2h après publication blog)
- Template de caption personnalisable par plateforme

#### M10.3 — Génération IA du contenu social

| Génération IA | Description |
|---|---|
| **Caption IA** | Génère une caption adaptée au ton et format de chaque plateforme |
| **Hashtags IA** | Génère 5-15 hashtags pertinents par plateforme |
| **Thumbnail IA** | Génère un visuel attrayant à partir de l'image à la une + titre |
| **Redimensionnement auto** | Adapte le thumbnail aux dimensions de chaque plateforme |

**Dimensions de thumbnails générées :**

| Plateforme | Dimensions |
|---|---|
| Facebook | 1200 × 630 px |
| Instagram Post | 1080 × 1080 px |
| Instagram Story | 1080 × 1920 px |
| LinkedIn | 1200 × 627 px |
| X/Twitter | 1600 × 900 px |
| TikTok | 1080 × 1920 px |
| Pinterest | 1000 × 1500 px |
| YouTube Community | 1280 × 720 px |

#### M10.4 — Tracking et analytics

- **UTM parameters** automatiques sur tous les liens partagés (source, medium, campaign configurables)
- Tableau de bord par plateforme : impressions, clics, engagement
- Comparaison des performances cross-plateformes
- Historique de toutes les publications sociales avec statut (succès / échec / en attente)

#### M10.5 — Gestion des erreurs

- Retry automatique (3 tentatives à intervalles exponentiels) si échec API réseau social
- Notification admin si échec persistant
- Logs détaillés de chaque tentative de publication

---

### M11 — Système Multi-langues

#### M11.1 — Détection automatique de la langue

- Détection basée sur : langue du navigateur (header Accept-Language) + géolocalisation IP
- Redirection douce vers la langue détectée (avec possibilité de choisir)
- Cookie de préférence de langue persistant

#### M11.2 — Langues supportées

- Toutes les langues majeures mondiales (100+ langues)
- Support complet **RTL** (Arabe, Hébreu, Persan, Ourdou) : layout miroir, typographie adaptée
- L'anglais est la langue source principale

#### M11.3 — Traduction IA

- **Traduction automatique des articles** via moteur IA (DeepL API / Google Cloud Translation / API à confirmer)
- **Traduction des commentaires** à la lecture (bouton "Traduire ce commentaire")
- **Traduction des métadonnées** : meta title, meta description, og:description
- **Traduction de l'UI** du blog public (menus, labels, boutons)
- Les traductions sont mises en cache (Redis) pour éviter les appels IA répétés

#### M11.4 — URLs multilingues SEO-friendly

```
blog.exemple.com/en/article-slug        (anglais — version source)
blog.exemple.com/fr/titre-article       (français — traduction)
blog.exemple.com/ar/عنوان-المقال        (arabe — RTL)
```

- Balise `hreflang` générée automatiquement pour toutes les versions linguistiques
- Sitemap XML multilingue avec une entrée par langue

#### M11.5 — Contrôle par le Tenant Admin

- Activation/désactivation des langues proposées
- Langue par défaut du blog configurable
- Traduction manuelle possible (override de la traduction automatique)
- Affichage du switcher de langue : header, footer, ou flottant

---

### M12 — Système Publicitaire

#### M12.1 — Intégration réseaux publicitaires

- **Google AdSense** : insertion du script AdSense et des blocs d'annonces via l'interface admin
- **Media.net** : intégration du code de tag
- **Code publicitaire personnalisé** : champ libre pour insérer n'importe quel code d'annonceur (script JS, iframe)
- Placements disponibles : header, sidebar, entre les paragraphes, footer
- Chargement en **lazy loading** pour ne pas pénaliser les Core Web Vitals
- Affichage responsive selon la taille d'écran

#### M12.2 — Rotateur de bannières publicitaires (Custom Ad Rotator)

Système de publicité directe géré par le Tenant Admin, affiché en position premium (haut de page).

**Fonctionnement :**
- Bannières chargées et affichées en rotation automatique
- **Rotation toutes les 30 secondes**
- **Pondération par budget** : un annonceur ayant payé 2x plus a 2x plus de chances d'être affiché
- Algorithme de rotation pondérée (Weighted Round Robin)

**Liens cliquables dans les publicités :**
> Les bannières publicitaires **peuvent contenir des liens cliquables**.
> L'annonceur saisit l'URL de destination lors de la soumission de son annonce.
> Tous les liens sont affichés et ouverts dans un **nouvel onglet** (`target="_blank" rel="noopener noreferrer"`).
> Chaque lien est soumis à un **scan de sécurité automatique toutes les heures** (voir M12.4).
> Un lien détecté comme malveillant entraîne la **désactivation immédiate** de la campagne.

**Gestion des bannières :**
- Upload d'image publicitaire par l'admin
- Redimensionnement automatique aux dimensions du rotateur
- Planification : date de début et date de fin de campagne
- Système d'expiration automatique
- Désactivation manuelle instantanée

**Tracking :**
- Compteur d'impressions par bannière
- Temps de diffusion total
- Rapport CPM calculé automatiquement

**Prévention de fraude :**
- Détection d'impressions frauduleuses (bots, IP farming)
- Monitoring IA des patterns d'affichage anormaux

#### M12.3 — Système de soumission d'annonces

Interface publique permettant aux annonceurs de soumettre leurs publicités directement.

**Formulaire de soumission ("Ad Submission") :**
- Email de l'annonceur (obligatoire)
- Nom de l'entreprise (obligatoire)
- Numéro de téléphone/mobile (obligatoire)
- Upload de l'image publicitaire (obligatoire)
- **Texte publicitaire** (optionnel — max 150 caractères, affiché sous la bannière)
- **URL de destination** (optionnel — lien cliquable de la bannière, doit commencer par `https://`)
- Budget souhaité en USD (minimum : **50 USD**)
- Durée de la campagne souhaitée
- Message optionnel pour l'admin

**Pipeline de traitement :**
1. Soumission du formulaire → email de confirmation automatique à l'annonceur
2. **Premier scan de sécurité de l'URL** (si fournie) — rejet immédiat si malveillante
3. Redimensionnement automatique de l'image aux dimensions du rotateur
4. **Amélioration qualité IA** de l'image (upscaling, sharpening si nécessaire)
5. Vérification de contenu IA : publicité inappropriée / contenu trompeur / logos connus de fraude
6. Envoi dans la file de révision admin
7. Admin examine : approuve ou refuse (avec raison)
8. Si approuvé : **lien de paiement Stripe ou PayPal généré automatiquement** et envoyé à l'annonceur par email
9. Paiement effectué par l'annonceur (carte bancaire ou PayPal)
10. Webhook Stripe/PayPal → activation automatique de la campagne + envoi de la facture PDF
11. **Inscription de l'URL dans le planificateur de scan horaire** (voir M12.4)

**Dashboard annonces pour l'admin :**
- File d'attente des soumissions pendantes
- Annonces actives avec statistiques (impressions, temps restant, **statut de sécurité du lien**)
- Annonces expirées avec archivage
- Revenus publicitaires cumulés
- Historique complet des campagnes

---

#### M12.4 — Surveillance et scan de sécurité des liens publicitaires

Toutes les URLs fournies par les annonceurs sont soumises à une **surveillance continue et automatique**.

**Fréquence de scan :** toutes les heures, pour chaque URL active dans le système.

**Sources de vérification consultées :**

| Source | Ce qu'elle détecte |
|---|---|
| **Google Safe Browsing API** | Malware, phishing, logiciels indésirables, sites trompeurs |
| **VirusTotal API** | Analyse multi-moteurs antivirus (70+ moteurs), réputation de domaine |
| **URLhaus (abuse.ch)** | Base de données de liens de distribution de malware |
| **PhishTank** | Base de données collaborative de sites de phishing |

**Processus de scan :**

```
[Cron job toutes les heures]
    ↓
Pour chaque URL publicitaire active :
    ↓
Interrogation des 4 sources de vérification
    ↓
    ├─ SCORE SÛRE (0 source négative) → Statut : ✅ SAFE — aucune action
    │
    ├─ SCORE SUSPECT (1 source négative) → Statut : ⚠️ SUSPECT
    │       → Notification immédiate au Tenant Admin (email + in-app)
    │       → Annonce maintenue active mais flag visible dans le dashboard
    │
    └─ SCORE DANGEREUX (2+ sources négatives) → Statut : 🔴 DANGEROUS
            → Désactivation automatique et immédiate de la campagne
            → Email d'alerte au Tenant Admin avec détail des menaces détectées
            → Email d'information à l'annonceur (campagne suspendue pour raisons de sécurité)
            → Log de sécurité horodaté dans les audit logs
            → Remboursement automatique déclenché si campagne désactivée avant la fin prévue
```

**Réactivation après désactivation :**
- L'annonceur doit soumettre une nouvelle URL propre
- La nouvelle URL passe par le pipeline de scan complet avant réactivation
- L'admin peut forcer la désactivation permanente d'un annonceur récidiviste

**Historique de sécurité :**
- Chaque résultat de scan est logué (date, heure, scores par source, décision)
- L'admin peut consulter l'historique complet de tous les scans pour chaque annonce
- Rapport hebdomadaire de sécurité publicitaire envoyé au Tenant Admin

---

### M13 — Analytics et Tableau de bord

#### M13.1 — Analytics blog (Tiers Starter)
- Vues de page totales et par article
- Visiteurs uniques (estimation)
- Articles les plus lus (top 10)

#### M13.2 — Analytics avancés (Tiers Pro+)
- Sources de trafic (recherche organique, réseaux sociaux, direct, referral, email)
- Données démographiques : pays, ville, langue
- Appareils : desktop / mobile / tablet + détail navigateur / OS
- Temps de lecture moyen par article
- Taux de rebond
- Évolution sur périodes personnalisables (7j, 30j, 90j, 1 an, custom)
- Intégration **Google Analytics 4** (ID configuré dans les paramètres du blog)
- Intégration **Matomo** (self-hosted ou cloud)

#### M13.3 — Analytics premium (Tiers Business+)
- **Heatmaps** : zones les plus cliquées et consultées par page
- **Scroll depth** : profondeur de défilement moyenne par article
- Taux de conversion newsletter (lecteur → abonné)
- Revenus (articles payants + newsletter payante + publicité)
- Export données brutes CSV
- Webhooks vers outils tiers (Segment, Mixpanel, etc.)

#### M13.4 — Analytics réseaux sociaux
- Performances par plateforme connectée
- Comparaison inter-plateformes
- Meilleur moment de publication suggéré par IA (analyse des données historiques)

#### M13.5 — Analytics publicitaires
- Impressions par bannière
- Revenus publicitaires par période
- Taux de rotation par annonceur

#### M13.6 — Tableau de bord Super Admin
- MRR / ARR / Churn / NPS
- Nombre de tenants par plan
- Volume de contenu publié (global, par jour)
- Signalements en attente
- Santé infrastructure (API, base de données, Elasticsearch, Redis)
- Logs d'audit (toutes actions admin et accès cross-tenant)

---

### M14 — SEO

#### M14.1 — SEO par article
- Title tag, meta description personnalisables
- Open Graph + Twitter Cards
- JSON-LD automatique : Article, BreadcrumbList, Person, Organization, AudioObject (podcasts), VideoObject
- Canonical URL
- Balises hreflang (multilingue)
- Robots (index/noindex par article)
- **Score SEO IA** : note globale + liste de suggestions concrètes (longueur titre, densité mots-clés, structure H, liens internes)

#### M14.2 — SEO global du blog
- Title template configurable
- Sitemap XML dynamique (articles, catégories, tags, pages, langues) — mis à jour à chaque publication
- `robots.txt` configurable
- Google Search Console : vérification via meta tag
- Redirections 301 automatiques en cas de changement de slug
- **Suggestions de liens internes** IA : lors de la rédaction, l'assistant suggère des articles existants à lier

#### M14.3 — Performance SEO
- Server-Side Rendering (SSR) pour les pages dynamiques
- Static Site Generation (SSG) pour les pages stables (catégories, tags, pages statiques)
- Incremental Static Regeneration (ISR) pour les articles populaires
- CDN-ready (headers Cache-Control appropriés)
- Images servies en WebP/AVIF avec srcset
- Lazy loading natif pour toutes les images
- **AMP** (Accelerated Mobile Pages) : version AMP générée automatiquement pour les articles (Tiers Pro+)
- Core Web Vitals : LCP, FID/INP, CLS optimisés

---

### M15 — Recherche

- Moteur : **Elasticsearch** (full-text sur titre, contenu, extrait, tags, catégories)
- Barre de recherche sur le blog public + dashboard admin
- Résultats enrichis : titre, extrait, image, date, catégorie, type de contenu
- Highlighting des termes dans les extraits
- Filtres : type de contenu, catégorie, tag, date, langue
- **Suggestions d'autocomplétion** en temps réel
- **Assistant de recherche IA** : interprétation de requêtes en langage naturel
  ("Montre-moi les articles de tech de la semaine dernière" → résultats filtrés automatiquement)
- Pages sans résultat avec suggestions d'articles similaires (similarité sémantique IA)
- Indexation automatique à chaque publication / modification

---

### M16 — Notifications Push

- Via **Firebase Cloud Messaging (FCM)**
- Abonnement aux notifications navigateur (prompt discret, non intrusif)
- Notification automatique à chaque nouvel article publié
- Notification manuelle par le Tenant Admin (message personnalisé)
- **Segmentation** : notifier uniquement les abonnés d'une catégorie spécifique
- Statistiques : taux d'ouverture, clics
- Désabonnement depuis le navigateur ou le blog

---

### M17 — Personnalisation du blog

#### M17.1 — Thèmes

- 3 thèmes V1 : **Minimal**, **Magazine**, **Tech**
- Chaque thème : responsive, Core Web Vitals optimisé, dark mode intégré
- Personnalisation par thème : couleur primaire, typographie (5 familles Google Fonts), espacement

#### M17.2 — Dark Mode / Light Mode

- Toggle Dark/Light dans le header du blog public
- Respect de la préférence système (`prefers-color-scheme`)
- Persistance du choix dans localStorage
- Transitions douces entre modes (Framer Motion)
- Dark mode également disponible dans le dashboard admin

#### M17.3 — Identité visuelle

- Logo (header), Favicon
- Couleur primaire (boutons, liens, accents)
- Couleur secondaire
- Message de footer personnalisable
- Liens réseaux sociaux (affichés dans header/footer)

#### M17.4 — Mise en page et widgets

- Sidebar configurable : widgets actifs, ordre (drag & drop)
- Widgets disponibles : articles populaires, catégories, tags, newsletter, biographie auteur, réseaux sociaux
- Nombre d'articles par page
- Page d'accueil : article vedette ou liste chronologique

#### M17.5 — Animations et UX

- Animations d'entrée des éléments (Framer Motion) — configurable : on/off pour les utilisateurs sensibles
- Transitions de page fluides
- Micro-interactions sur les boutons et les cards
- Respect du `prefers-reduced-motion`

---

### M18 — Expérience Lecteur (Reader Experience)

#### M18.1 — Barre de progression de lecture

- Barre horizontale en haut de page indiquant le pourcentage de l'article lu
- Disparaît une fois l'article terminé

#### M18.2 — Mode lecture

- Bouton "Mode lecture" dans les articles : supprime tous les éléments de navigation, publicités, sidebar
- Typographie optimisée pour la lisibilité
- Préférence de police et taille de texte personnalisable par le lecteur

#### M18.3 — Lecture vocale (Voice Narration)

- Bouton "Écouter cet article" dans chaque article texte
- Conversion texte-parole via API TTS (à confirmer : ElevenLabs / Google Cloud TTS / Amazon Polly)
- Player audio intégré avec : lecture/pause, vitesse (0.75x, 1x, 1.25x, 1.5x, 2x), avance rapide
- Langue de lecture = langue de l'article

#### M18.4 — Résumés IA

- Bloc "En résumé" généré automatiquement par IA en haut de chaque article
- Résumé en 3-5 points clés
- Configurable par le Tenant Admin (activer/désactiver, positionner)

#### M18.5 — Marque-pages et liste de lecture

- Les lecteurs connectés (compte NexusBlog) peuvent sauvegarder des articles
- Page "Ma liste de lecture" accessible dans leur profil
- Persistance en base de données (pas uniquement localStorage)

#### M18.6 — Recommandations IA

- Bloc "Articles recommandés pour vous" en fin d'article
- Basé sur : contenu de l'article lu + historique de lecture du visiteur + popularité
- Algorithme de similarité sémantique (embeddings)

#### M18.7 — Lecture hors ligne (PWA Offline)

- Service Worker cache les derniers articles lus
- Message d'indication quand l'article est disponible hors ligne
- Page dédiée des articles disponibles hors ligne

#### M18.8 — Mode Podcast

- Page dédiée listant tous les episodes podcast du blog
- Player audio persistant (barre en bas de page, reste actif lors de la navigation)
- Flux RSS podcast compatible Apple Podcasts, Spotify, Google Podcasts

---

### M19 — API REST Publique

- Versioning : `/api/v1/`
- Format : JSON
- Authentification : API Key (générée dans le dashboard tenant)
- Rate limiting par clé selon le plan
- Documentation Swagger / OpenAPI accessible à `/api/v1/docs`

**Endpoints lecture :**
- `GET /articles` — liste paginée avec filtres
- `GET /articles/{slug}` — article complet
- `GET /categories` — liste des catégories
- `GET /tags` — liste des tags
- `GET /authors` — liste des auteurs

**Endpoints écriture (Tiers Business+) :**
- `POST /articles` — création d'article (statut DRAFT)
- `PUT /articles/{id}` — mise à jour

**Webhooks entrants :**
- Réception d'articles depuis des outils externes (Zapier, Make, etc.)

**CORS** : origines autorisées configurables par tenant

---

### M20 — Facturation et Paiements

#### M20.1 — Passerelles de paiement intégrées (V1)

Deux passerelles sont supportées en V1 :

| Passerelle | Usage | Devise |
|---|---|---|
| **Stripe** | Abonnements SaaS, articles payants, newsletter payante | Multi-devises |
| **PayPal** | Alternative aux abonnements + paiements ad hoc | Multi-devises |

Le tenant choisit sa passerelle préférée dans les paramètres de paiement.  
Pour les tenants Enterprise, les deux passerelles peuvent être actives simultanément.

#### M20.2 — Abonnements SaaS (Tenant → Plateforme)

- Changement de plan : upgrade immédiat avec prorata, downgrade à la prochaine période
- Gestion des limites : blocage + CTA upgrade à 100%, email d'avertissement à 80%
- Période d'essai : 14 jours sur plan Pro (carte requise, pas de débit pendant l'essai)
- Factures PDF générées automatiquement à chaque paiement
- Informations de facturation modifiables (nom, société, adresse, numéro de TVA)
- Webhooks Stripe/PayPal pour la gestion automatique des événements (paiement réussi, échoué, remboursement)

#### M20.3 — Monétisation du contenu (Lecteur → Tenant)

- **Articles payants** : lecteur paie pour accéder à un article premium
  - Prix par article configurable (min : 0.50 USD)
  - Commission plateforme : 5% du montant (reversé à NexusBlog)
  - Accès à vie après paiement (aucune expiration)

- **Newsletter payante** : lecteur souscrit un abonnement mensuel ou annuel
  - Prix mensuel et annuel configurables par le tenant
  - Stripe Subscriptions / PayPal Subscriptions
  - Gestion automatique des renouvellements, résiliations, remboursements
  - Commission plateforme : 5%

#### M20.4 — Paiement des campagnes publicitaires (Annonceur → Tenant)

- Après approbation d'une soumission publicitaire, un lien de paiement Stripe/PayPal est envoyé à l'annonceur
- Budget minimum : 50 USD (configurable par tenant avec minimum plateforme de 10 USD)
- Activation automatique de la campagne à réception du paiement confirmé
- **Génération automatique de facture** envoyée à l'annonceur par email
- Tableau de revenus publicitaires dans le dashboard tenant

#### M20.5 — Dashboard financier du Tenant Admin

- Revenus totaux (abonnements lecteurs + articles payants + publicité)
- Revenus par source (ventilés)
- Historique de toutes les transactions
- Paiements en attente / confirmés / remboursés
- Export CSV des transactions
- Informations pour la déclaration fiscale (revenus bruts, commissions plateforme déduites)

#### M20.6 — Dashboard financier Super Admin

- MRR / ARR global de la plateforme
- Commissions perçues sur les transactions tenant-lecteur
- Revenus par plan d'abonnement
- Churn et LTV (Lifetime Value) par cohorte
- Remboursements et litiges en cours

---

### M21 — Intelligence Artificielle (Consolidated AI Layer)

Tous les services IA de la plateforme sont orchestrés par un module central qui :
- Route les requêtes vers le bon fournisseur selon le type de tâche
- Gère le cache des résultats (Redis) pour éviter les appels redondants
- Track la consommation IA par tenant pour les limites de plan
- Permet aux tenants Enterprise d'utiliser leur propre clé API

**Fournisseurs IA (à confirmer en Phase 2) :**

| Tâche IA | Fournisseur suggéré |
|---|---|
| Rédaction / complétion / reformulation | OpenAI GPT-4o / Anthropic Claude |
| Correction grammaire | OpenAI / LanguageTool API |
| Traduction | DeepL API / Google Cloud Translation |
| Modération commentaires | OpenAI Moderation API + modèle personnalisé |
| Génération d'images / thumbnails | OpenAI DALL-E 3 / Stability AI |
| Alt text images | OpenAI Vision / Google Cloud Vision |
| Résumés articles | OpenAI GPT-4o / Anthropic Claude |
| TTS (lecture vocale) | ElevenLabs / Google Cloud TTS |
| Transcription audio | OpenAI Whisper |
| Similarité sémantique (recommandations) | OpenAI Embeddings / Sentence Transformers |
| Détection plagiat | Copyscape API / modèle interne |

---

### M22 — Administration Super Admin

- Interface `/superadmin` — accès exclusif `SUPER_ADMIN`
- Liste complète des tenants (statut, plan, MRR, date création)
- Accès en lecture auditée à tout tenant (chaque accès logué)
- Suspension / réactivation / suppression forcée d'un tenant
- Gestion des signalements de contenu
- Logs d'audit de toutes les actions (immuables)
- Modification des plans et limites sans redéploiement
- Envoi d'emails broadcast vers tous les tenants
- Dashboard métriques plateforme (MRR, ARR, churn, santé infra)
- Gestion des providers IA globaux (clés API plateforme)

---

## 7. User Stories

*(Sélection des plus critiques — liste complète en annexe)*

### Authentification & Onboarding

| ID | En tant que | Je veux | Priorité |
|---|---|---|---|
| US-001 | Visiteur | M'inscrire avec Google | Must Have |
| US-002 | Visiteur | M'inscrire par email/mot de passe | Must Have |
| US-003 | Nouvel utilisateur | Créer mon blog en < 5 min (wizard) | Must Have |
| US-004 | Tenant Admin | Inviter un collaborateur avec un rôle | Must Have |
| US-005 | Tenant Admin | Activer la 2FA | Should Have |

### Contenu & Édition

| ID | En tant que | Je veux | Priorité |
|---|---|---|---|
| US-010 | Auteur | Créer un article avec l'éditeur riche | Must Have |
| US-011 | Auteur | Publier un podcast avec lecteur audio | Must Have |
| US-012 | Auteur | Uploader une vidéo avec player intégré | Must Have |
| US-013 | Auteur | Embedder un TikTok / Instagram | Must Have |
| US-014 | Auteur | Utiliser l'assistant IA pour continuer la rédaction | Should Have |
| US-015 | Auteur | Programmer la publication d'un article | Must Have |
| US-016 | Author (rôle) | Soumettre mon article pour approbation | Must Have |
| US-017 | Éditeur | Approuver ou rejeter un article soumis | Must Have |
| US-018 | Auteur | Détecter le plagiat avant publication | Should Have |

### Réseaux Sociaux

| ID | En tant que | Je veux | Priorité |
|---|---|---|---|
| US-030 | Tenant Admin | Connecter mes comptes LinkedIn et Twitter | Must Have |
| US-031 | Auteur | Publier automatiquement sur mes réseaux à la publication d'un article | Must Have |
| US-032 | Tenant Admin | Voir la caption IA générée avant envoi et la modifier | Must Have |
| US-033 | Tenant Admin | Voir le rapport de distribution sociale de chaque article | Should Have |

### Multilangue

| ID | En tant que | Je veux | Priorité |
|---|---|---|---|
| US-040 | Lecteur | Lire un article dans ma langue automatiquement | Must Have |
| US-041 | Lecteur | Changer la langue via un switcher | Must Have |
| US-042 | Tenant Admin | Activer uniquement certaines langues | Must Have |
| US-043 | Lecteur | Voir un commentaire traduit dans ma langue | Should Have |

### Publicité

| ID | En tant que | Je veux | Priorité |
|---|---|---|---|
| US-050 | Tenant Admin | Configurer mon code AdSense | Must Have |
| US-051 | Tenant Admin | Gérer le rotateur de bannières de mon blog | Must Have |
| US-052 | Annonceur | Soumettre ma publicité via le formulaire public | Must Have |
| US-053 | Tenant Admin | Voir les impressions par bannière | Should Have |

### Expérience Lecteur

| ID | En tant que | Je veux | Priorité |
|---|---|---|---|
| US-060 | Lecteur | Activer le dark mode | Must Have |
| US-061 | Lecteur | Écouter la lecture vocale d'un article | Should Have |
| US-062 | Lecteur | Sauvegarder un article dans ma liste de lecture | Should Have |
| US-063 | Lecteur | Lire un article hors ligne | Could Have |
| US-064 | Lecteur | Voir le résumé IA en haut de l'article | Should Have |

---

## 8. Règles métier

| ID | Règle | Raison |
|---|---|---|
| RG-001 | Le slug de sous-domaine est immuable après création | Préserve les liens existants |
| RG-002 | Les bannières publicitaires **peuvent contenir un lien cliquable** (URL fournie par l'annonceur). Le lien s'ouvre dans un nouvel onglet. Toute URL est soumise à un scan de sécurité toutes les heures (Google Safe Browsing + VirusTotal + URLhaus + PhishTank). Un lien détecté dangereux entraîne la désactivation immédiate de la campagne et déclenche un remboursement automatique. | Protection des visiteurs du blog |
| RG-003 | Double opt-in newsletter — non contournable | RGPD + CAN-SPAM compliance |
| RG-004 | Isolation des données tenant : RLS PostgreSQL + middleware | Sécurité multi-tenant critique |
| RG-005 | Chaque accès Super Admin à un tenant est logué avec identité + heure + raison | Accountability et audit |
| RG-006 | Budget minimum soumission publicitaire : 50 USD | Seuil anti-spam économique |
| RG-007 | Révocation immédiate de tous les refresh tokens lors de suspension ou changement de mot de passe | Sécurité session |
| RG-008 | Les `AUTHOR` ne publient jamais directement — ils soumettent pour approbation | Contrôle qualité éditorial |
| RG-009 | Suppression tenant : 30 jours de grâce + export données avant suppression définitive | RGPD article 17 |
| RG-010 | Score de risque commentaire > 70 = rejet automatique (non configurable) | Plancher de sécurité non négociable |
| RG-011 | La canonical URL pointe vers le domaine personnalisé (si configuré) | SEO — éviter le contenu dupliqué |
| RG-012 | Les thumbnails pour réseaux sociaux aux dimensions officielles sont générés automatiquement à chaque publication | Cohérence de l'image de marque |

---

## 9. Exigences non fonctionnelles (synthèse)

*(Détaillées dans le Cahier des Charges Technique — Phase 2)*

| Catégorie | Exigence |
|---|---|
| **Performance** | API < 200ms P95 ; Page publique < 1.5s P95 ; Elasticsearch < 50ms |
| **Disponibilité** | 99.9% mensuel hors maintenance planifiée |
| **Scalabilité** | 10 000 tenants actifs ; Kubernetes auto-scaling |
| **Sécurité** | OWASP Top 10, WAF, CSRF, XSS, SQLi, DDoS mitigation, Rate limiting, Secure file upload |
| **Accessibilité** | WCAG 2.1 niveau AA sur interfaces publiques |
| **Internationalisation** | 100+ langues, RTL complet |
| **Compatibilité navigateurs** | Chrome, Firefox, Safari, Edge — 2 dernières versions majeures |
| **Mobile** | Mobile-first, PWA installable, Offline reading |
| **SEO technique** | Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1) |
| **Conformité** | RGPD, CAN-SPAM, WCAG 2.1 |
| **Observabilité** | Logs structurés, distributed tracing, métriques Prometheus |

---

## 10. Contraintes et hypothèses

### Contraintes techniques (non négociables)

| ID | Contrainte |
|---|---|
| CT-001 | Stockage médias : **Cloudinary** uniquement |
| CT-002 | Authentification : **Firebase Auth** (pas de gestion interne des mots de passe) |
| CT-003 | Déploiement : **Docker + Kubernetes** |
| CT-004 | Base de données : **Neon PostgreSQL** (serverless — scaling automatique, branching Git-like, connection pooling intégré via PgBouncer) |
| CT-005 | Cache + gestion tokens : **Redis** |
| CT-006 | Recherche full-text : **Elasticsearch** |
| CT-006 | Les publicités du rotateur **peuvent être cliquables** (lien optionnel fourni par l'annonceur). Toute URL est scannée toutes les heures via Google Safe Browsing + VirusTotal + URLhaus + PhishTank. |
| CT-007 | Double opt-in newsletter non contournable |
| CT-008 | Backend en **Python FastAPI** uniquement (pas NestJS) |
| CT-009 | Frontend en **Next.js + TypeScript + Tailwind CSS + ShadCN UI + Framer Motion** |
| CT-010 | Paiement : **Stripe + PayPal** intégrés en V1 (abonnements + contenu payant + publicité) |

### Hypothèses

| ID | Hypothèse |
|---|---|
| H-001 | Les fournisseurs IA (OpenAI, DeepL, ElevenLabs) seront confirmés en Phase 2 |
| H-002 | L'intégration Stripe (paiements) est cible V1 ou V2 — à confirmer |
| H-003 | WhatsApp Channel et TikTok APIs peuvent avoir des restrictions d'accès — à vérifier en Phase 5 |
| H-004 | La détection de plagiat se base sur des APIs tierces (Copyscape) — non développé en interne |
| H-005 | Le multi-région déploiement est architecturé en V1 mais activé en V2 |

---

## 11. Questions ouvertes à valider

Les points suivants nécessitent une décision avant la Phase 2 (Cahier des Charges Technique).

| # | Question | Impact | Proposition par défaut |
|---|---|---|---|
| ~~Q1~~ | ~~Stripe en V1 ou V2 ?~~ | **FERMÉ — Stripe + PayPal intégrés en V1. Décision validée.** | — |
| Q2 | **Fournisseur IA principal ?** | Architecture du module IA, coûts | OpenAI GPT-4o pour texte + DALL-E 3 pour images |
| Q3 | **Fournisseur TTS (lecture vocale) ?** | Qualité de la voix, coût | ElevenLabs (qualité premium) |
| Q4 | **Fournisseur traduction ?** | Qualité, langues supportées, coût | DeepL API (meilleure qualité européenne) |
| Q5 | **AMP en V1 ou V2 ?** | Complexité technique élevée | V2 |
| Q6 | **Heatmaps : outil tiers ou développé en interne ?** | Complexité | Intégration Microsoft Clarity (gratuit) |
| Q7 | **Format de l'URL multilingue ?** | SEO, UX | Sous-chemin `/fr/` recommandé vs sous-domaine `fr.blog.com` |
| Q8 | **Budget minimum publicité : 50 USD fixe ou configurable par tenant ?** | Flexibilité tenant | Configurable par le tenant, avec minimum plateforme de 10 USD |

---

## 12. Glossaire

| Terme | Définition |
|---|---|
| **Tenant** | Instance de blog isolée appartenant à un client de la plateforme |
| **Tenant Admin** | Propriétaire et administrateur d'un tenant |
| **Super Admin** | Opérateur de la plateforme NexusBlog — accès global |
| **RBAC** | Role-Based Access Control — contrôle d'accès basé sur les rôles |
| **RLS** | Row-Level Security — isolation des données tenant au niveau SQL PostgreSQL |
| **JWT** | JSON Web Token — token d'authentification signé côté backend |
| **Refresh Token** | Token longue durée permettant de renouveler un JWT expiré |
| **FCM** | Firebase Cloud Messaging — service de notifications push Google |
| **MRR / ARR** | Monthly / Annual Recurring Revenue |
| **Churn** | Taux de désabonnement mensuel |
| **Double opt-in** | Confirmation en deux étapes d'un abonnement email |
| **RGPD** | Règlement Général sur la Protection des Données (UE 2016/679) |
| **PWA** | Progressive Web App — application web installable sur mobile |
| **AMP** | Accelerated Mobile Pages — format Google pour pages mobiles ultra-rapides |
| **SSR / SSG / ISR** | Server-Side Rendering / Static Generation / Incremental Static Regeneration (Next.js) |
| **RTL** | Right-To-Left — direction d'écriture pour l'arabe, l'hébreu, etc. |
| **CDN** | Content Delivery Network — réseau de distribution de contenu |
| **UTM** | Urchin Tracking Module — paramètres d'URL pour le suivi de trafic |
| **Shadow ban** | Bannissement silencieux — l'utilisateur croit publier, les autres ne voient pas |
| **Weighted Round Robin** | Algorithme de rotation pondérée par poids |
| **LCP / INP / CLS** | Core Web Vitals — métriques de performance Google (Largest Contentful Paint, etc.) |
| **WAF** | Web Application Firewall — pare-feu applicatif |
| **Canonical URL** | URL de référence d'une page pour les moteurs de recherche |
| **Webhook** | Notification HTTP vers un endpoint tiers lors d'un événement |
| **TTS** | Text-to-Speech — synthèse vocale |
| **Embedding** | Représentation vectorielle d'un texte pour la similarité sémantique |
| **CPM** | Cost Per Mille — coût pour 1000 impressions publicitaires |

---

*Document suivant : [02_cahier_des_charges_technique.md](./02_cahier_des_charges_technique.md)*  
*Version historique : v1.0 archivée dans git*
