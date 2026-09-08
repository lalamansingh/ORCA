from logging.config import fileConfig
import asyncio
from alembic import context
from sqlalchemy.engine import Connection
from app.db.session import create_database_engine
from app.core.config import get_settings
from app.db.base import Base
import app.db.models  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
config.set_main_option("sqlalchemy.url", get_settings().database_url.replace("%", "%%"))
target_metadata = Base.metadata


def include_object(object_, name: str | None, type_: str, reflected: bool, compare_to: object | None) -> bool:
    """Ignore PostGIS-owned tables while still checking every ORCA model table."""
    if type_ == "table" and reflected and compare_to is None:
        return bool(name and name in target_metadata.tables)
    return True

def run_migrations_offline() -> None:
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"}, include_object=include_object)
    with context.begin_transaction(): context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True, compare_server_default=True, include_object=include_object)
    with context.begin_transaction(): context.run_migrations()

async def run_migrations_online() -> None:
    settings = get_settings()
    connectable = create_database_engine(settings.database_url, settings)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode(): run_migrations_offline()
else: asyncio.run(run_migrations_online())
