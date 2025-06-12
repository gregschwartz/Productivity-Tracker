"""
Integration tests for TaskService - tests with real database, no mocking.
These tests verify that the TaskService correctly interacts with the database
and handles all CRUD operations, pagination, filtering, and statistics.
"""
import pytest
from datetime import date, datetime, timedelta
from typing import List
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from services.task_service import TaskService, get_local_today
from models.models import Task, FocusLevel, WeeklySummary  # Import all models to register them
from config.database import get_database_config


class TestTaskService:
    """Test TaskService with real database integration."""

    @pytest.fixture
    def task_service(self):
        """Create a TaskService instance."""
        return TaskService()

    @pytest.fixture
    def sample_tasks_data(self):
        """Sample task data for testing."""
        today = get_local_today()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)
        
        return [
            Task(
                name="Morning workout",
                time_spent=1.5,
                focus_level=FocusLevel.high,
                date_worked=today
            ),
            Task(
                name="Code review session",
                time_spent=2.0,
                focus_level=FocusLevel.high,
                date_worked=today
            ),
            Task(
                name="Team meeting",
                time_spent=0.5,
                focus_level=FocusLevel.medium,
                date_worked=yesterday
            ),
            Task(
                name="Email processing",
                time_spent=0.25,
                focus_level=FocusLevel.low,
                date_worked=yesterday
            ),
            Task(
                name="Project planning",
                time_spent=3.0,
                focus_level=FocusLevel.high,
                date_worked=two_days_ago
            ),
        ]

    # Create Task Tests
    @pytest.mark.asyncio
    async def test_create_task_success(self, task_service, test_db_session):
        """Test creating a task successfully."""
        
        task_data = Task(
            name="Test task creation",
            time_spent=1.0,
            focus_level=FocusLevel.medium,
            date_worked=get_local_today()
        )
        
        async for session in test_db_session:
            break
        created_task = await task_service.create_task(session, task_data)
        
        assert created_task.id is not None
        assert created_task.name == "Test task creation"
        assert created_task.time_spent == 1.0
        assert created_task.focus_level == FocusLevel.medium
        assert created_task.date_worked == get_local_today()
        assert created_task.created_at is not None
        assert created_task.updated_at is not None

    @pytest.mark.asyncio
    async def test_create_task_with_string_date(self, task_service, test_db_session):
        """Test creating a task with string date that gets converted."""
            
        task_data = Task(
            name="Task with string date",
            time_spent=2.5,
            focus_level=FocusLevel.high,
            date_worked="2024-03-15"  # String date
        )
        
        async for session in test_db_session:
            break
        created_task = await task_service.create_task(session, task_data)
        
        assert created_task.id is not None
        assert created_task.name == "Task with string date"
        assert created_task.date_worked == date(2024, 3, 15)

    @pytest.mark.asyncio
    async def test_create_task_excludes_auto_fields(self, task_service, test_db_session):
        """Test that auto-generated fields are properly excluded."""
        async for session in test_db_session:
            break
            
        # Try to set ID and timestamps (should be ignored)
        task_data = Task(
            id=999,  # Should be ignored
            name="Test exclusion",
            time_spent=1.0,
            focus_level=FocusLevel.low,
            date_worked=get_local_today(),
            created_at=datetime(2020, 1, 1),  # Should be ignored
            updated_at=datetime(2020, 1, 1)   # Should be ignored
        )
        
        created_task = await task_service.create_task(session, task_data)
        
        assert created_task.id != 999  # Database assigned ID
        assert created_task.created_at.year == datetime.now().year  # Current timestamp
        assert created_task.updated_at.year == datetime.now().year  # Current timestamp

    # Get Tasks Tests
    @pytest.mark.asyncio
    async def test_get_tasks_no_filters(self, task_service, test_db_session, sample_tasks_data):
        """Test getting tasks without any filters."""
        async for session in test_db_session:
            break
            
        # Create sample tasks
        created_tasks = []
        for task_data in sample_tasks_data:
            created_task = await task_service.create_task(session, task_data)
            created_tasks.append(created_task)
        
        # Get all tasks
        tasks = await task_service.get_tasks(session)
        
        assert len(tasks) == 5
        # Should be ordered by date_worked desc (newest first)
        assert tasks[0].date_worked >= tasks[1].date_worked
        assert tasks[1].date_worked >= tasks[2].date_worked
        assert tasks[2].date_worked >= tasks[3].date_worked
        assert tasks[3].date_worked >= tasks[4].date_worked

    @pytest.mark.asyncio
    async def test_get_tasks_with_pagination(self, task_service, test_db_session, sample_tasks_data):
        """Test getting tasks with pagination."""
        async for session in test_db_session:
            break
            
        # Create sample tasks
        for task_data in sample_tasks_data:
            await task_service.create_task(session, task_data)
        
        # Test pagination
        first_page = await task_service.get_tasks(session, limit=2, offset=0)
        second_page = await task_service.get_tasks(session, limit=2, offset=2)
        
        assert len(first_page) == 2
        assert len(second_page) == 2

        # Check that all tasks are unique
        all_task_ids = [task.id for task in first_page + second_page]
        assert len(all_task_ids) == len(set(all_task_ids))

        # Check that the tasks are ordered by date_worked desc (newest first)
        assert first_page[0].date_worked >= first_page[1].date_worked
        assert first_page[1].date_worked >= second_page[0].date_worked
        assert second_page[0].date_worked >= second_page[1].date_worked

    @pytest.mark.asyncio
    async def test_get_tasks_with_date_filter(self, task_service, test_db_session, sample_tasks_data):
        """Test getting tasks filtered by date range."""
        async for session in test_db_session:
            break
            
        # Create sample tasks
        for task_data in sample_tasks_data:
            await task_service.create_task(session, task_data)
        
        today = get_local_today()
        yesterday = today - timedelta(days=1)
        
        # Get tasks for yesterday only (inclusive start and end)
        tasks = await task_service.get_tasks(
            session, 
            start_date=yesterday.isoformat(),
            end_date=yesterday.isoformat()
        )
        
        # Should only get yesterday's tasks (2 tasks)
        assert len(tasks) == 2
        for task in tasks:
            assert task.date_worked == yesterday

    @pytest.mark.asyncio
    async def test_get_tasks_date_filter_raises_error(self, task_service, test_db_session):
        """Test that date filter validation works correctly."""
        async for session in test_db_session:
            break
            
        # Should raise ValueError when only one date is provided
        with pytest.raises(ValueError, match="Both start_date and end_date must be provided together"):
            await task_service.get_tasks(session, start_date="2024-03-01")
            
        with pytest.raises(ValueError, match="Both start_date and end_date must be provided together"):
            await task_service.get_tasks(session, end_date="2024-03-01")

    # Get Tasks Count Tests
    @pytest.mark.asyncio
    async def test_get_tasks_count_no_filters(self, task_service, test_db_session, sample_tasks_data):
        """Test getting total count of tasks."""
        async for session in test_db_session:
            break
            
        # Create sample tasks
        for task_data in sample_tasks_data:
            await task_service.create_task(session, task_data)
        
        count = await task_service.get_tasks_count(session)
        assert count == 5

    @pytest.mark.asyncio
    async def test_get_tasks_count_with_date_filter(self, task_service, test_db_session, sample_tasks_data):
        """Test getting count of tasks filtered by date range."""
        async for session in test_db_session:
            break
            
        # Create sample tasks
        for task_data in sample_tasks_data:
            await task_service.create_task(session, task_data)
        
        today = get_local_today()
        tomorrow = today + timedelta(days=1)
        
        # Count today's tasks
        count = await task_service.get_tasks_count(
            session,
            start_date=today.isoformat(),
            end_date=tomorrow.isoformat()
        )
        
        assert count == 2  # Two tasks for today

    @pytest.mark.asyncio
    async def test_get_tasks_count_empty_database(self, task_service, test_db_session):
        """Test getting count when database is empty."""
        async for session in test_db_session:
            break
            
        count = await task_service.get_tasks_count(session)
        assert count == 0

    # Get Task by ID Tests
    @pytest.mark.asyncio
    async def test_get_task_by_id_success(self, task_service, test_db_session):
        """Test getting a task by ID successfully."""
        async for session in test_db_session:
            break
            
        # Create a task
        task_data = Task(
            name="Find me by ID",
            time_spent=1.0,
            focus_level=FocusLevel.medium,
            date_worked=get_local_today()
        )
        created_task = await task_service.create_task(session, task_data)
        
        # Retrieve by ID
        found_task = await task_service.get_task_by_id(session, created_task.id)
        
        assert found_task is not None
        assert found_task.id == created_task.id
        assert found_task.name == "Find me by ID"
        assert found_task.time_spent == 1.0

    @pytest.mark.asyncio
    async def test_get_task_by_id_not_found(self, task_service, test_db_session):
        """Test getting a task by non-existent ID."""
        async for session in test_db_session:
            break
            
        found_task = await task_service.get_task_by_id(session, 99999)
        assert found_task is None

    # Update Task Tests
    @pytest.mark.asyncio
    async def test_update_task_success(self, task_service, test_db_session):
        """Test updating a task successfully."""
        async for session in test_db_session:
            break
            
        # Create a task
        task_data = Task(
            name="Original task",
            time_spent=1.0,
            focus_level=FocusLevel.low,
            date_worked=get_local_today()
        )
        created_task = await task_service.create_task(session, task_data)
        
        # Update the task
        update_data = {
            "name": "Updated task",
            "time_spent": 2.5,
            "focus_level": FocusLevel.high
        }
        updated_task = await task_service.update_task(session, created_task.id, update_data)
        
        assert updated_task is not None
        assert updated_task.id == created_task.id
        assert updated_task.name == "Updated task"
        assert updated_task.time_spent == 2.5
        assert updated_task.focus_level == FocusLevel.high
        assert updated_task.date_worked == get_local_today()  # Unchanged

    @pytest.mark.asyncio
    async def test_update_task_partial_update(self, task_service, test_db_session):
        """Test updating only some fields of a task."""
        async for session in test_db_session:
            break
            
        # Create a task
        task_data = Task(
            name="Partial update test",
            time_spent=1.0,
            focus_level=FocusLevel.medium,
            date_worked=get_local_today()
        )
        created_task = await task_service.create_task(session, task_data)
        
        # Update only the name
        update_data = {"name": "New name only"}
        updated_task = await task_service.update_task(session, created_task.id, update_data)
        
        assert updated_task.name == "New name only"
        assert updated_task.time_spent == 1.0  # Unchanged
        assert updated_task.focus_level == FocusLevel.medium  # Unchanged

    @pytest.mark.asyncio
    async def test_update_task_not_found(self, task_service, test_db_session):
        """Test updating a non-existent task."""
        async for session in test_db_session:
            break
            
        update_data = {"name": "Updated name"}
        updated_task = await task_service.update_task(session, 99999, update_data)
        
        assert updated_task is None

    @pytest.mark.asyncio
    async def test_update_task_invalid_fields(self, task_service, test_db_session):
        """Test updating with invalid field names (should be ignored)."""
        async for session in test_db_session:
            break
            
        # Create a task
        task_data = Task(
            name="Invalid field test",
            time_spent=1.0,
            focus_level=FocusLevel.medium,
            date_worked=get_local_today()
        )
        created_task = await task_service.create_task(session, task_data)
        
        # Try to update with invalid field
        update_data = {
            "name": "Valid update",
            "invalid_field": "Should be ignored"
        }
        updated_task = await task_service.update_task(session, created_task.id, update_data)
        
        assert updated_task.name == "Valid update"
        assert not hasattr(updated_task, "invalid_field")

    # Delete Task Tests
    @pytest.mark.asyncio
    async def test_delete_task_success(self, task_service, test_db_session):
        """Test deleting a task successfully."""
        async for session in test_db_session:
            break
            
        # Create a task
        task_data = Task(
            name="Delete me",
            time_spent=1.0,
            focus_level=FocusLevel.medium,
            date_worked=get_local_today()
        )
        created_task = await task_service.create_task(session, task_data)
        
        # Delete the task
        deleted = await task_service.delete_task(session, created_task.id)
        assert deleted is True
        
        # Verify task is gone
        found_task = await task_service.get_task_by_id(session, created_task.id)
        assert found_task is None

    @pytest.mark.asyncio
    async def test_delete_task_not_found(self, task_service, test_db_session):
        """Test deleting a non-existent task."""
        async for session in test_db_session:
            break
            
        deleted = await task_service.delete_task(session, 99999)
        assert deleted is False

    # Count of Tasks Tests
    @pytest.mark.asyncio
    async def test_get_count_of_tasks(self, task_service, test_db_session, sample_tasks_data):
        """Test getting total count of all tasks."""
        async for session in test_db_session:
            break
            
        # Initially should be 0
        count = await task_service.get_count_of_tasks(session)
        assert count == 0
        
        # Create sample tasks
        for task_data in sample_tasks_data:
            await task_service.create_task(session, task_data)
        
        # Should now be 5
        count = await task_service.get_count_of_tasks(session)
        assert count == 5

    # Task Statistics Tests
    @pytest.mark.asyncio
    async def test_analyze_task_statistics_with_tasks(self, task_service, test_db_session):
        """Test analyzing task statistics with real tasks."""
        async for session in test_db_session:
            break
            
        # Create tasks with known values for testing
        tasks_data = [
            Task(name="High focus 1", time_spent=2.0, focus_level=FocusLevel.high, date_worked=get_local_today()),
            Task(name="High focus 2", time_spent=3.0, focus_level=FocusLevel.high, date_worked=get_local_today()),
            Task(name="Medium focus", time_spent=1.0, focus_level=FocusLevel.medium, date_worked=get_local_today()),
            Task(name="Low focus", time_spent=0.5, focus_level=FocusLevel.low, date_worked=get_local_today()),
        ]
        
        created_tasks = []
        for task_data in tasks_data:
            created_task = await task_service.create_task(session, task_data)
            created_tasks.append(created_task)
        
        stats = task_service.analyze_task_statistics(created_tasks)
        
        assert stats["total_tasks"] == 4
        assert stats["total_hours"] == 6.5  # 2.0 + 3.0 + 1.0 + 0.5
        assert stats["average_hours_per_task"] == 1.62  # 6.5 / 4 = 1.625 rounded to 2 decimals
        
        # Check focus distribution
        assert stats["focus_count_percentages"]["high"] == 50.0  # 2/4 * 100
        assert stats["focus_count_percentages"]["medium"] == 25.0  # 1/4 * 100
        assert stats["focus_count_percentages"]["low"] == 25.0  # 1/4 * 100
        
        # Check focus hours
        assert stats["focus_hours"]["high"] == 5.0  # 2.0 + 3.0
        assert stats["focus_hours"]["medium"] == 1.0
        assert stats["focus_hours"]["low"] == 0.5
        
        # Check most productive focus
        assert stats["focus_with_most_hours"] == "high"

    def test_analyze_task_statistics_empty_list(self, task_service):
        """Test analyzing statistics with empty task list."""
        stats = task_service.analyze_task_statistics([])
        
        assert stats["total_tasks"] == 0
        assert stats["total_hours"] == 0.0
        assert stats["average_hours_per_task"] == 0.0
        assert stats["focus_count"] == {}
        assert stats["focus_hours"] == {}
        assert stats["focus_with_most_hours"] == "N/A"

    def test_analyze_task_statistics_with_none_time(self, task_service):
        """Test statistics calculation when some tasks have None time_spent."""
        # Create task objects directly (not persisted to database to avoid constraint issues)
        task_with_none_time = Task(
            name="No time task",
            time_spent=None,  # Simulate edge case without database constraints
            focus_level=FocusLevel.medium,
            date_worked=get_local_today()
        )
        
        normal_task = Task(
            name="Normal task",
            time_spent=2.0,
            focus_level=FocusLevel.high,
            date_worked=get_local_today()
        )
        
        stats = task_service.analyze_task_statistics([task_with_none_time, normal_task])
        
        assert stats["total_tasks"] == 2
        assert stats["total_hours"] == 2.0  # Only counts non-None values
        assert stats["average_hours_per_task"] == 1.0  # 2.0 / 2

    # Utility Function Tests
    def test_get_local_today(self):
        """Test the get_local_today utility function."""
        today = get_local_today()
        expected = datetime.now().date()
        
        assert isinstance(today, date)
        assert today == expected

    # Integration Tests
    @pytest.mark.asyncio
    async def test_full_crud_workflow(self, task_service, test_db_session):
        """Test complete CRUD workflow with real database."""
        async for session in test_db_session:
            break
            
        # 1. Create
        task_data = Task(
            name="CRUD workflow test",
            time_spent=1.0,
            focus_level=FocusLevel.medium,
            date_worked=get_local_today()
        )
        created_task = await task_service.create_task(session, task_data)
        assert created_task.id is not None
        
        # 2. Read
        found_task = await task_service.get_task_by_id(session, created_task.id)
        assert found_task.name == "CRUD workflow test"
        
        # 3. Update
        updated_task = await task_service.update_task(
            session, 
            created_task.id, 
            {"name": "Updated workflow test", "time_spent": 2.0}
        )
        assert updated_task.name == "Updated workflow test"
        assert updated_task.time_spent == 2.0
        
        # 4. List (should contain our task)
        all_tasks = await task_service.get_tasks(session)
        assert len(all_tasks) == 1
        assert all_tasks[0].id == created_task.id
        
        # 5. Count
        count = await task_service.get_count_of_tasks(session)
        assert count == 1
        
        # 6. Delete
        deleted = await task_service.delete_task(session, created_task.id)
        assert deleted is True
        
        # 7. Verify deletion
        found_after_delete = await task_service.get_task_by_id(session, created_task.id)
        assert found_after_delete is None
        
        final_count = await task_service.get_count_of_tasks(session)
        assert final_count == 0

    @pytest.mark.asyncio
    async def test_concurrent_operations(self, task_service, test_db_session):
        """Test that multiple operations work correctly in sequence."""
        async for session in test_db_session:
            break
            
        # Create multiple tasks
        task_names = ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"]
        created_tasks = []
        
        for name in task_names:
            task_data = Task(
                name=name,
                time_spent=1.0,
                focus_level=FocusLevel.medium,
                date_worked=get_local_today()
            )
            created_task = await task_service.create_task(session, task_data)
            created_tasks.append(created_task)
        
        # Verify all were created
        assert len(created_tasks) == 5
        all_tasks = await task_service.get_tasks(session)
        assert len(all_tasks) == 5
        
        # Update some tasks
        await task_service.update_task(session, created_tasks[0].id, {"name": "Updated Task 1"})
        await task_service.update_task(session, created_tasks[2].id, {"time_spent": 3.0})
        
        # Delete some tasks
        await task_service.delete_task(session, created_tasks[1].id)
        await task_service.delete_task(session, created_tasks[4].id)
        
        # Verify final state
        remaining_tasks = await task_service.get_tasks(session)
        assert len(remaining_tasks) == 3
        
        final_count = await task_service.get_count_of_tasks(session)
        assert final_count == 3
        
        # Check that updates persisted
        updated_task_1 = await task_service.get_task_by_id(session, created_tasks[0].id)
        assert updated_task_1.name == "Updated Task 1"
        
        updated_task_3 = await task_service.get_task_by_id(session, created_tasks[2].id)
        assert updated_task_3.time_spent == 3.0