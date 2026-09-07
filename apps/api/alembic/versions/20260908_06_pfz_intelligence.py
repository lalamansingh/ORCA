"""Add normalized PFZ intelligence fields and general geometry support.

Revision ID: 20260908_06
Revises: 20260908_05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260908_06"
down_revision = "20260908_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM("CURRENT", "STALE", "EXPIRED", "DEMO", "UPCOMING", name="pfz_status").create(bind, checkfirst=True)
    op.add_column("potential_fishing_zones", sa.Column("provider", sa.String(length=100), nullable=True))
    op.add_column("potential_fishing_zones", sa.Column("source_url", sa.String(length=2048), nullable=True))
    op.add_column("potential_fishing_zones", sa.Column("sector", sa.String(length=255), nullable=True))
    op.add_column("potential_fishing_zones", sa.Column("status", postgresql.ENUM("CURRENT", "STALE", "EXPIRED", "DEMO", "UPCOMING", name="pfz_status", create_type=False), nullable=True))
    op.add_column("potential_fishing_zones", sa.Column("retrieved_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE potential_fishing_zones SET provider = 'ORCA Demo PFZ', status = 'DEMO', retrieved_at = COALESCE(created_at, NOW()), external_id = COALESCE(external_id, 'legacy-' || id::text)")
    op.alter_column("potential_fishing_zones", "provider", nullable=False)
    op.alter_column("potential_fishing_zones", "external_id", nullable=False)
    op.execute("ALTER TABLE potential_fishing_zones ALTER COLUMN geometry TYPE geometry(GEOMETRY,4326) USING ST_SetSRID(geometry, 4326)")
    op.create_index("ix_potential_fishing_zones_provider", "potential_fishing_zones", ["provider"])
    op.create_index("ix_potential_fishing_zones_sector", "potential_fishing_zones", ["sector"])
    op.create_index("ix_potential_fishing_zones_status", "potential_fishing_zones", ["status"])
    op.create_index("ix_potential_fishing_zones_retrieved_at", "potential_fishing_zones", ["retrieved_at"])
    op.create_index("uq_pfz_provider_external_id", "potential_fishing_zones", ["provider", "external_id"], unique=True)


def downgrade() -> None:
    for name in ("uq_pfz_provider_external_id", "ix_potential_fishing_zones_retrieved_at", "ix_potential_fishing_zones_status", "ix_potential_fishing_zones_sector", "ix_potential_fishing_zones_provider"):
        op.drop_index(name, table_name="potential_fishing_zones")
    op.drop_column("potential_fishing_zones", "retrieved_at")
    op.drop_column("potential_fishing_zones", "status")
    op.drop_column("potential_fishing_zones", "sector")
    op.drop_column("potential_fishing_zones", "source_url")
    op.drop_column("potential_fishing_zones", "provider")
    postgresql.ENUM(name="pfz_status").drop(op.get_bind(), checkfirst=True)
