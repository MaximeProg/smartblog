# SmarterBloggers 3D Cartoon Studio — Résumé exécutif

**Date :** 2026-08-04
**Statut :** Document de cadrage — baseline pour la Phase 1
**Source faisant autorité :** `kimi.md` (Product Requirements Document, Smarter Bloggers 3D Cartoon Studio, v1.0, généré par Kimi.ai à partir de la « Master Development Prompt » sections 1–38) — **document fourni par le PDG, seule source officielle.**
**Documents liés :** [01_cahier_des_charges_fonctionnel.md](./01_cahier_des_charges_fonctionnel.md) · [02_cahier_des_charges_technique.md](./02_cahier_des_charges_technique.md) · [03_schema_base_de_donnees.md](./03_schema_base_de_donnees.md) · [04_conception_api_rest.md](./04_conception_api_rest.md) · [05_roadmap_phases.md](./05_roadmap_phases.md) · [06_adr.md](./06_adr.md) · [07_threat_model.md](./07_threat_model.md)
**Document compagnon référencé mais non fourni :** `02-Requirements-Traceability-Matrix.md` (à demander au PDG si disponible)

> Note de méthode : un autre document informel (rédigé via ChatGPT) avait été partagé initialement et a servi de brouillon pour une première version de ces fichiers. Le PDG a clarifié que **seul le PRD Kimi fait autorité**. Cette version reconstruit entièrement les 6 documents sur cette base ; l'autre document n'est plus utilisé comme source.

---

## 1. C'est quoi, en une phrase

Un **type de contenu supplémentaire pour SmarterBloggers** — pas un produit vendu indépendamment. L'utilisateur final crée des séries cartoon 3D récurrentes (images, comics, vidéos) où les personnages restent **identiques visuellement et vocalement** épisode après épisode, directement depuis le workflow de création d'article de SmarterBloggers.

> **Précision du PDG (confirmée hors PRD, 2026-08-04)** : « This is the project for cartoon generator project to be added as a content type on Smarterbloggers. » — le Cartoon Studio n'est **pas** accessible à des utilisateurs externes sans compte SmarterBloggers ; ce n'est pas un SaaS ouvert au grand public. Ça répond à la question ouverte que ce document soulevait précédemment (« est-ce que d'autres personnes peuvent utiliser la plateforme sans passer par SmarterBloggers ? ») — réponse : **non**.

## 2. Le problème central (non négociable)

**Persistance de l'identité des personnages** : chaque personnage récurrent doit rester reconnaissable et visuellement identique à travers toutes les images, scènes, épisodes, angles de caméra, expressions, changements de vêtements et vidéos générées — sauf modification volontaire du propriétaire. Obtenu par un pipeline en couches (assets 3D persistants, reference packs, conditionnement d'identité, scoring de cohérence automatisé), **jamais** par la seule recréation via prompt texte.

## 3. Décisions déjà actées par le PRD (§1.2)

