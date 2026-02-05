"""
Database Configuration and Session Management
Using SQLAlchemy async for PostgreSQL
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    future=True,
    pool_size=5,
    max_overflow=10,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for all models
Base = declarative_base()


async def get_db():
    """
    Dependency that provides a database session.
    Yields a session that automatically closes after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database - create all tables.
    Called during application startup.
    """
    async with engine.begin() as conn:
        # Import all models here to ensure they're registered with Base
        from app.models import user  # noqa: F401
        
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections.
    Called during application shutdown.
    """
    await engine.dispose()
