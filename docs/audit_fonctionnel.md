# NexusBlog SaaS — Audit Fonctionnel Complet
**Cahier des charges v4.0 — Audit technique réel au 2026-07-10**

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
| ✅ Complet | ~193 |
| 🔶 Partiel | ~40 |
| ❌ À faire | ~172 |
| **Total** | **~405** |
| **Avancement réel** | **~59%** |

> **v4.0 — 2026-07-10** — Audit complet après vérification exhaustive du code source (backend + frontend). Nombreuses fonctionnalités mal marquées ❌ alors qu'elles sont implémentées. Corrections appliquées sur M1–M24 : autosave, OAuth social, ARQ workers, CSV newsletter, segmentation tags, OAuth social, paywall thèmes, bookmarks, TTS banner, robots.txt, score SEO IA, géo/device analytics, super admin UI, affiliation (backend + frontend), comptabilité (backend + frontend).

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
| ✅ | Email de bienvenue automatique après inscription | `send_welcome_email()` dans `auth_service.py` — Resend |
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
| 🔶 | Custom domains : saisie → CNAME → vérification → SSL | Table `custom_domains` ✅ + middleware résolution ✅ + UI `domains/page.tsx` ✅ — Let's Encrypt automation ❌ |
| ❌ | Renouvellement automatique certificat SSL | |
| ❌ | Redirection HTTP → HTTPS sur domaines personnalisés | |
| ✅ | Collaborateurs : invitation email + rôle (validité 48h→7j) | `team.py` + `UserInvitation` model + email Resend |
| ✅ | Modification / révocation de rôle en temps réel | `team.py` PATCH + DELETE |
| ❌ | Historique des accès par membre | |
| 🔶 | Période d'essai 14 jours | Champ `trial_ends_at` ✅ + bannière `TrialBanner.tsx` ✅ — blocage accès à expiration ❌ |
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
| ✅ | Autosave automatique toutes les 30 secondes | Debounce 30s dans `edit/page.tsx` — indicateur `● Unsaved` / `autosaved…` |
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
| ✅ | Prévisualisation desktop / tablet / mobile depuis l'éditeur | Intégrée dans `edit/page.tsx` — toggle device dans la toolbar |
| ❌ | Commandes IA via `/` | Backend IA disponible — menu slash non implémenté |
| 🔶 | Outils IA dans la sidebar éditeur | TTS génération ✅ + analyse SEO IA ✅ + traduction DeepL ✅ — génération inline IA ❌ |

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
| ✅ | Statut SCHEDULED → PUBLISHED auto | ARQ cron `auto_publish_scheduled()` toutes les 60s dans `workers/tasks.py` |
| ✅ | Statuts UNPUBLISHED et ARCHIVED | `POST /{id}/unpublish` + `POST /{id}/archive` |
| 🔶 | File d'approbation | Backend complet ✅ — UI dédiée "in_review queue" à confirmer dans le frontend |
| ❌ | Journal d'approbation | |
| ✅ | Notifications in-app + email aux Éditeurs lors soumission | `POST /articles/{id}/submit-review` envoie email Resend aux éditeurs |
| ✅ | Notification auteur après rejet / publication | `POST /articles/{id}/reject` + `publish` envoient email Resend à l'auteur |
| ❌ | Fuseau horaire tenant respecté pour la programmation | |
| ✅ | Canonical URL | `canonical_url` (migration 011) |
| ✅ | Robots noindex par article | `robots_noindex` (migration 011) |
| ✅ | JSON-LD automatique | Généré côté Next.js SSR dans `[articleSlug]/page.tsx` — schema.org `Article`, `datePublished`, `author`, `publisher` |

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
| ✅ | Import CSV | `POST /newsletter/subscribers/import` multipart ✅ + UI `<input type="file" accept=".csv">` dans `newsletter/page.tsx` |
| ✅ | Segmentation par tags | Backend `tag=` query filter sur JSONB ✅ + UI tag pills dans `newsletter/page.tsx` ✅ |
| ❌ | Métriques par abonné | |
| 🔶 | Éditeur de newsletter | Modal création campagne (sujet + corps) ✅ — email builder drag-drop avancé ❌ |
| ❌ | Création newsletter depuis un article existant | |
| ❌ | Test d'envoi à l'adresse admin | |
| ✅ | Envoi immédiat | `POST /campaigns/{id}/send` + ARQ task `send_newsletter_campaign()` confirmé dans `workers/tasks.py` |
| 🔶 | Envoi programmé | `NewsletterCampaign.scheduled_at` ✅ + ARQ `auto_send_scheduled_newsletters()` ✅ — UI programmation dans modal campagne à confirmer |
| ✅ | Statistiques campagne (envoi / ouverture / clics / désabonnements / bounces) | Compteurs sur `NewsletterCampaign` model |
| ❌ | Newsletter payante | `Campaign.is_paid` + `price` champs ✅ — flow paiement ❌ |
| ❌ | Widgets d'abonnement : popup, sidebar, footer | Formulaire inline article ✅ — autres widgets ❌ |

