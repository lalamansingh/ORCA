"""Align existing alert validity indexes with ORM metadata.

Revision ID: 20260908_05
Revises: 20260907_04
"""

from alembic import op
import sqlalchemy as sa

revision = "20260908_05"
down_revision = "20260907_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pfz_validity ON potential_fishing_zones (valid_from, valid_until)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_alert_validity ON marine_alerts (valid_from, valid_until)"))


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS ix_alert_validity"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_pfz_validity"))
