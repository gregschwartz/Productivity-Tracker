"""
Test configuration for integration tests.
Sets up test database and fixtures.
"""
import pytest
import asyncio
import os
os.environ["TESTING"] = "1" # Disable Weave during testing

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

from main import app
from services.database import get_session
from models.models import Task, WeeklySummary, FocusLevel, WeeklyStats, SummaryResponse
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
    
    # Install pgvector extension in test database
    test_admin_url = f"postgresql+psycopg2://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{test_db_name}"
    test_admin_engine = create_engine(test_admin_url)
    with test_admin_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    test_admin_engine.dispose()
    
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
    """Provide a test database session with proper isolation."""
    global test_engine
    
    # Recreate test database completely
    config = get_database_config()
    admin_url = f"postgresql+psycopg2://{config['user']}:{config['password']}@{config['host']}:{config['port']}/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    test_db_name = f"{config['database']}_test"
    
    # Force drop and recreate test database
    with admin_engine.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
        conn.execute(text(f"CREATE DATABASE {test_db_name}"))
    admin_engine.dispose()
    
    # Install pgvector extension in test database
    test_admin_url = f"postgresql+psycopg2://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{test_db_name}"
    test_admin_engine = create_engine(test_admin_url)
    with test_admin_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    test_admin_engine.dispose()
    
    # Create fresh test engine
    test_engine = create_async_engine(get_test_database_url())
    
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Create session factory
    TestSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    # Override the get_session dependency
    async def override_get_session():
        async with TestSessionLocal() as session:
            yield session
    
    app.dependency_overrides[get_session] = override_get_session
    
    try:
        # Return a session for direct test use
        async with TestSessionLocal() as session:
            yield session
    finally:
        app.dependency_overrides.clear()
        await test_engine.dispose()

@pytest.fixture  
async def test_client(test_db):
    """Provide test client with database dependency override."""
    from httpx import AsyncClient, ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture(autouse=True)
def clear_db_before_and_after_test():
    """Clear database before and after each test."""
    # Clear before test
    if test_engine:
        import asyncio
        asyncio.run(_clear_tables())
    
    yield
    
    # Clear after test  
    if test_engine:
        import asyncio
        asyncio.run(_clear_tables())

async def _clear_tables():
    """Helper to clear database tables."""
    try:
        from sqlmodel import delete
        async with test_engine.connect() as conn:
            await conn.execute(delete(Task))
            await conn.execute(delete(WeeklySummary))
            await conn.commit()
    except Exception:
        # Tables don't exist yet, ignore
        pass

@pytest.fixture
def sync_test_client():
    """Provide synchronous test client for simple tests."""
    return TestClient(app)

@pytest.fixture
def sample_tasks():
    """Create sample tasks for testing."""
    from datetime import date
    tasks = [
        Task(
            id=1,
            name="Sample Task 1", 
            time_spent=2.0,
            focus_level=FocusLevel.high,
            date_worked=date(2024, 3, 5)
        ),
        Task(
            id=2,
            name="Sample Task 2",
            time_spent=1.5,
            focus_level=FocusLevel.medium,
            date_worked=date(2024, 3, 6)
        )
    ]
    return tasks

@pytest.fixture
def sample_weekly_stats():
    """Create sample weekly stats for testing."""
    return WeeklyStats(
        total_tasks=3,
        total_hours="4.0", 
        avg_focus=FocusLevel.high
    )

@pytest.fixture  
def sample_summary_response():
    """Create sample AI summary response for testing."""
    return SummaryResponse(
        summary="Great week with high focus!",
        recommendations=["Keep your focus by touching grass."]
    )