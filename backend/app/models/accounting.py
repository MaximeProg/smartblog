import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Text, Boolean, Date, DateTime, ForeignKey, Enum as SAEnum, Numeric, Integer, BigInteger, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, INET
from app.models.base import Base
from app.models.enums import AccountType, JournalType, JournalEntryStatus, JournalEntrySource, ENUM_VALUES


class ChartOfAccount(Base):
    """Singapore SFRS Chart of Accounts — Classes 1-5."""
    __tablename__ = "chart_of_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    account_class: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    account_type: Mapped[AccountType] = mapped_column(
        SAEnum(AccountType, name="account_type", create_type=False, values_callable=ENUM_VALUES),
        nullable=False,
    )
    parent_code: Mapped[str | None] = mapped_column(String(10), ForeignKey("chart_of_accounts.code", ondelete="RESTRICT"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    __table_args__ = (
        CheckConstraint("account_class BETWEEN 1 AND 5", name="chk_account_class"),
    )

    def __repr__(self) -> str:
        return f"<ChartOfAccount {self.code} — {self.name}>"


class JournalEntry(Base):
    """Immutable double-entry journal entry requiring dual approval."""
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_number: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    journal_type: Mapped[JournalType] = mapped_column(
        SAEnum(JournalType, name="journal_type", create_type=False, values_callable=ENUM_VALUES),
        nullable=False,
    )
    reference: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[JournalEntryStatus] = mapped_column(
        SAEnum(JournalEntryStatus, name="journal_entry_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=JournalEntryStatus.PENDING,
    )
    source_type: Mapped[JournalEntrySource | None] = mapped_column(
        SAEnum(JournalEntrySource, name="journal_entry_source", create_type=False, values_callable=ENUM_VALUES),
        nullable=True,
    )
    source_id: Mapped[str | None] = mapped_column(String(255))
    original_entry_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="RESTRICT"), nullable=True)

    # Dual-control audit trail
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    def __repr__(self) -> str:
        return f"<JournalEntry #{self.entry_number} {self.status}>"


class JournalEntryLine(Base):
    """One debit or credit line in a journal entry."""
    __tablename__ = "journal_entry_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="RESTRICT"), nullable=False)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)
    account_code: Mapped[str] = mapped_column(String(10), ForeignKey("chart_of_accounts.code", ondelete="RESTRICT"), nullable=False)
    debit: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False, default=0)
    credit: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        CheckConstraint(
            "(debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)",
            name="chk_debit_xor_credit",
        ),
    )