---

## M10 — Automatisation Réseaux Sociaux

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Page Réseaux Sociaux dans le dashboard | `social/page.tsx` |
| ✅ | OAuth flows (Facebook, LinkedIn, Twitter/X, TikTok) | `social_oauth.py` — redirect OAuth + callback + échange code + token chiffré Fernet |
| 🔶 | OAuth flows Instagram, Threads, Pinterest | UI dashboard affiché pour ces 3 plateformes — aucun handler OAuth backend |
| ✅ | Boutons connect OAuth dans le dashboard | `socialApi.getOAuthConnectUrl()` + redirect navigateur + gestion `?connected=platform` |
| ✅ | Gestion des posts sociaux (créer, programmer, lister, supprimer) | `social.py` posts CRUD + `scheduled_at` |
| ✅ | Publication immédiate | `POST /posts/{id}/publish` + ARQ `publish_to_social` worker |
| ✅ | Auto-post à la publication d'un article | `auto_post_enabled` flag par compte + `publish_to_social` ARQ déclenché |
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
| ❌ | Traduction automatique des articles (DeepL) pour blog public | DeepL SDK installé + endpoint IA ✅ — expose uniquement dans l'éditeur (remplace le contenu), pas de modèle multi-langue DB |
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
| ✅ | Scan URL multi-sources en temps réel | Google Safe Browsing + VirusTotal + URLhaus + PhishTank (`ads.py` scan endpoint) |
| ✅ | Désactivation automatique si URL dangereuse | Resume bloqué si `link_safety_status = DANGEROUS` |
| ✅ | Historique des scans horodatés | `AdLinkScan` model — scans, safety_status, sources, scanned_at |
| ✅ | Rotateur pondéré (Weighted Round Robin) | `GET /public/{slug}/ads/rotator` — pondération par budget |
| ✅ | Tracking impressions + clics (public) | `POST /ads/{id}/impression` + `/click` |
| ❌ | Prélèvement automatique 20% à l'activation paiement | Logique de split non implémentée |
| ❌ | Ventilation comptable automatique (M24) | |
| ❌ | Intégration Google AdSense | |
| ❌ | Intégration Media.net | |
| ❌ | Code publicitaire personnalisé (JS/iframe) | |
| ❌ | Planification campagne auto-expiration | `starts_at` / `ends_at` champs ✅ — ARQ scheduler ❌ |
| ✅ | Lien paiement Stripe/PayPal généré après approbation | Génération Checkout Session sur `review` → `PAYMENT_PENDING` + `payment_link_url` stocké — guarde si pas de clé |
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
| ✅ | Géolocalisation : pays | Bar chart pays dans `analytics/page.tsx` ✅ — `PageView.country_code` tracké |
| ✅ | Appareils : desktop / mobile / tablet | Device breakdown dans `analytics/page.tsx` ✅ — `PageView.device_type`, `browser`, `os` |
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
| ✅ | Dashboard Super Admin : MRR / ARR / santé infra | `GET /superadmin/stats` ✅ + UI `superadmin/page.tsx` dark theme |

---

