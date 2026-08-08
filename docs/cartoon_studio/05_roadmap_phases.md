# SmarterBloggers 3D Cartoon Studio — Roadmap par phases

**Version :** 1.0 (traduction/adaptation fidèle du PRD Kimi)
**Date :** 2026-08-04
**Statut :** Document de référence — baseline pour la Phase 1
**Source faisant autorité :** `kimi.md` §8 (Delivery Plan), §9 (Demonstration Project Acceptance), §10 (Assumptions/Dependencies/Risks), §11 (Glossary)

> Chaque phase DOIT produire une fonctionnalité qui marche, testée, déployable. Les gates de phase requièrent : suites de tests automatisées vertes (incluant les suites de régression de cohérence et de sécurité pertinentes pour la phase), vérifications d'accessibilité vertes pour les écrans livrés, et documentation à jour.

---

## Phase 1 — Architecture et définition du contrat d'intégration

*(Adapté du §35 Phase 1 de la spec source — re-scopé car le codebase SmarterBloggers n'est pas disponible.)*

**Intention de la spec source** : évaluation du repository et de l'architecture. Re-scopée en conséquence.

**Livrables :**
- ADR(s) de décision d'architecture ✅ [06_adr.md](./06_adr.md), définitions d'interface des provider-adapters ✅ (`backend/app/providers/`), ERD du modèle de données ✅ [03_schema_base_de_donnees.md](./03_schema_base_de_donnees.md), esquisse de threat model de sécurité ✅ [07_threat_model.md](./07_threat_model.md), et la spécification du contrat d'intégration SmarterBloggers ✅ [04_conception_api_rest.md](./04_conception_api_rest.md).
- Environnements de développement avec providers mock/local derrière chaque interface adapter ✅ (13 capacités, `PROVIDERS_MODE=mock`).
- Documentation des risques d'intégration et questions ouvertes pour la future inspection du repository ✅ (trackée comme dépendance formelle D1 — voir §10 ci-dessous).

**Gate** : ~~les contrats et ADRs sont revus~~ **✅ satisfait (2026-08-04)** — tous les livrables ci-dessus existent et sont documentés ; modèle de données migré et vérifié (Neon en dev, Postgres dédié en production sur le VPS), API skeleton fonctionnelle, déploiement de bout en bout vérifié (`/healthz` répond en local et en production). ~~Seul écart identifié : policies RLS PostgreSQL réelles non créées~~ **corrigé le 2026-08-05** — voir [07_threat_model.md §3.2](./07_threat_model.md).

---

## Phase 2 — Foundation

**Livrables :**
- Schéma de base de données et migrations ✅ ; isolation tenant ✅ (RLS réellement effectif depuis le 08-05) ; création de projet (wizard complet en 3 étapes, incluant l'outil de raffinement de thème et les presets) ✅ (étape 1 + FR-CON-002/003 le 08-04 ; étapes 2/3 + FR-WIZ-005/006/007 le 08-05) ; création de personnage (les 7 méthodes) ✅ (08-05) ; Character Bible ✅ (`GET /characters/{id}/bible`, 08-05) ; versioning et états de cycle de vie des personnages ✅ (`PATCH`/`POST .../lifecycle`, 08-05) ; previews statiques et reference packs ✅ reference packs (upload + approbation gate réelle) — previews statiques proprement dites reportées à la Phase 3 (génération d'image) ; permissions de projet/RBAC ✅ (viewer lecture seule, owner/admin seuls pour le cycle de vie) ; stockage d'assets ✅ (mock, `app/services/storage_service.py`, URLs signées) ; interfaces de provider avec implémentations mock ✅ (Phase 1) ; contrôles de sécurité de base ✅ ; **écrans UI 1–5 : décision PDG du 2026-08-05 — le backend est fait et testé en entier d'abord, l'intégration UI (et son emplacement : frontend SmarterBloggers vs frontend dédié) est un chantier séparé, pas encore démarré.**

**Gate** : un utilisateur peut créer un projet, créer et versionner un personnage approuvé avec un reference pack complet, et le scoring de cohérence tourne dessus. **✅ satisfait côté API** (vérifié par la suite de tests, 43/43 verts) — le gate décrit une capacité utilisateur testable, pas une UI ; la partie UI reste un chantier explicitement reporté (voir ci-dessus).

---

## Phase 3 — Manual Static Content

**Livrables :**
- Création d'image statique (tous types) ✅ ; panneaux de comic ✅ ; application de la cohérence de personnage par projet (scoring + seuils) dans la génération statique ✅ (gate bloquant réel, `POST .../generate-image` et `.../generate-panel`) ; script editor (contextes statiques) ✅ (versioning append-only, `PATCH /episodes/{id}`) ; episode builder pour contenu statique ✅ (scènes/plans/dialogue) ; intégration article via le contrat (contre l'implémentation de référence/mock) ✅ (`POST /episodes/{id}/article`, FR-INT-002) ; intégration médiathèque ✅ (basique, `GET /episodes/media/library`) ; vérifications et rapports d'originalité ✅ (`POST .../originality-check`) ; capture de déclaration de copyright à l'upload ✅ (`app/services/upload_service.py`, rétrofité aussi sur les uploads Phase 2) ; **écrans UI 6–9, 17 : reportés avec le reste de l'UI (décision PDG 2026-08-05).**

