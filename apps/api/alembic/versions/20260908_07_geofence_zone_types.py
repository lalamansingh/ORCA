"""Add canonical maritime geofence zone types.

Revision ID: 20260908_07
Revises: 20260908_06
"""
from alembic import op

revision="20260908_07";down_revision="20260908_06";branch_labels=None;depends_on=None
VALUES=("TERRITORIAL_SEA","CONTIGUOUS_ZONE","FISHING_RESTRICTION","PORT_RESTRICTED_ZONE","MILITARY_RESTRICTED_ZONE","TEMPORARY_RESTRICTION")
def upgrade():
    for value in VALUES:op.execute(f"ALTER TYPE zone_type ADD VALUE IF NOT EXISTS '{value}'")
def downgrade():
    # PostgreSQL enum values cannot be safely removed while rows may reference them.
    pass