## M14 — SEO

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Meta title + meta description par article | `Article.seo_title`, `seo_description`, `seo_keywords` |
| ✅ | Open Graph + Twitter Cards | `og_image_url` + `Article` model |
| ✅ | Page paramètres SEO globaux | `seo/page.tsx` + `Tenant.seo_title_template` |
| ✅ | SEO par article dans la sidebar éditeur | |
| ✅ | JSON-LD automatique | Généré côté Next.js SSR — schema.org `Article` dans `[articleSlug]/page.tsx` |
| ✅ | Canonical URL | `Article.canonical_url` (migration 011) |
| ❌ | Balises hreflang | |
| ✅ | Robots noindex par article | `Article.robots_noindex` (migration 011) |
| ❌ | Redirections 301 automatiques en cas de changement slug | |
| ✅ | Sitemap XML dynamique | `GET /public/{slug}/sitemap.xml` |
| ✅ | robots.txt configurable par tenant | `Tenant.robots_txt` champ + `GET /public/{slug}/robots.txt` endpoint ✅ + textarea UI dans `seo/page.tsx` ✅ |
| ❌ | Vérification Google Search Console | |
| ✅ | Score SEO IA | `POST /ai/seo` ✅ + analyse intégrée dans sidebar éditeur (score + suggestions) |
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
| ✅ | Barre de recherche blog public | `GET /search/public` + `FloatingSearch.tsx` dans les thèmes + page résultats `search/page.tsx` |
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
| 🔶 | Notification automatique à chaque article publié | Backend `PushNotification` model ✅ — ARQ trigger auto-publish ❌ |
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
| 🔶 | Dark mode toggle sur blog public | `BlogReaderProvider.tsx` ✅ + `blogDarkMode.css` ✅ — rollback partiel CSS ❌ |
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
| 🔶 | Lecture vocale TTS : bouton "Écouter" | `ArticleListenBanner.tsx` affiché si `audio_url` renseigné — bouton génération TTS depuis les thèmes directement ❌ |
| ❌ | Résumés IA (bloc "En résumé" 3–5 points clés) | |
| 🔶 | Marque-pages (bookmarks) | `useBookmark` hook ✅ + intégré dans Editorial, Luminary, Creative, Magazine, Minimal — persistance localStorage uniquement, pas d'API serveur |
| ✅ | Page "Ma liste de lecture" | `useAllBookmarks()` + `bookmarks/page.tsx` + `BookmarksClientPage.tsx` — localStorage |
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

## M20 — Facturation & Paiements (NowPayments — Crypto USDT)

> **Décision PDG — 2026-07-12** : Stripe et PayPal retirés. Tous les paiements transitent via **NowPayments** en crypto USDT. Les fonds arrivent directement dans le wallet USDT de la plateforme NexusBlog. Les commissions affiliés sont distribuées automatiquement et immédiatement en USDT vers les wallets des membres. Aucun seuil minimum d'attente. Les membres doivent obligatoirement avoir un wallet USDT pour recevoir des commissions.

### Flux de paiement (abonnement / slot pub)

```
1. Utilisateur clique "S'abonner"
2. Backend crée une invoice NowPayments → retourne invoice_url
3. Utilisateur paie en USDT (ou autre crypto) sur la page NowPayments
4. NowPayments envoie un webhook IPN signé (HMAC-SHA512)
5. Backend vérifie signature → active abonnement / campagne pub
6. Backend déclenche compute_and_accrue_commissions()
7. Commissions envoyées immédiatement en USDT via NowPayments Payout API
```

### Variables d'environnement NowPayments

