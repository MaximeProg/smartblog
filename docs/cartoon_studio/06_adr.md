# SmarterBloggers 3D Cartoon Studio — Architecture Decision Records (ADR)

**Version :** 1.0
**Date :** 2026-08-04
**Statut :** Livrable de Phase 1 (gate) — voir [05_roadmap_phases.md](./05_roadmap_phases.md)

> Chaque ADR suit le format Contexte / Décision / Statut / Conséquences. Ces décisions sont déjà reflétées dans les autres documents ; ce fichier les formalise comme registre de décision à part entière, conformément au livrable explicite de la Phase 1 (« ADR(s) de décision d'architecture »).

---

## ADR-001 — Service standalone, jamais fusionné au codebase SmarterBloggers

**Contexte** : le PDG a explicitement demandé que ce projet soit développé comme un codebase à part, connecté par API, pour protéger le codebase existant de SmarterBloggers de la complexité de ce nouveau projet (IA lourde, rendering, pipelines vidéo).

**Décision** : le Cartoon Studio est un service standalone avec son propre repository (`github.com/smarterbloggers/cartoon-studio`), sa propre base de données, son propre cycle de déploiement. L'intégration avec SmarterBloggers se fait exclusivement via des contrats d'API versionnés (REST) et des webhooks — jamais par import direct de code, ni par accès direct à la base de données de l'autre système.

**Statut** : Actée (confirmée explicitement par le PDG, 2026-08-04).

**Conséquences** :
- ✅ Un bug ou un incident du Cartoon Studio n'affecte jamais SmarterBloggers.
- ✅ Les deux projets évoluent à leur propre rythme, avec leurs propres cycles de release.
- ⚠️ Nécessite un contrat d'intégration explicite et documenté (voir [04_conception_api_rest.md](./04_conception_api_rest.md)) — pas de raccourci possible via un accès direct aux modèles/DB de SmarterBloggers.
- ⚠️ L'intégration réelle (FR-INT-001/002/005) reste bloquée tant que l'accès au repository SmarterBloggers n'est pas accordé à l'équipe Cartoon Studio (dépendance D1).

---

## ADR-002 — Monolithe modulaire, pas de microservices

**Contexte** : PRD Kimi §7 (non-goal 8) : « Architecture begins as the simplest modular monolith with clear service boundaries that can scale cleanly. »

**Décision** : le cœur applicatif (API, orchestration IA, logique métier) est un seul déploiement modulaire (un seul service FastAPI, modules internes par domaine : `projects`, `characters`, `episodes`, `jobs`, etc.). Seuls les workers de rendering GPU sont architecturalement séparés, pour des raisons de scaling matériel (NFR-SCL-001), pas par choix de design microservices.

**Statut** : Actée (littérale du PRD source).

**Conséquences** :
- ✅ Complexité opérationnelle minimale en Phase 1-3 (un seul service à déployer/monitorer côté API).
- ✅ Pas de latence réseau inter-services pour la logique métier courante.
- ⚠️ Si la charge le justifie plus tard (Phase 6), certains modules (ex. AI Orchestration) pourront être extraits en services séparés — décision différée, pas prise maintenant.

---

## ADR-003 — Architecture provider adapter, mocks avant tout provider réel

**Contexte** : FR-TEC-001/002 — aucun vendor lock-in IA, providers mock obligatoires avant tout provider réel.

**Décision** : chaque capacité IA (13 au total — LLM, image, image-to-video, text-to-video, 3D, motion, TTS, STT, lip-sync, musique/SFX, modération, similarité, rendering) est accédée via une interface Python `Protocol` (`app/providers/base.py`), résolue dynamiquement par `app/providers/registry.py` selon `PROVIDERS_MODE` (`mock` | `live`). Aucun code métier n'importe jamais un SDK de provider directement.

**Statut** : Implémentée (Phase 1, `backend/app/providers/`).

**Conséquences** :
- ✅ Développement et tests de tout le pipeline (wizard → génération → publication) possibles sans dépendre d'un provider réel ni engager de coût.
- ✅ Changer de provider = ajouter une implémentation + l'enregistrer dans `registry.py`, jamais de réécriture du code appelant.
- ⚠️ Le passage en mode `live` nécessite un choix de providers réels par capacité — dépendance D2, non tranchée à ce jour.

---

## ADR-004 — Stack technique : FastAPI/Python + Next.js/TypeScript (réutilisation SmarterBloggers)

**Contexte** : le PRD Kimi reste volontairement agnostique de stack (non-goal 7). Le PDG a demandé explicitement de réutiliser les services déjà utilisés dans SmarterBloggers quand c'est pertinent, plutôt que de réinventer.

**Décision** :

| Couche | Choix | Réutilisé de SmarterBloggers ? |
|---|---|---|
| Backend | FastAPI (Python 3.12) | Oui — même framework, mêmes conventions (`core/`, `models/`, `api/v1/`) |
| ORM / migrations | SQLAlchemy 2.0 async + Alembic | Oui — même pattern RLS, mêmes mixins (`Base`, naming convention) |
| Base de données | PostgreSQL | Oui — même moteur ; instance **séparée**, jamais partagée (voir ADR-001) |
| Cache / queue | Redis + ARQ | Oui — même pattern worker (`WorkerSettings`, `cron`) |
| Logging | structlog | Oui — **et** la leçon apprise avec (voir Non-conséquence ci-dessous) |
| Frontend | Next.js (App Router) + TypeScript | Prévu, pas encore implémenté (Phase 2 UI) |
| Auth | JWT interne (python-jose) | Pattern réutilisé (`TokenPayload`/`DBSession` dependencies), mécanisme SSO exact à définir avec l'accès au repo SmarterBloggers |

**Statut** : Implémentée (Phase 1, `backend/`).

**Leçon explicitement reportée depuis SmarterBloggers** : un bug réel a été trouvé et corrigé le 2026-08-04 dans SmarterBloggers où `logging.getLogger(__name__).info(...)` ne s'affichait jamais en production (aucun `basicConfig` pour le logger stdlib, seul `structlog.get_logger()` et les loggers uvicorn sont visibles). Ce projet réutilise `structlog.get_logger()` partout dès le départ (voir le commentaire explicite dans `app/main.py`) pour ne pas reproduire ce piège.

**Conséquences** :
- ✅ Un développeur familier de SmarterBloggers est immédiatement productif sur ce projet.
- ✅ Les leçons/bugs déjà découverts sur SmarterBloggers (logging, migrations circulaires, `-T </dev/null` sur `docker compose run`, `--force-recreate`) sont appliqués préventivement ici.
- ⚠️ Ce n'est pas une contrainte technique dure du PRD — un changement de stack reste possible si justifié plus tard.

---

## ADR-005 — Hébergement production : même VPS que SmarterBloggers, isolation totale des conteneurs/DB

**Contexte** : le PDG a confirmé que le Cartoon Studio serait déployé sur le même VPS (191.215.35.51) que SmarterBloggers.

**Décision** : répertoire séparé (`/opt/cartoon-studio`, vs `/opt/smarterbloggers`), fichier `docker-compose.prod.yml` propre au projet, noms de conteneurs préfixés différemment (`cartoon-studio-*` vs `smarterbloggers-*` — automatique via le nom de répertoire Compose), ports décalés (8010 vs 8000), volumes Postgres/Redis dédiés (`cartoon_pg_data`, `cartoon_redis_data`), clés de déploiement SSH GitHub dédiées (une deploy key ne peut servir qu'un seul repo GitHub — découverte opérationnelle du 2026-08-04).

**Statut** : Implémentée et vérifiée en production (2026-08-04) — `curl http://localhost:8010/healthz` répond `{"status":"ok","env":"production",...}`, 4 conteneurs `cartoon-studio-*` `Up`/`healthy`, indépendants de la stack `smarterbloggers-*`.

**Conséquences** :
- ✅ Aucun risque de collision de port, de volume, ou de conteneur avec SmarterBloggers.
- ✅ Un `docker compose down`/incident sur un projet n'affecte pas l'autre (containers isolés par projet Compose).
- ⚠️ Partage la même machine physique — une panne matérielle ou une saturation ressources (CPU/RAM/disque) du VPS affecterait les deux projets simultanément. Accepté comme compromis raisonnable à ce stade (pas de budget pour un second VPS dédié).

---

## ADR-006 — Base de données de développement local : Neon (même projet que SmarterBloggers, base séparée)

**Contexte** : Docker Desktop s'est révélé inutilisable localement sur la machine de développement (« Docker Desktop is unable to start », panne persistante non résolue malgré plusieurs tentatives de redémarrage). Le PDG a demandé d'utiliser Neon « comme on l'a fait avec SmarterBloggers » plutôt que de dépanner Docker ou de toucher à l'authentification d'une instance PostgreSQL locale déjà installée (refusé explicitement par le PDG, action bloquée aussi par le classificateur de sécurité automatique).

**Décision** : utilisation du **même projet Neon** que SmarterBloggers (`ep-fragrant-frog-axte0xmt-pooler.c-4.us-east-2.aws.neon.tech`), mais avec une **base de données PostgreSQL séparée** (`cartoon-studio` vs `smarterbloggers`) au sein de cette même instance.

**Statut** : Implémentée pour le développement local uniquement. **La production reste sur le Postgres dédié du VPS** (ADR-005), pas sur Neon — Neon ne sert ici que de commodité de développement local, pas d'infrastructure de production.

**Conséquences** :
- ✅ Isolation des données réelle : Postgres n'autorise pas les jointures entre bases différentes, même au sein de la même instance — aucune requête ne peut accidentellement mélanger les données des deux projets.
- ⚠️ **Isolation des credentials imparfaite, partiellement réduite le 2026-08-05** : le trafic applicatif réel (`DATABASE_URL`) utilise désormais un rôle dédié `cartoonstudio_app`, scopé en droits DML sur la base `cartoon-studio` uniquement (voir [07_threat_model.md](./07_threat_model.md) §3.2 — corrige aussi, en même temps, le fait que les policies RLS ne filtraient rien tant que l'app se connectait avec le rôle owner). Le rôle `neondb_owner` reste utilisé, mais uniquement pour `DATABASE_URL_ADMIN` (Alembic/DDL, invoqué à la main lors des migrations) — surface résiduelle plus petite et moins souvent exposée qu'avant. **Reste vrai** : `neondb_owner` a toujours accès aux deux bases ; une fuite du `.env` de dev exposerait encore ce rôle admin. Éliminer complètement ce résidu impliquerait un rôle owner distinct par base Neon, non fait à ce stade (coût/bénéfice faible pour du dev local).
- ⚠️ Ressources de calcul (compute Neon) partagées entre les deux projets en développement local — sans impact en production puisque la production n'utilise pas Neon.

---

## Registre — statut global

| ADR | Titre | Statut |
|---|---|---|
| 001 | Service standalone, jamais fusionné | Actée |
| 002 | Monolithe modulaire, pas de microservices | Actée |
| 003 | Provider adapter + mocks d'abord | Implémentée |
| 004 | Stack FastAPI/Python + Next.js (réutilisation) | Implémentée (backend) |
| 005 | Hébergement production — même VPS, isolation totale | Implémentée et vérifiée |
| 006 | DB dev locale — Neon, base séparée | Implémentée (dev uniquement) |
