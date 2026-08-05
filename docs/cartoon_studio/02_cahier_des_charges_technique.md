# SmarterBloggers 3D Cartoon Studio — Cahier des Charges Technique

**Version :** 1.0 (traduction/adaptation fidèle du PRD Kimi)
**Date :** 2026-08-04
**Statut :** Document de référence — baseline pour la Phase 1
**Source faisant autorité :** `kimi.md` — PRD §5.22–5.32 (exigences non-fonctionnelles), §7 point 8 (décision d'architecture), §12 (providers/3D)
**Dépend de :** [01_cahier_des_charges_fonctionnel.md](./01_cahier_des_charges_fonctionnel.md) v1.0
**Convention** : les IDs `NFR-<domaine>-<nnn>` et `FR-<domaine>-<nnn>` sont ceux du PRD original, conservés tels quels pour la traçabilité.

---

## Table des matières

1. [Décision d'architecture fondatrice](#1-décision-darchitecture-fondatrice)
2. [Modèle de données](#2-modèle-de-données-prd-522)
3. [AI Orchestration Layer](#3-ai-orchestration-layer-prd-523)
4. [Architecture des providers et technologie 3D](#4-architecture-des-providers-et-technologie-3d-prd-512)
5. [Sécurité](#5-sécurité-prd-524)
6. [Confidentialité et gouvernance des données](#6-confidentialité-et-gouvernance-des-données-prd-525)
7. [Scalabilité et contrôle des coûts](#7-scalabilité-et-contrôle-des-coûts-prd-526)
8. [Système de contrôle qualité](#8-système-de-contrôle-qualité-prd-527)
9. [Contrôles administratifs](#9-contrôles-administratifs-prd-528)
10. [Analytics](#10-analytics-prd-529)
11. [Tests](#11-tests-prd-530)
12. [Observabilité](#12-observabilité-prd-531)
13. [Gestion gracieuse des échecs](#13-gestion-gracieuse-des-échecs-prd-532)
14. [Stack technologique — recommandation ouverte](#14-stack-technologique--recommandation-ouverte)

---

## 1. Décision d'architecture fondatrice

*(PRD §7, non-goal 8)* :

> « No microservices for appearance. Architecture begins as the simplest modular monolith with clear service boundaries that can scale cleanly (spec §24). »

**Traduction opérationnelle** : le Cartoon Studio démarre comme un **monolithe modulaire** — un seul déploiement applicatif avec des frontières de module claires (projets, personnages, génération, jobs, orchestration IA, sécurité/légal), pas une architecture microservices découpée dès le premier jour. Le découpage en services séparés ne doit intervenir que si la charge réelle le justifie, pas par anticipation.

**Exception explicite** : les workers de rendering (GPU) sont architecturalement séparés du reste de l'application, car ils ont des besoins matériels et une logique de scaling différents (NFR-SCL-001 : « autoscaling CPU and GPU workers », « queue-based rendering »). Ce n'est pas une contradiction avec le non-goal 8 — c'est une séparation fonctionnelle justifiée par la charge, pas un découpage en microservices pour l'esthétique architecturale.

---

## 2. Modèle de données (PRD §5.22)

- **NFR-DAT-001 (P0)** : Un modèle de données normalisé et scalable DOIT inclure les entités : `User` ; `Organization` ; `Blog` ; `CartoonProject` ; `ProjectTheme` ; `ProjectStyle` ; `Character` ; `CharacterVersion` ; `CharacterRole` ; `CharacterRelationship` ; `CharacterAsset` ; `CharacterVoice` ; `Environment` ; `Prop` ; `StoryCanon` ; `Episode` ; `EpisodeVersion` ; `Scene` ; `Shot` ; `DialogueLine` ; `StoryboardFrame` ; `MediaAsset` ; `RenderJob` ; `GenerationJob` ; `ModelProvider` ; `ModelUsage` ; `Schedule` ; `PublishingJob` ; `Article` ; `CopyrightDeclaration` ; `ConsentRecord` ; `LicenseRecord` ; `ModerationCase` ; `QualityReport` ; `OriginalityReport` ; `Notification` ; `AuditLog`.
- **NFR-DAT-002 (P0)** : Le modèle DOIT utiliser des IDs immuables et une isolation tenant correcte, et DOIT inclure : soft deletion, règles de rétention, asset lineage, historique de version, et migrations de base de données gérées.

Voir [03_schema_base_de_donnees.md](./03_schema_base_de_donnees.md) pour le détail des champs par entité et l'ERD — cette liste d'entités y est reprise à l'identique.

---

## 3. AI Orchestration Layer (PRD §5.23)

- **NFR-ORC-001 (P0)** : Un service d'orchestration IA interne DOIT fournir : templates de prompts ; sorties structurées ; routing de modèle ; failover de provider ; assemblage de contexte ; récupération du Character Bible ; récupération de Series Memory ; filtrage de sécurité ; limites de coût ; limites de tokens ; validation de réponse ; logique de retry ; monitoring de santé de provider ; cache de sortie ; évaluation ; logging d'audit.
- **NFR-ORC-002 (P0)** : Toutes les sorties de modèle DOIVENT utiliser des schémas typés ; du JSON généré par modèle non validé NE DOIT JAMAIS être considéré fiable ; la validation de schéma DOIT intervenir avant que la sortie du modèle entre dans la base de données ou le pipeline de rendering.
- **NFR-ORC-003 (P0)** : La couche d'orchestration DOIT protéger contre : l'injection de prompt ; les documents uploadés malveillants ; l'invocation d'outil non sûre ; la fuite de données cross-projet ; les instructions cachées dans le contenu récupéré (Series Memory — voir FR-MEM-002) ; la consommation excessive de ressources ; les appels de provider non autorisés.

---

## 4. Architecture des providers et technologie 3D (PRD §5.11 / §12)

*(Rappel — le détail complet des exigences FR-TEC-001 à FR-TEC-005 est dans [01_cahier_des_charges_fonctionnel.md §8.11](./01_cahier_des_charges_fonctionnel.md#811-architecture-des-providers-et-stratégie-technologique-3d-spec-12).)*

Résumé technique : architecture adapter obligatoire (aucun vendor lock-in), une interface par capacité (LLM, image, image-to-video, text-to-video, génération d'assets 3D, text-to-motion, TTS, STT, lip-sync, musique/SFX, modération, similarité, cloud-rendering), implémentations mock obligatoires pour chaque adapter avant tout provider réel, sélection de provider pilotée par l'orchestration selon des critères métier (cohérence, qualité, coût, résolution, durée, langue, disponibilité, latence, licence, région, traitement des données), pipeline 3D ouvert (Blender ou équivalent) recommandé comme couche de rendering/traitement d'assets contrôlable, formats interopérables obligatoires (GLB, GLTF, FBX, USD, USDZ, OBJ, Alembic, PNG, WebP, SVG, MP4, WebM, WAV, SRT, VTT).

**Aucune clé de provider IA n'est jamais exposée au navigateur** (voir NFR-SEC-002 ci-dessous).

---

## 5. Sécurité (PRD §5.24)

- **NFR-SEC-001 (P0)** : Des contrôles secure-by-design DOIVENT inclure : authentification forte ; SSO SmarterBloggers (basé sur contrat jusqu'à l'intégration) ; support MFA ; RBAC ; permissions au niveau organisation et projet ; moindre privilège ; chiffrement en transit et au repos ; vault de secrets ; gestion de session sécurisée ; prévention CSRF, XSS, et injection SQL ; autorisation côté serveur sur chaque requête ; rate limiting ; protection anti-bot ; scan de malware ; validation de type de fichier et de contenu ; limites de taille d'upload ; URLs signées ; vérification sécurisée de webhook ; idempotence ; logs d'audit ; scan de dépendances ; analyse de sécurité statique ; scan de conteneur ; tests de pénétration ; chiffrement des sauvegardes ; procédures de réponse à incident.
- **NFR-SEC-002 (P0)** : Les clés de provider IA NE DOIVENT JAMAIS être exposées au navigateur.
- **NFR-SEC-003 (P0)** : Le système NE DOIT JAMAIS faire confiance aux IDs utilisateur, IDs de projet, prix, permissions, paramètres de rendering, ou destinations de publication fournis côté client ; les références d'objet direct non sécurisées à travers projets et utilisateurs DOIVENT être empêchées et testées.

---

## 6. Confidentialité et gouvernance des données (PRD §5.25)

- **NFR-PRV-001 (P0)** : La plateforme DOIT implémenter : isolation tenant ; paramètres de confidentialité ; export de données ; suppression de compte ; suppression de projet ; paramètres de rétention ; registres de consentement ; contrôles de localisation de données régionaux là où disponible ; registres de traitement de données des providers ; opt-out d'entraînement de modèle ; contrôles de confidentialité pour enfants ; logging d'accès administratif.
- **NFR-PRV-002 (P0)** : Défauts : les projets sont privés ; les assets ne sont pas utilisés pour l'entraînement de modèle partagé ; les références de personnage ne sont pas recherchables publiquement ; les échantillons vocaux sont traités comme des assets sensibles de type biométrique ; les URLs signées expirent ; les assets supprimés entrent dans un processus de suppression contrôlé.

---

## 7. Scalabilité et contrôle des coûts (PRD §5.26)

- **NFR-SCL-001 (P1)** : La plateforme DOIT implémenter : rendering basé sur queue ; workers CPU et GPU autoscaling ; priorisation de job ; quotas par utilisateur ; limites par plan ; limites de job concurrent ; routing de modèle par tier de qualité ; previews en résolution brouillon ; réutilisation des assets de scène inchangés ; cache de rendu ; rendering incrémental ; régénération au niveau scène ; politiques de cycle de vie de stockage ; archivage automatique ; livraison CDN ; budgets de coût ; alertes de coût ; mesure d'usage.
- **NFR-SCL-002 (P1)** : Avant le rendering, l'UI DOIT afficher : crédits estimés ; ressources de traitement estimées ; qualité de sortie attendue ; impact de stockage estimé ; si des providers premium seront utilisés. Les estimations NE DOIVENT PAS être décrites comme garanties.

---

## 8. Système de contrôle qualité (PRD §5.27)

- **NFR-QC-001 (P0)** : Des évaluations automatisées DOIVENT tourner pour chaque asset généré :
  - **Qualité de script** : pertinence ; cohérence ; originalité ; cohérence de rôle ; exactitude factuelle ; adéquation à l'âge ; ton ; grammaire ; sensibilité culturelle ; conformité de marque.
  - **Qualité d'image** : identité de personnage ; anatomie ; mains ; visage ; vêtements ; objets ; rendu de texte ; composition ; cohérence de fond ; placement de marque.
  - **Qualité vidéo** : identité de personnage à travers les frames ; cohérence temporelle ; synchronisation labiale ; qualité de mouvement ; continuité caméra ; physique ; synchronisation audio ; transitions de scène ; timing des sous-titres ; loudness audio ; artefacts de frame ; scintillement ; objets manquants ; mutation de personnage non désirée.
- **NFR-QC-002 (P1)** : Le workflow d'acceptation DOIT fournir : acceptation automatique ; régénération automatique ; revue humaine ; score de qualité ; raisons d'échec détaillées ; comparaison avec le rendu précédent ; approuver/rejeter ; régénérer une scène spécifique ; régénérer une performance de personnage spécifique ; remplacer uniquement l'audio ; remplacer uniquement les sous-titres.
- **NFR-QC-003 (P1)** : Une suite de benchmark DOIT être établie sur des principes spécifiques à l'animation : préservation d'identité, rationalité du mouvement, cohérence sémantique, cohérence caméra, mise en scène, anticipation, timing, exagération, appeal, et continuité.

---

## 9. Contrôles administratifs (PRD §5.28)

- **FR-ADM-001 (P1)** : Une console administrative DOIT couvrir : utilisateurs ; projets ; usage ; jobs de rendu ; statut des providers ; coûts ; modération ; plaintes de copyright ; registres de consentement ; demandes de takedown ; signalements d'abus ; jobs échoués ; santé de la queue ; stockage ; configurations de modèle ; feature flags ; limites de plan ; logs d'audit.
- **FR-ADM-002 (P0)** : L'accès administratif DOIT être étroitement contrôlé et audité. Les administrateurs NE DOIVENT PAS accéder au contenu privé de projet sauf si leur rôle et un motif de support ou de modération l'autorisent.

---

## 10. Analytics (PRD §5.29)

- **FR-ANL-001 (P2 ; sous-ensemble core en Phase 5)** : Les propriétaires de projet DOIVENT se voir offrir des analytics pour : épisodes, contenu statique, et vidéos générés ; brouillons ; publications ; vues ; temps de visionnage ; taux de complétion ; likes ; partages ; commentaires ; clics ; rétention d'audience ; personnages les plus performants ; thèmes les plus performants ; coût de génération ; coût par épisode publié ; générations échouées ; performance de génération automatique. Les analytics SmarterBloggers existants DEVRAIENT être réutilisés là où possible au moment de l'intégration.

---

## 11. Tests (PRD §5.30)

- **NFR-TST-001 (P0)** : Les tests automatisés DOIVENT inclure : unitaires ; intégration ; contrat d'API ; end-to-end ; queue ; permission ; isolation multi-tenant ; sécurité d'upload ; rendering ; schéma de sortie IA ; failover de provider ; contrôle de coût ; planification ; régression de cohérence de personnage ; régression visuelle ; accessibilité ; charge ; sécurité ; restauration de sauvegarde.
- **NFR-TST-002 (P0)** : Des « golden test projects » avec des personnages approuvés et des seuils de cohérence attendus DOIVENT être créés et maintenus. Aucune mise à jour majeure de provider IA ou de moteur de rendering ne peut être publiée sans relancer les tests de régression de cohérence de personnage et de qualité vidéo.

---

## 12. Observabilité (PRD §5.31)

- **NFR-OBS-001 (P1)** : La plateforme DOIT implémenter : logs structurés ; trace IDs ; messages d'erreur sûrs pour l'utilisateur avec détail diagnostique interne ; métriques au niveau job ; latence et taux d'échec des providers ; utilisation GPU ; profondeur de queue ; durée de rendu ; coût de génération ; croissance de stockage ; échecs de publication ; événements de modération ; alertes de sécurité.
- **NFR-OBS-002 (P0)** : Les logs NE DOIVENT JAMAIS contenir de secrets, tokens d'authentification bruts, prompts privés, ou données personnelles sensibles.

---

## 13. Gestion gracieuse des échecs (PRD §5.32)

- **NFR-FAL-001 (P0)** : L'application DOIT récupérer proprement de : pannes de provider ; échecs de worker GPU ; rendus partiels ; URLs signées expirées ; sortie de modèle invalide ; échec de génération audio ; échec de lip-sync ; échec de publication ; interruption réseau ; livraison de webhook dupliquée ; chevauchement de calendrier ; crédits utilisateur insuffisants ; signalements copyright ; rejet de modération.
- **NFR-FAL-002 (P0)** : Les étapes complétées DOIVENT être préservées ; les jobs DOIVENT reprendre depuis l'étape échouée plutôt que de redémarrer la production entière inutilement.

---

## 14. Stack technologique — recommandation ouverte

Le PRD Kimi reste délibérément **agnostique de stack et de provider** (voir non-goal 7 : « providers are named by capability, not by brand commitment »). Aucune techno précise n'est imposée par le document source. La recommandation ci-dessous est une proposition à valider avec le PDG en Phase 1, cohérente avec la décision de monolithe modulaire (§1) :

| Couche | Proposition | Justification |
|---|---|---|
| Backend | FastAPI (Python 3.12), monolithe modulaire par domaine | Cohérence avec le stack SmarterBloggers existant ; async natif ; OpenAPI auto-généré (utile pour FR-INT-004) |
| ORM / migrations | SQLAlchemy 2.0 async + Alembic | Migrations gérées (NFR-DAT-002) |
| Base de données | PostgreSQL + pgvector | JSONB pour les attributs de personnage flexibles ; pgvector pour Series Memory (FR-MEM-002, RAG) et détection de similarité |
| Queue / workers | ARQ (Redis-based) ou Celery | Jobs asynchrones checkpointés (FR-AUT-003, NFR-FAL-002) |
| Workers GPU | Pool séparé, autoscaling | NFR-SCL-001 — séparation justifiée par la charge, pas par microservices d'apparence |
| Frontend | Next.js (App Router) + TypeScript | Cohérence SmarterBloggers ; WCAG 2.2 AA (FR-UX-003) |
| Stockage objets | S3-compatible | URLs signées natives (NFR-SEC-001) |

**Ne pas partager la base de données avec SmarterBloggers**, même en cas d'hébergement mutualisé — l'intégration passe uniquement par les contrats API/webhooks définis en [04_conception_api_rest.md](./04_conception_api_rest.md), jamais par un accès direct inter-DB (cohérent avec FR-INT-005 : réutiliser via API, pas fusionner les données).

> **Hébergement — décidé (2026-08-04)** : le Cartoon Studio tourne sur le **même VPS** que SmarterBloggers (191.215.35.51), dans un répertoire séparé (`/opt/cartoon-studio`), avec son propre `docker-compose.prod.yml`, ses propres conteneurs Postgres/Redis (noms de projet Compose différents, ports décalés — 8010 au lieu de 8000), et sa propre base de données. Aucun conteneur, volume, ou processus n'est partagé avec la stack SmarterBloggers existante — seule l'API HTTP les relie. Cette mutualisation d'hébergement (même serveur physique) ne remet pas en cause l'isolation logique complète décrite ci-dessus.
