"""
Test configuration for integration tests.
Sets up test database and fixtures.
"""
import pytest
import os

os.environ["TESTING"] = "1" # Disable Weave during testing

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from models.models import Task, WeeklySummary, FocusLevel, WeeklyStats, SummaryResponse
from sqlmodel import SQLModel
from config.database import get_database_config

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
            admin_engine.dispose()
        finally:
            pass