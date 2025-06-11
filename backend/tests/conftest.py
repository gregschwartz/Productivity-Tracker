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
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

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
from models.models import Base, Task, FocusLevel
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
    pool_pre_ping=True
)

# Test session factory
TestSessionLocal = sessionmaker(
    test_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

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
    async with AsyncClient(app=app, base_url="http://testserver") as client:
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