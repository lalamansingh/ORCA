"""Expand the marine safety alert persistence model.

Revision ID: 20260907_03
Revises: 20260907_02
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260907_03"
down_revision = "20260907_02"
branch_labels = None
depends_on = None

ALERT_TYPES = ("CYCLONE", "STORM_SURGE", "HIGH_WAVES", "SWELL_SURGE", "STRONG_WIND", "LIGHTNING", "HEAVY_RAIN", "LOW_VISIBILITY", "TSUNAMI", "MARINE_HEAT_WAVE", "OTHER")
SEVERITIES = ("INFO", "WATCH", "WARNING", "SEVERE", "CRITICAL")


def _enum(name: str, values: tuple[str, ...]) -> postgresql.ENUM:
    return postgresql.ENUM(*values, name=name, create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    with op.get_context().autocommit_block():
        for enum_name in ("alert_type", "subscription_alert_type"):
            for value in ALERT_TYPES:
                op.execute(sa.text(f"ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{value}'"))

    for name, values in (
        ("alert_severity", SEVERITIES),
        ("subscription_alert_severity", SEVERITIES),
        ("alert_status", ("ACTIVE", "UPCOMING", "EXPIRED", "CANCELLED", "UNKNOWN")),
        ("alert_source_type", ("OFFICIAL_ADVISORY", "FORECAST_RISK", "INTERNAL_RULE", "DEMO")),
    ):
        postgresql.ENUM(*values, name=name).create(bind, checkfirst=True)

    columns = {column["name"]: column for column in inspector.get_columns("marine_alerts")}
    op.execute(sa.text("UPDATE marine_alerts SET alert_type = 'OTHER' WHERE alert_type::text = 'GEOFENCE'"))
    op.execute(sa.text("UPDATE alert_subscriptions SET alert_type = 'OTHER' WHERE alert_type::text = 'GEOFENCE'"))
    if getattr(columns["severity"]["type"], "name", None) != "alert_severity":
        op.alter_column("marine_alerts", "severity", type_=_enum("alert_severity", SEVERITIES), postgresql_using="CASE severity::text WHEN 'LOW' THEN 'INFO' WHEN 'MODERATE' THEN 'WATCH' WHEN 'HIGH' THEN 'WARNING' ELSE 'CRITICAL' END::alert_severity")

    additions = {
        "status": sa.Column("status", _enum("alert_status", ("ACTIVE", "UPCOMING", "EXPIRED", "CANCELLED", "UNKNOWN")), nullable=False, server_default="UNKNOWN"),
        "source_type": sa.Column("source_type", _enum("alert_source_type", ("OFFICIAL_ADVISORY", "FORECAST_RISK", "INTERNAL_RULE", "DEMO")), nullable=False, server_default="OFFICIAL_ADVISORY"),
        "summary": sa.Column("summary", sa.String(1000)),
        "affected_area": sa.Column("affected_area", sa.String(1000)),
        "latitude": sa.Column("latitude", sa.Float()),
        "longitude": sa.Column("longitude", sa.Float()),
        "radius_km": sa.Column("radius_km", sa.Float()),
        "forecast_track": sa.Column("forecast_track", sa.Text()),
        "forecast_points": sa.Column("forecast_points", postgresql.JSONB()),
        "provider": sa.Column("provider", sa.String(100), nullable=False, server_default="LEGACY"),
        "instructions": sa.Column("instructions", postgresql.JSONB()),
        "issued_at": sa.Column("issued_at", sa.DateTime(timezone=True)),
    }
    for name, column in additions.items():
        if name not in columns:
            if name == "forecast_track":
                op.execute("ALTER TABLE marine_alerts ADD COLUMN forecast_track geometry(LINESTRING,4326)")
            else:
                op.add_column("marine_alerts", column)
    op.execute(sa.text("UPDATE marine_alerts SET source_type = 'DEMO', provider = 'ORCA Demo Alerts' WHERE source = 'ORCA development fixture'"))
    op.execute(sa.text("UPDATE marine_alerts SET external_id = 'legacy-' || id::text WHERE external_id IS NULL"))
    op.alter_column("marine_alerts", "external_id", existing_type=sa.String(255), nullable=False)

    indexes = {index["name"] for index in inspector.get_indexes("marine_alerts")}
    for name, fields, unique in (
        ("ix_marine_alerts_severity", ["severity"], False),
        ("ix_marine_alerts_status", ["status"], False),
        ("ix_marine_alerts_source_type", ["source_type"], False),
        ("ix_marine_alerts_provider", ["provider"], False),
        ("ix_marine_alerts_issued_at", ["issued_at"], False),
        ("uq_marine_alert_provider_external_id", ["provider", "external_id"], True),
    ):
        if name not in indexes:
            op.create_index(name, "marine_alerts", fields, unique=unique)

    subscription_columns = {column["name"]: column for column in inspector.get_columns("alert_subscriptions")}
    if getattr(subscription_columns["minimum_severity"]["type"], "name", None) != "subscription_alert_severity":
        op.alter_column("alert_subscriptions", "minimum_severity", type_=_enum("subscription_alert_severity", SEVERITIES), postgresql_using="CASE minimum_severity::text WHEN 'LOW' THEN 'INFO' WHEN 'MODERATE' THEN 'WATCH' WHEN 'HIGH' THEN 'WARNING' ELSE 'CRITICAL' END::subscription_alert_severity")


def downgrade() -> None:
    raise RuntimeError("Step 7 stores alert history; destructive downgrade is intentionally disabled.")
