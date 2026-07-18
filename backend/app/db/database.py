from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event

from ..config import settings


def _get_engine_url():
    url = settings.database_url
    if "postgresql" in url and "asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    return url


engine_url = _get_engine_url()
is_sqlite = "sqlite" in engine_url

engine = create_async_engine(engine_url, echo=settings.debug)

if is_sqlite:
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