1. **Module autonome, prêt à intégrer.** Aucun accès au code SmarterBloggers n'est disponible actuellement → le Cartoon Studio est construit comme un service standalone avec des contrats d'API documentés et versionnés (REST ou GraphQL), auth service-to-service, webhooks/événements de queue, idempotency keys, URLs médias signées. L'inspection du repo SmarterBloggers (mentionnée au §19 de la spec) est **différée à la phase d'intégration** et trackée comme dépendance ouverte (D1, voir §7 ci-dessous). La Phase 1 est re-scopée en conséquence.
   > **Raison business confirmée par le PDG** : le codebase est développé à part précisément pour **protéger le codebase existant de SmarterBloggers** de la complexité de ce nouveau projet (IA lourde, rendering, pipelines vidéo). Le découplage n'est pas qu'une contrainte technique temporaire (absence d'accès au repo) — c'est un choix d'isolation délibéré et permanent : même une fois l'intégration faite, le Cartoon Studio reste un service séparé connecté par API, jamais fusionné dans le code de SmarterBloggers.
2. **Adapters providers modulaires, mocks d'abord.** Toutes les capacités IA (LLM, image, vidéo, 3D, voix, musique, modération, similarité, rendering) passent par des interfaces adapter. Développement initial avec providers mock/local ; credentials réels fournis plus tard via configuration d'environnement. **Aucun provider commercial n'est engagé dans ce document.**
3. **Livraison en 6 phases** (spec §35, détail en Section 8 du PRD).

## 4. Qui l'utilise (6 personas, PRD §2)

| Persona | Besoin clé |
|---|---|
| P-1 Créateur/blogueur non-technique (primaire) | Wizard, presets, génération en un clic, autosave, intégration article directe, coût visible avant rendu |
| P-2 Éducateur | Rôles jamais dérivants, fact-checking avec citations, ratings de maturité, sortie WCAG 2.2 AA |
| P-3 Marketeur/brand storyteller | Contrôles de marque, exports par plateforme, campagnes programmées, budgets prévisibles |
| P-4 Satiriste/commentaire | Étiquetage satire, revue humaine obligatoire, auto-publish désactivée pour catégories sensibles |
| P-5 Admin/modérateur (secondaire) | File de modération, plaintes copyright, consentements, coûts, logs — sans accès de routine au contenu privé |
| P-6 Développeur/intégrateur (secondaire) | Contrats API versionnés, webhooks, opérations idempotentes, providers sandbox |

## 5. Périmètre (PRD §3)

**Dans le périmètre v1** : service Cartoon Studio standalone complet (projets, personnages, consistency engine, pipelines statique+vidéo, QC, contrôles sécurité/légaux, console admin, analytics, les 20 écrans UI) ; contrats d'intégration documentés pour SmarterBloggers ; providers mock + réels configurés par env ; Phases 1–6.

**Hors périmètre (cette version)** : intégration live contre le code de production SmarterBloggers (bloquée sur l'accès au repo — livrée comme contrats à la place) ; entraînement de modèles partagés sur le contenu utilisateur ; clonage vocal d'une vraie personne sans consentement documenté ; engagement sur un provider commercial nommé, un prix ou un SLA ; application mobile native.

## 6. Les 6 phases (PRD §8 — détail complet en [05_roadmap_phases.md](./05_roadmap_phases.md))

| Phase | Nom (PRD) | Gate de sortie |
|---|---|---|
| 1 | Architecture et définition du contrat d'intégration | ADRs + contrats revus et approuvés ; aucune implémentation à grande échelle avant cette baseline |
| 2 | Foundation | Un utilisateur crée un projet, crée et versionne un personnage approuvé avec reference pack complet, et le scoring de cohérence tourne dessus |
| 3 | Manual Static Content | Épisode statique manuel de bout en bout (wizard → rattachement à un brouillon d'article), avec rapport d'originalité et gate de cohérence qui passent |
| 4 | Manual Video Creation | Vidéo de 30–60s, 2 personnages cohérents, dialogue lip-synced, sous-titres, audio normalisé, produite via le pipeline 7 étapes avec édition à chaque étape |
| 5 | Automatic Generation | Un projet configuré en génération quotidienne produit des brouillons revuables pendant 7 exécutions programmées consécutives sans répétition de sujet, coûts enregistrés, propriétaire notifié |
| 6 | Advanced Production | Projet de démonstration (§9 PRD) entièrement reproductible en qualité production ; checklist de lancement complète |

## 7. Risques et dépendances (PRD §10 — table complète en [05_roadmap_phases.md](./05_roadmap_phases.md))

**Dépendances bloquantes à trancher avec le PDG :**
- **D1** — Accès au repo/API SmarterBloggers (bloque la validation réelle de l'intégration article/SSO/reuse).
- **D2** — Credentials providers réels et décisions d'achat (bloque la sortie du mode mock, par adapter).
- **D3** — Revue légale des flux copyright/consentement/takedown/étiquetage-satire sur les marchés cibles.

**Risques les plus critiques (R1, R4) :**
- **R1** — La cohérence d'identité peut tomber sous le seuil avec des providers de vidéo générative → mitigé par le pipeline 3D-first/hybride (FR-CON-012) + tests de régression golden (NFR-TST-002) + gates de seuil (FR-CON-014).
- **R4** — Exposition légale/réputationnelle sur la satire ou le contenu de personnes réelles → mitigé par les gates §5.15–5.17, la revue humaine par défaut, le workflow de takedown, et la revue légale (D3).

## 8. Décision d'architecture clé à retenir (PRD §7, non-goal 8)

> « No microservices for appearance. Architecture begins as the simplest modular monolith with clear service boundaries that can scale cleanly. »

Le Cartoon Studio démarre comme un **monolithe modulaire** avec des frontières de service claires — pas une architecture microservices dès le jour 1. Les workers de rendering GPU restent séparés pour des raisons de scalabilité matérielle, mais le cœur applicatif (API, orchestration IA, logique métier) reste un seul déploiement modulaire tant que la charge ne justifie pas de le découper.

## 9. Prochaine étape

Valider ce résumé + le cahier fonctionnel avec le PDG, obtenir si possible la matrice de traçabilité compagnon, trancher D1–D3, puis démarrer la Phase 1 — dont le premier livrable est justement les contrats d'intégration et les ADRs, **pas du code métier**.
