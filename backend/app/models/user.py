import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, DateTime, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import PlanTier, ENUM_VALUES


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Firebase — utilisé uniquement pour la connexion Google. Nullable car les
    # comptes email/mot de passe sont authentifiés nativement (password_hash).
    firebase_uid: Mapped[str | None] = mapped_column(String(128), unique=True)
    sign_in_provider: Mapped[str | None] = mapped_column(String(50))  # google.com | password
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Authentification native (email/mot de passe géré par notre backend, pas Firebase)
    password_hash: Mapped[str | None] = mapped_column(String(255))

    # Profil
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    display_name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(30))
    country: Mapped[str | None] = mapped_column(String(2))   # ISO 3166-1 alpha-2
    continent: Mapped[str | None] = mapped_column(String(2)) # AF AS EU NA OC SA AN
    gender: Mapped[str | None] = mapped_column(String(20))   # immuable après saisie

    # Abonnement SaaS — le plan est sur le compte utilisateur, pas sur chaque blog
    plan: Mapped[PlanTier] = mapped_column(
        SAEnum(PlanTier, name="plan_tier", create_type=False, values_callable=ENUM_VALUES),
        nullable=False,
        default=PlanTier.FREE,
        server_default="free",
    )

    # Plateforme
    is_super_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # 2FA
    two_fa_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    two_fa_secret_enc: Mapped[str | None] = mapped_column(Text)
    two_fa_backup_codes: Mapped[dict | None] = mapped_column(JSONB)

    # Crypto wallet — pour recevoir les commissions affiliés/ads. Depuis le
    # 2026-07-27, l'utilisateur choisit son réseau/devise de cashout parmi ce
    # que NowPayments accepte réellement (payout_currency, ex: "usdtbsc",
    # "usdttrc20", "btc"...) — usdt_wallet_address stocke l'adresse pour CE
    # réseau (nom de colonne conservé pour compat, plus limité à USDT/BSC).
    # 2FA doit être activé avant de pouvoir renseigner/modifier cette adresse.
    usdt_wallet_address: Mapped[str | None] = mapped_column(String(100))
    payout_currency: Mapped[str] = mapped_column(String(20), nullable=False, default="usdtbsc")
    payout_extra_id: Mapped[str | None] = mapped_column(String(100))  # memo/tag requis par certains réseaux (XRP, EOS...)

    # Programme d'affiliation — au niveau du compte, pas d'un blog en particulier :
    # une même personne peut posséder plusieurs blogs, un seul code/solde compte.
    affiliate_code: Mapped[str | None] = mapped_column(String(8), unique=True)
    affiliate_balance: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    affiliate_cashout_threshold: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    referred_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", use_alter=True, name="fk_user_referred_by", ondelete="SET NULL"),
    )

    # Activité
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_ip: Mapped[str | None] = mapped_column(String(45))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<User {self.email}>"
