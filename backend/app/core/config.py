from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_SECRET_KEY: str
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    DATABASE_SYNC_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_API_KEY: str = ""

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_CLIENT_ID: str = ""

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # NowPayments (crypto — USDT BSC / BEP20)
    # Dashboard : https://account.nowpayments.io/
    NOWPAYMENTS_API_KEY: str = ""           # Clé principale (créer invoices)
    NOWPAYMENTS_IPN_SECRET: str = ""        # Secret HMAC-SHA512 pour vérifier webhooks IPN
    NOWPAYMENTS_PAYOUT_API_KEY: str = ""    # Clé Payouts (envoyer USDT aux affiliés)
    NOWPAYMENTS_EMAIL: str = ""             # Identifiants du compte dashboard — requis pour POST /v1/auth (JWT obligatoire sur les payouts, contrairement aux paiements entrants)
    NOWPAYMENTS_PASSWORD: str = ""
    NOWPAYMENTS_PAYOUT_TOTP_SECRET: str = ""  # Secret TOTP affiché lors de l'activation du 2FA "Authenticator app" sur les payouts (permet de générer le code de vérification automatiquement, sans email)
    NOWPAYMENTS_WALLET_USDT: str = ""       # Wallet USDT BSC de la plateforme SmarterBloggers
    NOWPAYMENTS_PLATFORM_FEE_PERCENT: int = 5  # Commission plateforme articles payants
    NOWPAYMENTS_SANDBOX: bool = True        # False en production
    NOWPAYMENTS_TOLERANCE_USD: float = 0.50  # Marge acceptée sur un paiement "partially_paid" (frais/variation crypto)
    NOWPAYMENTS_PAYMENT_WINDOW_HOURS: float = 3.0  # Durée d'affichage/validité de la fenêtre de paiement (l'adresse NowPayments reste utilisable ~7 jours ; expiration_estimate_date n'est qu'un délai de rafraîchissement de cours, non pertinent pour un stablecoin)

    # Registrar de domaines — OpenProvider (achat automatisé de noms de domaine)
    OPENPROVIDER_USERNAME: str = ""
    OPENPROVIDER_PASSWORD: str = ""
    OPENPROVIDER_SANDBOX: bool = True        # False en production (compte reseller réel requis)
    DEFAULT_DOMAIN_REGISTRAR: str = "openprovider"
    DOMAIN_SEARCH_TLDS: list[str] = ["com", "net", "org", "blog", "ai", "io", "co", "dev"]

    # Email (Resend)
    RESEND_API_KEY: str = ""
    EMAIL_FROM_NAME: str = "SmarterBloggers"
    EMAIL_FROM_ADDRESS: str = "noreply@smarterbloggers.com"
    # Adresse autorisée par Resend sans domaine vérifié (= email du compte Resend)
    RESEND_TEST_RECIPIENT: str = ""

    # Web Push (VAPID)
    # Génération : python -c "from pywebpush import Vapid; v=Vapid(); v.generate_keys(); print('PRIV:', v.private_key_pem.decode()); print('PUB:', v.public_key_pem.decode())"
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_CLAIMS_EMAIL: str = "mailto:admin@smarterbloggers.com"

    # AI
    OPENAI_API_KEY: str = ""
    OPENAI_DEFAULT_MODEL: str = "gpt-4o-mini"
    OPENAI_STRONG_MODEL: str = "gpt-4o"
    DEEPL_API_KEY: str = ""
    # Free plan → api-free.deepl.com ; Pro plan → api.deepl.com (clés Free se terminent par ":fx")
    DEEPL_API_URL: str = "https://api-free.deepl.com/v2/translate"
    ELEVENLABS_API_KEY: str = ""

    # Sécurité liens pub
    GOOGLE_SAFE_BROWSING_API_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""

    # Social OAuth
    FRONTEND_URL: str = "http://localhost:3000"
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    TWITTER_CLIENT_ID: str = ""
    TWITTER_CLIENT_SECRET: str = ""
    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    THREADS_APP_ID: str = ""
    THREADS_APP_SECRET: str = ""
    PINTEREST_APP_ID: str = ""
    PINTEREST_APP_SECRET: str = ""
    # YouTube + Google Business Profile partagent le même client OAuth Google Cloud
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Plateforme
    PLATFORM_DOMAIN: str = "smarterbloggers.com"
    PLATFORM_API_DOMAIN: str = "api.smarterbloggers.com"

    # Vercel (custom domain registration)
    VERCEL_TOKEN: str = ""
    VERCEL_PROJECT_ID: str = ""

    # URLs frontend supplémentaires autorisées (séparées par des virgules)
    # Ex: EXTRA_CORS_ORIGINS=https://smarterbloggers.vercel.app,https://staging.smarterbloggers.com
    EXTRA_CORS_ORIGINS: str = ""

    # Exiger la vérification email avant connexion (mettre "true" en prod quand email configuré)
    REQUIRE_EMAIL_VERIFICATION: str = "false"

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_db_url(cls, v: str) -> str:
        if not v.startswith("postgresql"):
            raise ValueError("DATABASE_URL doit être une URL PostgreSQL")
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origins(self) -> list[str]:
        origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
        if self.APP_ENV != "development":
            origins += [f"https://{self.PLATFORM_DOMAIN}"]
        if self.EXTRA_CORS_ORIGINS:
            extra = [o.strip() for o in self.EXTRA_CORS_ORIGINS.split(",") if o.strip()]
            origins += extra
        return list(dict.fromkeys(origins))


settings = Settings()
