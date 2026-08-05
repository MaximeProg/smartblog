# SmarterBloggers 3D Cartoon Studio — Conception API REST (contrat SmarterBloggers ↔ Cartoon Studio)

**Version :** 1.0 (traduction/adaptation fidèle du PRD Kimi)
**Date :** 2026-08-04
**Statut :** Document de référence — baseline pour la Phase 1
**Source faisant autorité :** `kimi.md` — PRD §5.18 (FR-INT-001 à FR-INT-005, spec §19)
**Dépend de :** [02_cahier_des_charges_technique.md](./02_cahier_des_charges_technique.md) §5 (sécurité)

> Note de contexte de construction (PRD §5.18) : puisque le repository SmarterBloggers n'est pas disponible à ce jour, ce document définit des **exigences de contrat**. Le travail de la phase d'intégration validera ces exigences contre le système réel — c'est une dépendance ouverte trackée (D1, voir [05_roadmap_phases.md](./05_roadmap_phases.md)), pas un blocage pour démarrer la Phase 1.

---

## 1. Les 5 exigences contractuelles (PRD §5.18)

### FR-INT-001 (P0) — Contrat d'intégration de type de contenu
La plateforme DOIT exposer la capacité d'apparaître comme un type de contenu SmarterBloggers de première classe (**« 3D Cartoon Series »**) sur la page de création d'article. Une fois sélectionné, le flux embarqué DOIT présenter :

```
Sélectionner un projet → Créer un nouveau projet
→ Sélectionner le type de génération (cartoon statique, comic strip, vidéo animée, épisode cartoon 3D)
→ Contenu automatique ou manuel
→ Titre d'épisode → Script editor → Sélecteur de personnage → Storyboard
→ Preview → Render → Sauvegarder brouillon → Programmer → Publier
```

### FR-INT-002 (P0) — Contrat d'intégration d'article
Quand un cartoon est produit, l'intégration DOIT supporter :
- créer ou mettre à jour un article SmarterBloggers ;
- insérer le lecteur vidéo ou l'image ;
- ajouter : titre, description, transcript, sous-titres, alt text, légendes, tags, métadonnées de projet et d'épisode, métadonnées SEO, structured data, disclosure le cas échéant ;
- préserver les informations de propriété du créateur ;
- lier l'article au Cartoon Project.

**La création d'un nouvel article ET le rattachement du contenu généré à un brouillon existant DOIVENT tous deux être supportés.**

### FR-INT-003 (P0) — Aucun contexte en dur
L'exemple d'UUID de blog dans la spec source NE DOIT PAS être codé en dur. L'intégration DOIT toujours utiliser le blog et le contexte d'article **sélectionnés par l'utilisateur authentifié** — jamais une valeur fixe.

### FR-INT-004 (P0) — Architecture d'intégration
La frontière de service DOIT utiliser :
- APIs REST ou GraphQL internes ;
- authentification service-to-service sécurisée ;
- webhooks ou événements de queue ;
- idempotency keys ;
- contrats d'API versionnés ;
- URLs médias signées ;
- traitement de job en arrière-plan ;
- logging d'audit.

### FR-INT-005 (P1) — Réutiliser plutôt que reconstruire
Au moment de l'intégration, la plateforme DOIT réutiliser les systèmes SmarterBloggers **existants** :

| Système SmarterBloggers à réutiliser | Ne PAS faire |
|---|---|
| Authentification | Créer un second système de compte |
| Comptes utilisateur et rôles | Dupliquer la gestion d'identité |
| Propriété de blog | Recréer une notion de blog côté Cartoon Studio |
| Éditeur d'article | Construire un éditeur d'article parallèle |
| Médiathèque | Dupliquer le stockage de médias déjà géré par SmarterBloggers |
| Facturation | Créer un système de facturation séparé et déconnecté |
| Notifications | Réinventer un canal de notification propre |
| Localisation | Redévelopper l'i18n |
| Workflow de publication | Contourner le workflow de publication existant |
| Tracking d'affiliation (le cas échéant) | L'ignorer si applicable au contenu cartoon |
| Design system | Diverger visuellement de l'expérience SmarterBloggers |

**Un second système de compte déconnecté NE DOIT PAS être créé** — c'est une règle explicite du PRD, pas une simple recommandation.

---

## 2. Principes de conception dérivés

- **REST, versionné** : `/api/v1/...` ; toute rupture de compatibilité crée `/api/v2/...` sans retirer v1 avant migration complète de SmarterBloggers.
- **Asynchrone par défaut** pour toute génération : l'appel initial retourne un `job_id`/`episode_id` en statut `pending` ; le résultat arrive par webhook ou est récupéré par polling (cohérent avec « traitement de job en arrière-plan » de FR-INT-004).
- **Idempotency keys obligatoires** (header `Idempotency-Key`) sur tout endpoint de création/déclenchement.
- **URLs médias signées** uniquement — jamais d'URL de stockage brute (FR-INT-004 ; NFR-SEC-001 « signed URLs »).
- **Logging d'audit** sur chaque appel service-to-service (FR-INT-004 ; NFR-OBS-001).
- **Vérification sécurisée de webhook** (signature) — NFR-SEC-001.

