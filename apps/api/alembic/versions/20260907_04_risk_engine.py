"""Add explicitly saved deterministic risk assessments.

Revision ID: 20260907_04
Revises: 20260907_03
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260907_04"
down_revision = "20260907_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM("LOW", "MODERATE", "HIGH", "EXTREME", "UNAVAILABLE", name="marine_risk_level").create(bind, checkfirst=True)
    postgresql.ENUM("EXCELLENT", "GOOD", "LIMITED", "POOR", "INSUFFICIENT", name="risk_data_quality").create(bind, checkfirst=True)
    postgresql.ENUM("LIVE", "DEMO", "MIXED", "UNAVAILABLE", name="risk_provenance_mode").create(bind, checkfirst=True)
    op.create_table(
        "risk_assessment_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("assessment_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("score", sa.Integer()),
        sa.Column("level", postgresql.ENUM("LOW", "MODERATE", "HIGH", "EXTREME", "UNAVAILABLE", name="marine_risk_level", create_type=False), nullable=False),
        sa.Column("risk_model_version", sa.String(64), nullable=False),
        sa.Column("data_quality", postgresql.ENUM("EXCELLENT", "GOOD", "LIMITED", "POOR", "INSUFFICIENT", name="risk_data_quality", create_type=False), nullable=False),
        sa.Column("provenance_mode", postgresql.ENUM("LIVE", "DEMO", "MIXED", "UNAVAILABLE", name="risk_provenance_mode", create_type=False), nullable=False),
        sa.Column("factors", postgresql.JSONB(), nullable=False),
        sa.Column("evidence", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90", name="risk_assessment_latitude_range"),
        sa.CheckConstraint("longitude BETWEEN -180 AND 180", name="risk_assessment_longitude_range"),
        sa.CheckConstraint("score IS NULL OR score BETWEEN 0 AND 100", name="risk_assessment_score_range"),
    )
    op.create_index("ix_risk_assessment_records_user_id", "risk_assessment_records", ["user_id"])
    op.create_index("ix_risk_assessment_records_assessment_time", "risk_assessment_records", ["assessment_time"])
    op.create_index("ix_risk_assessment_user_created", "risk_assessment_records", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_risk_assessment_user_created", table_name="risk_assessment_records")
    op.drop_table("risk_assessment_records")
    for name in ("risk_provenance_mode", "risk_data_quality", "marine_risk_level"):
        postgresql.ENUM(name=name).drop(op.get_bind(), checkfirst=True)
