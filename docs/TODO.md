# SmarterBloggers — Ce qui reste à faire

> Audit réel du 2026-07-14 — fichier par fichier
> Avancement estimé : **~75%**

---

## 🔴 BUGS

### BUG-1 — Changement de mot de passe factice
**Fichiers :** `backend/app/api/v1/auth.py` + `frontend/src/app/[locale]/(dashboard)/profile/page.tsx` ligne 277
`handlePwSave()` affiche un toast "succès" sans appeler aucune API. L'endpoint `PATCH /auth/me/password` n'existe pas côté backend.
**Fix :** Créer l'endpoint backend + appel frontend.

### BUG-2 — ThemeRenderer : thèmes non branchés dans les switch cases
**Fichier :** `frontend/src/components/themes/ThemeRenderer.tsx`
Les composants Minimal, Business, News, Tech, Portfolio sont importés mais aucun `case 'minimal'`, `case 'business'` etc. n'existe dans les fonctions `ThemeHome`, `ThemeArticle`, `ThemeAbout`, `ThemeContact`, `ThemeCategories`. Tous les blogs non-Editorial tombent sur Editorial.
**Fix :** Ajouter les cases manquants pour chaque thème dans chaque fonction.

---

## 🟠 PARTIELLEMENT IMPLÉMENTÉ

| # | Module | Ce qui manque exactement |
|---|---|---|
| P-1 | **Auth** | Révocation des tokens JWT existants quand le mot de passe change (dépend de BUG-1) |
| P-2 | **Trial** | Blocage effectif de l'accès à expiration — `trial_ends_at` existe en DB, bannière existe, mais aucune vérification dans les dependencies FastAPI |
| P-3 | **Tenants** | Suppression avec période de grâce 30j + export — `DELETE` existe mais supprime directement sans délai |
| P-4 | **Membres** | Historique des connexions par membre — aucun modèle ni endpoint de log d'accès |
| P-5 | **Catégories** | UI drag-and-drop pour hiérarchie — `sort_order` et `parent_id` existent en DB, aucune UI DnD |
| P-6 | **Commentaires** | Affichage hiérarchique (threading) — `parent_id` existe en DB, aucun rendu imbriqué dans la page modération |
| P-7 | **Commentaires** | ARQ cron fermeture auto après N jours — champ `comments_close_after_days` existe, aucun worker |
| P-8 | **Newsletter** | Builder visuel drag-drop — modal textarea HTML uniquement |
| P-9 | **Réseaux sociaux** | OAuth Instagram, Threads, Pinterest — UI affichée, aucun handler backend |
| P-10 | **Thèmes** | Widgets (populaires, catégories, tags, newsletter) uniquement dans Editorial — absent des autres thèmes |
| P-11 | **Retry social** | `retry_count` incrémenté dans tasks.py mais jamais re-queued — logique morte |
| P-12 | **Super Admin** | Broadcast email — endpoint retourne `{"ok": True}` sans rien faire (stub vide) |
| P-13 | **Logs audit** | Synthèse depuis les tables existantes, pas une table append-only dédiée immuable |
| P-14 | **Pièces jointes comptabilité** | Interface expandable présente, aucun upload réel |

---

## ❌ VRAIMENT MANQUANT

### Bloquant / Priorité haute