---

## 3. Authentification service-to-service

*(NFR-SEC-001 : « strong authentication; Smarter Bloggers SSO (contract-based until integration) »)*

- SmarterBloggers s'authentifie auprès du Cartoon Studio avec des credentials propres à l'intégration (client-credentials OAuth2, ou JWT signé partagé — mécanisme exact à trancher avec l'équipe SmarterBloggers lors de la Phase 1, une fois l'accès au repo obtenu — voir dépendance D1).
- **SSO utilisateur** : pour que le flux embarqué (FR-INT-001) s'affiche dans le contexte d'un utilisateur SmarterBloggers donné, SmarterBloggers génère un token d'échange à usage unique identifiant l'utilisateur + son blog/organisation ; le Cartoon Studio l'échange contre une session propre, en résolvant le mapping `Organization.external_tenant_id` / `User.external_user_id` / `Blog.external_blog_id` (voir [03_schema_base_de_donnees.md](./03_schema_base_de_donnees.md)).
- Aucune clé de provider IA ni credential d'intégration n'est exposé au navigateur, des deux côtés (NFR-SEC-002).

---

## 4. Format d'erreur standard

```json
{
  "error": {
    "code": "CONSISTENCY_THRESHOLD_NOT_MET",
    "message": "Character consistency score (82%) is below the project threshold (90%).",
    "details": { "episode_version_id": "...", "score": 0.82, "threshold": 0.90 },
    "request_id": "req_..."
  }
}
```

---

## 5. Endpoints — vue d'ensemble par ressource

### 5.1 Projects

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/projects` | Créer un `CartoonProject` (wizard FR-WIZ-001 à 007) |
| GET | `/api/v1/projects` | Lister les projets de l'organisation |
| GET | `/api/v1/projects/{project_id}` | Détail d'un projet |
| PATCH | `/api/v1/projects/{project_id}` | Mettre à jour thème/style/calendrier |
| POST | `/api/v1/projects/{project_id}/theme/refine` | Outil de raffinement de thème (FR-CON-003 — ≥3 suggestions) |
| DELETE | `/api/v1/projects/{project_id}` | Archiver (soft delete) |

### 5.2 Characters

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/projects/{project_id}/characters` | Créer un personnage (FR-CHR-002 : texte, upload, template, non-humain) |
| GET | `/api/v1/projects/{project_id}/characters` | Lister les personnages du projet |
| GET | `/api/v1/characters/{character_id}` | Détail + version courante (Character Bible, FR-CHR-001) |
| POST | `/api/v1/characters/{character_id}/versions` | Créer une nouvelle version (FR-CVC-001) |
| GET | `/api/v1/characters/{character_id}/versions` | Historique des versions |
| POST | `/api/v1/characters/{character_id}/reference-pack` | Générer/compléter le reference pack (FR-CON-011) |
| POST | `/api/v1/characters/{character_id}/reference-pack/approve` | Approuver le reference pack (déblocage production) |
| POST | `/api/v1/characters/{character_id}/consistency-test` | Générer un contenu test et retourner le score (FR-CON-013) |

### 5.3 Episodes / génération

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/projects/{project_id}/episodes` | Créer un épisode (manuel FR-MAN-001, langage naturel FR-MAN-003) |
| GET | `/api/v1/episodes/{episode_id}` | Détail, statut, version courante |
| POST | `/api/v1/episodes/{episode_id}/script` | Générer/mettre à jour le script (FR-MAN-002) |
| POST | `/api/v1/episodes/{episode_id}/storyboard` | Générer/mettre à jour le storyboard |
| POST | `/api/v1/episodes/{episode_id}/generate` | Lancer le pipeline (statique ou vidéo 7 étapes, FR-VID-001) → `job_id` |
| POST | `/api/v1/episodes/{episode_id}/regenerate-shot` | Régénération partielle d'un plan (NFR-QC-002) |
| GET | `/api/v1/episodes/{episode_id}/consistency-report` | Détail du dernier score de cohérence |
| GET | `/api/v1/episodes/{episode_id}/role-validation` | Résultat du Character Role Validator (FR-VAL-001/002) |
| GET | `/api/v1/episodes/{episode_id}/originality-report` | Rapport d'originalité avec clause de non-garantie (FR-ORG-002) |

### 5.4 Jobs

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/jobs/{job_id}` | Statut, checkpoint courant, coût |
| POST | `/api/v1/jobs/{job_id}/cancel` | Annuler |
| POST | `/api/v1/jobs/{job_id}/retry` | Relancer depuis le dernier checkpoint (NFR-FAL-002) |

