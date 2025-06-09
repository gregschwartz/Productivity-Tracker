"""
Database session management and engine configuration.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from typing import AsyncGenerator
# SQLModel might be needed if any base metadata operations were here, but typically not for just session/engine.
# from sqlmodel import SQLModel

from config.database import ASYNC_DATABASE_URL as DATABASE_URL

# Database engine, echo=False for cleaner logs in production/testing unless debugging SQL
engine = create_async_engine(DATABASE_URL, echo=False)

# ==========================================
# DATABASE SESSION
# ==========================================
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an asynchronous database session with proper connection management.
    This is a dependency that can be injected into router operations.
    
    Usage in FastAPI endpoints:
    async def my_endpoint(db: AsyncSession = Depends(get_session)):
        # Use db here
    """
    async with AsyncSession(engine, expire_on_commit=False) as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# For backwards compatibility with existing code that might use the old pattern
async def create_session() -> AsyncSession:
    """
    Creates a session that must be manually managed.
    Use get_session() dependency injection instead when possible.
    """
    return AsyncSession(engine, expire_on_commit=False)

# Any other database-wide configurations or initial SQLModel metadata setup
# (e.g., SQLModel.metadata.create_all(engine)) would typically be run once at application startup
# (e.g., in main.py or an Alembic migration script for async environments)
# rather than being part of a session utility function.
# For this refactoring, only engine and get_session remain here.
