# SmarterBloggers 3D Cartoon Studio — Cahier des Charges Fonctionnel

**Version :** 1.0 (traduction/adaptation fidèle du PRD Kimi)
**Date :** 2026-08-04
**Statut :** Document de référence — baseline pour la Phase 1
**Source faisant autorité :** `kimi.md` — PRD généré par Kimi.ai à partir de la « Master Development Prompt » sections 1–38, fourni par le PDG.
**Document technique associé :** [02_cahier_des_charges_technique.md](./02_cahier_des_charges_technique.md) (contient les exigences PRD §5.22–5.32 : modèle de données, orchestration IA, sécurité, confidentialité, scalabilité, QC, admin, analytics, tests, observabilité, gestion d'échec).
**Convention de traçabilité** : chaque exigence conserve son identifiant original du PRD (`FR-<domaine>-<nnn>` fonctionnel, `NFR-<domaine>-<nnn>` non-fonctionnel) pour rester traçable avec la matrice compagnon `02-Requirements-Traceability-Matrix.md` (non fournie à ce jour — à demander au PDG).

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Objectif produit](#2-objectif-produit)
3. [Contexte de construction et décisions déjà actées](#3-contexte-de-construction-et-décisions-déjà-actées)
4. [Définition du succès](#4-définition-du-succès)
5. [Personas](#5-personas)
6. [Périmètre](#6-périmètre)
7. [Conventions](#7-conventions)
8. [Exigences fonctionnelles](#8-exigences-fonctionnelles)
9. [Priorisation](#9-priorisation)
10. [Non-goals et limitations explicites](#10-non-goals-et-limitations-explicites)

---

## 1. Résumé exécutif

Smarter Bloggers 3D Cartoon Studio est une plateforme professionnelle propulsée par l'IA pour créer des séries cartoon 3D récurrentes, en formats statique (image/comic) et vidéo. L'utilisateur crée un **Cartoon Project** persistant — un univers fictif avec un thème précisément défini, des personnages récurrents à identités et rôles fixes, des lieux récurrents, un style visuel défini, des règles narratives, des préférences de publication, et un calendrier de génération automatique. La plateforme supporte la création manuelle, la génération automatique programmée (au moins une fois par jour par projet éligible), la revue de brouillon, l'approbation, la publication et la distribution sociale — et est conçue pour s'intégrer comme type de contenu de première classe dans le workflow de création d'article de SmarterBloggers.

**Exigence produit centrale, non négociable** : la persistance d'identité des personnages — chaque personnage récurrent doit rester reconnaissable et visuellement identique à travers toutes les images, scènes, épisodes, angles de caméra, expressions, changements de vêtements et vidéos générées, sauf modification volontaire du propriétaire du projet. Obtenue par un pipeline de préservation d'identité en couches (assets 3D persistants, reference packs, conditionnement d'identité, scoring de cohérence automatisé) — jamais par la seule recréation via prompt texte.

## 2. Objectif produit

*(PRD §1.1)* La plateforme doit supporter :
- Images et vidéos cartoon générées manuellement
- Images et vidéos cartoon générées automatiquement
- Séries cartoon récurrentes avec personnages, identités, rôles, environnements et styles visuels persistants au niveau du projet
- Génération automatique programmée au moins une fois par jour
- Revue de brouillon, approbation, publication, distribution sociale
- Intégration de première classe avec SmarterBloggers comme nouveau type de contenu dans le workflow de création d'article

## 3. Contexte de construction et décisions déjà actées

*(PRD §1.2)*

1. **Module autonome, prêt à intégrer.** Aucun code source SmarterBloggers n'est disponible pour inspection. La plateforme est donc construite comme un service standalone avec des contrats d'API documentés et versionnés (REST ou GraphQL), authentification service-to-service, webhooks/événements de queue, idempotency keys, et URLs médias signées, afin de pouvoir être intégrée plus tard à l'authentification, au workflow d'article et à la médiathèque de SmarterBloggers. L'instruction du §19 de la spec (« inspecter le repository existant ») est **différée à la phase d'intégration** et trackée comme dépendance ouverte (voir [05_roadmap_phases.md §10](./05_roadmap_phases.md#10-hypothèses-dépendances-et-risques)). La Phase 1 de la stratégie de livraison est re-scopée en conséquence.
2. **Adapters providers modulaires, mocks d'abord.** Toutes les capacités IA (LLM, image, vidéo, 3D, voix, musique, modération, similarité, rendering) sont accédées via des interfaces adapter. Le développement initial utilise des providers mock/local ; les credentials de providers réels sont fournis plus tard via configuration d'environnement. **Aucun provider commercial spécifique n'est engagé dans ce document.**
3. **Livraison phasée.** La construction suit la stratégie de livraison en six phases du §35 de la spec (voir [05_roadmap_phases.md](./05_roadmap_phases.md)).

## 4. Définition du succès

*(PRD §1.3)* La plateforme n'est pas complète parce qu'elle peut produire une vidéo attrayante. Elle est complète seulement quand :
- les utilisateurs peuvent créer et gérer des projets avec des thèmes spécifiques et réutilisables ;
- plusieurs personnages uniques restent visuellement et vocalement cohérents avec des rôles stables ;
- les utilisateurs peuvent contrôler manuellement le dialogue et les actions ;
- le système génère automatiquement du contenu au moins une fois par jour sans répétition inutile ;
- le contenu généré est revuable et modifiable ;
- le contenu statique et vidéo s'intègre aux articles SmarterBloggers ;
- les jobs de rendering sont fiables et reprenables ;
- les assets utilisateur sont privés et isolés ;
- les registres de copyright et de consentement sont maintenus ;
- les contrôles d'originalité fonctionnent ;
- le contenu sensible reçoit une revue ;
- les tests de sécurité et d'autorisation multi-tenant passent ;
- les seuils de qualité passent ;
- le monitoring de production est opérationnel ;
- les procédures de sauvegarde, restauration, déploiement et rollback sont testées et documentées.

## 5. Personas

*(PRD §2)* La plateforme cible des créateurs non-techniques. Tous les flux principaux doivent être complétables sans écrire de prompts, de code, ou de fichiers de configuration ; les prompts bruts et paramètres avancés sont cachés derrière un mode avancé opt-in.

### P-1 — Créateur de contenu non-technique / Blogueur (primaire)
**Profil** : auteur SmarterBloggers voulant enrichir ses articles de contenu cartoon récurrent, sans compétence en animation, 3D ou prompt engineering.
**Objectifs** : créer un projet en quelques minutes via le wizard ; produire des images/comics cartoon quotidiens attachés à des articles ; développer une audience avec un casting reconnaissable.
**Points de douleur** : outils nécessitant une expertise en prompt ; personnages qui changent d'apparence entre posts ; logiciels vidéo complexes.
**Exigences clés** : setup piloté par wizard, presets, génération en un clic, autosave, revue de brouillon, intégration article directe, visibilité du coût avant rendu.

### P-2 — Éducateur / Producteur de contenu éducatif
**Profil** : enseignant, tuteur, ou créateur ed-tech produisant des leçons récurrentes (finance, santé, éducation enfants, leçons Q&R).
**Objectifs** : un couple enseignant/élève stable ; un mode de continuité pour séquences éducatives ; contenu fact-checké et adapté à l'âge ; sous-titres et sortie multilingue.
**Exigences clés** : rôles de personnages qui ne dérivent jamais, pipeline de fact-checking avec citations, ratings de maturité, sortie WCAG 2.2 AA (sous-titres, transcripts, alt text), modes de continuité.

### P-3 — Marketeur / Conteur de marque
**Profil** : propriétaire de petite entreprise ou marketeur produisant des explainers produit, des cartoons de support client, et du storytelling de marque sur les réseaux sociaux.
**Objectifs** : couleurs de marque/placement logo ; exports dimensionnés par plateforme (Instagram, TikTok, LinkedIn, X, YouTube) ; campagnes programmées avec dates début/fin ; prévisibilité des coûts.
**Exigences clés** : contrôles de direction visuelle de marque, formatage spécifique par plateforme, programmation, quotas et budgets de coût, gestion des droits/retraits pour les assets de marque importés.

### P-4 — Satiriste / Créateur de commentaire
**Profil** : créateur produisant de la satire politique, du commentaire d'actualité, et des cartoons de sensibilisation sociale.
**Objectifs** : visuels de style caricature ; contenu topique vérifié par des sources actuelles ; délai de production rapide.
**Exigences clés (avec garde-fous)** : étiquetage de satire, protections pour personnes réelles et contenu politique, revue humaine obligatoire avant publication, auto-publication désactivée pour les catégories sensibles, blocages de diffamation/usurpation.

### P-5 — Administrateur d'équipe / Modérateur (secondaire)
**Profil** : staff opérations ou trust-and-safety de SmarterBloggers.
**Objectifs** : file de modération, plaintes copyright, takedowns, registres de consentement, statut des providers, supervision des coûts, logs d'audit — sans accès de routine au contenu privé des projets.
**Exigences clés** : console admin avec accès scopé par rôle et audité.

### P-6 — Développeur / Intégrateur (secondaire)
**Profil** : ingénieur SmarterBloggers intégrant le module.
**Objectifs** : contrats d'API versionnés et documentés ; webhooks ; opérations idempotentes ; providers sandbox ; documentation OpenAPI.

## 6. Périmètre

*(PRD §3)*

### 6.1 Dans le périmètre
- Service Cartoon Studio standalone : gestion de projets, système de personnages, consistency engine, pipelines de génération manuelle et automatique (statique + vidéo), QC, contrôles sécurité/légaux, console admin, analytics, et les 20 écrans UI du §20 de la spec.
- Contrats d'intégration documentés pour SmarterBloggers (création d'article, auth/SSO, médiathèque, workflow de publication, notifications, réutilisation d'analytics).
- Adapters providers mock/local et providers réels configurés par environnement.
- Phases 1–6 (voir [05_roadmap_phases.md](./05_roadmap_phases.md)).

### 6.2 Hors périmètre (cette version)
- Intégration live contre le codebase de production SmarterBloggers (bloquée sur l'accès au repository ; des contrats sont livrés à la place).
- Entraînement de modèles partagés sur le contenu utilisateur (interdit par défaut ; uniquement via consentement opt-in séparé — et aucune fonctionnalité d'entraînement de ce type n'est construite dans cette version).
- Clonage vocal d'une vraie personne sans consentement documenté (bloqué ; la capacité gated-par-consentement elle-même est incluse).
- Engagements sur des providers IA commerciaux nommés, des prix, ou des SLA.
- Applications mobiles natives (le web UI mobile-responsive en tient lieu).
- **Accès public/autonome au Cartoon Studio.** Confirmé par le PDG (hors PRD) : ce n'est pas un produit vendu ou accessible indépendamment de SmarterBloggers — c'est un type de contenu ajouté au workflow de création d'article. Aucun utilisateur ne peut y accéder sans passer par un compte SmarterBloggers. Cohérent avec FR-INT-005 (« a disconnected second account system MUST NOT be created »), mais va plus loin : la codebase séparée existe pour **protéger le codebase SmarterBloggers existant de la complexité du Cartoon Studio**, pas pour permettre un accès grand public indépendant.

## 7. Conventions

*(PRD §4)*
- **IDs d'exigence** : `FR-<domaine>-<nnn>` pour les exigences fonctionnelles ; `NFR-<domaine>-<nnn>` pour les exigences non-fonctionnelles. Chaque ID est mappé dans la matrice de traçabilité (document 02, non fourni à ce jour).
- **Priorité** : P0 = indispensable pour le gate de la phase ; P1 = requis dans le programme en 6 phases ; P2 = capacité avancée/de phase ultérieure. Les priorités suivent l'ordre de priorité en 10 points de la spec (voir §9 ci-dessous).
- **Mots-clés** : MUST / SHOULD / MAY selon RFC 2119.
- « Spec §N » fait référence à la master specification, sections 1–38.

## 8. Exigences fonctionnelles

### 8.1 Concept central et spécificité du thème (spec §2)

Chaque Cartoon Project agit comme un univers fictif persistant contenant : un thème précisément défini ; une audience cible ; un ou plusieurs formats de contenu récurrents ; un ou plusieurs personnages uniques ; des identités de personnage fixes ; des rôles fixes ou contrôlés ; des relations entre personnages ; des lieux récurrents ; un style visuel défini ; des règles narratives et comportementales ; des préférences de publication ; et un calendrier de génération de contenu automatique.

- **FR-CON-001 (P0)** : Le système DOIT stocker tous les éléments d'univers-projet listés ci-dessus comme des données de projet structurées et versionnées — pas comme des prompts en texte libre — afin qu'ils puissent être référencés lors de chaque génération.
- **FR-CON-002 (P0)** : Application de la spécificité du thème. Le flux de création de projet DOIT évaluer si un thème proposé est suffisamment spécifique pour supporter une génération de contenu répétable. Les thèmes jugés trop larges (ex. « Éducation ») NE DOIVENT PAS être acceptés sans raffinement ; le système DOIT montrer pourquoi et guider l'utilisateur vers une formulation spécifique (exemple de thème selon spec §2 : une série cartoon 3D humoristique quotidienne dans laquelle une étudiante curieuse pose des questions à un ancien comptable sur la finance personnelle).
- **FR-CON-003 (P0)** : Outil de raffinement de thème assisté par IA. Le système DOIT fournir un outil IA qui (a) score la clarté/spécificité du thème selon des critères (casting défini, situation récurrente, motif d'épisode répétable, audience, ton) ; (b) propose au moins trois alternatives de thème raffiné concrètes ; (c) permet à l'utilisateur d'accepter, éditer, ou re-scorer une révision. L'outil DOIT tourner dans le wizard et être re-exécutable plus tard depuis les paramètres du projet.
- **FR-CON-004 (P1)** : L'enregistrement de thème DOIT classifier le projet selon une liste de catégories de thème incluant : satire politique, comédie, éducation financière, éducation enfants, éducation santé, éducation business, histoires de fiction courtes, commentaire d'actualité, sensibilisation sociale, récit historique, explainers produit, histoires religieuses ou morales, comédie de bureau, comédie familiale, leçons Q&R, explainers de support client, storytelling marketing/marque. La classification de catégorie pilote les défauts de catégorie sensible (FR-AUT-005) et le routage de modération.

### 8.2 Wizard de création de projet (spec §3)

- **FR-WIZ-001 (P0)** : Le système DOIT fournir un wizard de projet étape par étape, autosaving, mobile-responsive, en trois étapes. La progression DOIT être reprenable entre sessions ; chaque étape DOIT valider avant de progresser.

**Étape 1 — Identité du projet (FR-WIZ-002, P0)** : le wizard DOIT collecter : nom du projet ; description du projet ; thème spécifique (avec raffinement FR-CON-003) ; objectif du projet ; langue principale ; langues additionnelles ; pays/région cible ; audience cible ; tranche d'âge de l'audience ; rating de maturité du contenu ; durée d'épisode préférée ; dimensions d'image statique préférées ; plateformes de publication préférées ; mode de génération (manuel / automatique / hybride).

**Étape 2 — Format de contenu (FR-WIZ-003, P0)** : le wizard DOIT permettre à l'utilisateur de définir un ou plusieurs formats récurrents parmi : dialogue question-réponse ; conversation à deux personnages ; leçon de classe ; commentaire d'actualité ; satire politique ; interview ; débat ; court-métrage ; histoire épisodique ; sketch comique ; explainer ; démonstration produit ; message motivant ; annonce de service public ; comédie visuelle silencieuse ; histoire narrée ; panneaux de comic séquentiels. L'utilisateur DOIT pouvoir créer des formats personnalisés avec nom, description, template structurel, et durée par défaut.

**Étape 3 — Direction visuelle (FR-WIZ-004, P0)** : le wizard DOIT permettre à l'utilisateur de définir : style cartoon 3D ; niveau de réalisme ; proportions des personnages ; style d'environnement ; style d'éclairage ; palette de couleurs ; ambiance cinématique ; style de caméra ; énergie d'animation ; plateforme visée ; ratio ; résolution ; framerate ; style de sous-titres ; placement logo ; couleurs de marque ; format intro/outro.

- **FR-WIZ-005 (P0)** : Presets professionnels. L'étape 3 DOIT offrir des presets : film d'animation 3D premium ; animation familiale stylisée ; cartoon éducatif ; caricature politique ; animation clay-style ; low-poly 3D ; comic-inspiré 3D ; animation enfants ; explainer corporate ; animation 3D à inspiration africaine ; animation multiculturelle globale ; court-métrage cinématique ; comédie réseaux sociaux ; animation news-desk. Sélectionner un preset DOIT peupler tous les champs de l'étape 3 avec des valeurs éditables.
- **FR-WIZ-006 (P0)** : Conversion de sécurité de style. Le système NE DOIT PAS accepter les demandes d'imitation du style signature protégé d'un artiste vivant, studio d'animation, franchise, ou personnage sous copyright. Les demandes de style prohibées DOIVENT être détectées et converties en caractéristiques visuelles de haut niveau, légalement plus sûres (ex. « formes arrondies douces, palette chaude » au lieu du nom d'un studio), avec la conversion montrée à l'utilisateur.
- **FR-WIZ-007 (P1)** : La complétion du wizard DOIT initialiser le calendrier de contenu du projet, le calendrier par défaut (si mode automatique/hybride), et un Character Bible vide, et DOIT router l'utilisateur vers la création de personnage.

### 8.3 Système de création de personnages (spec §4)

- **FR-CHR-001 (P0)** : Chaque projet DOIT avoir un Character Bible — l'enregistrement faisant autorité de chaque personnage récurrent — qui DOIT être chargé et référencé lors de chaque job de génération.
- **FR-CHR-002 (P0)** : Méthodes de création de personnage. Le système DOIT supporter : (1) génération texte-vers-personnage ; (2) art conceptuel uploadé par l'utilisateur ; (3) images de référence uploadées par l'utilisateur ; (4) création à partir de multiples angles de référence ; (5) personnalisation manuelle ; (6) création par template ; (7) personnages non-humains (animaux, robots, êtres fantastiques).
- **FR-CHR-003 (P0)** : Schéma d'attributs de personnage. Le système DOIT stocker, par personnage, l'ensemble complet d'attributs du §4 de la spec : ID de personnage unique ; nom ; surnom ; ID de projet ; rôle du personnage ; but narratif ; personnalité ; style d'élocution ; vocabulaire typique ; accent ou dialecte ; âge ou âge apparent ; présentation de genre (le cas échéant) ; taille ; proportions corporelles ; géométrie du visage ; teint ; forme et couleur des yeux ; sourcils ; nez ; bouche ; dents ; coiffure ; couleur de cheveux ; pilosité faciale ; marques distinctives ; tenue par défaut ; tenues alternatives approuvées ; accessoires ; chaussures ; posture corporelle ; démarche ; gestes typiques ; gamme d'expressions faciales ; identité vocale ; tendances émotionnelles ; forces ; faiblesses ; préférences (aime/n'aime pas) ; relations avec les autres personnages ; comportement interdit ; développement de personnage autorisé ; punchlines ; images de référence turnaround ; fichiers de modèle de personnage ; embeddings de personnage ; profil vocal approuvé ; numéro de version.
- **FR-CHR-004 (P0)** : Rôles. Le système DOIT fournir des rôles intégrés (questionneur, répondeur, professeur, élève, narrateur, intervieweur, interviewé, personnage gentil, méchant, personnage comique, personnage sérieux, héros, personnage secondaire, protagoniste principal, antagoniste, conseiller, parent, enfant, client, vendeur, commentateur politique, présentateur, leader communautaire) et DOIT permettre des rôles personnalisés définis par l'utilisateur.
- **FR-CHR-005 (P0)** : Stabilité du rôle. Le rôle d'un personnage DOIT rester constant à travers le contenu généré, sauf si l'utilisateur le change délibérément ou active un développement de personnage contrôlé ; une justification au niveau du script est requise pour toute déviation en cours d'épisode, appliquée par le Character Role Validator (FR-VAL-001).

### 8.4 Character Consistency Engine (spec §5)

- **FR-CON-010 (P0)** : La cohérence de personnage est une exigence non négociable. Le système NE DOIT PAS s'appuyer uniquement sur des prompts texte pour recréer les personnages. Il DOIT implémenter un pipeline de préservation d'identité en couches combinant, selon la capacité du provider : modèles de personnage 3D persistants ; meshes riggés ; rigs squelette et facial ; blend shapes ; embeddings de personnage ; adapters d'identité ; images de référence multi-vues ; cartes de profondeur, pose, normales, et segmentation ; cartes de texture ; définitions de matériaux ; conditionnement par image de référence ; métadonnées de continuité au niveau scène ; seeds déterministes le cas échéant ; adapters LoRA spécifiques au personnage ou équivalent là où la licence le permet ; vérification d'identité faciale ; tracking costume/accessoires ; scoring de cohérence visuelle automatisé.
- **FR-CON-011 (P0)** : Reference packs. Pour chaque personnage le système DOIT générer et stocker un reference pack approuvé contenant : vue de face ; vue arrière ; profils gauche et droit ; vues trois-quarts ; expressions neutre, joyeuse, triste, en colère, et surprise ; formes de bouche en parole ; référence corps entier ; référence gros-plan facial ; référence tenue par défaut ; fiche de référence couleur et matériaux. Les reference packs DOIVENT être approuvables par l'utilisateur avant que le personnage soit utilisé en production.
- **FR-CON-012 (P1)** : Préférence de pipeline 3D-first. Le système DEVRAIT utiliser un pipeline 3D-first ou hybride 3D-plus-vidéo-générative chaque fois qu'il offre une cohérence d'identité plus fiable que la génération texte-vers-vidéo pure, avec la couche d'orchestration enregistrant le chemin choisi par job.
- **FR-CON-013 (P0)** : Scoring de cohérence. Avant qu'une scène soit approuvée, le système DOIT automatiquement comparer les personnages générés aux références d'identité approuvées et calculer des scores de cohérence pour : identité faciale ; proportions corporelles ; teint ; cheveux ; vêtements ; accessoires ; identité vocale ; cohérence de rôle ; continuité de mouvement ; continuité inter-plans.
- **FR-CON-014 (P0)** : Seuils et application. Chaque score de cohérence DOIT avoir un seuil configurable par projet (avec des défauts système sûrs). Les scènes sous le seuil DOIVENT être automatiquement régénérées (jusqu'à un budget de tentatives) ou signalées pour revue humaine. Le système NE DOIT JAMAIS permettre que le visage, la forme du corps, le teint, les vêtements, ou la voix d'un personnage récurrent changent accidentellement entre les scènes ; les violations sont des défauts bloquants.

### 8.5 Contrôle de version des personnages (spec §6)

- **FR-CVC-001 (P0)** : Le système DOIT implémenter un contrôle de version type Git pour les assets de personnage. Chaque édition de personnage DOIT créer une nouvelle version ; préserver toutes les versions précédentes ; enregistrer ce qui a changé, qui a changé, et quand ; et demander si la nouvelle version s'applique aux futurs contenus seulement ou aussi aux brouillons existants.
- **FR-CVC-002 (P0)** : Les épisodes déjà publiés NE DOIVENT JAMAIS être altérés silencieusement par une édition de personnage ; les changements rétroactifs nécessitent une action utilisateur explicite et sont enregistrés dans le log d'audit.
- **FR-CVC-003 (P1)** : Les états de cycle de vie du personnage DOIVENT inclure : brouillon ; approuvé ; archivé ; temporairement inactif ; remplacement ; version restaurée. Les transitions d'état DOIVENT être vérifiées par permission et journalisées.

### 8.6 Génération de contenu manuelle (spec §7)

- **FR-MAN-001 (P0)** : Manual Episode Builder. Le propriétaire du projet DOIT pouvoir : saisir un titre d'épisode ; sélectionner les personnages participants ; assigner le dialogue par personnage ; ajouter du texte de narrateur ; définir les émotions des personnages ; définir actions et gestes ; choisir les lieux ; définir les instructions caméra ; ajouter des transitions de scène ; ajouter de la musique de fond ; ajouter des effets sonores ; sélectionner la durée ; choisir le type de sortie (image, comic, animation, ou vidéo) ; choisir le ratio ; choisir la destination de publication ; et sauvegarder comme brouillon.
- **FR-MAN-002 (P0)** : Script editor structuré. Le système DOIT fournir un éditeur de script avec colonnes/cartes pour : numéro de scène ; numéro de plan ; personnage ; dialogue ; action ; émotion ; caméra ; lieu ; accessoires ; son ; durée ; notes de continuité. L'utilisateur PEUT fournir un dialogue complet ou fournir un sujet et laisser l'IA le rédiger ; le dialogue rédigé par IA DOIT rester entièrement modifiable.
- **FR-MAN-003 (P1)** : Création en langage naturel. Le système DOIT accepter des commandes de création en format libre (ex. un épisode de 60 secondes avec des personnages, un sujet, un ton, et un élément de clôture spécifiés) et convertir la demande en un pipeline éditable par étapes : (1) script ; (2) plan de scène ; (3) storyboard ; (4) shot list ; (5) piste vocale ; (6) plan d'animation ; (7) scènes rendues ; (8) vidéo finale montée. Le propriétaire DOIT pouvoir éditer chaque étape avant le rendu final.

### 8.7 Génération de contenu automatique quotidienne (spec §8)

- **FR-AUT-001 (P0)** : La plateforme DOIT être capable de générer automatiquement du contenu au moins une fois par jour pour chaque projet éligible (mode automatique ou hybride avec un calendrier actif).
- **FR-AUT-002 (P1)** : Les options de planification DOIVENT inclure : une fois par jour ; plusieurs fois par jour ; jours spécifiques ; heures spécifiques ; calendriers hebdomadaires ; calendriers mensuels ; calendriers basés sur événement ; timezone utilisateur ; timezone de publication ; heures calmes ; exclusions de jours fériés ; dates de début et fin de campagne.
- **FR-AUT-003 (P0)** : Workflow de génération automatique. À chaque exécution programmée le système DOIT exécuter, dans l'ordre, le workflow en 18 étapes : (1) lire le thème du projet ; (2) lire le Character Bible ; (3) lire les rôles et relations des personnages ; (4) lire les épisodes précédents ; (5) éviter de répéter les sujets précédents ; (6) revoir le calendrier de contenu du projet ; (7) revoir les sources d'information externes approuvées le cas échéant ; (8) générer un nouveau sujet ; (9) exécuter les vérifications d'originalité et de similarité ; (10) générer le script ; (11) valider les rôles et faits des personnages ; (12) générer le storyboard ; (13) générer les voix et la synchronisation labiale ; (14) générer l'animation ou le contenu statique ; (15) exécuter les tests de contrôle qualité ; (16) sauvegarder comme brouillon ou publier selon les paramètres du projet ; (17) enregistrer les coûts de génération et l'usage de modèle ; (18) notifier le propriétaire. Chaque étape DOIT être checkpointée afin qu'une exécution échouée reprenne à l'étape échouée plutôt que de redémarrer.
- **FR-AUT-004 (P0)** : Les modes de publication automatique DOIVENT inclure : générer brouillon uniquement ; générer et demander approbation ; générer et programmer ; générer et publier automatiquement ; publier uniquement quand le score qualité dépasse un seuil ; publier uniquement après modération humaine ; publier sur SmarterBloggers uniquement ; publier sur des plateformes sociales externes sélectionnées.
- **FR-AUT-005 (P0)** : Défaut de catégorie sensible. La publication automatique DOIT être désactivée par défaut pour les catégories sensibles : politique, santé, finance, élections, religion, sujets légaux, actualités chaudes, et contenu impliquant des personnes identifiables. Réactiver l'auto-publication pour de tels projets DOIT nécessiter une confirmation explicite du propriétaire et DOIT quand même router le contenu à travers les gates de revue applicables (§8.13–8.15 de ce document).
- **FR-AUT-006 (P1)** : Gestion du chevauchement de calendrier. Si une exécution programmée démarre alors que l'exécution précédente du même projet n'est pas terminée, le système DOIT ignorer ou mettre en file la nouvelle exécution selon le paramètre du projet — jamais exécuter des générations dupliquées en simultané.

### 8.8 Series Memory et continuité (spec §9)

- **FR-MEM-001 (P0)** : Chaque projet DOIT avoir une Series Memory structurée stockant : épisodes publiés ; épisodes brouillon ; résumés d'épisode ; sujets déjà couverts ; expériences de personnage ; relations de personnage ; blagues récurrentes ; storylines non résolues ; lieux précédemment utilisés ; accessoires ; timeline ; faits importants ; retours utilisateur ; réactions d'audience ; règles de canon ; contradictions interdites.
- **FR-MEM-002 (P0)** : Récupération. Le système DOIT utiliser une génération augmentée par récupération (retrieval-augmented generation, vector-backed) pour ne récupérer que l'historique de projet pertinent pour chaque nouvel épisode ; le contenu récupéré DOIT être traité comme une entrée non fiable (protections anti-prompt-injection, voir NFR-ORC-003 en doc technique).
- **FR-MEM-003 (P0)** : Application de la continuité. Le système DOIT empêcher : la répétition inutile de la même leçon ; la réutilisation de dialogue sans autorisation ; la contradiction de faits établis ; le changement accidentel de relations entre personnages ; la résurrection de personnages retirés sans approbation ; la remise à zéro de la progression narrative ; la répétition excessive de blagues ; la création de timelines incohérentes. Les violations sont surfacées comme avertissements de validation ou erreurs bloquantes selon la sévérité.
- **FR-MEM-004 (P1)** : Modes de continuité. Un paramètre de projet DOIT sélectionner l'un de : continuité stricte ; continuité flexible ; épisodes indépendants ; continuité saisonnière ; séquence éducative ; storyline sérialisée. Le mode DOIT gouverner comment les contraintes de Series Memory sont appliquées pendant la génération et la validation.

### 8.9 Contenu cartoon statique (spec §10)

- **FR-STA-001 (P0)** : Types de contenu statique. Le système DOIT supporter la production de : images cartoon uniques ; illustrations de blog ; posts réseaux sociaux ; posters ; memes ; images de miniature ; portraits de personnage ; infographics ; comic strips ; comics multi-panneaux ; storyboards ; quote cards ; diagrammes éducatifs ; explainers produit.
- **FR-STA-002 (P1)** : Tailles de sortie optimisées par plateforme. Le système DOIT fournir des presets de sortie pour : SmarterBloggers ; Facebook ; flux Instagram ; Instagram Stories ; TikTok ; miniatures YouTube ; posts communautaires YouTube ; LinkedIn ; X ; Pinterest ; bannières de site web ; et dimensions personnalisées.
- **FR-STA-003 (P1)** : Les capacités d'export DOIVENT inclure des exports haute résolution, des fonds transparents le cas échéant, et des templates de layout scalables.

### 8.10 Pipeline de production vidéo (spec §11)

- **FR-VID-001 (P0)** : Le système DOIT implémenter un pipeline vidéo en sept étapes où chaque étape produit un artefact persisté et éditable, et peut être régénérée indépendamment.

| Étape | ID | Priorité | Contenu |
|---|---|---|---|
| 1 — Sujet et Script | FR-VID-002 | P0 | Génère un script structuré et éditable : hook ; mise en place ; dialogue principal ; conflit ou question ; explication ou développement ; résolution ; call-to-action ; ligne de clôture |
| 2 — Storyboard | FR-VID-003 | P0 | Génère des cadres de storyboard montrant : personnages ; lieu ; angle caméra ; composition ; action ; émotion ; accessoires ; éclairage ; dialogue ; durée de plan estimée |
| 3 — Préparation scène/assets | FR-VID-004 | P1 | Prépare : modèles de personnage ; rigs ; environnement ; accessoires ; vêtements ; éclairage ; caméras ; assets de mouvement ; assets d'animation faciale |
| 4 — Génération vocale | FR-VID-005 | P1 | Voix persistantes ; voix multilingues ; contrôle d'émotion ; vitesse d'élocution ; hauteur ; pauses ; dictionnaire de prononciation ; upload de voix enregistrée par l'utilisateur ; clonage vocal sous licence avec consentement explicite documenté ; contrôle de version vocale ; preview vocal. Le système NE DOIT JAMAIS cloner la voix d'une vraie personne sans permission documentée ; les échantillons vocaux DOIVENT être traités comme des assets sensibles de type biométrique |
| 5 — Animation | FR-VID-006 | P2 (sous-ensemble lip-sync/gestes de base : P1) | Texte-vers-animation ; animation faciale pilotée par audio ; synchronisation labiale ; animation corps entier ; génération de gestes ; import de motion-capture ; contrôle de pose ; mouvement yeux/tête/mains ; interaction personnage-à-personnage ; interaction avec objets ; scènes de foule ; mouvement caméra ; simulation physique ; gestion de collision |
| 6 — Rendering | FR-VID-007 | P1 | Tiers preview, draft-quality, standard, et premium ; 720p, 1080p, 1440p, et 4K lorsque l'infrastructure le permet ; formats portrait, paysage, et carré ; framerate configurable ; files de job GPU ; annulation de rendu ; retry de rendu ; régénération partielle de scène |
| 7 — Post-production | FR-VID-008 | P1 | Automatiquement : assemblage de scène ; transitions ; cohérence des couleurs ; mixage audio ; suppression de bruit ; musique de fond ; effets sonores ; création de sous-titres ; traduction de sous-titres ; placement logo ; intro et outro ; écran de fin ; crédits ; normalisation du volume (loudness) ; formatage spécifique par plateforme |

### 8.11 Architecture des providers et stratégie technologique 3D (spec §12)

- **FR-TEC-001 (P0)** : Le système DOIT utiliser une architecture de providers modulaire ; aucun vendor lock-in IA. Des adapters DOIVENT exister pour : modèles LLM ; modèles de génération d'image ; modèles image-to-video ; modèles text-to-video ; outils de génération d'assets 3D ; systèmes text-to-motion ; providers de synthèse vocale ; providers speech-to-text ; providers de lip-sync ; providers de musique et effets sonores ; providers de modération ; providers de détection de similarité ; providers de cloud-rendering. Tout code spécifique à un provider DOIT être isolé derrière des interfaces afin qu'un provider puisse être changé sans réécrire l'application.
- **FR-TEC-002 (P0)** : Des implémentations provider mock/local DOIVENT être fournies pour chaque adapter pour le développement et les tests ; les providers réels DOIVENT être configurés exclusivement via configuration d'environnement (aucune clé en dur).
- **FR-TEC-003 (P1)** : Sélection de provider basée sur l'orchestration. La couche d'orchestration DOIT pouvoir choisir des providers selon : cohérence de personnage ; qualité de sortie ; coût ; résolution ; durée ; langue ; disponibilité ; latence ; licence ; disponibilité régionale ; exigences de traitement de données.
- **FR-TEC-004 (P1)** : Un pipeline 3D ouvert professionnel (Blender ou équivalent) DEVRAIT servir de couche principale contrôlable de rendering et de traitement d'assets là où c'est pertinent.
- **FR-TEC-005 (P1)** : Des formats interopérables DOIVENT être supportés : GLB, GLTF, FBX, USD, USDZ, OBJ, Alembic, PNG, WebP, SVG, MP4, WebM, WAV, SRT, VTT.

### 8.12 AI Director (spec §13)

- **FR-DIR-001 (P1)** : Le système DOIT implémenter un AI Director qui interprète un script et choisit : structure de scène ; type de plan ; angle caméra ; mouvement caméra ; placement de personnage ; mouvement de personnage ; émotion faciale ; gestes ; éclairage ; rythme ; transitions ; musique de fond ; effets sonores.
- **FR-DIR-002 (P0)** : Contraintes. L'AI Director DOIT suivre les paramètres de direction visuelle de l'utilisateur et NE DOIT PAS outrepasser le Character Bible.
- **FR-DIR-003 (P1)** : Les modes de contrôle DOIVENT couvrir : entièrement automatique ; généré par IA avec approbation utilisateur ; direction manuelle assistée par IA ; direction entièrement manuelle.

### 8.13 Validation du dialogue et des rôles (spec §14)

- **FR-VAL-001 (P0)** : Avant le rendu, un Character Role Validator DOIT vérifier : si le bon personnage pose les questions ; si le bon personnage répond ; si le dialogue correspond à la personnalité du personnage ; si le personnage possède la connaissance requise par le script ; si le rôle reste cohérent ; si le style d'élocution reste cohérent ; si les relations restent cohérentes ; si un comportement interdit se produit ; si des déclarations sensibles nécessitent une revue.
- **FR-VAL-002 (P0)** : Le validateur DOIT afficher des avertissements et des corrections suggérées avant le rendu ; les violations bloquantes (ex. comportement interdit) DOIVENT empêcher le rendu jusqu'à résolution ou dérogation explicite avec justification journalisée.

### 8.14 Prévention de l'originalité et du plagiat (spec §15)

- **FR-ORG-001 (P1 ; Phase 3)** : Système d'originalité en couches. Pour chaque script, titre, légende, et storyline générés le système DOIT : comparer au contenu précédent du projet ; comparer aux autres projets de l'utilisateur ; exécuter des vérifications de similarité sémantique ; détecter le contenu copié ou étroitement paraphrasé ; détecter les citations connues ; identifier les paroles probablement sous copyright ; détecter les personnages de franchise reconnaissables ; détecter le mésusage de marque ; signaler l'imitation d'artistes vivants ; vérifier si des sources externes nécessitent une attribution ; préserver les citations de recherche le cas échéant ; et générer un rapport d'originalité par artefact.
- **FR-ORG-002 (P0)** : La plateforme NE DOIT PAS prétendre que les vérifications automatisées garantissent l'originalité légale ; les rapports d'originalité DOIVENT porter cette clause de non-garantie.
- **FR-ORG-003 (P1)** : La génération DOIT utiliser une synthèse originale plutôt que la réécriture de contenu tiers.
- **FR-ORG-004 (P1)** : Des métadonnées de provenance DOIVENT être maintenues pour : entrées utilisateur ; références uploadées ; assets générés par IA ; assets stock sous licence ; musique ; effets sonores ; polices ; voix ; faits externes ; providers de modèle.

### 8.15 Contrôles de copyright et de propriété intellectuelle (spec §16)

- **FR-IP-001 (P0)** : Confirmation de droits. Les utilisateurs DOIVENT confirmer qu'ils possèdent les droits nécessaires sur : images ; logos ; personnages ; musique ; vidéos ; scripts ; voix ; ressemblances ; modèles 3D ; matériel de marque uploadés — via une déclaration de copyright capturée au moment de l'upload.
- **FR-IP-002 (P1)** : Le système DOIT implémenter : déclarations de copyright ; registres de gestion de droits ; suivi d'expiration de licence ; registres de consentement ; workflow de takedown ; workflow de litige ; blocage d'assets ; contrôles de contrevenant récidiviste ; piste d'audit ; fingerprinting de contenu ; watermarking invisible optionnel ; étiquetage visible de contenu IA ; Content Credentials ou métadonnées de provenance équivalentes là où supporté.
- **FR-IP-003 (P0)** : Le système NE DOIT PAS permettre la création de copies confusément similaires de personnages cartoon protégés ou de franchises de divertissement célèbres.
- **FR-IP-004 (P0)** : Les personnages créés par les utilisateurs NE DOIVENT PAS être utilisés pour entraîner des modèles partagés sans consentement clair, séparé, et opt-in. Par défaut, les assets de projet de chaque utilisateur DOIVENT rester privés et isolés.

### 8.16 Protections pour personnes réelles et contenu politique (spec §17)

- **FR-RPP-001 (P0)** : Des contrôles plus stricts DOIVENT s'appliquer là où le contenu implique : politiciens ; élections ; officiels publics ; célébrités ; individus privés ; enfants ; actualités ; conseils santé ; conseils financiers ; conseils légaux ; conflit religieux. Les représentations générées par IA de personnes réelles DOIVENT porter un étiquetage approprié.
- **FR-RPP-002 (P0)** : Le système DOIT bloquer : représentations intimes non consensuelles ; endorsements frauduleux ; usurpation d'identité ; médias politiques trompeurs ; fausses annonces d'urgence ; fabrication diffamatoire ; désinformation nuisible ; harcèlement illégal. Les blocages DOIVENT afficher une explication sûre pour l'utilisateur et un chemin d'appel/revue.
- **FR-RPP-003 (P0)** : La satire politique DOIT être clairement identifiée comme satire et DOIT se conformer aux lois applicables et aux politiques de plateforme ; les projets de satire ont par défaut une revue humaine obligatoire avant publication.

### 8.17 Fact-checking et recherche (spec §18)

- **FR-FCT-001 (P1)** : Pour les projets factuels le système DOIT fournir un pipeline de recherche qui : utilise des sources approuvées et fiables ; enregistre les URLs de source et dates de publication ; distingue le fait de l'opinion ; vérifie les affirmations récentes avant publication ; affiche les citations dans l'article ; détecte les sources contradictoires ; signale les affirmations incertaines ; requiert une revue humaine pour les sujets à haut risque ; et n'invente jamais de source ou de citation.
- **FR-FCT-002 (P1)** : Les cartoons d'actualité ou politiques produits automatiquement DOIVENT subir une vérification de source actuelle immédiatement avant la génération.

### 8.18 Intégration SmarterBloggers (spec §19)

> Note de contexte de construction : puisque le repository SmarterBloggers n'est pas disponible, cette section définit des exigences de contrat. Le travail de phase d'intégration validera ces exigences contre le système réel (spec §19 : « inspecter le repository SmarterBloggers existant avant implémentation »).

- **FR-INT-001 (P0)** : Contrat d'intégration de type de contenu. La plateforme DOIT exposer la capacité d'apparaître comme un type de contenu SmarterBloggers de première classe (« 3D Cartoon Series ») sur la page de création d'article. Une fois sélectionné, le flux embarqué DOIT présenter : sélectionner un projet ; créer un nouveau projet ; sélectionner le type de génération (cartoon statique, comic strip, vidéo animée, épisode cartoon 3D) ; contenu automatique ou manuel ; titre d'épisode ; script editor ; sélecteur de personnage ; storyboard ; preview ; render ; sauvegarder brouillon ; programmer ; publier.
- **FR-INT-002 (P0)** : Contrat d'intégration d'article. Quand un cartoon est produit, l'intégration DOIT supporter : créer ou mettre à jour un article SmarterBloggers ; insérer le lecteur vidéo ou l'image ; ajouter titre ; description ; transcript ; sous-titres ; alt text ; légendes ; tags ; métadonnées de projet et d'épisode ; métadonnées SEO ; structured data ; disclosure le cas échéant ; préserver les informations de propriété du créateur ; lier l'article au cartoon project. La création d'un nouvel article et le rattachement du contenu généré à un brouillon existant DOIVENT tous deux être supportés.
- **FR-INT-003 (P0)** : Aucun contexte en dur. L'exemple d'UUID de blog dans la spec NE DOIT PAS être codé en dur ; l'intégration DOIT utiliser le blog et le contexte d'article sélectionnés par l'utilisateur authentifié.
- **FR-INT-004 (P0)** : Architecture d'intégration. La frontière de service DOIT utiliser : APIs REST ou GraphQL internes ; authentification service-to-service sécurisée ; webhooks ou événements de queue ; idempotency keys ; contrats d'API versionnés ; URLs médias signées ; traitement de job en arrière-plan ; logging d'audit.
- **FR-INT-005 (P1)** : Réutiliser plutôt que reconstruire. Au moment de l'intégration la plateforme DOIT réutiliser l'authentification existante de SmarterBloggers, les comptes utilisateur, les rôles, la propriété de blog, l'éditeur d'article, la médiathèque, la facturation, les notifications, la localisation, le workflow de publication, le tracking d'affiliation (le cas échéant), et le design system. Un second système de compte déconnecté NE DOIT PAS être créé.

### 8.19 Interface utilisateur (spec §20)

- **FR-UI-001 (P0/P1 par écran)** : Le système DOIT fournir une interface soignée et responsive pour des créateurs non-techniques avec ces 20 écrans :

| # | Écran | Priorité | Phase |
|---|---|---|---|
| 1 | Dashboard Cartoon Project | P0 | Phase 2 |
| 2 | Wizard nouveau projet | P0 | Phase 2 |
| 3 | Bibliothèque de personnages | P0 | Phase 2 |
| 4 | Éditeur de personnage | P0 | Phase 2 |
| 5 | Character Bible | P0 | Phase 2 |
| 6 | Bibliothèque d'environnements | P1 | Phase 3 |
| 7 | Bibliothèque d'accessoires | P1 | Phase 3 |
| 8 | Dashboard des épisodes | P0 | Phase 3 |
| 9 | Script editor | P0 | Phase 3 (statique) / Phase 4 (vidéo) |
| 10 | Storyboard editor | P1 | Phase 4 |
| 11 | Timeline editor | P1 | Phase 4 |
| 12 | Preview player | P1 | Phase 4 |
| 13 | Render queue | P1 | Phase 4 |
| 14 | Content calendar | P1 | Phase 5 |
| 15 | Paramètres de génération automatique | P0 | Phase 5 |
| 16 | Paramètres de publication | P1 | Phase 5 |
| 17 | Copyright & Consent Center | P1 | Phase 3 (basique) / Phase 5 (complet) |
| 18 | Usage & Billing Dashboard | P1 | Phase 5 |
| 19 | Project Analytics | P2 | Phase 6 |
| 20 | Console de modération administrative | P1 | Phase 5 (basique) / Phase 6 (complet) |

- **FR-UX-001 (P0)** : Les capacités UX DOIVENT inclure : autosave ; undo et redo ; drag-and-drop de scènes ; duplication de scène ; régénération partielle ; comparaison côte-à-côte ; historique de version ; navigation clavier ; tooltips ; indicateurs de progression ; estimations de coût de rendu ; confirmation avant génération coûteuse ; contrôles mobile-responsive ; contraste de couleur accessible ; support lecteur d'écran ; conformité WCAG 2.2 AA.
- **FR-UX-002 (P0)** : Les prompts bruts NE DOIVENT PAS être présentés aux utilisateurs à moins qu'ils n'ouvrent un mode avancé.
- **FR-UX-003 (P0)** : Accessibilité. L'UI DOIT se conformer à WCAG 2.2 AA ; les tests d'accessibilité DOIVENT tourner en CI (axe-core ou équivalent, plus des passages manuels au lecteur d'écran pour les flux principaux).

### 8.20 Capacités multilingues (spec §21)

- **FR-MLG-001 (P1)** : La plateforme DOIT supporter toutes les langues que les modèles sous-jacents peuvent traiter de manière fiable, incluant : thèmes de projet multilingues ; dialogue multilingue ; traduction ; doublage ; traduction de sous-titres ; layouts droite-à-gauche ; formats de date et nombre spécifiques à la locale ; polices spécifiques à la langue ; dictionnaires de prononciation ; métadonnées SEO multilingues ; politiques de contenu régionales.
- **FR-MLG-002 (P2)** : Chaque personnage DEVRAIT pouvoir parler plus d'une langue approuvée tout en préservant l'identité vocale aussi fidèlement que techniquement possible.
- **FR-MLG-003 (P1)** : Les blagues sensibles, le contenu politique, et les expressions culturellement dépendantes NE DOIVENT PAS être automatiquement traduits sans revue.

### 8.21 Audio et musique (spec §22)

- **FR-AUD-001 (P1)** : Le système DOIT supporter : musique de fond générée par IA ; bibliothèques musicales sous licence ; musique uploadée par l'utilisateur ; bibliothèques d'effets sonores ; musique thématique spécifique à un personnage ; audio ducking automatique ; normalisation de loudness ; édition multi-piste ; isolation vocale ; suppression de bruit ; affichage de waveform audio.
- **FR-AUD-002 (P0)** : La licence et la provenance de chaque asset audio DOIVENT être trackées. Le système NE DOIT PAS générer ou reproduire des chansons, mélodies, ou paroles sous copyright sous une forme substantiellement similaire.

> Les exigences PRD §5.22 à §5.32 (modèle de données, orchestration IA, sécurité, confidentialité, scalabilité, contrôle qualité, contrôles administratifs, analytics, tests, observabilité, gestion d'échec) sont documentées dans [02_cahier_des_charges_technique.md](./02_cahier_des_charges_technique.md).

## 9. Priorisation

*(PRD §6.1 — Ordre de priorité global, spec §39)* En cas de conflit entre exigences, l'équipe DOIT prioriser dans cet ordre :

1. Cohérence d'identité des personnages
2. Sécurité et confidentialité
3. Cohérence de rôle et narrative
4. Conformité copyright et consentement
5. Qualité de sortie
6. Fiabilité
7. Contrôle utilisateur
8. Scalabilité
9. Efficacité de coût
10. Vitesse

**Conséquences** : un provider plus rapide ou moins cher qui dégrade la cohérence d'identité NE DOIT PAS être adopté ; la commodité de l'auto-publication ne prime jamais sur les gates de sécurité ; le polish UI ne prime jamais sur les correctifs de sécurité.

*(PRD §6.2 — Niveaux de priorité)*

| Niveau | Signification |
|---|---|
| P0 | Bloquant pour la phase où il est planifié ; un échec est un défaut qui arrête la release |
| P1 | Requis dans le programme en six phases ; peut suivre le P0 au sein d'une phase |
| P2 | Capacité avancée planifiée pour une phase ultérieure (typiquement Phase 6) ou post-programme |

## 10. Non-goals et limitations explicites

*(PRD §7)*

1. **Aucune garantie d'originalité légale.** Les vérifications automatisées d'originalité, de similarité, et de plagiat sont consultatives. La plateforme NE DOIT PAS prétendre qu'elles garantissent l'originalité légale ; la responsabilité finale du contenu publié reste à l'utilisateur, divulguée dans l'UI et les rapports d'originalité.
2. **Aucun clonage vocal de vraie personne sans consentement documenté.** Le clonage vocal est gated par consentement avec des registres de consentement auditables ; en l'absence de permission documentée la capacité est bloquée.
3. **Aucune imitation de styles signature ou personnages protégés.** Les demandes imitant des artistes vivants, studios, franchises, ou personnages sous copyright sont converties en caractéristiques de haut niveau plus sûres ou bloquées ; les copies confusément similaires de personnages protégés sont interdites.
4. **Aucun entraînement sur le contenu utilisateur par défaut.** Les personnages et assets utilisateur ne sont jamais utilisés pour entraîner des modèles partagés sans consentement séparé et explicite opt-in ; aucune fonctionnalité d'entraînement n'est livrée dans ce programme.
5. **Aucune altération silencieuse du contenu publié.** Les éditions de personnage ou d'asset ne modifient jamais rétroactivement les épisodes publiés sans action utilisateur explicite.
6. **Aucune auto-publication pour les catégories sensibles par défaut.** Politique, santé, finance, élections, religion, sujets légaux, actualités chaudes, et contenu de personne identifiable requièrent une revue humaine avant publication sauf si le propriétaire outrepasse explicitement avec confirmation (et les gates de politique s'appliquent quand même).
7. **Aucune valeur d'environnement en dur.** Secrets, IDs utilisateur, IDs de blog, credentials de provider, prix, et URLs de stockage ne sont jamais codés en dur ; les providers sont nommés par capacité, pas par engagement de marque, jusqu'à ce que les décisions d'achat soient prises.
8. **Aucune microservice pour l'apparence.** L'architecture démarre comme le monolithe modulaire le plus simple avec des frontières de service claires qui peuvent scaler proprement (spec §24).
9. **Pas un éditeur vidéo généraliste.** La profondeur d'édition est scopée au pipeline de production cartoon (étapes, scènes, régénération) ; il ne vise pas à remplacer les outils NLE professionnels.
10. **Aucune garantie sur les estimations de coût.** Les estimations pré-rendu de crédits, ressources, qualité, et stockage sont indicatives et étiquetées comme telles.
11. **Dépendance bloquée : intégration live SmarterBloggers.** Jusqu'à ce que l'accès au repository soit accordé, l'intégration est livrée comme des contrats d'API versionnés plus un flux embarquable validé contre une implémentation de référence/mock, pas contre SmarterBloggers en production.
12. **Plafonds dépendants des providers.** Le rendu 4K, certaines langues, et les fonctionnalités de mouvement avancées ne sont livrés que là où l'infrastructure et la capacité du provider le permettent, et sont signalés par projet plutôt que promis.
