# Services externes — référence des clés/secrets

Depuis la migration vers le VPS (2026-08-01), la **source de vérité unique**
pour les secrets de production est `backend/.env.production` et
`frontend/.env.production` sur le VPS (`/opt/smarterbloggers/`), gitignorés.
Render et Vercel ne sont plus utilisés — leurs variables d'environnement sont
maintenant obsolètes et peuvent être supprimées de leurs dashboards respectifs
(l'accès à ces services devrait être révoqué s'ils ne servent plus à rien,
pour ne pas laisser de vrais secrets dormir dans un service inactif).

| Variable | Sert à | Où la gérer/renouveler |
|---|---|---|
| `APP_SECRET_KEY` | Chiffrement (Fernet) des secrets 2FA et tokens OAuth stockés en DB | Générée localement (`secrets.token_urlsafe`) — **ne jamais changer sans re-chiffrer les données existantes** (voir procédure de rotation ci-dessous) |
| `JWT_SECRET_KEY` | Signature des JWT (access/refresh tokens) | Générée localement — changer force une reconnexion de tous les utilisateurs, sans perte de données |
| `DATABASE_URL`/`DATABASE_SYNC_URL` | Connexion Postgres | VPS : Postgres local Docker. Neon (`smarterbloggers`) sert uniquement de sauvegarde maintenant, voir [[project_neon_db]] |
| `REDIS_URL` | Cache, rate-limiting, tokens 2FA/refresh temporaires, file de jobs ARQ | VPS : Redis local Docker |
| `FIREBASE_*` | Connexion "Se connecter avec Google" uniquement (pas l'auth email/mdp, gérée nativement) | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `CLOUDINARY_*` | Hébergement des images (covers d'articles, avatars, médias) | Cloudinary Dashboard → Settings → API Keys |
| `RESEND_API_KEY` | Envoi d'emails transactionnels (vérification, reset password, notifications) | resend.com → API Keys |
| `OPENAI_API_KEY` | Assistant IA (génération/amélioration d'articles) | platform.openai.com → API keys |
| `DEEPL_API_KEY` | Traduction automatique du contenu (articles, template_config) | deepl.com → compte → clé API |
| `ELEVENLABS_API_KEY` | Synthèse vocale (mode "écouter l'article") | elevenlabs.io → Profile → API Key |
| `GOOGLE_SAFE_BROWSING_API_KEY` / `VIRUSTOTAL_API_KEY` | Scan de sécurité des liens dans les publicités | Google Cloud Console / virustotal.com → API key |
| `OPENPROVIDER_USERNAME`/`PASSWORD` | Achat de domaines + gestion DNS pour les domaines clients | Dashboard OpenProvider (compte reseller) |
| `VAPID_*` | Notifications push web | Générées une fois (`pywebpush`), ne changent normalement jamais (regénérer invalide tous les abonnements push existants) |
| `NOWPAYMENTS_*` | Paiements crypto (abonnements, pubs) + payouts affiliés/revenus pub | Dashboard NowPayments (compte + 2FA TOTP séparé pour les payouts) |
| `FACEBOOK_APP_ID`/`SECRET`, `LINKEDIN_*`, `INSTAGRAM_*`, `THREADS_*` | Connexion des comptes réseaux sociaux des blogs (auto-publication) | Developer console de chaque plateforme |
| `TWITTER_*`, `TIKTOK_*`, `PINTEREST_*`, `GOOGLE_CLIENT_*` | Mêmes usages — **non configurés actuellement** (valeurs vides), fonctionnalités correspondantes indisponibles tant que ce n'est pas rempli | — |
| `VPS_HOST_IP` | IP du VPS, utilisée pour le DNS des nouveaux domaines clients achetés | `191.215.35.51` — à changer si le VPS change un jour d'IP |

## Rotation de `APP_SECRET_KEY` — procédure obligatoire

Cette clé chiffre des données déjà en base (`users.two_fa_secret_enc`,
`users.two_fa_backup_codes`, tokens OAuth sociaux si `social_accounts` est
rempli un jour). La changer sans migration **casse la 2FA de tous les
comptes qui l'ont activée** (ils ne pourraient plus du tout se connecter, ni
par code TOTP ni par code de secours).

Procédure sûre (déjà effectuée une fois le 2026-08-01, cf.
[[project_vps_migration]]) : déchiffrer chaque valeur avec l'ancienne clé,
rechiffrer avec la nouvelle, mettre à jour la DB — jamais juste remplacer la
variable d'environnement à chaud.

## Ce qui a changé lors de la migration VPS (2026-08-01)

- `OPENAI_API_KEY` : la vraie clé de prod (Render) différait de celle du
  `.env` local de dev — corrigée pour utiliser la clé de prod.
- `EMAIL_FROM_ADDRESS` : `noreply@smarterbloggers.com` (domaine vérifié sur
  Resend) au lieu du placeholder `onboarding@resend.dev` utilisé en dev.
- `NOWPAYMENTS_WALLET_USDT` : absente de ma première version de
  `.env.production`, ajoutée après comparaison avec les vraies valeurs Render.
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` : aligné sur 1440 (24h, valeur réelle de
  prod) au lieu de 2400 (valeur de dev local).
- `VERCEL_TOKEN`/`VERCEL_PROJECT_ID` : supprimés (plus utilisés, Vercel
  remplacé par le VPS pour tous les domaines sauf gemticash.com).
