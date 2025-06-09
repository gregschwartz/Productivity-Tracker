"""
Database session management and engine configuration.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# SQLModel might be needed if any base metadata operations were here, but typically not for just session/engine.
# from sqlmodel import SQLModel

from config.database import ASYNC_DATABASE_URL as DATABASE_URL

# Database engine, echo=False for cleaner logs in production/testing unless debugging SQL
engine = create_async_engine(DATABASE_URL, echo=False)

# ==========================================
# DATABASE SESSION
# ==========================================
async def get_session() -> AsyncSession:
    """
    Provides an asynchronous database session.
    This is a dependency that can be injected into router operations.
    """
    # The AsyncSession is typically used in a context manager pattern within endpoint functions
    # or service methods that need database access.
    # Example usage in an endpoint:
    # async with get_session() as session:
    #     # use session for db operations
    #     await session.commit()
    # However, the original get_session was returning the session directly,
    # and the actual context management (async with) was done in each CRUD function.
    # To maintain that pattern for now if preferred by the calling code:
    # return AsyncSession(engine)
    #
    # A more common pattern for FastAPI dependency injection is to yield a session:
    # async def get_session_dependency():
    #     async with AsyncSession(engine) as session:
    #         try:
    #             yield session
    #             await session.commit() # Optional: commit at the end of request if all good
    #         except:
    #             await session.rollback()
    #             raise
    #         finally:
    #             await session.close()
    # For now, sticking to the simpler return, assuming calling code handles context.
    # The original functions used `async with get_session() as session:`, which means
    # get_session() itself should not be a context manager but return a session factory or instance.
    # `AsyncSession(engine)` creates a new session instance.
    return AsyncSession(engine, expire_on_commit=False) # expire_on_commit=False is often useful

# Any other database-wide configurations or initial SQLModel metadata setup
# (e.g., SQLModel.metadata.create_all(engine)) would typically be run once at application startup
# (e.g., in main.py or an Alembic migration script for async environments)
# rather than being part of a session utility function.
# For this refactoring, only engine and get_session remain here.
