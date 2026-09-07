"""Add ORCA credential and refresh-session persistence.

Revision ID: 20260907_02
Revises: 20260907_01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260907_02"
down_revision = "20260907_01"
branch_labels = None
depends_on = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "password_hash" not in user_columns:
        op.add_column("users", sa.Column("password_hash", sa.String(length=512), nullable=True))
    if "last_login_at" not in user_columns:
        op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    if "refresh_token_sessions" not in inspector.get_table_names():
        op.create_table(
            "refresh_token_sessions",
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("jti", sa.String(length=64), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True)),
            sa.Column("last_used_at", sa.DateTime(timezone=True)),
            sa.Column("user_agent", sa.String(length=512)),
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.UniqueConstraint("jti", name="uq_refresh_token_sessions_jti"),
        )
        op.create_index("ix_refresh_token_sessions_user_id", "refresh_token_sessions", ["user_id"])
        op.create_index("ix_refresh_token_sessions_expires_at", "refresh_token_sessions", ["expires_at"])
        op.create_index("ix_refresh_token_sessions_revoked_at", "refresh_token_sessions", ["revoked_at"])

def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "refresh_token_sessions" in inspector.get_table_names(): op.drop_table("refresh_token_sessions")
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "last_login_at" in user_columns: op.drop_column("users", "last_login_at")
    if "password_hash" in user_columns: op.drop_column("users", "password_hash")
