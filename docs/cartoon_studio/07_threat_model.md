# SmarterBloggers 3D Cartoon Studio — Esquisse de Threat Model

**Version :** 1.0
**Date :** 2026-08-04
**Statut :** Livrable de Phase 1 (gate) — voir [05_roadmap_phases.md](./05_roadmap_phases.md)
**Source des exigences** : `kimi.md` NFR-SEC-001→003, NFR-PRV-001/002, NFR-ORC-003 — voir [02_cahier_des_charges_technique.md](./02_cahier_des_charges_technique.md) §5, §6

> Esquisse volontairement légère (format Phase 1) — pas un audit de pénétration. Objectif : identifier les surfaces d'attaque principales et vérifier que chacune a une mitigation prévue (implémentée ou planifiée), avant que l'implémentation à grande échelle ne démarre (gate de Phase 1).

---

## 1. Actifs à protéger

| Actif | Pourquoi c'est sensible |
|---|---|
| Données de projet/personnage d'une organisation | Privées par défaut (NFR-PRV-002) ; un concurrent ou un tiers ne doit jamais voir le Character Bible d'un autre tenant |
| Échantillons vocaux (`CharacterVoice`) | Traités comme des assets biométriques sensibles (NFR-PRV-002) — usage détourné = usurpation vocale |
| Credentials providers IA | Ne doivent jamais être exposés au navigateur (NFR-SEC-002) — fuite = coûts illimités + abus au nom de la plateforme |
| `ConsentRecord` (clonage vocal) | Preuve légale de consentement — falsification ou perte = exposition juridique directe (FR-VID-005) |
| Secret service-to-service (SmarterBloggers ↔ Cartoon Studio) | Compromission = un attaquant peut créer/publier du contenu au nom de n'importe quel tenant SmarterBloggers |
| Media assets (reference packs, rendus) | URLs signées à courte durée de vie — une fuite d'URL signée expose temporairement un asset privé |
| Crédits/solde de l'organisation | Cible évidente de fraude (génération gratuite illimitée si le contrôle de quota est contournable) |

---

## 2. Acteurs de menace considérés

1. **Utilisateur authentifié d'une autre organisation** — essaie d'accéder aux projets/personnages/médias d'un tenant qui n'est pas le sien.
2. **Attaquant externe non authentifié** — essaie d'atteindre des endpoints sans JWT valide, ou de rejouer un webhook.
3. **Contenu malveillant injecté via upload ou via Series Memory** (prompt injection, cf. FR-MEM-002) — essaie de manipuler l'IA Orchestration pour extraire des données d'un autre tenant ou déclencher des appels provider non autorisés.
4. **Compte SmarterBloggers compromis ou secret service-to-service volé** — essaie d'agir au nom d'une organisation sans y être autorisé.
5. **Insider / accès admin** — un rôle `platform_admin` accède à du contenu privé sans motif de modération légitime (FR-ADM-002).

---

## 3. Analyse par composant (STRIDE allégé)

### 3.1 Authentification API (JWT interne)

- **Spoofing** : un attaquant forge un JWT sans passer par l'échange SSO. *Mitigation* : `JWT_SECRET_KEY` fort, jamais commité (`.env` gitignored, vérifié), signature vérifiée à chaque requête (`decode_access_token`). **Implémenté.**
- **Tampering** : modification du payload (ex. changer `organization_id`) après émission. *Mitigation* : signature JWT standard (`python-jose`) rend toute modification détectable. **Implémenté.**
- **Repudiation** : un token révoqué (déconnexion, compromission) continue d'être accepté. *Mitigation* : `jti` + `is_token_blacklisted()` via Redis. **Implémenté** (mécanisme de blacklist en place ; la révocation elle-même — endpoint logout — reste à construire en Phase 2 avec l'auth réelle).

### 3.2 Isolation multi-tenant (Row-Level Security)

- **Information disclosure** : une requête retourne des lignes d'une autre organisation. *Mitigation* : `organization_id` injecté depuis le JWT (jamais depuis un paramètre client — NFR-SEC-003) via `set_config('app.current_organization_id', ...)` à l'ouverture de chaque session DB (`get_db`), **et** policies RLS PostgreSQL réelles sur les 14 tables portant `organization_id` (migration `8f3a1c2d9e01`). **Implémenté et vérifié réellement effectif le 2026-08-05** — voir le point suivant.
- **Écart trouvé et corrigé (2026-08-05)** : les policies RLS existaient depuis le 08-04 mais ne filtraient rien : Postgres exempte par défaut le *propriétaire* d'une table de ses propres policies, et l'app se connectait avec ce rôle owner (`neondb_owner` en dev). Corrigé en introduisant un rôle applicatif restreint, non-owner, `cartoonstudio_app` (droits DML uniquement) — c'est lui qui est désormais utilisé par `DATABASE_URL` en dev, test, et production ; `DATABASE_URL_ADMIN` (rôle owner) reste réservé à Alembic pour le DDL. Vérifié par la suite de tests : la fixture `db` (rôle admin, session sans contexte tenant) se voit désormais elle-même refuser toute écriture sur une table protégée sans `app.current_organization_id` positionné — preuve directe que RLS bloque réellement, indépendamment des clauses `WHERE organization_id = ...` applicatives.

### 3.3 AI Orchestration Layer / providers