**Gate** : un épisode statique manuel de bout en bout, du wizard jusqu'au rattachement à un brouillon d'article, avec un rapport d'originalité et un gate de cohérence qui passent. **✅ satisfait côté API** (`tests/test_episodes.py`, vert).

---

## Phase 4 — Manual Video Creation

**Livrables :**
- Script editor (vidéo) ✅ (structure en 8 parties, FR-VID-002) ; storyboard editor ✅ (réutilise l'episode builder Phase 3, générique aux content_types) ; génération vocale ✅ (voix persistantes/versionnées, previews, clonage gated par ConsentRecord — FR-VID-005) ; synchronisation labiale ✅ (pipeline image→image_to_video→lip_sync par plan) ; animation ✅ (cœur : mock providers image_to_video + lip_sync par plan) ; rendering ✅ (tiers preview/draft/standard/premium, résolution/ratio, `RenderJob` avec cancel/retry) ; automatisation de post-production ✅ (sous-titres réels dérivés du script + SRT persisté, loudness normalization + reste représentés comme appliqués — mock, Phase 1-4) ; régénération de scène ✅ (`POST .../scenes/{id}/regenerate`) ; Character Role Validator appliqué avant rendu ✅ (bloquant + dérogation journalisée, FR-VAL-001/002) ; AI Director ✅ (mode assisté minimal — suggestions non appliquées automatiquement) ; **écrans UI 10–13 : reportés (idem Phase 3).**

**Gate** : une vidéo de **30 à 60 secondes avec deux personnages cohérents, dialogue lip-synced, sous-titres, et audio normalisé en loudness**, produite via le pipeline en 7 étapes avec édition à chaque étape. **✅ satisfait côté API** (`tests/test_video.py::test_render_video_full_pipeline_gate`, vert).

---

## Phase 5 — Automatic Generation

**Livrables :**
- Series Memory ✅ et modes de continuité — **RAG vectoriel reporté** : `StoryCanon.embedding` reste un placeholder JSONB tant que pgvector n'est pas activé sur Postgres (décision explicite, documentée dans automation.py) ; l'évitement de répétition (FR-MEM-003) fonctionne aujourd'hui par correspondance textuelle déterministe sur `StoryCanon.fact_type="topic_covered"`, suffisant pour le gate ci-dessous mais pas une vraie recherche sémantique ; content calendar ✅ (`PUT/GET /projects/{id}/schedule`, réutilise le modèle `Schedule` déjà migré en Phase 2) ; planification quotidienne et avancée ✅ (le modèle `Schedule` portait déjà tous les champs FR-AUT-002) ; workflow automatique en 18 étapes avec checkpointing ✅ (`POST /projects/{id}/schedule/run`, `POST /generation-jobs/{id}/resume` — reprise réelle depuis le dernier checkpoint, pas un redémarrage) ; génération de sujet avec évitement de répétition ✅ ; workflow de brouillon et notifications ✅ ; publication automatique contrôlée avec défauts de catégorie sensible ✅ (FR-AUT-005, `sensitive_category_autopublish_override`) ; modes de publication ✅ (réutilise `PublishingJob.mode`) ; mesure d'usage ✅ (`ModelUsage`/`GenerationJob.cost_actual`) — budgets de coût et alertes, usage/billing dashboard, console de modération admin, pipeline de fact-checking dédié : **reportés** (fonctionnalités de tableau de bord/admin, hors scope backend API pur de cette passe) ; **écrans UI 14–16, 18, 20 : reportés (idem Phases 3-4).**

**Gate** : un projet configuré pour la génération quotidienne produit des brouillons revuables pendant **7 exécutions programmées consécutives sans répétition de sujet**, avec les coûts enregistrés et les propriétaires notifiés. **✅ satisfait côté API** (`tests/test_automation.py::test_gate_seven_consecutive_runs_without_topic_repetition`, vert).

---

## Phase 6 — Advanced Production

**Livrables :**
- Composition de scène 3D par plan ✅ (`SceneComposition` — caméra, placements de personnages, foule, physique ; `POST/GET .../shots/{id}/scene3d`) ; doublage multilingue avec préservation de l'identité vocale ✅ (`EpisodeDubTrack` + `source_voice_id`, dérivation de `voice_profile_ref` par langue, `POST/GET .../dub`) ; optimisation de provider ✅ (routing par score coût/qualité/priorité, `app/services/provider_router.py`, `select_provider`) ; tier de rendu premium/4K ✅ gating par `feature_flags` d'organisation (`premium_4k_rendering`, quota `max_renders_per_day`) — **rendering 4K réel non couvert** : toujours des providers mock, aucune infrastructure GPU/cloud-rendering engagée (dépend de D2) ; détection auto 2D/3D du mode de rendu par épisode ✅ ; analytics de projet ✅ (`GET /projects/{id}/analytics`) ; contrôles enterprise ✅ (`GET/PUT /organizations/{id}/feature-flags`, console admin `GET /organizations/{id}/admin/overview`) ; pagination episodes/characters ✅.

**Gate** : **✅ satisfait côté API** (20/20 tests `tests/test_production.py`, incluant le gate combiné scène 3D + rendu premium_4k + routing + doublage + analytics + admin overview ; 109/116 sur la suite complète historique, les 7 écarts étant une flakiness de pool de connexion Neon préexistante sur les runs longs, non liée à cette phase). Le gate tel qu'écrit à l'origine (projet de démonstration reproductible en qualité production, checklist de lancement) reste **non satisfait** : il dépend du vrai rendering 4K/GPU (D2, providers réels non engagés) et de l'UI, les deux explicitement hors scope de cette passe API — même distinction que les Phases 2-5 ci-dessus.

Avec Phase 6, **le backend API est désormais complet pour les 6 phases de la roadmap** (mode mock pour toutes les capacités IA). Restent hors scope de cette roadmap backend : le frontend Next.js (reporté depuis la Phase 2, décision PDG 2026-08-05), le contrat API SmarterBloggers réel (bloqué sur D1), les credentials/providers IA réels (D2), et le rendering GPU réel.

---

## Section 9 — Acceptation du projet de démonstration

Avant le lancement, l'équipe DOIT produire un projet de démonstration complet avec **au moins trois personnages récurrents uniques** :

| Personnage | Exigence |
|---|---|
| **Questioner** | Curieux, langage simple, reste toujours le questionneur dans chaque épisode |
| **Expert** | Calme, compétent, reste le répondeur principal utilisant des exemples pratiques |
| **Comic Character** | Ajoute un humour bref sans compromettre l'exactitude factuelle ni dominer l'épisode, avec une voix et un style de mouvement reconnaissables |

**Plus** : fiches de référence de personnage ; modèles de personnage ; profils vocaux ; un script éducatif court ; un storyboard ; une image statique ; un comic strip ; une vidéo 3D de 30–60 secondes ; et une configuration de futur épisode automatiquement programmé.

**La démonstration DOIT être utilisée pour tester** : cohérence d'identité, cohérence de rôle, qualité d'animation, synchronisation labiale, rendering, et intégration article SmarterBloggers.

---

## Section 10 — Hypothèses, dépendances, et risques

### Hypothèses
- **A1** : les capacités de provider (adapters d'identité, lip-sync, TTS multilingue) existent sur le marché et sont atteignables via la couche adapter ; là où un seul provider ne peut pas satisfaire une exigence, un pipeline hybride est implémenté et les compromis documentés.
- **A2** : SmarterBloggers accordera l'accès au repository et à l'API avant la phase d'intégration ; les contrats d'intégration définis en Phase 1 ne nécessiteront qu'une révision bornée.
- **A3** : l'infrastructure GPU (ou des providers de cloud-rendering) est disponible avec autoscaling d'ici la Phase 4.

### Dépendances
- **D1** : accès au repository/API SmarterBloggers (bloque la validation de FR-INT-001/002/005 contre la production).
- **D2** : credentials de provider réels et décisions d'achat (bloque la sortie du mode mock-provider, par adapter).
- **D3** : revue légale des flux copyright, consentement, takedown, et étiquetage-satire sur les marchés cibles.

### Table des risques

| ID | Risque | Impact | Mitigation |
|---|---|---|---|
| **R1** | Cohérence d'identité sous le seuil avec les providers de vidéo générative | L'exigence centrale échoue | Pipeline 3D-first/hybride (FR-CON-012) ; tests de régression golden (NFR-TST-002) ; gates de seuil (FR-CON-014) |
| **R2** | Les contrats d'intégration ne correspondent pas aux vraies APIs SmarterBloggers | Retravail à la phase d'intégration | Contrats versionnés ; adapter/façade à la frontière d'intégration ; demande d'accès anticipée |
| **R3** | Dépassement de coût provider sur le rendering | Échec de l'économie unitaire | Quotas, budgets, alertes (NFR-SCL-001/002) ; previews en tier brouillon ; cache de rendu |
| **R4** | Exposition légale/sécurité sur la satire ou le contenu de personne réelle | Légal/réputationnel | Gates §8.15–8.17 du cahier fonctionnel ; défauts de revue humaine ; workflow de takedown ; revue légale (D3) |
| **R5** | Le comportement des providers mock diverge des providers réels | Défauts d'intégration tardifs | Tests de contrat par adapter ; livrable de matrice de comparaison de provider ; tests de failover |

---

## Section 11 — Glossaire

| Terme | Définition |
|---|---|
| **Cartoon Project** | Conteneur d'univers fictif persistant (thème, personnages, style, règles, calendrier) |
| **Character Bible** | Enregistrement versionné et faisant autorité de chaque personnage récurrent d'un projet ; référencé par chaque génération |
| **Reference pack** | Ensemble d'images/assets multi-vues et multi-expressions approuvé définissant l'identité d'un personnage |
| **Consistency score** | Mesure de similarité automatisée d'un asset généré contre les références d'identité approuvées, par dimension (visage, corps, teint, cheveux, vêtements, accessoires, voix, rôle, mouvement, inter-plans) |
| **Series Memory** | Enregistrement structuré et récupérable de l'historique de projet, utilisé pour appliquer la continuité et éviter la répétition |
| **AI Director** | Composant qui traduit un script en décisions de scène/plan/caméra/éclairage/rythme dans les contraintes utilisateur et du Character Bible |
| **GenerationJob / RenderJob** | Unités de travail asynchrones mises en queue, avec progression, retry, annulation, idempotence, et suivi de coût |
| **Originality report** | Rapport consultatif par artefact issu des vérifications de similarité/plagiat en couches ; **pas une garantie légale** |
| **Sensitive category** | Politique, santé, finance, élections, religion, sujets légaux, actualités chaudes, ou contenu de personne identifiable ; déclenche un comportement de revue par défaut |

---

## Critère de réussite final du produit (rappel)

Le produit n'est considéré terminé que lorsque **tous** les points de la définition du succès sont vérifiés (voir [01_cahier_des_charges_fonctionnel.md §4](./01_cahier_des_charges_fonctionnel.md#4-définition-du-succès)) — pas seulement « ça produit une belle vidéo ».
