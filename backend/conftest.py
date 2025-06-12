"""
Test configuration for integration tests.
Sets up test database and fixtures.
"""
import pytest
import asyncio
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

from main import app
from services.database import get_session
from models.models import Task, WeeklySummary
from sqlmodel import SQLModel
from config.database import get_database_config

# Test database configuration
def get_test_database_url():
    """Get test database URL."""
    config = get_database_config()
    test_db_name = f"{config['database']}_test"
    return f"postgresql+asyncpg://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{test_db_name}"

def get_test_database_url_sync():
    """Get sync test database URL for setup/teardown."""
    config = get_database_config()
    test_db_name = f"{config['database']}_test"
    return f"postgresql+psycopg2://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{test_db_name}"

# Test engine and session
test_engine = None
TestSessionLocal = None

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Set up test database before all tests."""
    global test_engine, TestSessionLocal
    
    # Create test database
    config = get_database_config()
    admin_url = f"postgresql+psycopg2://{config['user']}:{config['password']}@{config['host']}:{config['port']}/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    
    test_db_name = f"{config['database']}_test"
    
    # Drop and recreate test database
    with admin_engine.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
        conn.execute(text(f"CREATE DATABASE {test_db_name}"))
    
    admin_engine.dispose()
    
    # Set up test engine
    test_engine = create_async_engine(get_test_database_url())
    TestSessionLocal = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    yield
    
    # Cleanup
    if test_engine:
        test_engine.sync_engine.dispose()

@pytest.fixture
async def test_db():
    """Provide a test database session with transaction rollback."""
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Start transaction
    async with test_engine.connect() as connection:
        transaction = await connection.begin()
        
        # Create session bound to transaction
        async_session = AsyncSession(bind=connection, expire_on_commit=False)
        
        # Override dependency
        async def override_get_session():
            yield async_session
        
        app.dependency_overrides[get_session] = override_get_session
        
        try:
            yield async_session
        finally:
            await async_session.close()
            await transaction.rollback()
            app.dependency_overrides.clear()

@pytest.fixture
async def test_client(test_db):
    """Provide test client with database dependency override."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def sync_test_client():
    """Provide synchronous test client for simple tests."""
    return TestClient(app)