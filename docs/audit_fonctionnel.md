# NexusBlog SaaS — Audit Fonctionnel Complet
**Cahier des charges v3.0 — Audit technique réel au 2026-07-09**

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✅ | Implémenté — backend + frontend opérationnel |
| 🔶 | Partiel — backend ✅ mais frontend manquant (ou l'inverse) |
| ❌ | Non implémenté |

---

## Résumé global

| Statut | Fonctionnalités |
|--------|----------------|
| ✅ Complet | ~131 |
| 🔶 Partiel | ~35 |
| ❌ À faire | ~239 |
| **Total** | **~405** |
| **Avancement réel** | **~40%** *(était déclaré ~20% — le vrai chiffre est le double)* |

> **v3.0 — 2026-07-09** — Audit complet du code source (backend + frontend). Beaucoup de fonctionnalités étaient marquées ❌ alors qu'elles sont bel et bien implémentées. Corrections appliquées sur M1–M22. Ajout M23 + M24 (directives PDG du 2026-07-08).

---

## M1 — Authentification & Identités

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Google Sign-In via Firebase | `auth.py` — Firebase ID Token → JWT interne |
| ✅ | Email / mot de passe via Firebase | Même flux, `sign_in_provider` stocké |
| ✅ | JWT Access Token (15 min) + Refresh Token rotatif | Cookie HttpOnly, blacklist Redis au logout |
| ✅ | RBAC : SUPER_ADMIN, TENANT_ADMIN, EDITOR, AUTHOR, VIEWER | `enums.py` UserRole + `dependencies.py` `require_role()` |
| ✅ | Onboarding wizard 4 étapes | `blogs/new/page.tsx` |
| 🔶 | 2FA TOTP via Google Authenticator | Backend ✅ (`/auth/2fa/setup`, `/auth/2fa/verify`, `DELETE /auth/2fa`) — QR code SVG + backup codes. Frontend : page profil à vérifier |
| ❌ | Email de bienvenue automatique après inscription | |
| ❌ | Checklist post-inscription | |
| 🔶 | Révocation tokens Redis lors suspension | Logout blacklist ✅ — suspension via superadmin invalide cache Redis tenant ✅ — changement mot de passe ❌ |

---

## M2 — Gestion des Tenants

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Isolation RLS PostgreSQL + middleware applicatif | `database.py` set_config + `TenantMiddleware` |
| ✅ | Sous-domaine {slug}.nexusblog.io (unique, immuable) | `TenantMiddleware` résout par slug → Redis → DB |
| ✅ | Paramètres généraux : nom, description, logo, favicon, langue, timezone | `tenants.py` PATCH + `general/page.tsx` |
| ✅ | Paramètres SEO globaux | `Tenant` model : seo_title_template, ga4, matomo, facebook_pixel |
| 🔶 | Custom domains : saisie → CNAME → vérification → SSL | Table `custom_domains` ✅ + middleware résolution ✅ — UI dashboard ❌ — Let's Encrypt automation ❌ |
| ❌ | Renouvellement automatique certificat SSL | |
| ❌ | Redirection HTTP → HTTPS sur domaines personnalisés | |
| ✅ | Collaborateurs : invitation email + rôle (validité 48h→7j) | `team.py` + `UserInvitation` model + email Resend |
| ✅ | Modification / révocation de rôle en temps réel | `team.py` PATCH + DELETE |
| ❌ | Historique des accès par membre | |
| 🔶 | Période d'essai 14 jours | Champ `trial_ends_at` ✅ — logique checkout + blocage ❌ |
| ❌ | Downgrade vers Starter à expiration | |
| ❌ | Suppression tenant : 30 jours grâce + export + suppression définitive | Soft delete uniquement |
| ✅ | Intégrations GA4, Matomo, Facebook Pixel | Champs DB + `general/page.tsx` |

---

## M3 — Types de Contenu

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Article texte riche (M3.1) | |
| ✅ | Sélecteur de type dans l'éditeur | `ArticleType` enum : article/photo/video/audio/podcast/mixed |
| ✅ | Champs spécifiques : audio_url, video_url, episode_number, season | Migration 011 ajoute `episode_number`, `season` |
| ✅ | Badge type dans la liste des articles | |
| ❌ | Photo / Galerie multi-images avec légendes | |
| 🔶 | Vidéo embed | Extension Tiptap YouTube installée (`@tiptap/extension-youtube`) — non confirmé dans l'éditeur |
| ✅ | Player audio avancé | `PersistentAudioPlayer.tsx` : skip ±15s, vitesse 0.5×–2×, volume, seek |
| ❌ | Transcription automatique IA des fichiers audio | Backend OpenAI Whisper disponible, non exposé |
| ✅ | Flux RSS podcast | `GET /public/{slug}/podcast/rss` — format iTunes complet |
| ✅ | Page dédiée série podcast | `(blog)/[slug]/podcast/page.tsx` |
| ✅ | Rendu public articles audio/podcast | `PersistentAudioProvider` dans blog layout |

---

## M4 — Éditeur de Contenu Riche

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Éditeur Tiptap/ProseMirror (WYSIWYG) | `RichEditor.tsx` |
| ✅ | Titres H1-H4, paragraphes, gras, italique, souligné, barré | StarterKit + Underline extension |
| ✅ | Listes à puces ordonnées / non ordonnées | StarterKit |
| ✅ | Upload image via Cloudinary | |
| ✅ | Liens hypertextes, séparateurs horizontaux | Link + HorizontalRule extensions |
| ❌ | Autosave automatique toutes les 30 secondes | |
| ✅ | Historique des versions | `article_versions` table + `GET /{id}/versions` + `getVersions` API |
| ❌ | Mode Focus plein écran | |
| ❌ | Mode Markdown avec prévisualisation splitée | |
| ❌ | Drag & Drop de blocs | |
| 🔶 | Tableaux inline | `@tiptap/extension-table` installé — intégration dans RichEditor à confirmer |
| 🔶 | To-do list avec cases à cocher | `@tiptap/extension-task-item` + `task-list` installés |
| 🔶 | Blocs de code avec coloration syntaxique | `@tiptap/extension-code-block-lowlight` + `lowlight` installés |
| ❌ | Callouts : info / avertissement / danger / succès | |
| ❌ | Boutons Call-to-Action | |
| ❌ | Galerie d'images inline | |
| ❌ | Upload vidéo MP4/WebM dans l'éditeur | |
| ❌ | Upload audio MP3/WAV dans l'éditeur | |
| 🔶 | Embeds vidéo par URL | `@tiptap/extension-youtube` installé — intégration à confirmer |
| ❌ | Iframes intégrées | |
| ❌ | Picker émoji | |
| 🔶 | Mentions @auteur | `@tiptap/extension-mention` installé |
| 🔶 | Couleur de texte + arrière-plan | `@tiptap/extension-color` + `highlight` installés |
| 🔶 | Police de caractères | `@tiptap/extension-font-family` installé |
| 🔶 | Compteur mots / caractères / temps de lecture | `@tiptap/extension-character-count` installé |
| ❌ | Prévisualisation desktop / tablet / mobile depuis l'éditeur | |
| ❌ | Commandes IA via `/` | Backend IA disponible — menu slash non implémenté |

---

## M5 — Métadonnées & Workflow de Publication

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Métadonnées : titre, slug auto, extrait, image à la une, catégorie, tags, SEO | `ArticleEditorSidebar` |
| ✅ | Open Graph : titre, description, image | `og_image_url` + `Article` model |
| ✅ | Statuts DRAFT → PUBLISHED | |
| ✅ | Visibilité : public / privé | `ContentVisibility` enum : PUBLIC/PRIVATE/PAID |
| ✅ | Statut IN_REVIEW : soumission par AUTHOR | `POST /articles/{id}/submit-review` |
| ✅ | Statut APPROVED : validé par EDITOR/ADMIN | `POST /articles/{id}/approve` |
| ✅ | Statut REJECTED avec commentaire | `POST /articles/{id}/reject` + `rejection_reason` (migration 011) |
| 🔶 | Statut SCHEDULED → PUBLISHED auto | `scheduled_at` champ ✅ + endpoint soumission ✅ — tâche ARQ auto-publish ❌ |
| ✅ | Statuts UNPUBLISHED et ARCHIVED | `POST /{id}/unpublish` + `POST /{id}/archive` |
| 🔶 | File d'approbation | Backend complet ✅ — UI dédiée "in_review queue" à confirmer dans le frontend |
| ❌ | Journal d'approbation | |
| ❌ | Notifications in-app + email aux Éditeurs lors soumission | |
| ❌ | Notification auteur après publication | |
| ❌ | Fuseau horaire tenant respecté pour la programmation | |
| ✅ | Canonical URL | `canonical_url` (migration 011) |
| ✅ | Robots noindex par article | `robots_noindex` (migration 011) |
| ❌ | JSON-LD automatique | |

---

## M6 — Catégories & Tags

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Catégories : créer, éditer, supprimer, slug auto, description | `categories.py` CRUD + `categories/page.tsx` |
| ✅ | Tags : créer, gérer, assigner aux articles | `tags.py` CRUD + `ArticleTag` pivot |
| ✅ | Pages de listing publiques par catégorie et par tag | `(blog)/[slug]/categories/` |
| 🔶 | Hiérarchie catégories 2 niveaux (parent / enfant) | Champ `parent_id` sur `Category` ✅ — UI drag&drop hiérarchie ❌ |
| 🔶 | Image de couverture pour les catégories | `cover_image_url` sur `Category` ✅ — UI d'upload ❌ |
| ✅ | Couleur de catégorie | `color` (migration 012) + UI dashboard |
| ❌ | Ordre configurable par drag & drop | `sort_order` champ DB ✅ — DnD UI ❌ |
| ✅ | Protection suppression si articles publiés | `DELETE /categories/{id}` bloqué si articles liés (sauf `force=true`) |
| ❌ | IA suggestion catégorie | |
| ❌ | IA suggestion tags | |
| ✅ | Fusion tags | `POST /tags/merge` — fusionne N tags vers un tag cible |
| ❌ | Nuage de tags widget | |

---

## M7 — Gestion des Médias

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Page Médiathèque (galerie UI avec filtres type/date) | `media/page.tsx` + `mediaApi` |
| ✅ | Upload image via Cloudinary | `POST /media/upload` + `media.py` |
| ❌ | Upload vidéo : MP4/WebM/MOV, max 500 MB | Cloudinary supporte mais non exposé |
| ❌ | Upload audio : MP3/WAV/OGG/M4A/FLAC, max 100 MB | |
| ❌ | Upload PDF : max 50 MB | |
| ❌ | Pipeline : compression, srcset (400/800/1200/1600px), WebP/AVIF | |
| ❌ | Thumbnail vidéo automatique | |
| ❌ | Alt text automatique IA | Backend OpenAI Vision disponible, non exposé |
| ❌ | Tagging IA automatique des images | |
| ❌ | Scan sécurité upload | |
| ❌ | Transcodage vidéo multi-qualité | |
| ❌ | Normalisation audio | |
| ❌ | Détection droits IA | |
| ❌ | Recherche médiathèque par nom / alt text / tag | Champ `q` côté API ✅ — UI non confirmée |
| ✅ | Détails complets (dimensions, poids, format, URL, date) | `Media` model : width, height, file_size_bytes, format, secure_url |
| ❌ | Avertissement suppression si media utilisé dans article | |

---

## M8 — Système de Commentaires

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Commentaires anonymes (prénom + email obligatoires) | `engagement.py` POST /comments public |
| ✅ | File de modération : approuver, refuser, spam | `moderation.py` PATCH /comments/{id} |
| ✅ | Suppression de commentaire | `DELETE /comments/{id}` |
| ✅ | Statistiques : total / pending / approved / rejected / spam | `GET /moderation/comments/stats` |
| ✅ | Filtres par statut + recherche | `moderation.py` : status, article_id, search |
| 🔶 | Réponses imbriquées (1 niveau threading) | `parent_id` sur `Comment` ✅ — UI threading ❌ |
| ❌ | Upload image dans les commentaires | |
| ❌ | Picker émoji dans les commentaires | |
| ❌ | Formatage basique (gras, italique, lien) | |
| ❌ | Pipeline IA modération (score toxicité) | |
| ❌ | Rejet automatique si score > 70 | |
| ❌ | Modération manuelle score 31–70 avec raison IA | |
| 🔶 | Shadow ban | `CommentStatus.SHADOW_BANNED` enum ✅ — logique et UI ❌ |
| ✅ | Bannissement par email ou IP | `CommentBan` model + `POST /bans` + `GET /bans` + `DELETE /bans/{id}` |
| ✅ | Liste de blocage gérée | `moderation.py` bans CRUD |
| ❌ | Liste de mots-clés interdits personnalisable | |
| ❌ | Bouton "Signaler" pour lecteurs | |
| ❌ | CAPTCHA pour IP suspectes | |
| ❌ | Rate limiting max 5 commentaires/heure | |
| ✅ | Mode global : OPEN / MODERATED / CLOSED | `CommentsMode` enum + `Tenant.comments_mode` |
| ✅ | Override par article : activer/désactiver commentaires | `Article.allow_comments` + `articles.comments_closed_at` |
| ❌ | Seuils score IA ajustables par tenant | |
| 🔶 | Fermeture automatique après N jours | `Tenant.comments_close_after_days` ✅ — logique auto-close ❌ |

---

## M9 — Newsletter & Abonnés

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Statistiques basiques (total, ce mois, désabonnements) | |
| ✅ | Double opt-in obligatoire | `newsletter.py` : email confirmation token + Resend |
| ✅ | Page de désabonnement | `GET /newsletter/unsubscribe/{token}` |
| ✅ | Consentement enregistré (timestamp, IP, source) | `NewsletterSubscriber` : confirmed_at, ip_address, source |
| ✅ | Liste abonnés filtrable (statut, date, source) | `GET /subscribers` avec filtres status, q, cursor |
| ✅ | Export CSV | `GET /subscribers/export` — UTF-8 BOM |
| ❌ | Import CSV | |
| ❌ | Segmentation par tags / listes | `NewsletterSubscriber.tags` champ JSON ✅ — logique segmentation ❌ |
| ❌ | Métriques par abonné | |
| 🔶 | Éditeur de newsletter | `createCampaign` API ✅ — UI éditeur email builder ❌ |
| ❌ | Création newsletter depuis un article existant | |
| ❌ | Test d'envoi à l'adresse admin | |
| 🔶 | Envoi immédiat | `POST /campaigns/{id}/send` ✅ — ARQ batch réel ❌ (TODO dans le code) |
| ❌ | Envoi programmé | `NewsletterCampaign.scheduled_at` ✅ — ARQ scheduler ❌ |
| ✅ | Statistiques campagne (envoi / ouverture / clics / désabonnements / bounces) | Compteurs sur `NewsletterCampaign` model |
| ❌ | Newsletter payante | `Campaign.is_paid` + `price` champs ✅ — flow paiement ❌ |
| ❌ | Widgets d'abonnement : popup, sidebar, footer | Formulaire inline article ✅ — autres widgets ❌ |

---

## M10 — Automatisation Réseaux Sociaux

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Page Réseaux Sociaux dans le dashboard | `social/page.tsx` |
| ❌ | OAuth flows (Facebook, Instagram, LinkedIn, X, TikTok, Threads…) | `POST /social/accounts` accepte raw token — pas de redirect OAuth |
| ✅ | Gestion des posts sociaux (créer, programmer, lister, supprimer) | `social.py` posts CRUD + `scheduled_at` |
| ✅ | Publication immédiate | `POST /posts/{id}/publish` (TODO ARQ réel) |
| ❌ | Auto-post à la publication d'un article | |
| ✅ | Délai de publication configurable | `SocialPost.scheduled_at` |
| ❌ | Template de caption personnalisable par plateforme | |
| ❌ | Caption IA adaptée au ton | |
| ❌ | Hashtags IA (5–15 par plateforme) | |
| ❌ | Thumbnail IA aux bonnes dimensions | |
| ❌ | UTM parameters automatiques | |
| ❌ | Tableau de bord impressions / clics / engagement | |
| ❌ | Meilleur moment de publication IA | |
| ✅ | Historique publications (succès / échec / en attente) | `GET /social/posts` avec filtres status |
| ❌ | Retry automatique (3 tentatives exponentielles) | |
| ❌ | Notification admin si échec persistant | |

---

## M11 — Système Multi-langues

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| 🔶 | i18n UI plateforme : EN + FR | `next-intl` + `en.json` + `fr.json` ✅ — langues blog public (détection auto, switcher) ❌ |
| ❌ | Détection langue navigateur | |
| ❌ | Traduction automatique des articles (DeepL) | DeepL SDK installé — non exposé côté blog |
| ❌ | Cache Redis des traductions | |
| ❌ | Traduction des commentaires à la lecture | |
| ❌ | Traduction des métadonnées | |
| ❌ | Support RTL complet | |
| ❌ | URLs multilingues SEO-friendly | |
| ❌ | Balises hreflang générées automatiquement | |
| ❌ | Sitemap XML multilingue | |
| ❌ | Switcher de langue sur le blog public | |
| ❌ | Activation / désactivation des langues par tenant | |
| ❌ | Override de traduction manuelle | |

---

## M12 — Système Publicitaire

> **RG-AD-01** — Commission plateforme **20%** prélevée à l'achat sur tous les slots publicitaires (tous plans, y compris Gratuit). Décomposition : 50% → compte société NexusBlog (4101) ; 50% → programme d'affiliation (2810, voir M23).

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Formulaire de soumission annonce (public, sans auth) | `POST /ads/submit` + page `advertise/page.tsx` |
| ✅ | Liste annonces avec statuts (All / Pending / Active / Paused / Rejected) | `GET /ads` + `ads/page.tsx` |
| ✅ | Statistiques (impressions, clics, CTR) | Compteurs sur `Ad` model |
| ✅ | Pause / Resume d'une campagne | `POST /ads/{id}/pause` + `resume` |
| ✅ | Approbation / rejet (EDITOR+) | `POST /ads/{id}/review` |
| ✅ | Scan URL multi-sources en temps réel | Google Safe Browsing + VirusTotal + URLhaus + PhishTank (ads.py scan endpoint) |
| ✅ | Désactivation automatique si URL dangereuse | Resume bloqué si `link_safety_status = DANGEROUS` |
| ✅ | Historique des scans horodatés | `AdLinkScan` model — scans /, safety_status, sources, scanned_at |
| ✅ | Rotateur pondéré (Weighted Round Robin) | `GET /public/{slug}/ads/rotator` — pondération par budget |
| ✅ | Tracking impressions + clics (public) | `POST /ads/{id}/impression` + `/click` |
| ❌ | Prélèvement automatique 20% à l'activation paiement | Logique de split non implémentée |
| ❌ | Ventilation comptable automatique (M24) | |
| ❌ | Intégration Google AdSense | |
| ❌ | Intégration Media.net | |
| ❌ | Code publicitaire personnalisé (JS/iframe) | |
| ❌ | Planification campagne auto-expiration | `starts_at` / `ends_at` champs ✅ — ARQ scheduler ❌ |
| ❌ | Lien paiement Stripe/PayPal généré après approbation | `AdSubmissionStatus.PAYMENT_PENDING` ✅ — génération lien ❌ |
| ❌ | Activation campagne au webhook de paiement confirmé | |
| ❌ | Remboursement automatique si désactivation sécurité | |
| ❌ | Rapport hebdomadaire sécurité publicitaire | |
| ❌ | Détection fraude (bots, IP farming) | |
| ❌ | Budget minimum configurable par tenant | |
| ❌ | Lazy-loading publicités | |

---

## M13 — Analytics & Tableau de Bord

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Vues totales par période (7j / 30j / 90j) | `GET /analytics/overview` |
| ✅ | Sessions uniques (visiteurs) | `unique_sessions` dans DailyAnalytics |
| ✅ | Durée moyenne de lecture | `avg_duration_seconds` |
| ✅ | Graphique vues par jour | Bar chart interactif dans `analytics/page.tsx` |
| ✅ | Top 8 articles par vues | `overview` response |
| ✅ | Top 8 sources de trafic (referrers) | `top_referrers` dans DailyAnalytics |
| 🔶 | Géolocalisation : pays | `PageView.country_code` ✅ — UI carte ❌ |
| 🔶 | Appareils : desktop / mobile / tablet + navigateur + OS | `PageView.device_type`, `browser`, `os` ✅ — UI ❌ |
| ❌ | Taux de rebond | |
| ❌ | Temps de lecture moyen par article | |
| ❌ | Évolution sur périodes custom | |
| ✅ | Intégration GA4 | `Tenant.ga4_measurement_id` + `ViewTracker.tsx` |
| ✅ | Intégration Matomo | `Tenant.matomo_url` + `matomo_site_id` |
| ❌ | Heatmaps (Microsoft Clarity) | |
| ✅ | Scroll depth | `PageView.scroll_depth_pct` tracked par `ViewTracker.tsx` |
| ❌ | Taux de conversion newsletter | |
| ❌ | Revenus par source | |
| ❌ | Export données brutes CSV | |
| ❌ | Webhooks vers outils tiers (Segment, Mixpanel) | |
| ❌ | Analytics réseaux sociaux | |
| ❌ | Analytics publicitaires (CPM, revenus par bannière) | |
| 🔶 | Dashboard Super Admin : MRR / ARR / santé infra | `GET /superadmin/stats` ✅ — dashboard UI ❌ |

---

## M14 — SEO

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Meta title + meta description par article | `Article.seo_title`, `seo_description`, `seo_keywords` |
| ✅ | Open Graph + Twitter Cards | `og_image_url` + `Article` model |
| ✅ | Page paramètres SEO globaux | `seo/page.tsx` + `Tenant.seo_title_template` |
| ✅ | SEO par article dans la sidebar éditeur | |
| ❌ | JSON-LD automatique | |
| ✅ | Canonical URL | `Article.canonical_url` (migration 011) |
| ❌ | Balises hreflang | |
| ✅ | Robots noindex par article | `Article.robots_noindex` (migration 011) |
| ❌ | Redirections 301 automatiques en cas de changement slug | |
| ✅ | Sitemap XML dynamique | `GET /public/{slug}/sitemap.xml` |
| ❌ | robots.txt configurable par tenant | `Tenant.robots_txt` champ ✅ — endpoint ❌ |
| ❌ | Vérification Google Search Console | |
| ❌ | Score SEO IA | Backend `POST /ai/seo` ✅ — intégration éditeur en temps réel ❌ |
| ❌ | Suggestions de liens internes IA | |
| ❌ | SSG pour pages stables | |
| ❌ | ISR pour articles populaires | |
| ❌ | AMP | |

---

## M15 — Recherche (Elasticsearch)

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Setup Elasticsearch + client async | `elasticsearch[async]` installé + `search.py` |
| ❌ | Mapping et index initial | Non confirmé dans le code — pas de migration ES |
| ❌ | Indexation automatique à chaque publication | |
| ✅ | Barre de recherche blog public | `GET /search/public` : q, category_id, tags, article_type |
| ✅ | Barre de recherche dashboard | `GET /search` : même filtres, auth MEMBER |
| ❌ | Résultats enrichis (titre, extrait, image, date, catégorie) | |
| ❌ | Highlighting des termes recherchés | |
| ❌ | Suggestions d'autocomplétion | |
| ❌ | Assistant de recherche IA | |
| ❌ | Pages sans résultat avec suggestions | |

---

## M16 — Notifications Push (FCM)

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | FCM setup backend | `firebase-admin` installé + `push.py` + `PushToken` model |
| ✅ | Enregistrement token FCM | `POST /push/register` (upsert, web/ios/android) |
| ✅ | Notification manuelle (EDITOR+) | `POST /push/send` — multicast Firebase batch 500 |
| 🔶 | Notification automatique à chaque article publié | Backend `PushNotification` model ✅ — ARQ trigger auto ❌ |
| ❌ | Segmentation par catégorie | |
| ❌ | Statistiques taux d'ouverture + clics | `PushNotification.clicked_count` ✅ — tracking click ❌ |
| ✅ | Désabonnement | `DELETE /push/unregister` |
| ❌ | Prompt navigateur non intrusif (frontend) | |

---

## M17 — Personnalisation du Blog

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | 6 templates complets : editorial, magazine, creative, luminary, corporate, minimal | Chacun : Home, Article, About, Contact, Categories, CategoryPage, Shared |
| 🔶 | 4 templates en cours : business, news, tech, portfolio | Home + Article implémentés — autres pages manquantes |
| ✅ | Header / Footer entièrement personnalisables | `template_config` JSON + `header/page.tsx` + `footer/page.tsx` |
| ✅ | Logo, favicon, couleur primaire, couleur secondaire | |
| ✅ | Personnalisation CSS custom, scripts, Google Fonts | Page customization dans le dashboard |
| ✅ | Page Widgets (UI de configuration) | `blogs/[blogId]/` pages home, header, footer, about, contact, article, categories |
| ✅ | Postsperpage configurable | `template_config.home.latest.postsPerPage` + UI select |
| 🔶 | Dark mode toggle sur blog public | `BlogReaderProvider` ✅ — dark mode CSS désactivé (rollback) ❌ |
| ❌ | Widgets actifs blog public : articles populaires, catégories, tags, newsletter | Logique config sauvegardée — rendu dans thèmes ❌ |
| ❌ | Ordre des widgets configurable par drag & drop | |
| ❌ | Article vedette vs liste chronologique (configurable) | |
| ❌ | Animations Framer Motion | Non installé |
| ❌ | Transitions de page fluides | |

---

## M18 — Expérience Lecteur

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Barre de progression de lecture | `ReadingProgressBar` dans tous les thèmes |
| ✅ | Mode lecture (focus mode) | `BlogReaderProvider.tsx` : supprime nav, pub, sidebar |
| ✅ | Préférence lecteur : police + taille de texte | `BlogReaderProvider` : --reader-fs, --reader-ff (S/M/L/XL + sans/serif/mono) |
| ✅ | Player audio persistant | `PersistentAudioProvider` + barre sticky en bas |
| ✅ | Page dédiée podcast | `(blog)/[slug]/podcast/page.tsx` |
| ✅ | Flux RSS podcast | `GET /public/{slug}/podcast/rss` iTunes format |
| ✅ | Partage articles : X, Facebook, LinkedIn, WhatsApp, copier lien | `ShareButtons.tsx` + `FloatingShareBar.tsx` dans les 6 thèmes |
| ✅ | Partage du blog (footer) | `ShareButtons variant="blog"` dans le footer de tous les 6 thèmes |
| ❌ | Lecture vocale TTS : bouton "Écouter" | Backend `POST /ai/tts` ✅ — bouton dans les thèmes ❌ |
| ❌ | Résumés IA (bloc "En résumé" 3–5 points clés) | |
| ❌ | Marque-pages | |
| ❌ | Page "Ma liste de lecture" | |
| ❌ | Recommandations IA en fin d'article | |
| ❌ | PWA Offline (Service Worker) | `Tenant.pwa_enabled` ✅ — service worker ❌ |

---

## M19 — API REST Publique

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ❌ | Génération d'API Keys par tenant | |
| ❌ | Rate limiting par clé | |
| 🔶 | Documentation Swagger / OpenAPI | Auto-générée par FastAPI à `/docs` (dev uniquement, désactivée en prod) |
| ✅ | GET /articles, /articles/{slug}, /categories, /tags | `public.py` (sans auth) |
| ❌ | POST /articles via API externe | |
| ✅ | Webhooks entrants sortants | `webhooks.py` : endpoints CRUD, deliveries, rotation secret HMAC |
| ❌ | CORS configurables par tenant | Global uniquement via settings |

---

## M20 — Facturation & Paiements (Stripe + PayPal)

> Note: APIs de paiement disponibles dans le code mais non configurées en production.

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| 🔶 | Checkout Stripe | `POST /payments/checkout` ✅ — UI frontend ❌ |
| 🔶 | PayPal alternative | `POST /payments/paypal/capture` ✅ — UI ❌ |
| 🔶 | Articles payants (paywall) | `ContentVisibility.PAID` + `Article.price` + `article_access` table + `GET /payments/access/{id}` ✅ — paywall UI dans les thèmes ❌ |
| ✅ | Commission plateforme 5% articles payants | `STRIPE_PLATFORM_FEE_PERCENT=5` dans settings |
| ✅ | Accès à vie après paiement | `ArticleAccess.expires_at` nullable |
| ✅ | Webhooks Stripe/PayPal | `POST /payments/webhook/stripe` + signature vérification |
| ✅ | Transactions historique | `GET /payments/transactions` |
| ✅ | Abonnement SaaS query | `GET /payments/subscription` |
| ❌ | Période d'essai 14 jours Pro avec carte | `trial_ends_at` ✅ — checkout flow ❌ |
| ❌ | Upgrade/downgrade avec prorata | |
| ❌ | Gestion des limites : blocage à 100% + email à 80% | PLAN_LIMITS défini dans `tenant_service.py` ✅ — enforcement UI ❌ |
| ❌ | Factures PDF | |
| ❌ | Newsletter payante | |
| ❌ | Paiement campagnes publicitaires | |
| ❌ | Dashboard financier tenant | |
| ❌ | Dashboard financier Super Admin | |

---

## M21 — Intelligence Artificielle (IA Layer)

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Page IA dans le dashboard | |
| ✅ | Module central IA | `ai.py` — routing OpenAI / ElevenLabs / DALL-E 3 |
| ❌ | Cache Redis des résultats IA | |
| ✅ | Tracking consommation IA par tenant | `Tenant.ai_tokens_used`, `ai_tts_chars_used`, `ai_images_generated`, `ai_quota_reset_at` |
| 🔶 | Support clé API propre tenant Enterprise | `Tenant.ai_api_key_enc` (Fernet) ✅ — UI saisie clé ❌ |
| ✅ | Complétion de rédaction contextuelle | `POST /ai/generate` — GPT-4o / tone / langue / longueur |
| ✅ | Reformulation (professionnel / décontracté / formel) | `POST /ai/improve` |
| ✅ | Résumé en N phrases | `POST /ai/summarize` |
| ✅ | Correction grammaire + style | `POST /ai/improve` |
| ✅ | Génération introduction / conclusion | `POST /ai/generate` |
| ✅ | Suggestions SEO + méta-données | `POST /ai/seo` → meta title, description, keywords |
| ❌ | Détection de plagiat | |
| ✅ | Traduction de blocs | `POST /ai/translate` — DeepL API |
| ❌ | Modération commentaires IA | |
| ❌ | Alt text automatique images | |
| ❌ | Suggestion catégorie IA | |
| ❌ | Suggestion tags IA | |
| ❌ | Bloc "En résumé" IA (3–5 points clés) | |
| ❌ | Recommandations IA | |
| ❌ | Caption + hashtags IA pour réseaux sociaux | |
| ✅ | Génération image couverture | `POST /ai/cover` — DALL-E 3 → Cloudinary |
| ❌ | Tagging IA automatique des images | |
| ✅ | TTS lecture vocale | `POST /ai/tts` — ElevenLabs → MP3 → Cloudinary |
| ❌ | Transcription audio (Whisper) | |
| ❌ | Meilleur moment de publication IA | |

---

## M22 — Administration Super Admin

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| 🔶 | Interface /superadmin | Backend `superadmin.py` ✅ — UI frontend dédiée ❌ |
| ✅ | Liste tenants : statut, plan, date création | `GET /superadmin/tenants` avec filtres |
| ❌ | Accès en lecture auditée à tout tenant | |
| ✅ | Suspension / réactivation / suppression forcée | `POST /suspend`, `/activate`, `DELETE` |
| ✅ | Changement plan | `PATCH /superadmin/tenants/{id}/plan` |
| ✅ | Liste utilisateurs | `GET /superadmin/users` |
| ✅ | Promotion / révocation super-admin | `POST /users/{id}/make-super-admin` + `/revoke-super-admin` |
| 🔶 | Dashboard métriques plateforme | `GET /superadmin/stats` ✅ (tenants, users, revenue) — UI dashboard ❌ |
| ❌ | Validation publicités de tous les blogs | |
| ❌ | Gestion des signalements de contenu | |
| ❌ | Logs d'audit immuables de toutes les actions | |
| ❌ | Modification plans sans redéploiement | Table `pricing_plans` ✅ (`GET /platform/pricing`) — UI admin config ❌ |
| ❌ | Envoi emails broadcast vers tous les tenants | |
| ❌ | Gestion des providers IA globaux | |
| ❌ | Remboursements et litiges | |

---

## M23 — Programme d'Affiliation

> **Directives PDG — 2026-07-08** — Non implémenté.

### Règles métier (RG-AFF)

| Règle | Description |
|-------|-------------|
| RG-AFF-01 | Code de parrainage unique (alphanumérique 8 chars) + lien d'affiliation par membre |
| RG-AFF-02 | Arbre limité à 10 niveaux (L1 = parrain direct, L2–L10 = remontée hiérarchique) |
| RG-AFF-03 | Pas de compression — si un niveau est absent, sa part revient à NexusBlog |
| RG-AFF-04 | Commissions cumulées (accruals) jusqu'au seuil minimum de retrait ($50 défaut) |
| RG-AFF-05 | Frais de retrait fixes : **$20** déduits du montant retiré |
| RG-AFF-06 | Retrait net minimum après frais : $30 (soit $50 brut − $20 frais) |
| RG-AFF-07 | Paiements via Stripe Transfer / PayPal Payout |
| RG-AFF-08 | Auto-parrainage interdit — détection des cycles dans l'arbre |

### Distribution — Abonnements SaaS

```
Montant abonnement payé
  └─ 20% → Pool affiliation
       ├─ 50% → L1 (parrain direct)
       └─ 50% → Partagé ÉGALEMENT entre L2, L3, … L10 (9 niveaux)
```

### Distribution — Slots publicitaires

```
Montant payé par l'annonceur
  └─ 20% → Commission totale
       ├─ 50% (10% du total) → Compte NexusBlog (4101)
       └─ 50% (10% du total) → Pool affiliation
            ├─ 50% → L1
            └─ 50% → L2–L10 partagé également
```

### Exemples illustratifs

**Exemple 1 — Abonnement Pro $99/mois**
```
Pool affiliation = 20% × $99 = $19.80
L1 = 50% × $19.80 = $9.90
L2 à L10 (si tous existent) = $9.90 ÷ 9 = $1.10 chacun
Si seulement L1 et L2 existent : L1=$9.90, L2=$1.10, NexusBlog récupère $8.80
```

**Exemple 2 — Slot publicitaire $500**
```
Commission totale = 20% × $500 = $100
→ $50 → NexusBlog (compte 4101)
→ $50 → Pool affiliation du blog owner
     L1 = 50% × $50 = $25.00
     L2–L10 = $25 ÷ 9 = $2.78 chacun
Blog owner reçoit net = $500 − $100 = $400
```

**Exemple 3 — Retrait de commissions**
```
Affilié A a accumulé $85 (≥ seuil $50 ✅)
Frais retrait = $20
Montant net versé = $65
Écriture : D 2810 $85 / C 1010 $65 + C 4201 $20
```

### Fonctionnalités M23

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Code de parrainage unique généré à l'inscription + lien d'affiliation |
| ❌ | Arbre affiliation — table `affiliate_relationships` (ancestor_id, descendant_id, level) |
| ❌ | Calcul automatique commissions à chaque paiement abonnement (webhook Stripe) |
| ❌ | Calcul automatique commissions à chaque paiement slot pub |
| ❌ | Accruals — table `affiliate_commissions` (PENDING/READY/PAID/CANCELLED) |
| ❌ | Notification email à chaque commission créditée |
| ❌ | Dashboard affilié : solde, historique gains, lien parrainage, QR code |
| ❌ | Visualisation de l'arbre filleuls |
| ❌ | Demande de retrait (bouton actif si solde ≥ seuil) |
| ❌ | Frais retrait $20 déduits automatiquement + comptabilisés |
| ❌ | Versement via Stripe Transfer ou PayPal Payout |
| ❌ | Vérification bancaire KYC avant premier retrait |
| ❌ | Historique retraits avec statuts (REQUESTED/PROCESSING/PAID/FAILED) |
| ❌ | Super Admin : tous les affiliés, commissions en attente, retraits en cours |
| ❌ | Super Admin : approbation manuelle retraits > $500 |
| ❌ | Rapport mensuel commissions par affilié (CSV + PDF) |
| ❌ | Détection fraude : cycles, auto-parrainage, comptes multiples même IP |
| ❌ | Bannissement affilié frauduleux + annulation commissions non versées |
| ❌ | Seuil de retrait configurable (défaut $50) |
| ❌ | Frais retrait configurables (défaut $20) |
| ❌ | Page publique programme d'affiliation (comment ça marche, simulateur gains) |
| ❌ | Intégration comptable — chaque commission → écriture dans M24 |

---

## M24 — Comptabilité & Plan Comptable (Singapore SFRS)

> **Directives PDG — 2026-07-08** — Non implémenté. Conforme : Singapore Financial Reporting Standards (SFRS), Companies Act (Cap. 50), IRAS GST Act.

### Principes directeurs

| Principe | Description |
|----------|-------------|
| Immuabilité | Écriture validée = immuable — corrections par extourne uniquement |
| Double validation | Initiateur ≠ approbateur (erreur bloquante si même user) |
| Piste d'audit | created_by, approved_by, created_at, approved_at, ip_address |
| Devise | USD fonctionnel — SGD avec taux change historique |
| GST Singapore | 9% sur services B2C si CA > SGD 1M |

### Plan Comptable (Chart of Accounts — ~80 comptes)

#### Classe 1 — Actifs
`1000` Caisse | `1010` Banque SGD | `1011` Banque USD | `1020` Stripe Settlement | `1021` PayPal Settlement | `1100` Créances clients | `1101` Créances abonnements | `1102` Créances publicité | `1110` Provision créances douteuses | `1200` Frais payés d'avance | `1201` Abonnements logiciels prépayés | `1400` Input GST (9%) | `1500` Matériel informatique | `1511` Amortissement cumulé matériel | `1520` Logiciels | `1521` Amortissement cumulé logiciels | `1530` Incorporelles

#### Classe 2 — Passifs
`2000` Dettes fournisseurs | `2001` Fournisseurs techniques | `2100` Revenus différés | `2101` Abonnements mensuels d'avance | `2102` Abonnements annuels d'avance | `2103` Campagnes pub d'avance | `2200` Output GST (9%) | `2300` Charges à payer | `2301` Salaires | `2302` CPF employeur (17%) | `2304` Corporate Tax | `2400` Remboursements clients | `2500` Emprunts | `2800` Programme d'affiliation | `2810` Commissions affiliés à payer | `2811` Commissions en cours de virement | `2812` Frais retrait affiliés

#### Classe 3 — Capitaux propres
`3000` Capital social | `3001` Capital ordinaire | `3101` Réserves légales | `3201` Report à nouveau | `3202` Résultat de l'exercice | `3301` Dividendes déclarés

#### Classe 4 — Revenus
`4001` Starter mensuel | `4002` Starter annuel | `4010` Pro mensuel | `4011` Pro annuel | `4020` Business mensuel | `4021` Business annuel | `4030` Enterprise mensuel | `4031` Enterprise annuel | `4101` Commission slots pub (10% → NexusBlog) | `4102` Revenus nets pub (blog owners) | `4201` Frais retrait affiliés ($20) | `4202` Commission articles payants (5%) | `4203` Commission newsletter payante (5%) | `4204` Frais domaine personnalisé | `4301` Revenus de change | `4302` Intérêts créditeurs | `4401` Revenus abonnements annuels (mensualisés)

#### Classe 5 — Charges
`5001` Hébergement cloud (Vercel/AWS) | `5002` Neon PostgreSQL | `5003` Cloudinary | `5101` OpenAI/Anthropic | `5102` Stripe fees (~2.9%+$0.30) | `5103` PayPal fees | `5104` Firebase | `5105` Resend (emails) | `5108` Elasticsearch | `5201` Salaires bruts | `5202` CPF employeur (17%) | `5301` Google/Meta Ads | `5401` Loyer bureaux | `5404` Frais juridiques | `5405` Frais comptables/audit | `5406` Licences Singapore | `5501` Amortissement matériel | `5502` Amortissement logiciels | `5601` Intérêts emprunts | `5602` Pertes de change | `5701` Commissions affiliés — Abonnements | `5702` Commissions affiliés — Publicité | `5801` Provision créances douteuses | `5901` Corrections erreurs comptables

### Écritures automatiques par événement

| Événement | Écriture |
|-----------|----------|
| Paiement abonnement mensuel | D 1020 / C 4001–4031 + C 2200 (GST si applicable) |
| Paiement abonnement annuel | D 1020 / C 2101 (différé) → reconnaissance 1/12 par mois en C 4401 |
| Paiement slot pub $X | D 1020 $X / C 4101 $X×10% + C 2810 $X×10% + C 4102 $X×80% |
| Commission affilié créée | D 5701 $Y / C 2810 $Y |
| Retrait affilié validé ($85 brut) | D 2810 $85 / C 1010 $65 + C 4201 $20 |
| Remboursement client | D 4000 (montant) / C 2401 puis D 2401 / C 1020 |
| Frais Stripe | D 5102 / C 1020 |

### Fonctionnalités M24

| Statut | Fonctionnalité |
|--------|----------------|
| ❌ | Plan comptable ~80 comptes pré-chargés (seed) |
| ❌ | Interface Super Admin : visualisation + navigation CoA |
| ❌ | Ajout manuel de nouveaux comptes (numéro, libellé, classe, type) |
| ❌ | Désactivation de comptes (jamais suppression si mouvements) |
| ❌ | Journaux : Ventes, Achats, Banque, OD (opérations diverses) |
| ❌ | Grand livre général (toutes écritures par compte, solde progressif) |
| ❌ | Balance des comptes (trial balance) export PDF + CSV |
| ❌ | **Immuabilité** — écriture validée non modifiable, non supprimable |
| ❌ | Extourne uniquement avec `original_entry_id` |
| ❌ | **Saisie manuelle** multi-lignes (débit/crédit équilibrés) |
| ❌ | **Double validation** — initiateur ≠ approbateur (bloquant si même user) |
| ❌ | File d'approbation (PENDING jusqu'à validation) |
| ❌ | Approbateur : détail complet avant validation + pièces jointes |
| ❌ | Rejet avec commentaire obligatoire |
| ❌ | Piste d'audit complète (created_by, approved_by, IP, timestamps) |
| ❌ | Comptabilisation automatique transactions Stripe/PayPal (webhooks) |
| ❌ | Comptabilisation automatique commissions affiliés (M23) |
| ❌ | Comptabilisation automatique remboursements |
| ❌ | Types saisies manuelles : charge, retrait cash, correction, provision, amortissement |
| ❌ | Pièces justificatives attachées (PDF, image, max 10 MB) |
| ❌ | Rapport P&L (Compte de résultat) |
| ❌ | Rapport Bilan (Balance Sheet) |
| ❌ | Rapport Flux de trésorerie |
| ❌ | Comparatif N vs N-1 |
| ❌ | Export PDF + CSV tous rapports |
| ❌ | **GST Singapore** — rapport F5/F7 pré-rempli (Output GST − Input GST) |
| ❌ | Déclaration GST trimestrielle calculée automatiquement |
| ❌ | **Corporate Tax** (17%, exemptions PME Singapore) |
| ❌ | Rapport XBRL pour ACRA Singapore |
| ❌ | Clôture de période (gel journal, validation directeur financier) |
| ❌ | Clôture annuelle (virement résultat → report à nouveau) |
| ❌ | Réconciliation bancaire (import CSV/OFX, rapprochement auto) |
| ❌ | Alertes : écriture déséquilibrée, compte débiteur imprévu |
| ❌ | Accès lecture-seule pour auditeurs externes (rôle AUDITOR) |
| ❌ | Dashboard comptable : MRR, ARR, EBITDA, burn rate, runway |

