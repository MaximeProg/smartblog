import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from app.models.enums import DomainVerificationStatus, ENUM_VALUES


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
