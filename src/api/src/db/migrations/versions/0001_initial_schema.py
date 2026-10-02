"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-10-02 12:23:52.906787
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "admin_session",
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("csrf_token", sa.Text(), nullable=False),
        sa.Column("created_at", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("token_hash"),
    )
    with op.batch_alter_table("admin_session", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_admin_session_expires_at"), ["expires_at"], unique=False)

    op.create_table(
        "content_section",
        sa.Column("section", sa.Text(), nullable=False),
        sa.Column("document", sa.Text(), nullable=False),
        sa.Column("etag", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.Text(), nullable=False),
        sa.CheckConstraint("json_valid(document)", name="ck_content_section_document_json"),
        sa.PrimaryKeyConstraint("section"),
    )


def downgrade() -> None:
    op.drop_table("content_section")
    with op.batch_alter_table("admin_session", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_admin_session_expires_at"))

    op.drop_table("admin_session")