```
NOWPAYMENTS_API_KEY=...          # Clé principale (créer invoice)
NOWPAYMENTS_IPN_SECRET=...       # Secret HMAC pour vérification webhooks
NOWPAYMENTS_PAYOUT_API_KEY=...   # Clé Payouts (envoyer USDT aux affiliés)
NOWPAYMENTS_WALLET_USDT=...      # Wallet USDT TRC20 de NexusBlog (destination fonds entrants)
NOWPAYMENTS_PLATFORM_FEE_PERCENT=5  # Commission plateforme articles payants
```

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ❌ | Checkout NowPayments — abonnements SaaS | `POST /tenants/{id}/payments/checkout-subscription` → invoice NowPayments → `invoice_url` retourné |
| ❌ | Checkout NowPayments — slots publicitaires | `POST /tenants/{id}/payments/checkout-ad` → même flow |
| ✅ | Articles payants (paywall) | `ArticlePaywall.tsx` ✅ + public page retourne paywall si `article.is_paid = true` + `ArticleAccess` model |
| ❌ | Articles payants via NowPayments | Ancienne logique Stripe retirée — NowPayments invoice à implémenter |
| ✅ | Accès à vie après paiement | `ArticleAccess.expires_at` nullable |
| ❌ | Webhook IPN NowPayments | `POST /payments/webhook/nowpayments` — vérification HMAC-SHA512 sur `x-nowpayments-sig` |
| ✅ | Transactions historique | `GET /payments/transactions` |
| ✅ | Abonnement SaaS query | `GET /payments/subscription` |
| ❌ | Activation subscription au webhook confirmé | `payment_status == "finished"` → activer plan |
| ❌ | Upgrade/downgrade plan | |
| 🔶 | Gestion des limites : blocage à 100% + bannière à 80% | Bannière UI amber/rouge dans `articles/page.tsx` ✅ — email à 80% ❌ |
| ❌ | Factures PDF | |
| ❌ | Newsletter payante | |
| ❌ | Dashboard financier tenant | |

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
| ✅ | Interface /superadmin | Dark theme complet — `layout.tsx` (slate-950 sidebar + rose header), `page.tsx`, tenants, users, accounting |
| ✅ | Dashboard métriques plateforme | `GET /superadmin/stats` ✅ + `superadmin/page.tsx` — stats tenants, users, plans, MRR |
| ✅ | Liste tenants : statut, plan, date création | `GET /superadmin/tenants` avec filtres + UI dark |
| ❌ | Accès en lecture auditée à tout tenant | |
| ✅ | Suspension / réactivation / suppression forcée | `POST /suspend`, `/activate`, `DELETE` |
| ✅ | Changement plan | `PATCH /superadmin/tenants/{id}/plan` |
| ✅ | Liste utilisateurs | `GET /superadmin/users` + UI dark |
| ✅ | Promotion / révocation super-admin | `POST /users/{id}/make-super-admin` + `/revoke-super-admin` |
| ❌ | Validation publicités de tous les blogs | |
| ❌ | Gestion des signalements de contenu | |
| ❌ | Logs d'audit immuables de toutes les actions | |
| ❌ | Modification plans sans redéploiement | Table `pricing_plans` ✅ (`GET /platform/pricing`) — UI admin config ❌ |
| ❌ | Envoi emails broadcast vers tous les tenants | |
| ❌ | Gestion des providers IA globaux | |
| ❌ | Remboursements et litiges | |

---

## M23 — Programme d'Affiliation

> **Directives PDG — 2026-07-08, mis à jour 2026-07-12 (migration NowPayments)**

### Règles métier (RG-AFF)

