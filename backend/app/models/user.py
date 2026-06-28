import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import PlanTier, ENUM_VALUES


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Firebase
    firebase_uid: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    sign_in_provider: Mapped[str | None] = mapped_column(String(50))  # google.com | password | github.com …
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Profil
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    display_name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str | None] = mapped_column(Text)

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

    # Activité
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_ip: Mapped[str | None] = mapped_column(String(45))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<User {self.email}>"