---

## Priorités par criticité

| Module | Criticité | Raison |
|--------|-----------|--------|
| M20 — Paiements (Stripe + PayPal) | 🔴 Bloquant commercial | Génère 0 revenu sans ça |
| M23 — Programme d'Affiliation | 🔴 Directive PDG | Moteur de croissance |
| M24 — Comptabilité SFRS Singapore | 🔴 Directive PDG + légal | Obligation légale Singapore |
| M22 — Super Admin (UI) | 🔴 Bloquant opérationnel | Gestion plateforme impossible sans |
| M12 — Pub 20% + paiement | 🔴 Revenu direct | Commission non collectée |
| M9 — Newsletter (envoi réel ARQ) | 🔴 Fonctionnalité core | Campagnes en stub |
| M10 — OAuth réseaux sociaux | 🟠 Différenciateur fort | Connexion impossible sans |
| M5 — Scheduled publish (ARQ) | 🟠 Core éditorial | |
| M11 — Multi-langues (blog public) | 🟠 Différenciateur fort | |
| M17 — Dark mode blog + widgets actifs | 🟠 Expérience | |
| M15 — Elasticsearch indexation auto | 🟠 Différenciateur fort | |
| M18 — TTS + Résumés IA | 🟡 Valeur lecteur | |
| M16 — Push (prompt frontend) | 🟡 Engagement | |
| M4 — Éditeur (extensions Tiptap) | 🟡 Qualité rédaction | |
| M19 — API Keys + rate limiting | 🟡 Business+ / Enterprise | |
