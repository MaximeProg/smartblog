# SmarterBloggers — Plan d'achèvement

> Audit du 2026-07-14 · 14 items restants · ~25% du projet
> À traiter dans l'ordre ci-dessous.

---

## SPRINT A — Critique métier (backend + frontend léger)

### A-1 · Trial blocking — backend `dependencies.py`
**Priorité :** Bloquant business — sans ça, les trials expirés gardent l'accès.
- Ajouter une dependency FastAPI `require_active_plan` qui vérifie `trial_ends_at` et le statut de l'abonnement
- L'appliquer sur tous les routers tenants sensibles (articles, newsletters, analytics…)
- Frontend : le `TrialBanner` existe déjà ✅

### A-2 · Affiliation — email de notification de commission
**Priorité :** UX affiliés — ils ne savent pas quand ils gagnent de l'argent.
- Dans `backend/app/api/v1/affiliate.py`, fonction `_accrue_commission`
- Appeler `email_service` pour notifier l'affilié : montant crédité, nouveau solde
- Email simple, pas de template complexe

### A-3 · Super Admin — broadcast email fonctionnel
**Priorité :** Outil admin essentiel.
- `backend/app/api/v1/superadmin.py` → fonction `send_platform_notification`
- Remplacer le stub `{"ok": True}` par un vrai envoi via `email_service` à tous les tenants actifs (ou filtrés)
- Frontend `superadmin/notifications/page.tsx` existe déjà ✅

---

## SPRINT B — SEO + Expérience lecteur

### B-1 · SEO — Redirections 301 sur changement de slug
**Priorité :** SEO critique — changer un slug casse tous les backlinks.
- Créer modèle `SlugRedirect` (old_slug, new_slug, article_id, tenant_id)
- Hooker la mise à jour dans `PATCH /articles/{id}` : si slug change → créer redirect
- Endpoint public : `GET /public/{slug}/r/{old_slug}` → 301 vers nouveau slug

### B-2 · Bookmarks — persistance en base de données
**Priorité :** Expérience lecteur.
- Créer modèle `Bookmark` (user_id, article_id, tenant_id, created_at)
- Endpoints : `POST /tenants/{id}/bookmarks`, `DELETE`, `GET`
- Migrer le hook `useBookmark` frontend de localStorage → API

### B-3 · Analytics — taux de rebond + export CSV
**Priorité :** Dashboard analytics incomplet.
- Backend `analytics.py` : calculer `bounce_rate` (sessions avec 1 seule page vue)
- Ajouter endpoint `GET /analytics/export?format=csv`
- Frontend `analytics/page.tsx` : afficher bounce_rate + bouton téléchargement CSV

---

## SPRINT C — Sécurité commentaires + Push

### C-1 · Commentaires — rate limiting
**Priorité :** Sécurité anti-spam.
- Ajouter `slowapi` rate limiting sur `POST /public/{slug}/comments` : 5 requêtes/heure par IP
- Pas de CAPTCHA (complexité inutile pour l'instant) — le rate limiting suffit

### C-2 · Push notifications — segmentation par catégorie
**Priorité :** Pertinence des notifications.
- Ajouter champ `category_ids` (array) sur `PushSubscription`
- Endpoint `POST /push/subscribe` : accepter les catégories d'intérêt
- `POST /push/send` : filtrer les tokens par catégorie si `category_id` fourni

---

## SPRINT D — Revenue (Newsletter payante)

### D-1 · Newsletter payante — flow NowPayments
**Priorité :** Revenue direct pour les tenants.
- Champs `is_paid` + `price` existent déjà en DB ✅
- Créer endpoint `POST /tenants/{id}/newsletters/{nid}/checkout` → invoice NowPayments
- Webhook : à réception paiement → `NewsletterAccess` (modèle à créer)
- Frontend : afficher prix + bouton paiement sur newsletters payantes publiques

### D-2 · Newsletter builder — blocs d'email
**Priorité :** UX rédaction newsletter.
- Remplacer/enrichir `NewsletterBodyEditor.tsx` avec des blocs Tiptap : Texte, Image, Bouton CTA, Séparateur, Citation
- Pas de builder drag-and-drop complet (Unlayer) — des blocs Tiptap suffisent
- Aperçu HTML email dans un iframe

---

## SPRINT E — API publique tenants

### E-1 · Clés API par tenant
**Priorité :** Permettre les intégrations tierces.
- Créer modèle `TenantApiKey` (tenant_id, key_hash, name, permissions, last_used_at, expires_at)
- Endpoints : `POST /tenants/{id}/api-keys`, `GET`, `DELETE`
- Middleware : vérifier `X-API-Key` header comme alternative au JWT
- Frontend `settings/api-keys/page.tsx` : générer/révoquer les clés

---

## SPRINT F — Réseaux sociaux OAuth

### F-1 · OAuth Instagram
**Priorité :** Demandé mais complexe (Instagram Basic Display API).
- Backend `social_oauth.py` : ajouter `_handle_instagram`
- Scope : `user_profile`, `user_media`

### F-2 · OAuth Pinterest
**Priorité :** Utile pour blogs lifestyle/créatifs.
- Backend `social_oauth.py` : ajouter `_handle_pinterest`

### F-3 · OAuth Threads
**Priorité :** Réseau récent, API Meta.
- Backend `social_oauth.py` : ajouter `_handle_threads`

---

## SPRINT G — Affiliation avancée

### G-1 · Arbre des filleuls (tree view)
**Priorité :** Visualisation réseau de parrainage.
- Backend : endpoint `GET /tenants/{id}/affiliate/tree` → structure hiérarchique JSON
- Frontend `affiliate/page.tsx` : nouvel onglet "Mon réseau" avec tree component

### G-2 · Export CSV des commissions
**Priorité :** Gestion fiscale des affiliés.
- Backend : endpoint `GET /tenants/{id}/affiliate/commissions/export?format=csv&month=2026-07`
- Frontend : bouton "Exporter CSV" dans l'onglet Commissions

---

## SPRINT H — Comptabilité tenant

### H-1 · Vue comptable pour les tenants
**Priorité :** Transparence financière.
- `frontend/src/app/[locale]/(dashboard)/blogs/[blogId]/accounting/page.tsx` à créer
- Afficher : revenus articles payants, abonnements, publicités — déjà en DB via `Transaction`
- Rapport simple : total revenus / commissions platform / net tenant par mois

---

## Récapitulatif

| Sprint | Items | Complexité |
|--------|-------|------------|
| A | 3 items | Faible — backend pur |
| B | 3 items | Moyenne — modèle + API + frontend |
| C | 2 items | Faible |
| D | 2 items | Haute — nouveau flow paiement |
| E | 1 item | Moyenne |
| F | 3 items | Haute — OAuth tiers |
| G | 2 items | Moyenne |
| H | 1 item | Faible — UI seulement |
| **Total** | **17 tâches** | |