| # | Module | Fonctionnalité |
|---|---|---|
| H-1 | **Auth** | i18n blog public : switcher langue, détection auto navigateur, balises `hreflang` |
| H-2 | **Affiliation** | Email de notification à chaque commission créditée (`_accrue_commission` n'envoie aucun email) |

### Éditeur (M4)

| # | Fonctionnalité |
|---|---|
| E-1 | Commandes slash IA `/` dans l'éditeur (Callouts et CTA existent, mais pas le menu slash `/`) |
| E-2 | Mode Markdown avec prévisualisation splitée |
| E-3 | Drag & Drop de blocs Tiptap |

### Médiathèque (M7)

| # | Fonctionnalité |
|---|---|
| M7-1 | Alt text automatique via IA (saisie manuelle uniquement) |
| M7-2 | Pipeline srcset multi-breakpoints WebP/AVIF (Cloudinary `get_optimized_url` existe mais pas de srcset) |

### Commentaires (M8)

| # | Fonctionnalité |
|---|---|
| M8-1 | Score de toxicité IA automatique (OpenAI Moderation API — gratuit) |
| M8-2 | CAPTCHA sur soumission commentaire public |
| M8-3 | Rate limiting commentaires (5/heure par IP) |

### Newsletter (M9)

| # | Fonctionnalité |
|---|---|
| M9-1 | Newsletter payante (champs `is_paid` / `price` existent en DB, aucun flow paiement NowPayments) |

### SEO (M14)

| # | Fonctionnalité |
|---|---|
| M14-1 | Redirections 301 automatiques lors du changement de slug d'un article |

### Expérience lecteur (M18)

| # | Fonctionnalité |
|---|---|
| M18-1 | Encadré "En résumé" IA (3-5 points clés) en début d'article public |
| M18-2 | Articles recommandés IA en fin de lecture |
| M18-3 | Bookmarks persistés en base de données (localStorage uniquement, aucun endpoint backend) |
| M18-4 | PWA offline (`sw.js` gère uniquement les push, pas de cache offline) |

### API publique (M19)

| # | Fonctionnalité |
|---|---|
| M19-1 | Génération de clés API par tenant depuis le dashboard (aucun modèle `ApiKey` ni router) |
| M19-2 | Rate limiting par clé API |

### IA (M21)

| # | Fonctionnalité |
|---|---|
| M21-1 | Détection de plagiat |
| M21-2 | Suggestion automatique de catégorie et tags lors de la rédaction |

### Affiliation (M23)

| # | Fonctionnalité |
|---|---|
| M23-1 | Visualisation arbre des filleuls (graphe ou tree view) dans le dashboard |
| M23-2 | Page publique du programme d'affiliation |
| M23-3 | Export CSV des commissions mensuelles |
| M23-4 | Détection de fraude affiliés (auto-parrainage, cycles) |

### Comptabilité avancée (M24)

| # | Fonctionnalité |
|---|---|
| M24-1 | Journaux typés : Ventes, Achats, Banque, OD (filtrage par type journal) |
| M24-2 | Grand livre général par compte |
| M24-3 | Balance des comptes (trial balance) |
| M24-4 | Rapport P&L (Compte de résultat) |
| M24-5 | Rapport Bilan |
| M24-6 | Flux de trésorerie |
| M24-7 | Export PDF + CSV des rapports |
| M24-8 | GST Singapour (déclarations F5/F7) |
| M24-9 | Impôt sur les sociétés 17% + export XBRL ACRA |
| M24-10 | Clôture de période et clôture annuelle |
| M24-11 | Réconciliation bancaire |

### Contenu (M3)

| # | Fonctionnalité |
|---|---|
| M3-1 | Galerie photos multi-images avec légendes |
| M3-2 | Transcription audio automatique via Whisper (OpenAI) |

### Notifications push (M16)

| # | Fonctionnalité |
|---|---|
| M16-1 | Segmentation push par catégorie |
| M16-2 | Statistiques d'ouverture et clics des notifications push |

### Analytics (M13)

| # | Fonctionnalité |
|---|---|
| M13-1 | Taux de rebond et temps de lecture moyen par article |
| M13-2 | Export CSV des données analytics |

---

## 📊 Récapitulatif réel

| Statut | Nombre |
|---|---|
| ✅ Terminé | ~310 |
| 🟠 Partiel | 14 |
| ❌ Manquant | ~45 |
| **Total** | **~405** |
| **Avancement réel** | **~75%** |

---

## 🚀 Ordre de traitement recommandé

1. **BUG-2** ThemeRenderer — brancher les switch cases (bloque toute démo de thème)
2. **BUG-1** Changement de mot de passe réel (backend + frontend)
3. **P-2** Blocage trial expiré dans les dependencies FastAPI
4. **H-2** Email notification commission affilié
5. **P-10** Widgets dans tous les thèmes (pas seulement Editorial)
6. **M14-1** Redirections 301 sur changement de slug
7. **M18-3** Bookmarks en base de données
8. **M19-1** Clés API tenant
9. **M9-1** Newsletter payante
10. **M24** Comptabilité avancée (gros chantier)







