"""content drafts

A section's unpublished edit, one row per section, which preview renders and publishing deletes.

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-02 14:35:40.381812
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "content_draft",
        sa.Column("section", sa.Text(), nullable=False),
        sa.Column("document", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.Text(), nullable=False),
        sa.CheckConstraint("json_valid(document)", name="ck_content_draft_document_json"),
        sa.PrimaryKeyConstraint("section"),
    )


def downgrade() -> None:
    op.drop_table("content_draft")
