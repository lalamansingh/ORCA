"""Persist conversational message timestamps on fresh and existing databases.
Revision ID: 20260908_09
Revises: 20260908_08
"""
from alembic import op
import sqlalchemy as sa
revision = "20260908_09"
down_revision = "20260908_08"
branch_labels = None
depends_on = None

def upgrade():
    op.alter_column("messages", "created_at", server_default=sa.func.now())
    for name in ("status", "source_type", "provider"):
        op.alter_column("marine_alerts", name, server_default=None)

def downgrade():
    op.alter_column("messages", "created_at", server_default=None)
