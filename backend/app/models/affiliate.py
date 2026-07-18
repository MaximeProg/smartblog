import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum, Numeric, Integer, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from app.models.enums import AffiliateCommissionSource, AffiliateCommissionStatus, CashoutStatus, ENUM_VALUES


class AffiliateRelationship(Base):
    """Precomputed closure table for the affiliate tree (max 10 levels).
    Keyed on users, not tenants — affiliation belongs to the PERSON, not to
    whichever blog happened to be used to generate the shared link."""
    __tablename__ = "affiliate_relationships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    descendant_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ancestor_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("level BETWEEN 1 AND 10", name="chk_affiliate_level"),
    )


class AffiliateCodeAlias(Base):
    """Legacy affiliate codes (one blog used to have its own code) that must
    keep resolving to their owner's canonical user-level identity forever,
    since links bearing these codes may already be shared/bookmarked."""
    __tablename__ = "affiliate_code_aliases"

    code: Mapped[str] = mapped_column(String(8), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


class AffiliateCommission(Base):
    """One commission accrual per affiliate per transaction."""
    __tablename__ = "affiliate_commissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    affiliate_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    source_type: Mapped[AffiliateCommissionSource] = mapped_column(
        SAEnum(AffiliateCommissionSource, name="affiliate_commission_source", create_type=False, values_callable=ENUM_VALUES),
        nullable=False,
    )
    source_transaction_id: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False)

    gross_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    commission_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[AffiliateCommissionStatus] = mapped_column(
        SAEnum(AffiliateCommissionStatus, name="affiliate_commission_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=AffiliateCommissionStatus.PENDING,
    )

    cashout_request_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("affiliate_cashout_requests.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AffiliateCashoutRequest(Base):
    __tablename__ = "affiliate_cashout_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    gross_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fee: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=20)
    net_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[CashoutStatus] = mapped_column(
        SAEnum(CashoutStatus, name="cashout_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=CashoutStatus.REQUESTED,
    )

    payout_method: Mapped[str | None] = mapped_column(String(30))  # 'nowpayments_crypto'
    usdt_wallet_snapshot: Mapped[str | None] = mapped_column(String(100))  # wallet au moment du payout
    payout_reference: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)

    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    def __repr__(self) -> str:
        return f"<AffiliateCashoutRequest {self.id} ${self.net_amount} {self.status}>"
