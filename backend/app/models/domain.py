import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum, Numeric, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import DomainVerificationStatus, DomainSource, DomainOrderStatus, ENUM_VALUES


class CustomDomain(Base):
    __tablename__ = "custom_domains"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    verification_status: Mapped[DomainVerificationStatus] = mapped_column(
        SAEnum(DomainVerificationStatus, name="domain_verification_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=DomainVerificationStatus.PENDING,
    )
    ssl_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # ── Achat automatisé de domaine (registrar) ──────────────────────
    source: Mapped[DomainSource] = mapped_column(
        SAEnum(DomainSource, name="domain_source", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=DomainSource.EXTERNAL,
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    registrar: Mapped[str | None] = mapped_column(String(50))
    registrar_domain_id: Mapped[str | None] = mapped_column(String(100))
    purchased_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    purchase_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    renewal_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class DomainOrder(Base):
    """Pipeline d'achat d'un domaine (paiement → enregistrement registrar),
    séparé de CustomDomain car l'enregistrement registrar peut échouer après
    un paiement déjà réussi."""
    __tablename__ = "domain_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    transaction_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="SET NULL"))
    custom_domain_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("custom_domains.id", ondelete="SET NULL"))

    domain_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tld: Mapped[str] = mapped_column(String(30), nullable=False)
    years: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    registrar: Mapped[str] = mapped_column(String(50), nullable=False)
    registrant_info: Mapped[dict] = mapped_column(JSONB, nullable=False)
    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    status: Mapped[DomainOrderStatus] = mapped_column(
        SAEnum(DomainOrderStatus, name="domain_order_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=DomainOrderStatus.PENDING_PAYMENT,
    )
    registrar_order_id: Mapped[str | None] = mapped_column(String(100))
    registrar_domain_id: Mapped[str | None] = mapped_column(String(100))
    purchase_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    renewal_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    error_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    registered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
