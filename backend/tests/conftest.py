"""
Integration test configuration with transaction rollback.
Uses persistent test database with automatic cleanup via transaction rollback.
"""
import pytest
import asyncio
import os
import warnings
import sys
from httpx import AsyncClient
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Set testing environment variable to disable Weave during testing
os.environ["TESTING"] = "1"

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Filter out weave-related deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="weave.*")
warnings.filterwarnings("ignore", message=".*sentry_sdk.Hub.*")
warnings.filterwarnings("ignore", message=".*warn.*method.*deprecated.*")

def pytest_configure(config):
    warnings.filterwarnings("ignore", category=DeprecationWarning, module="weave")
    warnings.filterwarnings("ignore", message=".*sentry_sdk.Hub.*")
    warnings.filterwarnings("ignore", message=".*warn.*method.*deprecated.*")

from main import app
from services.database import get_session
from models.models import Task, FocusLevel, WeeklySummary, WeeklyStats, SummaryResponse
from sqlmodel import SQLModel
from config.database import get_database_config

def get_test_database_url():
    """Get test database URL by appending _test to the database name."""
    config = get_database_config()
    test_db_name = f"{config['database']}_test"
    return f"postgresql+asyncpg://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{test_db_name}"

# Create test engine
test_engine = create_async_engine(
    get_test_database_url(),
    echo=False,  # Set to True for SQL debugging
    connect_args={
        # turn off asyncpg's client-side cache
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
    pool_pre_ping=True
)

# Test session factory
TestSessionLocal = sessionmaker(
    test_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)


@pytest.fixture
async def test_db():
    """
    Provide a test database session with automatic transaction rollback.
    
    Each test gets a fresh database state:
    1. Starts a transaction
    2. Creates session bound to transaction
    3. Runs test with real database operations
    4. Rolls back transaction (undoes all changes)
    5. Next test starts with empty database
    """
    # Create connection and start transaction
    async with test_engine.connect() as connection:
        # Start transaction
        transaction = await connection.begin()
        
        # Create session bound to this transaction
        session = AsyncSession(bind=connection, expire_on_commit=False)
        
        # Override the dependency injection
        async def override_get_session():
            yield session
        
        app.dependency_overrides[get_session] = override_get_session
        
        try:
            # Yield session to the test
            yield session
        finally:
            # Cleanup: close session and rollback transaction
            await session.close()
            await transaction.rollback()
            
            # Clear dependency overrides
            app.dependency_overrides.clear()

@pytest.fixture
async def test_client(test_db):
    """
    Provide HTTP client for testing API endpoints.
    
    This client will use the test database session via dependency injection.
    All API calls go through the real FastAPI app with real database operations,
    but everything gets rolled back after the test.
    """
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client

@pytest.fixture
async def sample_tasks(test_db):
    """Create sample tasks in the test database."""
    from datetime import date
    
    tasks = [
        Task(
            name="Complete project documentation",
            time_spent=2.0,
            focus_level=FocusLevel.high,
            date_worked=date.today()
        ),
        Task(
            name="Team standup meeting", 
            time_spent=0.5,
            focus_level=FocusLevel.medium,
            date_worked=date.today()
        ),
        Task(
            name="Code review and testing",
            time_spent=1.5, 
            focus_level=FocusLevel.high,
            date_worked=date.today()
        )
    ]
    
    # Add to database
    for task in tasks:
        test_db.add(task)
    
    await test_db.commit()
    
    # Refresh to get IDs
    for task in tasks:
        await test_db.refresh(task)
    
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

# Legacy fixtures from backend/conftest.py - kept for backward compatibility
@pytest.fixture
def sample_tasks_legacy():
    """Create sample tasks for testing (legacy version with static data)."""
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

@pytest.fixture(scope="function")
async def test_db_session():
    """Create completely isolated test database session for each test."""
    import time
    config = get_database_config()
    test_db_name = f"test_isolated_{int(time.time() * 1000000)}"
    
    # Create test database
    from sqlalchemy import create_engine, text
    admin_url = f"postgresql+psycopg2://{config['user']}:{config['password']}@{config['host']}:{config['port']}/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    
    try:
        with admin_engine.connect() as conn:
            conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
            conn.execute(text(f"CREATE DATABASE {test_db_name}"))
    finally:
        admin_engine.dispose()
    
    # Install pgvector extension
    test_admin_url = f"postgresql+psycopg2://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{test_db_name}"
    test_admin_engine = create_engine(test_admin_url)
    try:
        with test_admin_engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    finally:
        test_admin_engine.dispose()
    
    # Create async engine for test database
    test_url = f"postgresql+asyncpg://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{test_db_name}"
    engine = create_async_engine(test_url, echo=False)
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        
        # Create session
        async_session_maker = sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        
        async with async_session_maker() as session:
            yield session
            
    finally:
        await engine.dispose()
        
        # Drop test database
        admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        try:
            with admin_engine.connect() as conn:
                conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
        finally:
            admin_engine.dispose()