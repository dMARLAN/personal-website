"""Table definitions. Alembic autogenerates migrations from this metadata; repositories query with raw SQL.

Timestamps are ISO 8601 UTC strings with microseconds (`datetime.isoformat(timespec="microseconds")`), so they sort
and compare as text.
"""

from sqlalchemy import CheckConstraint, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ContentSectionRow(Base):
    """One validated JSON document per content section (`content.sections.ContentSection`)."""

    __tablename__ = "content_section"
    __table_args__ = (CheckConstraint("json_valid(document)", name="ck_content_section_document_json"),)

    section: Mapped[str] = mapped_column(Text, primary_key=True)
    document: Mapped[str] = mapped_column(Text, nullable=False)
    # sha256 of `document`: the section's ETag.
    etag: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class AdminSessionRow(Base):
    """A signed-in admin browser. The cookie holds the token; only its sha256 is stored."""

    __tablename__ = "admin_session"

    token_hash: Mapped[str] = mapped_column(Text, primary_key=True)
    csrf_token: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[str] = mapped_column(Text, nullable=False, index=True)
