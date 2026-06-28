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

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PLATFORM_FEE_PERCENT: int = 5

    # PayPal
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: Literal["sandbox", "live"] = "sandbox"

    # Email
    RESEND_API_KEY: str = ""
    EMAIL_FROM_NAME: str = "NexusBlog"
    EMAIL_FROM_ADDRESS: str = "noreply@nexusblog.io"

    # AI
    OPENAI_API_KEY: str = ""
    OPENAI_DEFAULT_MODEL: str = "gpt-4o-mini"
    OPENAI_STRONG_MODEL: str = "gpt-4o"
    DEEPL_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""

    # Sécurité liens pub
    GOOGLE_SAFE_BROWSING_API_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""

    # Plateforme
    PLATFORM_DOMAIN: str = "nexusblog.io"
    PLATFORM_API_DOMAIN: str = "api.nexusblog.io"

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
        if self.APP_ENV == "development":
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return [f"https://*.{self.PLATFORM_DOMAIN}", f"https://{self.PLATFORM_DOMAIN}"]


settings = Settings()
