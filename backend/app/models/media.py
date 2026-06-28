import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, BigInteger, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import MediaType, ENUM_VALUES


class Media(Base):
    __tablename__ = "media"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Cloudinary
    cloudinary_public_id: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    cloudinary_url: Mapped[str] = mapped_column(Text, nullable=False)
    cloudinary_secure_url: Mapped[str] = mapped_column(Text, nullable=False)
    cloudinary_resource_type: Mapped[str] = mapped_column(String(20), nullable=False, default="image")

    # Métadonnées
    media_type: Mapped[MediaType] = mapped_column(
        SAEnum(MediaType, name="media_type", create_type=False, values_callable=ENUM_VALUES),
        nullable=False,
    )
    original_filename: Mapped[str | None] = mapped_column(String(500))
    alt_text: Mapped[str | None] = mapped_column(String(500))
    caption: Mapped[str | None] = mapped_column(Text)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    format: Mapped[str | None] = mapped_column(String(20))
    extra: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Media {self.cloudinary_public_id}>"
