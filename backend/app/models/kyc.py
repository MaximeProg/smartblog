import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Numeric, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import KycStatus, ENUM_VALUES


class KycVerification(Base):
    """Une ligne par cycle de vérification KYC — achat initial ou
    re-vérification après un changement important de profil (voir
    auth.py::update_profile). Historique complet façon AffiliateCommission,
    conservé pour l'audit/la comptabilité même après expiration."""
    __tablename__ = "kyc_verifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)  # = PLATFORM_TENANT_ID
    transaction_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.id"))

    years_purchased: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    amount_paid: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    status: Mapped[KycStatus] = mapped_column(
        SAEnum(KycStatus, name="kyc_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=KycStatus.NOT_STARTED,
    )

    kaluta_session_id: Mapped[str | None] = mapped_column(String(255))
    kaluta_verification_url: Mapped[str | None] = mapped_column(Text)
    kaluta_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    raw_webhook_payload: Mapped[dict | None] = mapped_column(JSONB)

    document_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    face_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    liveness_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    overall_score: Mapped[float | None] = mapped_column(Numeric(5, 2))

    is_material_change_reverification: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<KycVerification {self.id} user={self.user_id} status={self.status}>"
