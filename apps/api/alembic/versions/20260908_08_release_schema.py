"""Complete release schema constraints and spatial index.
Revision ID: 20260908_08
Revises: 20260908_07
"""
from alembic import op
import sqlalchemy as sa
revision = "20260908_08"
down_revision = "20260908_07"
branch_labels = None
depends_on = None

def upgrade():
    op.execute("UPDATE potential_fishing_zones SET status = 'STALE' WHERE status IS NULL")
    op.alter_column("potential_fishing_zones", "status", nullable=False)
    op.execute("CREATE INDEX IF NOT EXISTS idx_marine_alerts_forecast_track ON marine_alerts USING gist (forecast_track)")

def downgrade():
    op.alter_column("potential_fishing_zones", "status", nullable=True)
    op.execute("DROP INDEX IF EXISTS idx_marine_alerts_forecast_track")