### 5.5 Publishing / intégration article (FR-INT-002)

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/episodes/{episode_id}/publish` | Déclenche la publication selon le mode (FR-AUT-004) |
| POST | `/api/v1/episodes/{episode_id}/export-for-article` | Payload complet pour création/rattachement d'article (§7) |
| GET | `/api/v1/projects/{project_id}/calendar` | Content calendar (FR-UI écran 14) |

### 5.6 Copyright / consentement

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/copyright/declarations` | Déclaration de droits sur un asset importé (FR-IP-001) |
| POST | `/api/v1/consent-records` | Enregistrer un consentement (clonage vocal — FR-VID-005) |
| GET | `/api/v1/consent-records/{id}` | Statut d'un consentement |

### 5.7 Billing / usage

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/organizations/{org_id}/usage` | Consommation crédits/coûts (usage/billing dashboard, écran 18) |
| GET | `/api/v1/organizations/{org_id}/quotas` | Quotas et limites du plan |
| POST | `/api/v1/estimate` | Estimation de coût avant opération (NFR-SCL-002 — jamais garantie) |

### 5.8 Admin / modération (interne, non exposé à SmarterBloggers — FR-ADM-001/002)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/moderation-cases` | File de modération |
| PATCH | `/api/v1/admin/moderation-cases/{id}` | Décision de modération |
| GET | `/api/v1/admin/providers/health` | Santé des providers IA |

---

## 6. Payload d'export vers article SmarterBloggers (FR-INT-002)

`POST /api/v1/episodes/{episode_id}/export-for-article` retourne :

```json
{
  "episode_id": "...",
  "episode_version_id": "...",
  "project_id": "...",
  "content_type": "video",
  "title": "...",
  "description": "...",
  "media": {
    "video_url": "https://... (signed, short TTL)",
    "player_embed_ref": "...",
    "image_url": "https://... (thumbnail, signed)",
    "transcription": "...",
    "subtitles": { "srt_url": "...", "vtt_url": "..." },
    "alt_text": "...",
    "captions": "..."
  },
  "tags": ["..."],
  "seo": { "meta_title": "...", "meta_description": "...", "structured_data": {} },
  "disclosure_required": true,
  "ownership": { "organization_id": "...", "project_id": "...", "character_ids": ["..."] },
  "source_reference": { "cartoon_project_id": "...", "episode_id": "...", "episode_version_id": "..." }
}
```

SmarterBloggers utilise ce payload pour créer un article ou l'attacher à un brouillon existant, en conservant `source_reference` pour préserver le lien Cartoon Project ↔ article.

---

## 7. Webhooks (Cartoon Studio → SmarterBloggers)

| Événement | Déclencheur | Payload clé |
|---|---|---|
| `episode.draft_ready` | Génération terminée, en attente de revue | `episode_id`, `episode_version_id`, `preview_url` |
| `episode.consistency_failed` | Score sous seuil, régénération épuisée (FR-CON-014) | `episode_id`, `consistency_report` |
| `episode.published` | Publication effectuée | `episode_id`, `article_export_payload` (§6) |
| `job.failed` | Job en échec définitif (retries épuisés) | `job_id`, `job_type`, `error_message` |
| `moderation.escalated` | Cas de modération nécessitant une action côté SmarterBloggers | `moderation_case_id`, `subject_type`, `subject_id` |
| `budget.threshold_reached` | Alerte de budget organisation (NFR-SCL-001) | `organization_id`, `threshold_pct`, `current_usage` |

### 7.1 Sécurité et fiabilité des webhooks (NFR-SEC-001, NFR-FAL-001)
- Signature HMAC (`X-CartoonStudio-Signature`) sur le corps brut, secret par intégration.
- `X-CartoonStudio-Event-Id` unique — SmarterBloggers DOIT dédupliquer sur cet ID (protection contre la « duplicate webhook delivery » explicitement listée en NFR-FAL-001).
- Retry avec backoff exponentiel si SmarterBloggers ne répond pas `2xx`, budget de tentatives limité, puis file d'échec consultable côté admin.

---

## 8. Idempotence

- **Idempotency-Key** (header) obligatoire sur tout `POST` créant une ressource ou déclenchant un job (FR-INT-004). Une requête rejouée avec la même clé retourne la réponse originale, jamais un doublon.
- **Webhook Event-Id** : même principe côté émission.
- Les jobs internes (`GenerationJob`, `RenderJob`) portent leur propre idempotency key contre la re-livraison de message de queue interne.

---

## 9. Documentation et environnement de test à livrer en Phase 1

*(PRD §8, Phase 1 : « Stand up development environments with mock/local providers behind every adapter interface »)*

- Spécification OpenAPI complète et publiée.
- **Environnement sandbox** avec tous les providers mock, pour que l'équipe SmarterBloggers (persona P-6) puisse intégrer sans dépendre de providers IA réels ni de coûts, et sans attendre l'accès au repo réel (le flux embarqué est « validé contre une implémentation de référence/mock, pas contre SmarterBloggers en production », non-goal 11).
- Endpoint admin `POST /api/v1/admin/webhooks/test-fire` pour déclencher manuellement chaque type de webhook et valider la réception côté SmarterBloggers.
