"""Initial ORCA PostgreSQL/PostGIS schema.

Revision ID: 20260907_01
Revises:
"""
from alembic import op

revision = "20260907_01"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    from app.db.base import Base
    import app.db.models  # noqa: F401
    # Keep table creation under Alembic operations; the application never calls create_all.
    for table in Base.metadata.sorted_tables:
        op.create_table(table.name, *[column.copy() for column in table.columns], *table.constraints)

def downgrade() -> None:
    from app.db.base import Base
    import app.db.models  # noqa: F401
    for table in reversed(Base.metadata.sorted_tables):
        op.drop_table(table.name)