- **Prompt injection** : du contenu de Series Memory (FR-MEM-002, contenu récupéré traité comme non fiable) ou un upload utilisateur contient des instructions cachées visant à faire fuiter des données d'un autre tenant ou à faire exécuter une action non prévue par le LLM. *Mitigation prévue* : NFR-ORC-003 exige explicitement une protection contre l'injection de prompt et les instructions cachées dans le contenu récupéré. **Non encore implémenté** (l'AI Orchestration Layer elle-même arrive en Phase 2+, seuls les mocks existent en Phase 1).
- **Élévation de privilège via provider** : un appel provider non autorisé consomme du crédit d'une autre organisation. *Mitigation* : `ModelUsage` trace chaque appel par `organization_id` ; limites de coût à implémenter au niveau AI Orchestration (NFR-ORC-001). **Modèle de données prêt, logique d'application à construire.**
- **Exposition de clé provider** : *Mitigation* : `PROVIDERS_MODE=mock` par défaut, aucune clé réelle dans le code ; en mode `live`, les clés vivront exclusivement côté serveur (`.env`, jamais transmises au frontend). **Implémenté par construction** (aucune route ne retourne de credential provider).

### 3.4 Intégration service-to-service avec SmarterBloggers

- **Spoofing** : un tiers se fait passer pour SmarterBloggers pour créer des ressources au nom d'un tenant. *Mitigation prévue* : authentification service-to-service signée (client-credentials ou JWT partagé — mécanisme exact non tranché, dépendance D1/D4 des questions ouvertes). **Non encore implémenté** (`SMARTERBLOGGERS_API_URL`/`SMARTERBLOGGERS_SERVICE_SECRET` existent dans la config mais aucun endpoint d'intégration réel n'est câblé en Phase 1).
- **Replay d'un webhook** : un webhook capturé est rejoué pour déclencher une action en double. *Mitigation prévue* : `X-CartoonStudio-Event-Id` unique + idempotence côté récepteur (voir [04_conception_api_rest.md](./04_conception_api_rest.md) §7.1). **Conçu, pas encore implémenté** (aucun webhook n'est encore émis en Phase 1).

### 3.5 Assets média (reference packs, rendus, échantillons vocaux)

- **Accès non autorisé** : un lien direct vers un asset privé est deviné/partagé. *Mitigation prévue* : URLs signées à expiration courte (`STORAGE_SIGNED_URL_TTL_SECONDS`, défaut 900s), jamais d'URL de stockage brute exposée. **Conçu dans le modèle de données et la config ; le service de stockage réel (S3-compatible) n'est pas encore implémenté en Phase 1** — `STORAGE_ENDPOINT_URL`/`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY` existent en config mais aucun code ne les utilise encore.
- **Tampering / substitution d'asset** : un asset approuvé (reference pack) est remplacé silencieusement. *Mitigation* : `MediaAsset.previous_version_id` (asset lineage, NFR-DAT-002) — toute nouvelle version crée une nouvelle ligne, jamais un écrasement en place. **Modélisé dans le schéma ; à appliquer dans la logique de service quand l'upload sera implémenté.**

### 3.6 Uploads utilisateur (images de référence, audio, documents)

- **Malware / fichier malveillant** : upload d'un fichier déguisé. *Mitigation prévue* : validation de type de fichier, taille max, scan antivirus/malware (NFR-SEC-001). **Non encore implémenté** — aucun endpoint d'upload n'existe en Phase 1 (la création de personnage par upload est FR-CHR-002 méthode 2/3, prévue Phase 2 UI).
- **Déni de service via fichier volumineux** : *Mitigation prévue* : limites de taille d'upload (NFR-SEC-001). **À construire avec l'endpoint d'upload.**

### 3.7 Console d'administration

- **Accès de routine au contenu privé par un admin** : *Mitigation prévue* : FR-ADM-002 — accès administratif strictement contrôlé et audité, jamais de routine sans motif de support/modération. **Non encore implémenté** — aucune console admin n'existe en Phase 1 (prévue Phase 5 basique, Phase 6 complète).

---

## 4. Résumé — implémenté vs planifié (Phase 1)

| Contrôle | Statut Phase 1 |
|---|---|
| Signature/validation JWT | ✅ Implémenté |
| Blacklist de token (révocation) | ✅ Implémenté (mécanisme ; endpoint logout à construire) |
| Filtrage `organization_id` par requête | ✅ Implémenté (au niveau code applicatif) |
| Policies RLS PostgreSQL réelles | ✅ Implémenté et vérifié réellement effectif (rôle `cartoonstudio_app` non-owner, 2026-08-05) |
| Clés provider jamais côté client | ✅ Implémenté par construction (aucune route ne les expose) |
| Protection anti-prompt-injection (AI Orchestration) | ⏳ Planifié (Phase 2+, AI Orchestration Layer pas encore construite) |
| Auth service-to-service SmarterBloggers | ⏳ Planifié (dépend de l'accès au repo SmarterBloggers, D1) |
| Signature/idempotence des webhooks | ⏳ Planifié (aucun webhook émis en Phase 1) |
| URLs signées pour les médias | ⏳ Planifié (aucun service de stockage réel branché en Phase 1) |
| Scan/validation des uploads | ⏳ Planifié (aucun endpoint d'upload en Phase 1) |
| Audit log des accès admin | ⏳ Planifié (console admin en Phase 5/6) |

---

## 5. Action recommandée avant de démarrer la Phase 2

~~Ajouter les policies RLS PostgreSQL réelles...~~ **Fait le 2026-08-05** — voir §3.2. Le seul écart Phase 1 restant listé au §4 concerne des fonctionnalités pas encore construites (upload, stockage réel, webhooks, auth service-to-service, console admin), pas un filet de sécurité manquant sur ce qui existe déjà. Rien ne bloque le démarrage de la Phase 2 côté isolation tenant.
