# NexusBlog SaaS — Cahier des Charges Technique

**Version :** 1.0  
**Date :** 2026-06-26  
**Statut :** Document de référence — validé  
**Dépend de :** [01_cahier_des_charges_fonctionnel.md](./01_cahier_des_charges_fonctionnel.md) v2.1  
**Édition :** Avancée — Version complète V1  

---

## Table des matières

1. [Stack technologique validée](#1-stack-technologique-validée)
2. [Architecture système globale](#2-architecture-système-globale)
3. [Stratégie multi-tenant](#3-stratégie-multi-tenant)
4. [Backend — FastAPI](#4-backend--fastapi)
5. [Base de données — Neon PostgreSQL](#5-base-de-données--neon-postgresql)
6. [Cache — Redis](#6-cache--redis)
7. [Recherche — Elasticsearch](#7-recherche--elasticsearch)
8. [Frontend — Next.js](#8-frontend--nextjs)
9. [Authentification](#9-authentification)
10. [Stockage médias — Cloudinary](#10-stockage-médias--cloudinary)
11. [Intelligence Artificielle](#11-intelligence-artificielle)
12. [Automatisation réseaux sociaux](#12-automatisation-réseaux-sociaux)
13. [Système multi-langues](#13-système-multi-langues)
14. [Système publicitaire & scan de sécurité](#14-système-publicitaire--scan-de-sécurité)
15. [Paiements — Stripe & PayPal](#15-paiements--stripe--paypal)
16. [Notifications push — FCM](#16-notifications-push--fcm)
17. [Email transactionnel](#17-email-transactionnel)
18. [Sécurité](#18-sécurité)
19. [Performance & SLAs](#19-performance--slas)
20. [Infrastructure & DevOps](#20-infrastructure--devops)
21. [Observabilité](#21-observabilité)
22. [Conformité RGPD & PCI-DSS](#22-conformité-rgpd--pci-dss)
23. [Questions ouvertes techniques](#23-questions-ouvertes-techniques)

---

## 1. Stack technologique validée

### Tableau récapitulatif

| Couche | Technologie | Version cible | Justification |
|---|---|---|---|
| **Frontend framework** | Next.js | 15.x (App Router) | SSR/SSG/ISR natif, excellent SEO, ecosystem React |
| **Langage frontend** | TypeScript | 5.x | Typage fort, maintenabilité, refactoring sûr |
| **Styling** | Tailwind CSS | 4.x | Utility-first, JIT compiler, excellent DX |
| **UI Components** | ShadCN UI | Latest | Composants accessibles non-opinionnés, basés Radix UI |
| **Animations** | Framer Motion | 11.x | Animations déclaratives, gestures, layout animations |
| **Backend framework** | FastAPI | 0.115.x | Async natif, OpenAPI auto-généré, performances élevées |
| **Langage backend** | Python | 3.12 | Maturité, écosystème IA, typing moderne |
| **ORM** | SQLAlchemy 2.0 | 2.0.x | Async support, Core + ORM, compatible asyncpg |
| **Migrations** | Alembic | Latest | Migrations versionnées, compatible SQLAlchemy |
| **Base de données** | Neon PostgreSQL | Latest | Serverless, branching, PgBouncer intégré, scales to zero |
| **Driver DB** | asyncpg | Latest | Driver PostgreSQL async le plus rapide pour Python |
| **Cache** | Redis | 7.x | Pub/Sub, structures de données riches, performance |
| **Client Redis** | redis-py (async) | Latest | Support async natif avec asyncio |
| **Recherche** | Elasticsearch | 8.x | Full-text, filtres, aggregations, multilingue |
| **Client ES** | elasticsearch-py | 8.x | Client officiel Python |
| **Auth** | Firebase Auth | v10 SDK | Google Sign-In natif, email/password, 2FA TOTP |
| **JWT** | python-jose | Latest | JWT signing/verification côté backend |
| **Push Notifications** | Firebase FCM | v1 API | Notifications web push cross-plateformes |
| **Stockage médias** | Cloudinary | Latest SDK | Transformation à la volée, CDN intégré, pipelines |
| **Paiements** | Stripe + PayPal | Stripe v3 / PayPal v2 | Double gateway, couverture mondiale |
| **Email** | Resend | Latest | API moderne, deliverability premium, React Email |
| **Conteneurisation** | Docker | 27.x | Déploiement reproductible |
| **Orchestration** | Kubernetes | 1.30.x | Scaling horizontal, self-healing, rolling deploys |
| **CI/CD** | GitHub Actions | N/A | Intégration native, large marketplace |
| **Reverse proxy** | Nginx | 1.26.x | Terminaison SSL, routing, rate limiting niveau infra |
| **Monitoring** | Prometheus + Grafana | Latest | Métriques temps réel, alerting |
| **Logging** | Loki + Grafana | Latest | Agrégation logs, corrélation avec métriques |
| **Tracing** | OpenTelemetry | Latest | Distributed tracing, compatible Jaeger/Tempo |

---

## 2. Architecture système globale

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└───────────────────────┬────────────────────────────────────────┘
                        │
                ┌───────▼────────┐
                │   Cloudflare   │  ← WAF, DDoS protection, CDN
                │  (DNS + CDN)   │
                └───────┬────────┘
                        │
                ┌───────▼────────┐
                │  Load Balancer │  ← Kubernetes Ingress (Nginx)
                │  + SSL/TLS     │    Terminaison TLS, routing
                └──┬──────────┬──┘
                   │          │
          ┌────────▼──┐  ┌───▼────────┐
          │ Next.js   │  │  FastAPI   │  ← Kubernetes Pods
          │ Frontend  │  │  Backend   │    Auto-scaling HPA
          │ (SSR/SSG) │  │  API v1    │
          └─────┬─────┘  └─────┬──────┘
                │              │
                │        ┌─────▼──────────────────────────────┐
                │        │           Data Layer                │
                │        │                                     │
                │        │  ┌─────────────┐  ┌─────────────┐  │
                │        │  │    Neon     │  │    Redis    │  │
                │        │  │ PostgreSQL  │  │   (Cache)   │  │
                │        │  │ (Serverless)│  │             │  │
                │        │  └─────────────┘  └─────────────┘  │
                │        │                                     │
                │        │  ┌─────────────┐  ┌─────────────┐  │
                │        │  │Elasticsearch│  │  Cloudinary │  │
                │        │  │  (Search)   │  │  (Médias)   │  │
                │        │  └─────────────┘  └─────────────┘  │
                │        └─────────────────────────────────────┘
                │
                │        ┌─────────────────────────────────────┐
                │        │        Services Externes            │
                │        │                                     │
                │        │  Firebase Auth/FCM │ Stripe/PayPal  │
                │        │  OpenAI / DeepL    │ Social APIs    │
                │        │  Google Safe Brow. │ VirusTotal     │
                │        │  Resend (Email)    │ Matomo/GA4     │
                │        └─────────────────────────────────────┘
```

### Flux d'une requête type (article public)

```
Visiteur
  → Cloudflare CDN (cache hit?) → Renvoie directement si en cache
  → Cloudflare → Nginx Ingress
  → Nginx → Next.js Pod (SSR/ISR)
  → Next.js → FastAPI /api/v1/articles/{slug}
  → FastAPI → Redis (cache API hit?)
  → FastAPI → Neon PostgreSQL (si cache miss)
  → FastAPI → Redis (mise en cache du résultat)
  → FastAPI → Next.js → Rendu HTML → Visiteur
```

### Séparation des responsabilités

| Composant | Responsabilité unique |
|---|---|
| **Cloudflare** | WAF, DDoS, CDN, DNS, cache niveau edge |
| **Nginx Ingress** | Routing, terminaison SSL interne, rate limiting infra |
| **Next.js** | Rendu (SSR/SSG/ISR), routing frontend, API Routes pour BFF |
| **FastAPI** | Business logic, accès données, orchestration services |
| **Neon PostgreSQL** | Persistance, isolation tenant (RLS), transactions |
| **Redis** | Cache application, sessions, rate limiting, pub/sub |
| **Elasticsearch** | Recherche full-text, indexation contenu |
| **Cloudinary** | Stockage, transformation, delivery des médias |

---

## 3. Stratégie multi-tenant

### Modèle choisi : Shared Database + Shared Schema + Row-Level Security

**Trois approches possibles :**

| Approche | Isolation | Complexité | Coût à 10k tenants |
|---|---|---|---|
| Database par tenant | Maximale | Très haute | Prohibitif (10k connexions DB) |
| Schema par tenant | Haute | Haute | Élevé (migrations complexes) |
| **RLS (choix retenu)** | **Très haute** | **Modérée** | **Optimal** |

**Pourquoi RLS avec Neon :**
- PostgreSQL RLS fournit une isolation au niveau du moteur de base de données, pas seulement applicatif
- Neon supporte pleinement RLS
- Une seule connexion pool partagée = économique à grande échelle
- Les migrations s'appliquent une seule fois pour tous les tenants

### Implémentation RLS

**Colonne `tenant_id` sur toutes les tables :**
```sql
-- Chaque table métier contient :
tenant_id UUID NOT NULL REFERENCES tenants(id)

-- Index composite sur toutes les tables :
CREATE INDEX idx_{table}_tenant ON {table}(tenant_id);
```

**Politique RLS type :**
```sql
-- Activation de la RLS sur chaque table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Politique : un utilisateur ne voit que les lignes de son tenant
CREATE POLICY tenant_isolation ON articles
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Le Super Admin bypasse la RLS
CREATE POLICY super_admin_bypass ON articles
    USING (current_setting('app.is_super_admin', true)::boolean = true);
```

**Middleware FastAPI — injection du tenant_id :**
```
Requête entrante
    ↓
TenantMiddleware
    ├── Extraction du host (subdomain ou custom domain)
    ├── Résolution tenant_id via Redis (cache) ou Neon
    ├── Validation du token JWT → extraction user_id + role
    └── SET LOCAL app.current_tenant_id = '{tenant_id}'
        SET LOCAL app.current_user_id = '{user_id}'
        SET LOCAL app.user_role = '{role}'
    ↓
Handler FastAPI (les requêtes SQL sont automatiquement filtrées par RLS)
```

### Identification du tenant

**Deux méthodes de routing tenant :**

1. **Sous-domaine** : `monblog.nexusblog.io`
   - Header `Host` extrait → slug `monblog` → lookup Redis → `tenant_id`

2. **Domaine personnalisé** : `www.monsite.com`
   - Header `Host` extrait → lookup Redis (custom_domains table) → `tenant_id`

**Cache Redis pour la résolution de tenant :**
```
tenant:subdomain:{slug}       → tenant_id  (TTL: 1h)
tenant:domain:{domain}        → tenant_id  (TTL: 1h)
tenant:config:{tenant_id}     → JSON config (TTL: 5min)
```

---

## 4. Backend — FastAPI

### Structure du projet

```
backend/
├── app/
│   ├── main.py                    # Application FastAPI, middlewares globaux
│   ├── core/
│   │   ├── config.py              # Paramètres (Pydantic Settings)
│   │   ├── database.py            # Connexion Neon asyncpg + SQLAlchemy
│   │   ├── redis.py               # Client Redis async
│   │   ├── security.py            # JWT, hashing, tokens
│   │   └── exceptions.py          # Exceptions HTTP personnalisées
│   ├── middleware/
│   │   ├── tenant.py              # Résolution tenant + RLS setup
│   │   ├── auth.py                # Validation JWT + injection user
│   │   └── rate_limit.py          # Rate limiting Redis
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── tenant.py
│   │   ├── user.py
│   │   ├── article.py
│   │   ├── media.py
│   │   ├── comment.py
│   │   ├── newsletter.py
│   │   ├── ad.py
│   │   └── ...
│   ├── schemas/                   # Pydantic schemas (request/response)
│   │   ├── article.py
│   │   ├── user.py
│   │   └── ...
│   ├── api/
│   │   └── v1/
│   │       ├── router.py          # Agrégation de tous les routers
│   │       ├── auth.py
│   │       ├── articles.py
│   │       ├── media.py
│   │       ├── comments.py
│   │       ├── newsletter.py
│   │       ├── analytics.py
│   │       ├── social.py
│   │       ├── ads.py
│   │       ├── payments.py
│   │       ├── search.py
│   │       ├── tenants.py
│   │       └── superadmin.py
│   ├── services/                  # Business logic
│   │   ├── ai/
│   │   │   ├── writing.py         # Rédaction, reformulation
│   │   │   ├── moderation.py      # Modération commentaires
│   │   │   ├── translation.py     # Traduction
│   │   │   ├── seo.py             # Suggestions SEO
│   │   │   ├── images.py          # Alt text, thumbnail
│   │   │   └── plagiarism.py      # Détection plagiat
│   │   ├── social/
│   │   │   ├── publisher.py       # Orchestrateur publication sociale
│   │   │   ├── facebook.py
│   │   │   ├── linkedin.py
│   │   │   ├── twitter.py
│   │   │   └── ...
│   │   ├── email.py               # Resend email service
│   │   ├── cloudinary.py          # Upload, transformation médias
│   │   ├── elasticsearch.py       # Indexation et recherche
│   │   ├── payments/
│   │   │   ├── stripe.py
│   │   │   └── paypal.py
│   │   ├── link_scanner.py        # Scan de sécurité des liens pub
│   │   └── fcm.py                 # Firebase push notifications
│   ├── workers/                   # Background tasks (Celery ou ARQ)
│   │   ├── social_publisher.py    # Publication asynchrone réseaux sociaux
│   │   ├── link_scanner.py        # Cron scan horaire des liens pub
│   │   ├── newsletter.py          # Envoi newsletter en batch
│   │   ├── ai_processor.py        # Tâches IA longues (génération, traduction)
│   │   └── analytics.py           # Agrégation analytiques
│   └── utils/
│       ├── pagination.py
│       ├── slug.py
│       └── validators.py
├── migrations/                    # Alembic migrations
├── tests/
├── Dockerfile
└── requirements.txt
```

### Worker asynchrone

**Choix : ARQ (Async Redis Queue) — Python natif async**

Justification vs Celery :
- ARQ est 100% async (natif asyncio) — cohérent avec FastAPI
- Plus léger, moins de configuration
- Redis comme broker (déjà utilisé dans la stack)
- Parfaitement adapté aux tâches du projet

**Tâches définies :**

| Tâche | Déclencheur | Timeout |
|---|---|---|
| `publish_to_social` | À la publication d'un article | 120s |
| `scan_ad_links` | Cron toutes les heures | 300s |
| `send_newsletter_batch` | Envoi newsletter (chunks de 100) | 600s |
| `generate_ai_thumbnail` | Post-upload image | 60s |
| `translate_article` | Demande de traduction | 180s |
| `index_article_elasticsearch` | Publication/modification article | 30s |
| `generate_article_summary` | Publication article | 60s |
| `send_push_notification` | Publication article | 30s |

### Conventions API

- **Versioning** : `/api/v1/` — Breaking changes → nouvelle version `/api/v2/`
- **Pagination** : Cursor-based (plus performant que offset pour grands datasets)
  ```json
  { "data": [...], "cursor": "eyJpZCI6...", "has_more": true }
  ```
- **Format erreur standard** :
  ```json
  {
    "error": "ARTICLE_NOT_FOUND",
    "message": "L'article demandé n'existe pas",
    "status": 404,
    "trace_id": "abc123"
  }
  ```
- **Rate limiting headers** :
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1719399600
  ```

---

## 5. Base de données — Neon PostgreSQL

### Pourquoi Neon

| Fonctionnalité | Impact sur NexusBlog |
|---|---|
| **Serverless auto-scaling** | Supporte les pics de trafic sans intervention |
| **Scale to zero** | Environnements dev/staging ne coûtent rien la nuit |
| **Branching** | Branche de DB par feature branch Git — tests isolés |
| **PgBouncer intégré** | Connection pooling critique — évite le `too many clients` |
| **Compatible PostgreSQL** | RLS, extensions, triggers — tout fonctionne |
| **Read replicas** | Séparation lecture/écriture pour les analytics |

### Configuration de connexion

```python
# Pooling mode recommandé pour FastAPI (serverless-friendly)
DATABASE_URL = "postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Paramètres SQLAlchemy async engine
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,          # Faible — Neon PgBouncer gère le pooling réel
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,    # Recyclage toutes les 30min (évite les connexions stales)
    echo=False,
)
```

### Extensions PostgreSQL activées

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- Génération UUID v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- Chiffrement, hashing
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Similarité de texte (fuzzy search)
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- Recherche sans accents
CREATE EXTENSION IF NOT EXISTS "btree_gin";     -- Index GIN sur types scalaires
```

### Stratégie de migrations (Alembic)

- Une migration = un fichier versionné dans `migrations/versions/`
- Chaque migration est réversible (méthode `upgrade` + `downgrade`)
- Pipeline CI exécute `alembic upgrade head` avant tout déploiement
- Environnements : Neon branching
  - `main` branch → production
  - `staging` branch → staging
  - `feature/*` branch → par feature (créé/supprimé automatiquement par CI)

### Politique d'index

**Index standards (toutes tables) :**
```sql
-- Chaque table a ces index minimaux
CREATE INDEX idx_{table}_id ON {table}(id);
CREATE INDEX idx_{table}_tenant ON {table}(tenant_id);
CREATE INDEX idx_{table}_created ON {table}(created_at DESC);
```

**Index composites (tables critiques) :**
```sql
-- Articles : requête la plus fréquente
CREATE INDEX idx_articles_tenant_status_pub
    ON articles(tenant_id, status, published_at DESC)
    WHERE status = 'PUBLISHED';

-- Commentaires : modération
CREATE INDEX idx_comments_tenant_status
    ON comments(tenant_id, status, created_at DESC);

-- Abonnés newsletter
CREATE INDEX idx_subscribers_tenant_email
    ON newsletter_subscribers(tenant_id, email)
    WHERE status = 'ACTIVE';
```

---

## 6. Cache — Redis

### Stratégie de cache par domaine

| Clé Redis | Contenu | TTL | Invalidation |
|---|---|---|---|
| `tenant:subdomain:{slug}` | tenant_id | 1h | Modification tenant |
| `tenant:domain:{domain}` | tenant_id | 1h | Modification domaine |
| `tenant:config:{id}` | Configuration tenant JSON | 5min | Modification settings |
| `jwt:blacklist:{jti}` | Token révoqué (valeur = "1") | = expiry du token | Auto |
| `refresh:{token_hash}` | user_id + tenant_id + role | 7j | Déconnexion / révocation |
| `rate:ip:{ip}:{route}` | Compteur de requêtes | 1min | Auto |
| `rate:apikey:{key}` | Compteur mensuel | Reset 1er du mois | Auto |
| `cache:api:{tenant}:{hash}` | Réponse API JSON | 2min | Publication nouvel article |
| `cache:article:{slug}` | Article complet JSON | 10min | Modification article |
| `cache:ai:{hash}` | Résultat IA | 24h | Jamais (cache permanent) |
| `cache:translate:{lang}:{hash}` | Traduction | 7j | Jamais |
| `session:scan:{url_hash}` | Dernier résultat scan URL | 50min | Résultat scan (< 1h) |
| `social:tokens:{tenant}:{platform}` | OAuth tokens chiffrés | 55min | Refresh OAuth |
| `es:query:{tenant}:{hash}` | Résultat Elasticsearch | 30s | Nouvelle publication |

### Redis comme Pub/Sub

Utilisé pour les événements temps réel entre les workers et l'API :

```
Channel: article:published:{tenant_id}
    → Déclenche : indexation ES + push FCM + publication sociale + newsletter

Channel: ad:link:dangerous:{ad_id}
    → Déclenche : désactivation campagne + notification admin + remboursement

Channel: comment:flagged:{comment_id}
    → Déclenche : notification modération admin
```

---

## 7. Recherche — Elasticsearch

### Index par type de contenu

```json
Index: nexusblog_articles_{tenant_id}
{
  "mappings": {
    "properties": {
      "id":           { "type": "keyword" },
      "title":        { "type": "text", "analyzer": "multilingual" },
      "excerpt":      { "type": "text", "analyzer": "multilingual" },
      "content_text": { "type": "text", "analyzer": "multilingual" },
      "slug":         { "type": "keyword" },
      "status":       { "type": "keyword" },
      "type":         { "type": "keyword" },
      "category_id":  { "type": "keyword" },
      "tags":         { "type": "keyword" },
      "author_id":    { "type": "keyword" },
      "language":     { "type": "keyword" },
      "published_at": { "type": "date" },
      "embedding":    { "type": "dense_vector", "dims": 1536 }
    }
  }
}
```

### Stratégie de recherche

**Recherche full-text :**
- Analyzer multilingue : détection automatique de la langue, stemming, synonymes
- `multi_match` sur title (boost ×3), excerpt (boost ×2), content_text

**Recherche sémantique (IA) :**
- L'assistant de recherche IA génère un embedding de la requête utilisateur
- k-Nearest Neighbors (kNN) sur le champ `embedding` pour trouver les articles similaires
- Combinaison full-text + sémantique (score hybride)

**Recommandations d'articles :**
- `more_like_this` query sur l'article courant
- Combiné avec les embeddings pour similarité sémantique

**Synchronisation DB → Elasticsearch :**
- À chaque publication/modification d'article : tâche ARQ `index_article_elasticsearch`
- À chaque suppression : `delete_from_index`
- Aucune synchronisation temps réel directe — toujours via le worker

---

## 8. Frontend — Next.js

### Stratégie de rendu par page

| Page | Stratégie | Justification |
|---|---|---|
| Blog public — article | ISR (revalidate: 60s) | Contenu fréquemment lu, rarement modifié |
| Blog public — listing | ISR (revalidate: 30s) | Changement à chaque publication |
| Blog public — page d'accueil | ISR (revalidate: 60s) | Contenu semi-dynamique |
| Blog public — catégorie/tag | SSG + ISR | Rarement modifiés |
| Recherche | SSR | Query dynamique, non cacheable |
| Dashboard admin | SSR | Données temps réel, authentification |
| Page de connexion | SSG | Statique |
| Super Admin | SSR | Données sensibles, pas de cache |

### Structure du projet Next.js

```
frontend/
├── app/
│   ├── (public)/                  # Routes publiques du blog
│   │   ├── [tenant]/              # Routing par sous-domaine (middleware)
│   │   │   ├── page.tsx           # Page d'accueil du blog
│   │   │   ├── [slug]/page.tsx    # Article
│   │   │   ├── category/[slug]/   # Listing catégorie
│   │   │   ├── tag/[slug]/        # Listing tag
│   │   │   └── search/            # Recherche
│   │   └── layout.tsx
│   ├── (auth)/                    # Authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/               # Dashboard tenant (protégé)
│   │   ├── layout.tsx
│   │   ├── overview/
│   │   ├── articles/
│   │   ├── media/
│   │   ├── comments/
│   │   ├── newsletter/
│   │   ├── analytics/
│   │   ├── social/
│   │   ├── ads/
│   │   ├── settings/
│   │   └── billing/
│   ├── (superadmin)/              # Super Admin (protégé SUPER_ADMIN)
│   │   ├── tenants/
│   │   ├── analytics/
│   │   └── settings/
│   └── api/                       # Next.js API Routes (BFF pattern)
│       ├── auth/[...nextauth]/
│       └── revalidate/
├── components/
│   ├── ui/                        # ShadCN components
│   ├── blog/                      # Composants blog public
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleContent.tsx
│   │   ├── AdRotator.tsx
│   │   ├── CommentSection.tsx
│   │   ├── NewsletterWidget.tsx
│   │   └── ...
│   ├── editor/                    # Éditeur Tiptap
│   │   ├── TiptapEditor.tsx
│   │   ├── AIAssistant.tsx
│   │   └── extensions/
│   ├── dashboard/                 # Composants dashboard
│   └── shared/                    # Composants partagés
├── lib/
│   ├── api.ts                     # Client API FastAPI
│   ├── auth.ts                    # Firebase Auth helpers
│   └── utils.ts
├── hooks/                         # React hooks personnalisés
├── stores/                        # Zustand stores
├── types/                         # TypeScript types partagés
└── middleware.ts                  # Middleware Next.js (tenant routing)
```

### Middleware Next.js — Routing multi-tenant

```typescript
// middleware.ts
// Identifie le tenant depuis le host et injecte les headers
export function middleware(req: NextRequest) {
  const host = req.headers.get('host')
  const subdomain = extractSubdomain(host)       // monblog.nexusblog.io → "monblog"
  const customDomain = isCustomDomain(host)       // www.monsite.com → true

  // Injection dans les headers pour les Server Components
  const headers = new Headers(req.headers)
  headers.set('x-tenant-slug', subdomain ?? '')
  headers.set('x-tenant-domain', customDomain ? host : '')

  return NextResponse.next({ headers })
}
```

### Gestion d'état

- **Server State** : TanStack Query (React Query) v5 — fetch, cache, sync avec le serveur
- **Client State** : Zustand — état UI léger (sidebar open, theme, preferences)
- **Form State** : React Hook Form + Zod — validation typée côté client

---

## 9. Authentification

### Flux complet d'authentification

```
1. CONNEXION INITIALE
──────────────────────
Utilisateur → Firebase Auth (Google Sign-In ou email/password)
Firebase Auth → ID Token (JWT Firebase, durée 1h)
Frontend → POST /api/v1/auth/login { firebase_id_token }
  ↓
Backend FastAPI :
  1. Vérification du Firebase ID Token via Firebase Admin SDK
  2. Extraction uid + email + email_verified
  3. Lookup ou création du user en base
  4. Génération Access Token JWT signé (HS256, 15 min, claims: user_id, tenant_id, role)
  5. Génération Refresh Token (UUID v4, haché en SHA-256, stocké dans Redis + DB)
  6. Retour : { access_token, expires_in: 900 }
  7. Refresh Token → cookie HttpOnly + Secure + SameSite=Strict + Path=/api/v1/auth

2. REQUÊTE AUTHENTIFIÉE
──────────────────────
Frontend → Authorization: Bearer {access_token}
Backend FastAPI :
  1. Décodage JWT, vérification signature, expiry
  2. Vérification jti non blacklisté (Redis)
  3. Injection user dans request.state

3. RENOUVELLEMENT DU TOKEN
──────────────────────────
Access Token expiré → Frontend → POST /api/v1/auth/refresh
Cookie refresh_token envoyé automatiquement
Backend :
  1. Lecture refresh token depuis cookie
  2. Hash SHA-256 → lookup Redis
  3. Vérification validité + non révoqué
  4. Rotation : suppression ancien refresh token, génération nouveau
  5. Retour : nouveau access_token + nouveau refresh token (cookie mis à jour)

4. DÉCONNEXION
──────────────
Frontend → POST /api/v1/auth/logout
Backend :
  1. Blacklist du jti de l'access token courant dans Redis (TTL = temps restant du token)
  2. Suppression du refresh token (Redis + DB)
  3. Suppression du cookie
```

### Claims du JWT

```json
{
  "sub": "user_id_uuid",
  "tenant_id": "tenant_id_uuid",
  "role": "TENANT_ADMIN",
  "email": "user@example.com",
  "jti": "unique_token_id",
  "iat": 1719399000,
  "exp": 1719399900
}
```

### 2FA — TOTP

- Activation via `/api/v1/auth/2fa/setup` → retourne URI TOTP + QR code
- Vérification via `/api/v1/auth/2fa/verify` → valide le code TOTP (fenêtre ±30s)
- Codes de récupération (8 codes à usage unique) générés à l'activation
- Obligatoire pour les Super Admins, optionnel pour les Tenant Admins (Tiers Pro+)

---

## 10. Stockage médias — Cloudinary

### Pipelines de transformation

**Images :**
```
Upload → Cloudinary
  → Détection MIME + magic bytes (sécurité)
  → Génération WebP + AVIF automatique
  → Génération srcset : 400w, 800w, 1200w, 1600w
  → Stockage dans le dossier tenant : /nexusblog/{tenant_id}/images/
  → Génération d'URL de livraison via CDN Cloudinary
```

**Vidéos :**
```
Upload → Cloudinary
  → Transcodage MP4 H.264 en : 360p, 720p, 1080p
  → Génération thumbnail automatique (frame 0s, 5s, 10s)
  → Génération du poster (image d'aperçu)
  → Dossier : /nexusblog/{tenant_id}/videos/
```

**Audio :**
```
Upload → Cloudinary
  → Conversion MP3 320kbps
  → Normalisation du volume (EBU R128)
  → Génération forme d'onde (waveform) pour le player
  → Dossier : /nexusblog/{tenant_id}/audio/
```

### Signed URLs

Tous les uploads passent par des **signed upload URLs** générées côté backend :
- Frontend demande une upload URL signée à FastAPI
- FastAPI génère une signature Cloudinary (expire en 60s)
- Frontend uploade directement vers Cloudinary (pas de transit par le backend)
- Backend reçoit le webhook Cloudinary de confirmation + métadonnées

---

## 11. Intelligence Artificielle

### Architecture du module IA

```
AIService (orchestrateur)
    ├── Router (détermine le fournisseur selon la tâche)
    ├── RateLimiter (quota par tenant selon le plan)
    ├── CacheLayer (Redis, TTL variable)
    └── Providers
        ├── OpenAIProvider    (texte, images, modération, embeddings)
        ├── DeepLProvider     (traduction)
        ├── ElevenLabsProvider (TTS)
        ├── WhisperProvider   (transcription audio)
        └── CustomProvider    (clé API tenant Enterprise)
```

### Fournisseurs IA — Décisions

| Tâche | Fournisseur retenu | Modèle | Justification |
|---|---|---|---|
| Rédaction / complétion | OpenAI | GPT-4o | Meilleure qualité, long context |
| Correction grammaticale | OpenAI | GPT-4o-mini | Rapide, peu coûteux |
| Résumés articles | OpenAI | GPT-4o-mini | Suffisant pour la tâche |
| Suggestions SEO | OpenAI | GPT-4o-mini | Rapide, structuré |
| Détection plagiat | Copyscape API | — | Spécialisé, base de données web |
| Traduction | DeepL API | DeepL Pro | Meilleure qualité EU, 29 langues natives |
| Traduction LLM (langues rares) | OpenAI | GPT-4o | Fallback DeepL pour langues non supportées |
| Modération commentaires | OpenAI | omni-moderation-latest | API modération officielle + catégories |
| Alt text images | OpenAI | GPT-4o Vision | Description d'images précise |
| Génération thumbnails | OpenAI | DALL-E 3 | Qualité premium |
| Amélioration qualité images pub | Cloudinary AI | — | Intégré nativement, pas de coût IA |
| TTS (lecture vocale) | ElevenLabs | Multilingual v2 | Voix naturelles, multilingue |
| Transcription audio | OpenAI | Whisper | Précision élevée, open source |
| Embeddings (recommandations) | OpenAI | text-embedding-3-small | Rapide, économique, performant |
| Génération captions sociales | OpenAI | GPT-4o-mini | Ton adaptatif par plateforme |
| Génération hashtags | OpenAI | GPT-4o-mini | Structuré, précis |
| Auto-catégorisation | OpenAI | GPT-4o-mini | Classification multi-labels |

### Gestion des quotas IA par plan

| Opération | Starter | Pro | Business | Enterprise |
|---|---|---|---|---|
| Tokens rédaction/mois | 0 | 100k | 1M | Illimité |
| Traductions/mois | 0 | 50k mots | 500k mots | Illimité |
| Thumbnails générés/mois | 0 | 20 | 200 | Illimité |
| TTS (minutes audio)/mois | 0 | 30 min | 300 min | Illimité |
| Modération commentaires | Non | Oui | Oui | Oui |

---

## 12. Automatisation réseaux sociaux

### Architecture d'intégration

```
Publication article
    ↓
SocialPublisherService
    ↓
Pour chaque plateforme activée :
    → Génération caption IA (OpenAI GPT-4o-mini)
    → Génération hashtags IA
    → Génération thumbnail (dimensions plateforme)
    → Ajout UTM parameters sur le lien
    → Mise en file ARQ worker (délai configurable par plateforme)
    ↓
ARQ Worker : SocialPlatformAdapter.publish(post_data)
    ↓
    ├── Appel API plateforme (OAuth 2.0 token depuis Redis)
    ├── Succès → log publication + analytics
    └── Échec → retry (3x, backoff exponentiel)
                → Notification admin si échec définitif
```

### OAuth Token Management

- Les tokens OAuth des plateformes sociales sont stockés **chiffrés** dans Neon PostgreSQL
- Version déchiffrée mise en cache dans Redis (TTL = expiry du token - 5 min)
- Refresh automatique du token OAuth avant expiry
- Révocation possible par le tenant depuis le dashboard

### Limites API des plateformes

| Plateforme | Limite connue | Gestion |
|---|---|---|
| Facebook | 200 posts/heure par page | Queue avec throttling |
| Instagram | 25 posts/24h par compte | Queue avec délai forcé |
| LinkedIn | 100 posts/24h | Queue |
| X/Twitter | 300 tweets/3h | Queue avec throttling |
| TikTok | Contenu vidéo requis | Vérification avant envoi |
| WhatsApp Channel | Restrictions API | Webhook Business API |

---

## 13. Système multi-langues

### Architecture de traduction

```
Requête article en langue X (ex: /fr/mon-article)
    ↓
Redis cache : existe une traduction FR pour cet article ?
    ├── OUI → Retour depuis cache (TTL 7j)
    └── NON
        ↓
        Traduction FR disponible en base ?
        ├── OUI → Retour depuis DB + mise en cache
        └── NON
            ↓
            Appel DeepL API (si langue supportée) ou OpenAI GPT-4o
            ↓
            Stockage en base (table article_translations)
            Mise en cache Redis (TTL 7j)
            ↓
            Retour contenu traduit
```

### Table `article_translations`

```sql
CREATE TABLE article_translations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID NOT NULL REFERENCES articles(id),
    tenant_id   UUID NOT NULL,
    language    VARCHAR(10) NOT NULL,  -- BCP 47 (fr, en, ar, zh-CN)
    title       TEXT NOT NULL,
    excerpt     TEXT,
    content     JSONB NOT NULL,        -- Blocs traduits (même format que l'original)
    meta_title  TEXT,
    meta_desc   TEXT,
    slug        VARCHAR(500),
    is_auto     BOOLEAN DEFAULT TRUE,  -- TRUE = traduit par IA, FALSE = traduction manuelle
    translated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, language)
);
```

### Support RTL

- Détection automatique via la langue sélectionnée (`ar`, `he`, `fa`, `ur` → RTL)
- Next.js : attribut `dir="rtl"` sur `<html>`
- Tailwind CSS : classes RTL-aware (plugin `tailwindcss-rtl` ou Tailwind v4 natif)
- ShadCN UI : composants compatibles RTL
- Framer Motion : animations inversées pour RTL

---

## 14. Système publicitaire & scan de sécurité

### Architecture du rotateur

```typescript
// Composant AdRotator — rotation côté client, display-only ou avec lien
// Les bannières se succèdent toutes les 30 secondes
// Algorithme de sélection : Weighted Random (proportionnel au budget)

function selectAd(ads: Ad[]): Ad {
  const totalWeight = ads.reduce((sum, ad) => sum + ad.weight, 0)
  let random = Math.random() * totalWeight
  for (const ad of ads) {
    random -= ad.weight
    if (random <= 0) return ad
  }
  return ads[ads.length - 1]
}

// weight = budget_paid / budget_total_campagne * 100
```

### Pipeline de scan horaire

```
[ARQ Cron — toutes les heures]
    ↓
Récupération de toutes les URLs publicitaires actives (Neon PostgreSQL)
    ↓
Pour chaque URL :
    1. Vérification Redis : résultat scan < 50 min ? → Skip (évite double-scan)
    2. Appels parallèles (asyncio.gather) :
       - Google Safe Browsing API v4
       - VirusTotal URL scan API
       - URLhaus lookup API
       - PhishTank API
    3. Agrégation des résultats → score (SAFE / SUSPECT / DANGEROUS)
    4. Mise en cache Redis (TTL 50min — scan suivant dans ~60min)
    5. Mise à jour du statut en base (ad_campaigns.link_safety_status)
    6. Si DANGEROUS :
       → UPDATE ad_campaigns SET status = 'SUSPENDED' WHERE id = ...
       → Redis PUBLISH 'ad:link:dangerous:{ad_id}'
       → Worker : email admin + email annonceur + déclencher remboursement Stripe/PayPal
    7. Si SUSPECT (nouveau ou changement) :
       → Notification in-app admin
       → Email admin
```

---

## 15. Paiements — Stripe & PayPal

### Architecture des flux de paiement

**Flux 1 — Abonnement SaaS (tenant → plateforme) :**
```
Tenant choisit un plan
    → Stripe Checkout Session créée côté backend
    → Redirection vers Stripe Checkout (ou PayPal)
    → Paiement effectué
    → Webhook Stripe/PayPal → backend
    → Mise à jour plan tenant en base
    → Email confirmation + facture PDF
```

**Flux 2 — Contenu payant (lecteur → tenant) :**
```
Lecteur clique "Débloquer l'article" (2.99€)
    → Stripe Payment Intent créé (montant = prix article, bénéficiaire = tenant)
    → Stripe Connect : paiement réparti (95% tenant, 5% NexusBlog)
    → Webhook confirmation
    → Accès accordé (enregistrement en base)
    → Email reçu (billet d'accès)
```

**Flux 3 — Campagne publicitaire (annonceur → tenant) :**
```
Admin approuve une soumission publicitaire
    → Backend génère un Payment Link Stripe (ou PayPal Invoice)
    → Email envoyé à l'annonceur avec le lien de paiement
    → Paiement effectué
    → Webhook → activation campagne + émission facture PDF
```

### Stripe Connect

Pour les flux lecteur → tenant et annonceur → tenant, **Stripe Connect** (Standard ou Express) est utilisé :
- Chaque tenant crée/connecte son compte Stripe
- NexusBlog prélève automatiquement sa commission (5%) via `application_fee_amount`
- Les fonds arrivent directement sur le compte Stripe du tenant

### Webhooks

Tous les webhooks sont vérifiés par signature (secret Stripe / PayPal) avant traitement :

| Événement | Action |
|---|---|
| `invoice.paid` | Activer/renouveler abonnement |
| `invoice.payment_failed` | Email relance + période de grâce 3j |
| `customer.subscription.deleted` | Downgrade vers Starter |
| `checkout.session.completed` | Activer achat one-time |
| `charge.refunded` | Révoquer accès + log |
| PayPal `PAYMENT.CAPTURE.COMPLETED` | Même logique que Stripe |

### Conformité PCI-DSS

- **Aucun numéro de carte stocké** sur les serveurs NexusBlog
- Tout le paiement passe par Stripe/PayPal (PCI-DSS Level 1 certifiés)
- Formulaires de paiement = iframes Stripe.js / PayPal SDK (jamais dans le DOM NexusBlog)
- HTTPS obligatoire sur toutes les pages de paiement

---

## 16. Notifications push — FCM

### Architecture

```
Article publié
    ↓
ARQ Worker : send_push_notification
    ↓
Récupération des tokens FCM des abonnés push du tenant
    (filtrés par catégorie si notification segmentée)
    ↓
Firebase Admin SDK → FCM API v1
    → Envoi en batches de 500 tokens (limite FCM)
    ↓
Nettoyage des tokens invalides (InvalidRegistrationError)
```

### Payload FCM

```json
{
  "notification": {
    "title": "Nouveau : {article_title}",
    "body": "{article_excerpt}",
    "image": "{featured_image_url}"
  },
  "data": {
    "article_id": "uuid",
    "url": "https://blog.exemple.com/article-slug",
    "tenant_id": "uuid"
  },
  "webpush": {
    "fcm_options": {
      "link": "https://blog.exemple.com/article-slug"
    }
  }
}
```

---

## 17. Email transactionnel

### Fournisseur : Resend

**Justification :** API simple, excellent deliverability, support React Email pour les templates, pricing adapté au volume.

### Templates (React Email)

| Template | Déclencheur |
|---|---|
| `welcome` | Création du compte + tenant |
| `invitation` | Invitation collaborateur |
| `article_approved` | Approbation d'un article |
| `article_rejected` | Refus d'un article (avec commentaire) |
| `newsletter_confirmation` | Double opt-in abonné |
| `newsletter_unsubscribe` | Désabonnement confirmé |
| `newsletter_send` | Envoi newsletter |
| `payment_success` | Paiement abonnement confirmé |
| `payment_failed` | Échec paiement (avec lien de mise à jour) |
| `invoice` | Facture PDF en pièce jointe |
| `ad_submission_received` | Confirmation soumission annonceur |
| `ad_approved_payment` | Lien de paiement campagne |
| `ad_link_suspended` | Alerte lien dangereux |
| `limit_warning_80` | 80% de la limite atteinte |
| `limit_blocked_100` | 100% limite atteinte |
| `account_suspended` | Suspension tenant par Super Admin |
| `delete_grace_period` | Début période de grâce suppression |
| `push_subscription_confirm` | Confirmation abonnement push |

---

## 18. Sécurité

### OWASP Top 10 — Mesures

| Vulnérabilité | Mesure |
|---|---|
| **A01 Broken Access Control** | RLS PostgreSQL + RBAC FastAPI + vérification tenant sur chaque requête |
| **A02 Cryptographic Failures** | TLS 1.3 partout, secrets en variables d'environnement (Kubernetes Secrets), refresh tokens hachés SHA-256 |
| **A03 Injection** | SQLAlchemy ORM (parameterized queries), validation Pydantic sur toutes les entrées, pas de raw SQL |
| **A04 Insecure Design** | Architecture multi-tenant revue en Phase 3, threat modeling documenté |
| **A05 Security Misconfiguration** | CORS strict (liste blanche), headers de sécurité (CSP, HSTS, X-Frame-Options), secrets en vault |
| **A06 Vulnerable Components** | Dependabot activé, scan automatique des dépendances en CI |
| **A07 Auth Failures** | Firebase Auth + JWT rotatif + 2FA + rate limiting sur /auth |
| **A08 Software Integrity** | Vérification de signature sur les webhooks (Stripe, PayPal, Firebase) |
| **A09 Logging Failures** | Tous les accès, erreurs 4xx/5xx, actions admin loggés avec trace_id |
| **A10 SSRF** | Validation des URLs (liste blanche de domaines), pas de fetch côté serveur d'URL utilisateur sauf cas validés |

### Headers de sécurité HTTP

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{nonce}' *.googleapis.com *.cloudinary.com *.stripe.com; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Rate Limiting

| Endpoint | Limite | Fenêtre |
|---|---|---|
| `POST /auth/login` | 10 tentatives | 15 min par IP |
| `POST /auth/refresh` | 20 appels | 1 min par IP |
| `POST /comments` | 5 commentaires | 1 heure par IP |
| `POST /ads/submit` | 3 soumissions | 24h par IP |
| `GET /api/v1/*` (public) | 1000 req | 1 min par IP |
| `GET /api/v1/*` (API Key Pro) | 10 000 req | 1 mois cumulatif |
| `POST /ai/*` | 50 req | 1 min par tenant |

### Upload sécurisé

Chaque upload passe par une validation en plusieurs étapes :
1. Vérification de l'extension du fichier (liste blanche)
2. Vérification du MIME type réel (magic bytes, pas l'extension déclarée)
3. Vérification de la taille (limite par type)
4. Upload vers Cloudinary (isolation, pas de stockage local)
5. Scan antivirus Cloudinary (si activé sur le plan Cloudinary)

### Protection CSRF

- Méthode **Double Submit Cookie + SameSite** :
  - Cookies d'auth : `SameSite=Strict`
  - Pour les formulaires critiques : token CSRF généré côté server, vérifié côté backend
  - Les API REST pures (JSON) sont naturellement protégées si CORS est strict

---

## 19. Performance & SLAs

### SLAs cibles

| Métrique | Cible | Mesuré sur |
|---|---|---|
| Disponibilité plateforme | 99.9% | Mois calendaire |
| Latence API P50 | < 80ms | Toutes requêtes authentifiées |
| Latence API P95 | < 200ms | Toutes requêtes authentifiées |
| Latence API P99 | < 500ms | Toutes requêtes authentifiées |
| Chargement page publique P95 | < 1.5s | Time to First Byte (TTFB) |
| Elasticsearch P95 | < 50ms | Requêtes de recherche |
| LCP (Core Web Vitals) | < 2.5s | Pages publiques |
| INP (Core Web Vitals) | < 200ms | Interactions |
| CLS (Core Web Vitals) | < 0.1 | Pages publiques |

### Stratégie de cache multi-niveaux

```
Niveau 1 : Cloudflare Edge Cache    (CDN mondial — HTML statique, médias)
Niveau 2 : Next.js Full Route Cache (ISR — pages rendues côté serveur)
Niveau 3 : Redis Application Cache  (API responses, données tenant)
Niveau 4 : Neon Query Cache         (résultats PostgreSQL fréquents)
```

### Optimisations images

- Cloudinary génère WebP/AVIF automatiquement
- `next/image` : lazy loading natif, dimensions déclarées (évite CLS)
- Srcset complet pour les images responsives
- Blur placeholder (LQIP — Low Quality Image Placeholder) pour toutes les images

---

## 20. Infrastructure & DevOps

### Environnements

| Environnement | Hébergement | Branch Git | DB Neon Branch |
|---|---|---|---|
| **Development** | Local Docker Compose | `feature/*` | Branch `feature/{name}` |
| **Staging** | K8s cluster staging | `develop` | Branch `staging` |
| **Production** | K8s cluster prod | `main` | Branch `main` (production) |

### Pipeline CI/CD (GitHub Actions)

```yaml
# Déclenché sur : push, PR, tag

stages:
  1. lint-and-type-check    (ruff, mypy, eslint, tsc --noEmit)
  2. tests-unit              (pytest, vitest)
  3. tests-integration       (pytest + Neon branch éphémère)
  4. security-scan           (bandit, safety, npm audit, trivy)
  5. build-docker-images     (multi-arch, push vers registry)
  6. deploy-staging          (helm upgrade --install, smoke tests)
  7. deploy-production       (manuel avec approval gate)
  8. cleanup-neon-branch     (suppression branch éphémère après merge)
```

### Kubernetes — Composants

```
Namespace: nexusblog-prod
├── Deployments
│   ├── frontend          (Next.js)   replicas: 3 min, HPA: CPU > 70%
│   ├── backend           (FastAPI)   replicas: 3 min, HPA: CPU > 70%
│   └── worker            (ARQ)       replicas: 2 min, HPA: queue length
├── Services
│   ├── frontend-svc      (ClusterIP)
│   └── backend-svc       (ClusterIP)
├── Ingress
│   └── nginx-ingress     (LoadBalancer)
│       ├── nexusblog.io → frontend
│       ├── api.nexusblog.io → backend
│       └── *.nexusblog.io → frontend (wildcard SSL)
├── ConfigMaps
│   └── app-config        (variables non sensibles)
└── Secrets
    └── app-secrets       (clés API, DB URL, JWT secrets)
        → Sealed Secrets (chiffrés dans Git)
```

### Docker — Images

```dockerfile
# Backend — multi-stage build
FROM python:3.12-slim AS builder
  # Installation dépendances
FROM python:3.12-slim AS runtime
  # Image finale légère (~200MB)

# Frontend — multi-stage build
FROM node:20-alpine AS builder
  # Build Next.js
FROM node:20-alpine AS runtime
  # Image standalone Next.js (~150MB)
```

---

## 21. Observabilité

### Logging structuré (JSON)

Chaque log contient :
```json
{
  "timestamp": "2026-06-26T10:00:00Z",
  "level": "INFO",
  "service": "backend",
  "trace_id": "abc123",
  "span_id": "def456",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "method": "GET",
  "path": "/api/v1/articles",
  "status": 200,
  "duration_ms": 45,
  "message": "Articles fetched"
}
```

### Stack d'observabilité

| Couche | Outil | Usage |
|---|---|---|
| **Métriques** | Prometheus + Grafana | CPU, mémoire, latences API, taux d'erreur |
| **Logs** | Loki + Grafana | Agrégation et recherche des logs JSON |
| **Tracing** | OpenTelemetry → Tempo | Traces distribuées FastAPI → Neon → Redis |
| **Alerting** | Grafana Alerting | PagerDuty / Slack si SLA violé |
| **Uptime** | Grafana Synthetics | Vérification toutes les 60s de chaque endpoint |

### Métriques custom exposées

```
nexusblog_articles_published_total{tenant_id, type}
nexusblog_api_requests_total{endpoint, status, tenant_id}
nexusblog_ai_requests_total{provider, task, tenant_id}
nexusblog_social_posts_total{platform, status, tenant_id}
nexusblog_ad_scans_total{result}
nexusblog_active_tenants_total{plan}
nexusblog_mrr_usd
```

---

## 22. Conformité RGPD & PCI-DSS

### RGPD

| Exigence | Implémentation |
|---|---|
| **Consentement** | Double opt-in newsletter, consentement cookies explicite (banner) |
| **Droit d'accès** | Export JSON de toutes les données utilisateur depuis le dashboard |
| **Droit à l'effacement** | Suppression compte → anonymisation des données (pseudonymisation) |
| **Portabilité** | Export CSV/JSON articles, abonnés, analytics |
| **Registre des traitements** | Documenté dans le DPA (Data Processing Agreement) |
| **Durée de conservation** | Logs : 90 jours, données analytiques agrégées : 2 ans, données tenant supprimé : 0 (après 30j) |
| **Localisation** | Données hébergées en Europe (région AWS eu-west ou Azure westeurope) |
| **Sous-traitants** | DPA avec Neon, Cloudinary, Stripe, OpenAI, Resend documentés |

### PCI-DSS

| Exigence | Implémentation |
|---|---|
| **Pas de stockage de données cartes** | Délégué entièrement à Stripe/PayPal (PCI Level 1) |
| **Transmission chiffrée** | TLS 1.3 sur toutes les communications paiement |
| **Formulaires de paiement** | Stripe.js / PayPal SDK (iframes PCI-compliant) |
| **Accès minimal** | Seul le service Payments a accès aux clés Stripe |
| **Audit logs** | Toutes les transactions enregistrées avec trace_id |

---

## 23. Questions ouvertes techniques

| # | Question | Impact | Proposition |
|---|---|---|---|
| Q2 | **Hébergeur K8s ?** | Coût, région, performance | AWS EKS ou DigitalOcean DOKS (moins cher) |
| Q3 | **AMP en V1 ou V2 ?** | Complexité élevée | V2 recommandé |
| Q4 | **Heatmaps : Microsoft Clarity (gratuit) ou développé en interne ?** | Complexité vs coût | Microsoft Clarity intégré en V1 |
| Q5 | **Format URL multilingue : `/fr/article` ou `fr.blog.com/article` ?** | SEO, architecture | Sous-chemin `/fr/` recommandé (moins de certificats SSL) |
| Q6 | **Stripe Connect Standard ou Express pour les tenants ?** | Onboarding tenant | Express (onboarding simplifié, NexusBlog gère les payouts) |
| Q7 | **WhatsApp Business API : accès direct Meta ou via BSP ?** | Coût, délai d'accès | Via BSP (Twilio/360dialog) pour éviter le délai d'accès Meta |

---

*Document suivant : [03_architecture_logicielle.md](./03_architecture_logicielle.md)*  
*Document précédent : [01_cahier_des_charges_fonctionnel.md](./01_cahier_des_charges_fonctionnel.md)*
