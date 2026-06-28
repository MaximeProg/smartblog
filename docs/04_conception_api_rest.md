# NexusBlog SaaS — Conception API REST

**Version :** 1.0  
**Date :** 2026-06-26  
**Base URL :** `https://api.nexusblog.io/api/v1`  
**Format :** JSON  
**Auth :** Bearer JWT  

---

## Table des matières

1. [Conventions globales](#1-conventions-globales)
2. [Authentification](#2-authentification)
3. [Tenants & Onboarding](#3-tenants--onboarding)
4. [Équipe & Invitations](#4-équipe--invitations)
5. [Articles](#5-articles)
6. [Catégories](#6-catégories)
7. [Tags](#7-tags)
8. [Médias](#8-médias)
9. [Commentaires](#9-commentaires)
10. [Newsletter](#10-newsletter)
11. [Réseaux Sociaux](#11-réseaux-sociaux)
12. [Publicité](#12-publicité)
13. [Analytics](#13-analytics)
14. [Recherche](#14-recherche)
15. [Paiements & Facturation](#15-paiements--facturation)
16. [Notifications Push](#16-notifications-push)
17. [Intelligence Artificielle](#17-intelligence-artificielle)
18. [API Publique (Lecture externe)](#18-api-publique-lecture-externe)
19. [Super Admin](#19-super-admin)
20. [Webhooks entrants](#20-webhooks-entrants)
21. [Matrice des permissions](#21-matrice-des-permissions)

---

## 1. Conventions globales

### Base URL et versioning

```
https://api.nexusblog.io/api/v1/{resource}
```

### Identification du tenant

Chaque requête est associée à un tenant via le header `Host` résolu par le middleware :
- `monblog.nexusblog.io` → résolution automatique
- `www.mondomaine.com` → résolution via `custom_domains`

Pour l'API publique (API Key), le tenant est résolu depuis la clé.

### Authentification

```http
Authorization: Bearer {access_token}
```

Pour l'API publique :
```http
X-API-Key: nbk_xxxxxxxxxxxxxxxx
```

### Format de réponse — Succès

```json
{
  "data": { ... },
  "meta": {
    "cursor": "eyJpZCI6...",
    "has_more": true,
    "total": 142
  }
}
```

### Format de réponse — Erreur

```json
{
  "error": "ARTICLE_NOT_FOUND",
  "message": "L'article demandé n'existe pas ou a été supprimé.",
  "status": 404,
  "trace_id": "abc123def456"
}
```

### Codes d'erreur métier (sélection)

| Code | HTTP | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Token manquant ou invalide |
| `FORBIDDEN` | 403 | Rôle insuffisant |
| `TENANT_NOT_FOUND` | 404 | Tenant introuvable |
| `ARTICLE_NOT_FOUND` | 404 | Article introuvable |
| `SLUG_ALREADY_EXISTS` | 409 | Slug déjà utilisé |
| `PLAN_LIMIT_REACHED` | 402 | Limite du plan atteinte |
| `VALIDATION_ERROR` | 422 | Données invalides (détail inclus) |
| `RATE_LIMIT_EXCEEDED` | 429 | Trop de requêtes |
| `AI_QUOTA_EXCEEDED` | 402 | Quota IA mensuel épuisé |

### Pagination — Cursor-based

```http
GET /articles?limit=20&cursor=eyJpZCI6IjEyMyJ9&sort=published_at:desc
```

```json
{
  "data": [...],
  "meta": {
    "cursor": "eyJpZCI6IjQ1NiJ9",
    "has_more": true
  }
}
```

### Filtres communs

```
?status=published
?type=article,podcast
?category_id=uuid
?tag=javascript
?author_id=uuid
?language=fr
?from=2026-01-01&to=2026-06-30
?q=search+term
```

### Rate Limiting — Headers de réponse

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1719399600
```

---

## 2. Authentification

### `POST /auth/login`
Échange un token Firebase contre un JWT NexusBlog.

**Auth requis :** Non  
**Body :**
```json
{ "firebase_id_token": "eyJhbGci..." }
```

**Réponse 200 :**
```json
{
  "data": {
    "access_token": "eyJhbGci...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "is_super_admin": false
    },
    "tenant": {
      "id": "uuid",
      "name": "Mon Blog",
      "slug": "monblog",
      "plan": "pro",
      "role": "TENANT_ADMIN"
    }
  }
}
```
*Le refresh token est posé en cookie HttpOnly.*

---

### `POST /auth/refresh`
Renouvelle l'access token via le cookie refresh token.

**Auth requis :** Non (cookie)  
**Body :** Vide  
**Réponse 200 :** Même structure que `/auth/login`

---

### `POST /auth/logout`
Révoque le refresh token courant.

**Auth requis :** Oui  
**Body :** Vide  
**Réponse 204 :** No Content

---

### `GET /auth/me`
Retourne le profil de l'utilisateur connecté.

**Auth requis :** Oui  
**Réponse 200 :**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": "https://...",
    "two_fa_enabled": false,
    "tenants": [
      { "id": "uuid", "name": "Mon Blog", "slug": "monblog", "role": "TENANT_ADMIN" }
    ]
  }
}
```

---

### `PUT /auth/me`
Met à jour le profil (nom, avatar).

**Auth requis :** Oui  
**Body :**
```json
{
  "display_name": "Jane Doe",
  "bio": "Blogueur passionné"
}
```
**Réponse 200 :** Profil mis à jour

---

### `POST /auth/2fa/setup`
Génère un secret TOTP et retourne un QR code.

**Auth requis :** Oui  
**Réponse 200 :**
```json
{
  "data": {
    "otpauth_uri": "otpauth://totp/NexusBlog:user@...",
    "qr_code_svg": "<svg>...</svg>",
    "backup_codes": ["XXXX-XXXX", "YYYY-YYYY", "..."]
  }
}
```

---

### `POST /auth/2fa/verify`
Active la 2FA en validant le premier code TOTP.

**Auth requis :** Oui  
**Body :** `{ "code": "123456" }`  
**Réponse 200 :** `{ "data": { "two_fa_enabled": true } }`

---

### `DELETE /auth/2fa`
Désactive la 2FA (nécessite un code TOTP valide).

**Auth requis :** Oui  
**Body :** `{ "code": "123456" }`  
**Réponse 204 :** No Content

---

## 3. Tenants & Onboarding

### `POST /tenants`
Crée un nouveau tenant (l'utilisateur connecté devient TENANT_ADMIN).

**Auth requis :** Oui  
**Body :**
```json
{
  "name": "Mon Awesome Blog",
  "slug": "mon-awesome-blog",
  "language": "fr",
  "timezone": "Europe/Paris",
  "theme": "minimal"
}
```
**Réponse 201 :**
```json
{
  "data": {
    "id": "uuid",
    "name": "Mon Awesome Blog",
    "slug": "mon-awesome-blog",
    "plan": "starter",
    "subdomain_url": "https://mon-awesome-blog.nexusblog.io"
  }
}
```

---

### `GET /tenants/current`
Retourne la configuration complète du tenant courant.

**Auth requis :** Oui — Tout rôle  
**Réponse 200 :**
```json
{
  "data": {
    "id": "uuid",
    "name": "Mon Blog",
    "slug": "monblog",
    "description": "...",
    "logo_url": "https://...",
    "favicon_url": "https://...",
    "theme": "minimal",
    "primary_color": "#3B82F6",
    "language": "fr",
    "timezone": "Europe/Paris",
    "plan": "pro",
    "plan_expires_at": "2027-06-26T00:00:00Z",
    "trial_ends_at": null,
    "comments_mode": "moderated",
    "ga4_measurement_id": "G-XXXXXXXX",
    "limits": {
      "articles_max": null,
      "authors_max": 3,
      "storage_gb": 5,
      "subscribers_max": 1000,
      "domains_max": 1,
      "api_requests_monthly": 10000
    },
    "usage": {
      "articles_count": 42,
      "authors_count": 2,
      "storage_used_gb": 1.2,
      "subscribers_count": 340,
      "domains_count": 1,
      "api_requests_this_month": 1250
    }
  }
}
```

---

### `PUT /tenants/current`
Met à jour les paramètres du tenant.

**Auth requis :** Oui — `TENANT_ADMIN`  
**Body :** Champs partiels (PATCH sémantique)
```json
{
  "name": "Nouveau Nom",
  "description": "Ma nouvelle description",
  "primary_color": "#EF4444",
  "comments_mode": "open",
  "ga4_measurement_id": "G-XXXXXXXX",
  "footer_text": "© 2026 Mon Blog",
  "social_links": {
    "twitter": "https://x.com/monblog",
    "linkedin": "https://linkedin.com/in/..."
  }
}
```
**Réponse 200 :** Tenant mis à jour

---

### `DELETE /tenants/current`
Initie la suppression du tenant (période de grâce 30 jours).

**Auth requis :** Oui — `TENANT_ADMIN`  
**Body :** `{ "confirmation": "DELETE MY BLOG" }`  
**Réponse 200 :**
```json
{
  "data": {
    "grace_period_ends_at": "2026-07-26T00:00:00Z",
    "message": "Votre blog sera supprimé le 26 juillet 2026."
  }
}
```

---

### `GET /tenants/current/check-slug`
Vérifie la disponibilité d'un slug.

**Auth requis :** Non  
**Params :** `?slug=mon-blog`  
**Réponse 200 :** `{ "data": { "available": true } }`

---

### Domaines personnalisés

#### `GET /tenants/current/domains`
Liste les domaines du tenant.

**Auth requis :** Oui — `TENANT_ADMIN`

#### `POST /tenants/current/domains`
Ajoute un domaine personnalisé.

**Body :** `{ "domain": "www.monsite.com" }`  
**Réponse 201 :**
```json
{
  "data": {
    "id": "uuid",
    "domain": "www.monsite.com",
    "verification_status": "pending",
    "cname_target": "monblog.nexusblog.io",
    "instructions": "Ajoutez un enregistrement CNAME : www → monblog.nexusblog.io"
  }
}
```

#### `POST /tenants/current/domains/{id}/verify`
Déclenche la vérification DNS.

**Réponse 200 :** `{ "data": { "verification_status": "verified" } }`

#### `DELETE /tenants/current/domains/{id}`
Supprime un domaine.

---

## 4. Équipe & Invitations

### `GET /team`
Liste les membres de l'équipe.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": { "id": "uuid", "display_name": "Alice", "email": "alice@...", "avatar_url": "..." },
      "role": "EDITOR",
      "joined_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### `POST /team/invite`
Invite un collaborateur par email.

**Auth requis :** Oui — `TENANT_ADMIN`  
**Body :**
```json
{ "email": "alice@example.com", "role": "EDITOR" }
```
**Réponse 201 :** `{ "data": { "id": "uuid", "email": "alice@example.com", "role": "EDITOR", "expires_at": "..." } }`

---

### `PUT /team/{member_id}/role`
Change le rôle d'un membre.

**Auth requis :** Oui — `TENANT_ADMIN`  
**Body :** `{ "role": "AUTHOR" }`  
**Réponse 200 :** Membre mis à jour

---

### `DELETE /team/{member_id}`
Révoque l'accès d'un membre.

**Auth requis :** Oui — `TENANT_ADMIN`  
**Réponse 204 :** No Content

---

### `POST /team/invitations/{token}/accept`
Accepte une invitation (l'utilisateur doit être connecté).

**Auth requis :** Oui  
**Réponse 200 :** `{ "data": { "tenant": { ... }, "role": "EDITOR" } }`

---

## 5. Articles

### `GET /articles`
Liste les articles du tenant (dashboard).

**Auth requis :** Oui  
**Query params :**
```
?status=draft,published,in_review
?type=article,podcast
?category_id=uuid
?author_id=uuid
?language=fr
?q=recherche
?sort=created_at:desc
?limit=20&cursor=...
```
**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "article",
      "title": "Mon article",
      "slug": "mon-article",
      "excerpt": "...",
      "featured_image_url": "https://...",
      "status": "published",
      "visibility": "public",
      "category": { "id": "uuid", "name": "Tech", "slug": "tech" },
      "tags": [{ "id": "uuid", "name": "JavaScript", "slug": "javascript" }],
      "author": { "id": "uuid", "display_name": "Alice", "avatar_url": "..." },
      "language": "fr",
      "reading_time_minutes": 5,
      "views_count": 1240,
      "comments_count": 8,
      "published_at": "2026-06-20T10:00:00Z",
      "created_at": "2026-06-18T08:00:00Z"
    }
  ],
  "meta": { "cursor": "...", "has_more": true }
}
```

---

### `POST /articles`
Crée un nouvel article (brouillon).

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`, `AUTHOR`  
**Body :**
```json
{
  "type": "article",
  "title": "Mon nouvel article",
  "slug": "mon-nouvel-article",
  "excerpt": "Un court résumé...",
  "content": { "type": "doc", "content": [...] },
  "content_text": "Texte brut extrait...",
  "category_id": "uuid",
  "tag_ids": ["uuid1", "uuid2"],
  "featured_image_url": "https://...",
  "language": "fr",
  "visibility": "public",
  "meta_title": "Mon article SEO",
  "meta_description": "Description pour Google...",
  "status": "draft"
}
```
**Réponse 201 :** Article créé (schéma complet)

---

### `GET /articles/{id}`
Détail d'un article (dashboard).

**Auth requis :** Oui  
**Réponse 200 :** Article complet avec toutes les métadonnées

---

### `PUT /articles/{id}`
Met à jour un article.

**Auth requis :** Oui — Auteur de l'article (AUTHOR), EDITOR, TENANT_ADMIN  
**Body :** Champs partiels  
**Réponse 200 :** Article mis à jour

---

### `POST /articles/{id}/publish`
Publie un article immédiatement.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Body :** `{}` ou `{ "published_at": "2026-06-30T10:00:00Z" }` pour programmer  
**Réponse 200 :** `{ "data": { "status": "published", "published_at": "..." } }`

---

### `POST /articles/{id}/submit`
Soumet un article pour relecture (AUTHOR uniquement).

**Auth requis :** Oui — `AUTHOR`  
**Réponse 200 :** `{ "data": { "status": "in_review" } }`

---

### `POST /articles/{id}/approve`
Approuve un article soumis.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Body :** `{ "comment": "Très bon article !" }`  
**Réponse 200 :** `{ "data": { "status": "approved" } }`

---

### `POST /articles/{id}/reject`
Rejette un article soumis.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Body :** `{ "comment": "Il manque des sources..." }`  
**Réponse 200 :** `{ "data": { "status": "draft" } }`

---

### `POST /articles/{id}/unpublish`
Dépublie un article.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Réponse 200 :** `{ "data": { "status": "unpublished" } }`

---

### `DELETE /articles/{id}`
Envoie en corbeille (soft delete, 30 jours).

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`, auteur AUTHOR  
**Réponse 204 :** No Content

---

### `POST /articles/{id}/duplicate`
Duplique un article (crée un nouveau brouillon).

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Réponse 201 :** Nouvel article en DRAFT

---

### `GET /articles/{id}/versions`
Liste les versions d'un article.

**Auth requis :** Oui  
**Réponse 200 :** `{ "data": [{ "version_number": 3, "created_by": {...}, "created_at": "..." }] }`

---

### `POST /articles/{id}/versions/{version_number}/restore`
Restaure une version antérieure.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Réponse 200 :** Article avec le contenu restauré

---

### `GET /articles/{id}/translations`
Liste les traductions disponibles.

**Auth requis :** Oui

---

### `POST /articles/{id}/translations/{language}`
Génère ou met à jour une traduction (IA ou manuelle).

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Body :** `{ "source": "ai" }` ou `{ "source": "manual", "title": "...", "content": {...} }`

---

## 6. Catégories

### `GET /categories`
Liste toutes les catégories du tenant.

**Auth requis :** Oui  
**Réponse 200 :** Liste avec hiérarchie parent/enfant

---

### `POST /categories`
Crée une catégorie.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Body :**
```json
{
  "name": "Technologie",
  "slug": "technologie",
  "description": "Articles tech",
  "parent_id": null,
  "cover_image_url": "https://..."
}
```

---

### `PUT /categories/{id}`
Met à jour une catégorie.

---

### `DELETE /categories/{id}`
Supprime une catégorie (bloqué si articles publiés associés).

**Réponse 409 si articles publiés :**
```json
{ "error": "CATEGORY_HAS_PUBLISHED_ARTICLES", "message": "...", "count": 5 }
```

---

### `PUT /categories/reorder`
Réordonne les catégories par drag & drop.

**Body :** `{ "order": [{"id": "uuid", "sort_order": 0}, ...] }`

---

## 7. Tags

### `GET /tags`
Liste tous les tags avec compteur d'articles.

### `POST /tags`
Crée un tag.

### `PUT /tags/{id}`
Renomme un tag.

### `DELETE /tags/{id}`
Supprime un tag.

### `POST /tags/{id}/merge`
Fusionne un tag dans un autre.

**Body :** `{ "target_tag_id": "uuid" }`

---

## 8. Médias

### `POST /media/upload-url`
Génère une URL d'upload signé Cloudinary (upload direct depuis le client).

**Auth requis :** Oui  
**Body :**
```json
{
  "filename": "photo.jpg",
  "content_type": "image/jpeg",
  "size_bytes": 2048576
}
```
**Réponse 200 :**
```json
{
  "data": {
    "upload_url": "https://api.cloudinary.com/v1_1/...",
    "upload_params": {
      "api_key": "...",
      "timestamp": 1719399600,
      "signature": "...",
      "folder": "nexusblog/tenant_id/images"
    },
    "expires_at": "2026-06-26T10:01:00Z"
  }
}
```

---

### `POST /media`
Enregistre un média après upload Cloudinary réussi.

**Auth requis :** Oui  
**Body :**
```json
{
  "cloudinary_public_id": "nexusblog/uuid/images/photo",
  "cloudinary_url": "https://res.cloudinary.com/...",
  "original_name": "photo.jpg",
  "type": "image",
  "mime_type": "image/jpeg",
  "size_bytes": 2048576,
  "width": 1920,
  "height": 1080
}
```
**Réponse 201 :** Média enregistré (avec alt_text IA si image)

---

### `GET /media`
Médiathèque avec filtres.

**Query :** `?type=image&q=sunset&sort=created_at:desc&limit=30&cursor=...`

---

### `PUT /media/{id}`
Met à jour les métadonnées (alt_text, nom).

---

### `DELETE /media/{id}`
Supprime un média (avertissement si utilisé).

---

## 9. Commentaires

### `GET /comments`
Liste des commentaires (modération).

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Query :** `?status=pending&article_id=uuid&sort=created_at:desc`

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "article": { "id": "uuid", "title": "..." },
      "content": "Super article !",
      "status": "pending",
      "ai_risk_score": 12,
      "ai_risk_reasons": { "toxicity": 0.05, "spam": 0.10 },
      "author": { "name": "Jean Dupont", "email": "jean@..." },
      "ip_address": "192.168.1.x",
      "created_at": "2026-06-26T09:00:00Z"
    }
  ]
}
```

---

### `PUT /comments/{id}/status`
Change le statut d'un commentaire.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Body :** `{ "status": "approved" | "rejected" | "spam" | "shadow_banned" }`

---

### `DELETE /comments/{id}`
Supprime définitivement un commentaire.

---

### `POST /comments/{id}/ban-ip`
Bannit l'IP de l'auteur du commentaire.

**Body :** `{ "reason": "Spam répété", "expires_in_days": 30 }`

---

### `GET /banned-ips`
Liste des IPs bannies.

### `DELETE /banned-ips/{id}`
Lève un ban IP.

---

### `POST /articles/{article_id}/comments` *(Public)*
Poste un commentaire (endpoint public, rate limited).

**Auth requis :** Non (invité) ou Oui (authentifié)  
**Body :**
```json
{
  "content": "Excellent article, merci !",
  "parent_id": null,
  "guest_name": "Jean",
  "guest_email": "jean@example.com"
}
```
**Réponse 201 :** Commentaire créé (statut selon le mode de modération)

---

### `GET /articles/{article_id}/comments` *(Public)*
Commentaires approuvés d'un article, triés, paginés.

---

## 10. Newsletter

### `GET /newsletter/subscribers`
Liste des abonnés.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Query :** `?status=active&sort=created_at:desc&limit=50&cursor=...`

---

### `GET /newsletter/subscribers/export`
Export CSV des abonnés actifs.

**Auth requis :** Oui — `TENANT_ADMIN`  
**Réponse :** `Content-Type: text/csv`

---

### `DELETE /newsletter/subscribers/{id}`
Supprime manuellement un abonné (RGPD).

---

### `POST /newsletter/subscribe` *(Public)*
Abonnement depuis le blog public (déclenche double opt-in).

**Auth requis :** Non  
**Body :** `{ "email": "user@example.com", "first_name": "Marie" }`  
**Réponse 201 :** `{ "data": { "message": "Email de confirmation envoyé." } }`

---

### `GET /newsletter/confirm/{token}` *(Public)*
Confirme l'abonnement (double opt-in).

**Réponse 200 :** `{ "data": { "confirmed": true } }`

---

### `GET /newsletter/unsubscribe/{token}` *(Public)*
Se désabonner via le lien dans les emails.

**Réponse 200 :** `{ "data": { "unsubscribed": true } }`

---

### `GET /newsletter/campaigns`
Liste des campagnes.

---

### `POST /newsletter/campaigns`
Crée une campagne.

**Body :**
```json
{
  "subject": "Nos nouvelles du mois",
  "preview_text": "Voici ce qui s'est passé...",
  "content_html": "<html>...</html>",
  "from_name": "Mon Blog",
  "source_article_id": "uuid"
}
```

---

### `PUT /newsletter/campaigns/{id}`
Met à jour une campagne (uniquement si status=draft).

---

### `POST /newsletter/campaigns/{id}/send-test`
Envoie un email de test à l'adresse admin.

---

### `POST /newsletter/campaigns/{id}/send`
Envoie la campagne à tous les abonnés actifs.

**Body :** `{ "scheduled_at": null }` ou `{ "scheduled_at": "2026-07-01T10:00:00Z" }`

---

### `GET /newsletter/campaigns/{id}/stats`
Statistiques d'une campagne.

**Réponse 200 :**
```json
{
  "data": {
    "recipients_count": 500,
    "sent_count": 498,
    "delivered_count": 495,
    "opened_count": 210,
    "open_rate": 0.424,
    "clicked_count": 45,
    "click_rate": 0.091,
    "bounced_count": 3,
    "unsubscribed_count": 2
  }
}
```

---

## 11. Réseaux Sociaux

### `GET /social/accounts`
Liste les comptes connectés.

### `DELETE /social/accounts/{id}`
Déconnecte un compte social.

---

### `GET /social/accounts/{platform}/auth-url`
Génère l'URL d'autorisation OAuth pour une plateforme.

**Params :** `platform` = facebook | instagram | linkedin | twitter | ...  
**Réponse 200 :** `{ "data": { "auth_url": "https://..." } }`

---

### `POST /social/accounts/{platform}/callback`
Callback OAuth après autorisation.

**Body :** `{ "code": "oauth_code", "state": "csrf_state" }`  
**Réponse 201 :** Compte social connecté

---

### `PUT /social/accounts/{id}`
Met à jour la configuration (auto_post, delay, template).

**Body :**
```json
{
  "auto_post": true,
  "post_delay_minutes": 30,
  "caption_template": "🆕 {title}\n\n{excerpt}\n\nLire : {url}"
}
```

---

### `GET /social/posts`
Historique des posts sociaux.

**Query :** `?article_id=uuid&platform=linkedin&status=published`

---

### `POST /social/posts`
Publication manuelle vers les réseaux sociaux.

**Body :**
```json
{
  "article_id": "uuid",
  "platforms": ["linkedin", "twitter"],
  "caption_override": "Mon texte personnalisé...",
  "scheduled_at": null
}
```

---

### `GET /social/posts/{id}/preview`
Aperçu du post généré par IA avant envoi.

**Réponse 200 :**
```json
{
  "data": {
    "caption": "🆕 Découvrez notre guide complet...",
    "hashtags": ["#tech", "#saas", "#blogging"],
    "thumbnail_url": "https://...",
    "link_with_utm": "https://monblog.com/article?utm_source=linkedin&..."
  }
}
```

---

## 12. Publicité

### `GET /ads/campaigns`
Liste des campagnes publicitaires actives.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "image_url": "https://...",
      "ad_text": "Découvrez notre service",
      "destination_url": "https://annonceur.com",
      "budget_usd": 200,
      "weight": 400,
      "starts_at": "2026-06-01T00:00:00Z",
      "ends_at": "2026-06-30T23:59:59Z",
      "status": "active",
      "link_safety_status": "safe",
      "last_scanned_at": "2026-06-26T09:00:00Z",
      "impressions_count": 12400,
      "clicks_count": 85
    }
  ]
}
```

---

### `PUT /ads/campaigns/{id}`
Met à jour une campagne (pause, reprise).

**Body :** `{ "status": "paused" | "active" }`

---

### `DELETE /ads/campaigns/{id}`
Annule une campagne (remboursement si en cours).

---

### `GET /ads/submissions`
File de revue des soumissions publicitaires.

**Query :** `?status=pending`

---

### `POST /ads/submissions/{id}/approve`
Approuve une soumission et génère le lien de paiement.

**Auth requis :** Oui — `TENANT_ADMIN`  
**Body :** `{ "gateway": "stripe" | "paypal" }`  
**Réponse 200 :**
```json
{
  "data": {
    "payment_link": "https://buy.stripe.com/...",
    "payment_link_expires_at": "2026-06-29T00:00:00Z"
  }
}
```

---

### `POST /ads/submissions/{id}/reject`
Rejette une soumission.

**Body :** `{ "reason": "Contenu non conforme à nos conditions." }`

---

### `POST /ads/submit` *(Public)*
Formulaire de soumission publicitaire (accès public).

**Auth requis :** Non  
**Body :**
```json
{
  "email": "contact@entreprise.com",
  "business_name": "Mon Entreprise",
  "phone": "+33612345678",
  "image_base64": "data:image/jpeg;base64,...",
  "ad_text": "Découvrez notre service révolutionnaire",
  "destination_url": "https://monentreprise.com",
  "budget_usd": 150,
  "duration_days": 30,
  "message": "Je souhaite une visibilité maximale le matin."
}
```
**Réponse 201 :** `{ "data": { "message": "Soumission reçue. Email de confirmation envoyé." } }`

---

### `GET /ads/rotator` *(Public)*
Retourne la campagne à afficher (algorithme de rotation pondérée).

**Auth requis :** Non  
**Réponse 200 :**
```json
{
  "data": {
    "id": "uuid",
    "image_url": "https://...",
    "ad_text": "Découvrez...",
    "destination_url": "https://...",
    "is_clickable": true
  }
}
```

---

### `POST /ads/campaigns/{id}/impression` *(Public)*
Enregistre une impression (appelé côté client toutes les 30s).

**Auth requis :** Non (rate limited par IP)  
**Réponse 204 :** No Content

---

### `GET /ads/scans/{campaign_id}/history`
Historique des scans de sécurité d'une campagne.

**Auth requis :** Oui — `TENANT_ADMIN`

---

## 13. Analytics

### `GET /analytics/overview`
Métriques globales du blog.

**Auth requis :** Oui  
**Query :** `?period=7d | 30d | 90d | 1y | custom&from=2026-01-01&to=2026-06-30`

**Réponse 200 :**
```json
{
  "data": {
    "total_views": 45200,
    "unique_visitors": 12400,
    "avg_session_duration_seconds": 142,
    "bounce_rate": 0.42,
    "top_articles": [...],
    "views_by_day": [{ "date": "2026-06-01", "views": 1200 }],
    "traffic_sources": {
      "organic": 0.45,
      "social": 0.28,
      "direct": 0.18,
      "referral": 0.09
    },
    "top_countries": [{ "country_code": "FR", "views": 18000 }],
    "devices": { "desktop": 0.55, "mobile": 0.38, "tablet": 0.07 }
  }
}
```

---

### `GET /analytics/articles/{id}`
Statistiques d'un article.

**Réponse 200 :**
```json
{
  "data": {
    "article_id": "uuid",
    "total_views": 3400,
    "unique_visitors": 2100,
    "avg_scroll_depth": 0.72,
    "avg_reading_time_seconds": 185,
    "traffic_sources": { ... },
    "views_by_day": [ ... ],
    "comments_count": 14,
    "social_shares": { "linkedin": 45, "twitter": 120 }
  }
}
```

---

### `GET /analytics/revenue`
Métriques de revenus (Tiers Business+).

**Auth requis :** Oui — `TENANT_ADMIN`

---

### `GET /analytics/export`
Export CSV des données brutes (Tiers Business+).

**Query :** `?type=page_views&from=2026-01-01&to=2026-06-30`  
**Réponse :** `Content-Type: text/csv`

---

## 14. Recherche

### `GET /search` *(Public + Dashboard)*
Recherche full-text dans les articles.

**Auth requis :** Non (public) / Oui (dashboard — inclut les brouillons)  
**Query :**
```
?q=intelligence artificielle
&type=article,podcast
&category=tech
&language=fr
&from=2026-01-01
&limit=10&cursor=...
```

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "article",
      "title": "L'intelligence artificielle en 2026",
      "excerpt_highlighted": "...l'<em>intelligence artificielle</em> révolutionne...",
      "slug": "ia-2026",
      "featured_image_url": "https://...",
      "category": { "name": "Tech" },
      "published_at": "2026-06-01T00:00:00Z",
      "reading_time_minutes": 8,
      "score": 0.94
    }
  ],
  "meta": { "cursor": "...", "has_more": false, "total": 3 }
}
```

---

### `GET /search/suggestions` *(Public)*
Autocomplétion en temps réel.

**Query :** `?q=intelli&limit=5`  
**Réponse 200 :** `{ "data": ["intelligence artificielle", "intelligence émotionnelle"] }`

---

## 15. Paiements & Facturation

### `GET /billing/subscription`
Abonnement courant du tenant.

**Auth requis :** Oui — `TENANT_ADMIN`

---

### `POST /billing/checkout`
Crée une session de paiement pour changer de plan.

**Body :** `{ "plan": "pro", "billing_period": "monthly", "gateway": "stripe" }`  
**Réponse 200 :** `{ "data": { "checkout_url": "https://checkout.stripe.com/..." } }`

---

### `POST /billing/cancel`
Annule l'abonnement (à la fin de la période).

**Auth requis :** Oui — `TENANT_ADMIN`

---

### `GET /billing/invoices`
Liste des factures.

---

### `GET /billing/invoices/{id}/pdf`
Télécharge une facture en PDF.

**Réponse :** `Content-Type: application/pdf`

---

### `GET /billing/transactions`
Historique des transactions (abonnements + contenu + pub).

---

### `POST /billing/connect-stripe`
Connecte un compte Stripe (pour la monétisation du contenu).

**Auth requis :** Oui — `TENANT_ADMIN`  
**Réponse 200 :** `{ "data": { "onboarding_url": "https://connect.stripe.com/..." } }`

---

## 16. Notifications Push

### `GET /push/subscriptions`
Liste des abonnés push.

### `POST /push/send`
Envoie une notification push manuelle.

**Auth requis :** Oui — `TENANT_ADMIN`, `EDITOR`  
**Body :**
```json
{
  "title": "Nouvelle vidéo disponible !",
  "body": "Regardez notre dernière interview exclusive.",
  "image_url": "https://...",
  "target_url": "https://monblog.com/article",
  "category_ids": null
}
```

---

### `POST /push/subscribe` *(Public)*
Enregistre un token FCM.

**Body :** `{ "fcm_token": "...", "browser": "Chrome", "device_type": "desktop" }`  
**Réponse 201 :** No Content

---

### `DELETE /push/subscribe/{fcm_token}` *(Public)*
Se désabonner des push.

---

## 17. Intelligence Artificielle

### `POST /ai/writing/complete`
Complétion de texte.

**Auth requis :** Oui  
**Body :**
```json
{
  "context": "L'intelligence artificielle est...",
  "instruction": "continue",
  "tone": "professional",
  "max_tokens": 200
}
```
**Réponse 200 :** `{ "data": { "completion": "...en train de transformer l'industrie de la santé." } }`

---

### `POST /ai/writing/rewrite`
Reformulation d'un texte.

**Body :** `{ "text": "...", "tone": "casual | professional | formal" }`

---

### `POST /ai/seo/analyze`
Analyse SEO d'un article.

**Body :** `{ "article_id": "uuid" }`  
**Réponse 200 :**
```json
{
  "data": {
    "score": 72,
    "suggestions": [
      { "type": "title_length", "severity": "warning", "message": "Le titre est trop long (180 car.). Idéal : < 60 car." },
      { "type": "missing_h2", "severity": "info", "message": "Ajoutez au moins 2 sous-titres H2." }
    ]
  }
}
```

---

### `POST /ai/seo/meta`
Génère automatiquement meta title + meta description + tags.

**Body :** `{ "article_id": "uuid" }`

---

### `POST /ai/translate`
Traduit un article ou un texte.

**Body :**
```json
{
  "article_id": "uuid",
  "target_language": "fr",
  "source_language": "en"
}
```

---

### `POST /ai/moderate`
Modère manuellement un contenu textuel.

**Body :** `{ "text": "..." }`  
**Réponse 200 :**
```json
{
  "data": {
    "risk_score": 12,
    "categories": { "toxicity": 0.05, "spam": 0.08, "hate_speech": 0.01 },
    "decision": "safe"
  }
}
```

---

### `POST /ai/image/alt-text`
Génère le alt text d'une image.

**Body :** `{ "image_url": "https://..." }`  
**Réponse 200 :** `{ "data": { "alt_text": "Photo d'un coucher de soleil sur la mer..." } }`

---

### `POST /ai/social/generate`
Génère caption + hashtags pour un réseau social.

**Body :**
```json
{
  "article_id": "uuid",
  "platform": "linkedin",
  "tone": "professional"
}
```
**Réponse 200 :**
```json
{
  "data": {
    "caption": "🚀 Notre dernier article explore...",
    "hashtags": ["#tech", "#innovation", "#saas"],
    "thumbnail_prompt": "Modern tech blog cover with..."
  }
}
```

---

### `POST /ai/summary`
Génère un résumé d'article en points clés.

**Body :** `{ "article_id": "uuid", "num_points": 5 }`

---

### `POST /ai/plagiarism/check`
Vérifie le plagiat d'un article.

**Body :** `{ "article_id": "uuid" }`  
**Réponse 200 :**
```json
{
  "data": {
    "originality_score": 0.94,
    "flagged_segments": [
      { "text": "...", "source_url": "https://...", "similarity": 0.72 }
    ]
  }
}
```

---

## 18. API Publique (Lecture externe)

Ces endpoints sont accessibles via `X-API-Key` par les développeurs intégrateurs.

### `GET /public/articles`
Liste paginée des articles publiés.

**Auth :** API Key  
**Query :** `?type=article&category=tech&language=fr&limit=10&cursor=...`

---

### `GET /public/articles/{slug}`
Article complet par slug.

---

### `GET /public/categories`
Liste des catégories.

---

### `GET /public/tags`
Liste des tags.

---

### `GET /public/authors`
Liste des auteurs.

---

### `GET /public/podcast/{series_slug}`
Détail d'une série podcast + liste des épisodes.

---

### `GET /public/feed.rss`
Flux RSS du blog.  
**Réponse :** `Content-Type: application/rss+xml`

---

### `GET /public/podcast/{series_slug}/feed.rss`
Flux RSS d'un podcast (Apple Podcasts / Spotify compatible).  
**Réponse :** `Content-Type: application/rss+xml`

---

### `GET /public/sitemap.xml`
Sitemap XML dynamique.  
**Réponse :** `Content-Type: application/xml`

---

## 19. Super Admin

Tous les endpoints `/superadmin/*` sont accessibles uniquement aux utilisateurs `is_super_admin = true`.

### `GET /superadmin/tenants`
Liste tous les tenants.

**Query :** `?plan=pro&status=active&q=recherche&sort=created_at:desc`

---

### `GET /superadmin/tenants/{id}`
Détail d'un tenant (accès en lecture auditée).

---

### `PUT /superadmin/tenants/{id}/suspend`
Suspend un tenant.

**Body :** `{ "reason": "Contenu illicite signalé." }`

---

### `PUT /superadmin/tenants/{id}/reactivate`
Réactive un tenant suspendu.

---

### `DELETE /superadmin/tenants/{id}`
Supprime définitivement un tenant (après période de grâce).

---

### `GET /superadmin/metrics`
Métriques globales de la plateforme.

**Réponse 200 :**
```json
{
  "data": {
    "tenants_total": 1200,
    "tenants_by_plan": { "starter": 800, "pro": 320, "business": 75, "enterprise": 5 },
    "mrr_usd": 12450,
    "arr_usd": 149400,
    "churn_rate_monthly": 0.022,
    "articles_published_today": 340,
    "new_tenants_today": 12
  }
}
```

---

### `GET /superadmin/audit-logs`
Logs d'audit plateforme.

**Query :** `?user_id=uuid&action=tenant.suspend&from=2026-06-01`

---

### `POST /superadmin/broadcast`
Envoie un email à tous les tenants.

**Body :** `{ "subject": "Maintenance prévue le 28 juin", "content_html": "..." }`

---

## 20. Webhooks entrants

### `POST /webhooks/stripe`
Réception des événements Stripe.

**Headers :** `Stripe-Signature: t=...,v1=...`  
**Auth :** Vérification signature Stripe (HMAC-SHA256)

---

### `POST /webhooks/paypal`
Réception des événements PayPal.

**Headers :** `PAYPAL-TRANSMISSION-SIG: ...`

---

### `POST /webhooks/cloudinary`
Notification après upload et traitement Cloudinary.

---

## 21. Matrice des permissions

| Endpoint | PUBLIC | VIEWER | AUTHOR | EDITOR | TENANT_ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /public/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /auth/me` | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /articles` (dashboard) | — | ✅ | ✅ | ✅ | ✅ | — |
| `POST /articles` | — | — | ✅ | ✅ | ✅ | — |
| `POST /articles/{id}/submit` | — | — | ✅ | — | — | — |
| `POST /articles/{id}/publish` | — | — | — | ✅ | ✅ | — |
| `POST /articles/{id}/approve` | — | — | — | ✅ | ✅ | — |
| `DELETE /articles/{id}` | — | — | Own | ✅ | ✅ | — |
| `GET /comments` (modération) | — | — | — | ✅ | ✅ | — |
| `PUT /comments/{id}/status` | — | — | — | ✅ | ✅ | — |
| `POST /articles/{id}/comments` | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `GET /analytics/*` | — | ✅ | Own | ✅ | ✅ | — |
| `GET /billing/*` | — | — | — | — | ✅ | ✅ |
| `POST /team/invite` | — | — | — | — | ✅ | — |
| `DELETE /team/{id}` | — | — | — | — | ✅ | — |
| `GET /ads/submissions` | — | — | — | ✅ | ✅ | — |
| `POST /ads/submissions/{id}/approve` | — | — | — | — | ✅ | — |
| `POST /ads/submit` | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `GET /superadmin/*` | — | — | — | — | — | ✅ |

---

*Document suivant : Développement — Module Authentification*  
*Document précédent : [03_schema_base_de_donnees.md](./03_schema_base_de_donnees.md)*
