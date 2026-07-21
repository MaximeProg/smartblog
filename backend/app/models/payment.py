import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import (
    PaymentGateway, TransactionType, TransactionStatus, SubscriptionStatus, ENUM_VALUES,
)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    transaction_type: Mapped[TransactionType] = mapped_column(
        SAEnum(TransactionType, name="transaction_type", create_type=False, values_callable=ENUM_VALUES), nullable=False,
    )
    status: Mapped[TransactionStatus] = mapped_column(
        SAEnum(TransactionStatus, name="transaction_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=TransactionStatus.PENDING,
    )
    payment_gateway: Mapped[PaymentGateway] = mapped_column(
        SAEnum(PaymentGateway, name="payment_gateway", create_type=False, values_callable=ENUM_VALUES), nullable=False,
    )

    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USDT")
    platform_fee: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    net_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    # Cumul confirmé pour cette transaction (mis à jour à chaque webhook/
    # poll) — une seule adresse de dépôt tout du long : NowPayments détecte
    # lui-même les dépôts complémentaires sur la même adresse ("Re-deposit"),
    # pas besoin de suivre plusieurs tentatives séparément.
    amount_received: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    # Référence NowPayments
    nowpayments_invoice_id: Mapped[str | None] = mapped_column(String(255))
    nowpayments_order_id: Mapped[str | None] = mapped_column(String(255))
    nowpayments_payment_id: Mapped[str | None] = mapped_column(String(255))

    # Paiement intégré (adresse + QR affichés directement sur la plateforme)
    pay_address: Mapped[str | None] = mapped_column(String(255))
    pay_amount: Mapped[float | None] = mapped_column(Numeric(20, 8))
    pay_currency: Mapped[str | None] = mapped_column(String(20))
    payment_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Statut brut NowPayments (waiting/confirming/finished/failed/expired/...),
    # affiché tel quel côté frontend sans étendre TransactionStatus.
    provider_status: Mapped[str | None] = mapped_column(String(30))

    # Objet acheté
    article_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="SET NULL"))
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))  # newsletter campaign ou ad
    extra: Mapped[dict | None] = mapped_column(JSONB)

    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Transaction {self.id} {self.amount}{self.currency} ({self.status})>"


class UserSubscription(Base):
    """Abonnement SaaS d'un compte utilisateur (plan Starter/Pro/Business/Enterprise),
    répercuté sur tous les blogs dont l'utilisateur est propriétaire."""
    __tablename__ = "user_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    nowpayments_payment_id: Mapped[str | None] = mapped_column(String(255))

    status: Mapped[SubscriptionStatus] = mapped_column(
        SAEnum(SubscriptionStatus, name="subscription_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=SubscriptionStatus.TRIALING,
    )
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    extra: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class ArticleAccess(Base):
    """Accès utilisateur à un article payant."""
    __tablename__ = "article_access"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    transaction_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.id"))
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