| Règle | Description |
|-------|-------------|
| RG-AFF-01 | Code de parrainage unique (alphanumérique 8 chars) + lien d'affiliation par membre |
| RG-AFF-02 | Arbre limité à 10 niveaux (L1 = parrain direct, L2–L10 = remontée hiérarchique) |
| RG-AFF-03 | Pas de compression — si un niveau est absent, sa part revient à NexusBlog |
| RG-AFF-04 | **Paiement immédiat** — plus de seuil minimum d'attente. Dès qu'une commission est créée, elle est versée automatiquement si le membre a un wallet USDT enregistré |
| RG-AFF-05 | **Aucun frais de retrait** — la blockchain TRC20 (USDT Tron) a des frais négligeables couverts par la plateforme |
| RG-AFF-06 | ~~Retrait net minimum après frais~~ — **supprimé** |
| RG-AFF-07 | **Paiements en USDT TRC20 via NowPayments Payout API** — directs vers le wallet crypto du membre |
| RG-AFF-08 | Auto-parrainage interdit — détection des cycles dans l'arbre |
| RG-AFF-09 | **Wallet USDT TRC20 obligatoire** pour recevoir des commissions. Sans wallet enregistré, les commissions restent en état PENDING jusqu'à l'ajout du wallet (paiement déclenché alors automatiquement) |
| RG-AFF-10 | **2FA obligatoire** avant d'ajouter ou modifier l'adresse wallet USDT — protection contre le vol de commissions |

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

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Code de parrainage unique + lien d'affiliation | `affiliate.py` — lien referral dans `GET /affiliate` + copie dans UI |
| ✅ | Arbre affiliation — closure table multi-niveaux | `AffiliateRelationship` (ancestor_id, descendant_id, level) — 10 niveaux max |
| ✅ | Calcul automatique commissions abonnements | `compute_and_accrue_commissions()` appelé depuis webhook Stripe |
| ✅ | Calcul automatique commissions slots pub | `book_ad_slot_payment()` — split 80%/10%/10% |
| ✅ | Accruals — table commissions | `AffiliateCommission` model — statuts PENDING/READY/PAID/CANCELLED |
| ❌ | Notification email à chaque commission créditée | |
| ✅ | Dashboard affilié : solde, historique gains, lien parrainage | `affiliate/page.tsx` — balance, referral URL avec copie, commissions list, cashout history |
| ❌ | Visualisation de l'arbre filleuls | |
| ❌ | Paiement immédiat automatique (pas de seuil minimum) | Commission créée → NowPayments Payout déclenché si wallet USDT enregistré |
| ❌ | Wallet USDT TRC20 — ajout dashboard (2FA obligatoire) | `User.usdt_wallet_address` + `PATCH /users/me/wallet` + vérification TOTP avant sauvegarde |
| ❌ | Paiement auto-différé — membres sans wallet | Commissions PENDING auto-payées dès que le wallet est ajouté |
| ❌ | Versement automatique USDT via NowPayments Payout | Appel `POST /v1/payout` NowPayments → référence payout stockée dans `AffiliateCashoutRequest.payout_reference` |
| ✅ | Historique retraits avec statuts | `AffiliateCashoutRequest` model — REQUESTED/PROCESSING/PAID/FAILED |
| ✅ | Super Admin : tous les affiliés, retraits en cours | `GET /superadmin/affiliate/cashouts` |
| ❌ | Super Admin : approbation manuelle remplacée par auto-payout | Ancien flow manuel → NowPayments Payout auto. Super Admin peut voir les payout references |
| ❌ | Rapport mensuel commissions par affilié (CSV + PDF) | |
| ❌ | Détection fraude : cycles, auto-parrainage, comptes multiples même IP | |
| ❌ | Bannissement affilié frauduleux + annulation commissions non versées | |
| ❌ | Page publique programme d'affiliation (comment ça marche, simulateur gains) | |
| ✅ | Intégration comptable — chaque commission → écriture M24 | Écritures D5701/C2810 créées automatiquement |

---

## M24 — Comptabilité & Plan Comptable (Singapore SFRS)

> **Directives PDG — 2026-07-08** — Conforme : Singapore Financial Reporting Standards (SFRS), Companies Act (Cap. 50), IRAS GST Act.

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

| Statut | Fonctionnalité | Notes techniques |
|--------|----------------|-----------------|
| ✅ | Plan comptable ~80 comptes pré-chargés (seed) | Seed intégré dans migration 014 via `ON CONFLICT DO NOTHING` — idempotent |
| ✅ | Interface Super Admin : visualisation + navigation CoA | `superadmin/accounting/page.tsx` — onglet "Plan Comptable" avec groupes par classe |
| ✅ | Ajout manuel de nouveaux comptes | `POST /accounting/chart-of-accounts` + formulaire UI |
| ✅ | Désactivation de comptes (jamais suppression si mouvements) | `PATCH /chart-of-accounts/{code}/toggle` |
| ❌ | Journaux : Ventes, Achats, Banque, OD (opérations diverses) | Pas de filtrage par journal type |
| ❌ | Grand livre général (toutes écritures par compte, solde progressif) | |
| ❌ | Balance des comptes (trial balance) export PDF + CSV | |
| ✅ | **Immuabilité** — écriture validée non modifiable, non supprimable | Pas de PUT/DELETE sur écritures validées |
| ✅ | Extourne uniquement avec `original_entry_id` | `POST /accounting/entries/{id}/reverse` avec `reason` obligatoire |
| ✅ | **Saisie manuelle** multi-lignes (débit/crédit équilibrés) | `POST /accounting/entries` + validation débit=crédit + UI formulaire |
| ✅ | **Double validation** — initiateur ≠ approbateur (bloquant si même user) | `POST /accounting/entries/{id}/approve` — erreur 403 si même user |
| ✅ | File d'approbation (PENDING jusqu'à validation) | Statut PENDING → APPROVED dans UI avec bouton Approuver |
| 🔶 | Approbateur : détail complet avant validation + pièces jointes | Expandable detail rows ✅ — pièces jointes ❌ |
| ❌ | Rejet avec commentaire obligatoire | Endpoint reject non confirmé |
| ✅ | Piste d'audit complète (created_by, approved_by, IP, timestamps) | `created_by`, `approved_by`, `ip_address`, `created_at`, `approved_at` sur `JournalEntry` |
| ✅ | Comptabilisation automatique transactions Stripe/PayPal (webhooks) | `book_subscription_payment()` + gestion `charge.refunded` dans `POST /payments/webhook/stripe` |
| ✅ | Comptabilisation automatique commissions affiliés | `compute_and_accrue_commissions()` crée écritures D5701/C2810 |
| ✅ | Comptabilisation automatique remboursements | `charge.refunded` webhook → écriture D4000/C2401 |
| ❌ | Types saisies manuelles : charge, retrait cash, correction, provision, amortissement | |
| ❌ | Pièces justificatives attachées (PDF, image, max 10 MB) | |
| ❌ | Rapport P&L (Compte de résultat) | |
| ❌ | Rapport Bilan (Balance Sheet) | |
| ❌ | Rapport Flux de trésorerie | |
| ❌ | Comparatif N vs N-1 | |
| ❌ | Export PDF + CSV tous rapports | |
| ❌ | **GST Singapore** — rapport F5/F7 pré-rempli (Output GST − Input GST) | |
| ❌ | Déclaration GST trimestrielle calculée automatiquement | |
| ❌ | **Corporate Tax** (17%, exemptions PME Singapore) | |
| ❌ | Rapport XBRL pour ACRA Singapore | |
| ❌ | Clôture de période (gel journal, validation directeur financier) | |
| ❌ | Clôture annuelle (virement résultat → report à nouveau) | |
| ❌ | Réconciliation bancaire (import CSV/OFX, rapprochement auto) | |
| ❌ | Alertes : écriture déséquilibrée, compte débiteur imprévu | |
| ❌ | Accès lecture-seule pour auditeurs externes (rôle AUDITOR) | |
| ❌ | Dashboard comptable : MRR, ARR, EBITDA, burn rate, runway | |

---

## Priorités par criticité

| Module | Criticité | Raison |
|--------|-----------|--------|
| M20 — Checkout Stripe abonnements SaaS | 🔴 Bloquant commercial | Endpoint backend manquant — 0 revenu abonnements |
| M12 — Pub 20% + paiement activation | 🔴 Revenu direct | Commission non collectée, lien paiement manquant |
| M9 — Newsletter email builder avancé | 🟠 Fonctionnalité core | Modal basique existe, builder drag-drop manquant |
| M11 — Multi-langues (blog public) | 🟠 Différenciateur fort | Aucun routage /fr/, /en/ côté blog public |
| M17 — Widgets actifs dans thèmes | 🟠 Expérience | Config sauvegardée mais non rendue |
| M15 — Elasticsearch indexation auto | 🟠 Différenciateur fort | Client installé mais pas d'index ni d'indexation |
| M24 — Rapports comptables (P&L, Bilan) | 🟠 Obligation légale | Backend/UI écritures ✅ — rapports financiers ❌ |
| M23 — Stripe Transfer / PayPal Payout | 🟠 Affiliation core | Approbation ✅ — virement réel ❌ |
| M18 — TTS bouton génération dans thèmes | 🟡 Valeur lecteur | `ArticleListenBanner` si audio_url, pas de bouton générer |
| M16 — Push prompt navigateur (frontend) | 🟡 Engagement | Backend FCM ✅ — prompt web ❌ |
| M4 — Commandes slash IA `/` | 🟡 Qualité rédaction | Extensions Tiptap installées mais pas câblées |
| M22 — Seed plan comptable ~80 comptes | 🟡 Comptabilité | UI ✅ mais base vide sans seed |
| M19 — API Keys + rate limiting | 🟡 Business+ / Enterprise | |
