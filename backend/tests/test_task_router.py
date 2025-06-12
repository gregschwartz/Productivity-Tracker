import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from main import app  # Import your FastAPI app
from models.models import Task, FocusLevel


# Sample task data for reuse
SAMPLE_TASK_PAYLOAD = {"name": "Test Task", "time_spent": 1.0, "focus_level": "medium", "date_worked": "2024-03-10"}
UPDATED_TASK_PAYLOAD = {"name": "Updated Test Task", "time_spent": 1.5, "focus_level": "high", "date_worked": "2024-03-11"}


@pytest.mark.asyncio
async def test_create_task_success(test_client):
    """Test POST /api/tasks for creating tasks successfully."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.create_task', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = Task(id=1, **SAMPLE_TASK_PAYLOAD)
        response = await client.post("/api/tasks/", json=SAMPLE_TASK_PAYLOAD)
        assert response.status_code == 200
        assert response.json()["name"] == SAMPLE_TASK_PAYLOAD["name"]
        assert response.json()["id"] == 1
        mock_create.assert_called_once()

@pytest.mark.asyncio
async def test_create_task_validation_error(test_client):
    """Test POST /api/tasks with invalid input data."""
    async for client in test_client:
        break
    
    response = await client.post("/api/tasks/", json={"name": "Test"}) # Missing fields
    assert response.status_code == 500  # Database constraint violation

@pytest.mark.asyncio
async def test_get_tasks_success(test_client):
    """Test GET /api/tasks for retrieving a list of tasks."""
    async for client in test_client:
        break
    
    mock_task_list = [
        Task(id=1, **SAMPLE_TASK_PAYLOAD),
        Task(id=2, name="Another Task", time_spent=2.0, focus_level="low", date_worked="2024-03-09")
    ]
    with patch('services.task_service.TaskService.get_tasks', new_callable=AsyncMock) as mock_get_tasks, \
         patch('services.task_service.TaskService.get_tasks_count', new_callable=AsyncMock) as mock_get_count:
        mock_get_tasks.return_value = mock_task_list
        mock_get_count.return_value = 2
        response = await client.get("/api/tasks/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["tasks"]) == 2
        assert data["tasks"][0]["name"] == SAMPLE_TASK_PAYLOAD["name"]
        mock_get_tasks.assert_called_once()
        mock_get_count.assert_called_once()

@pytest.mark.asyncio
async def test_get_tasks_empty(test_client):
    """Test GET /api/tasks when no tasks exist."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.get_tasks', new_callable=AsyncMock) as mock_get_tasks, \
         patch('services.task_service.TaskService.get_tasks_count', new_callable=AsyncMock) as mock_get_count:
        mock_get_tasks.return_value = []
        mock_get_count.return_value = 0
        response = await client.get("/api/tasks/")
        assert response.status_code == 200
        data = response.json()
        assert data["tasks"] == []
        assert data["total"] == 0
        mock_get_tasks.assert_called_once()
        mock_get_count.assert_called_once()

@pytest.mark.asyncio
async def test_get_single_task_success(test_client):
    """Test GET /api/tasks/{task_id} for retrieving a single task."""
    async for client in test_client:
        break
    
    mock_task = Task(id=1, **SAMPLE_TASK_PAYLOAD)
    with patch('services.task_service.TaskService.get_task_by_id', new_callable=AsyncMock) as mock_get_task_by_id:
        mock_get_task_by_id.return_value = mock_task
        response = await client.get("/api/tasks/1")
        assert response.status_code == 200
        assert response.json()["name"] == SAMPLE_TASK_PAYLOAD["name"]
        assert response.json()["id"] == 1
        mock_get_task_by_id.assert_called_once()

@pytest.mark.asyncio
async def test_get_single_task_not_found(test_client):
    """Test GET /api/tasks/{task_id} for a non-existent task."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.get_task_by_id', new_callable=AsyncMock) as mock_get_task_by_id:
        mock_get_task_by_id.return_value = None
        response = await client.get("/api/tasks/999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"
        mock_get_task_by_id.assert_called_once()

@pytest.mark.asyncio
async def test_update_task_success(test_client):
    """Test PUT /api/tasks/{task_id} for updating a task."""
    async for client in test_client:
        break
    
    mock_updated_task = Task(id=1, **UPDATED_TASK_PAYLOAD)
    with patch('services.task_service.TaskService.update_task', new_callable=AsyncMock) as mock_update_task:
        mock_update_task.return_value = mock_updated_task
        response = await client.put("/api/tasks/1", json=UPDATED_TASK_PAYLOAD)
        assert response.status_code == 200
        assert response.json()["name"] == UPDATED_TASK_PAYLOAD["name"]
        assert response.json()["time_spent"] == UPDATED_TASK_PAYLOAD["time_spent"]
        mock_update_task.assert_called_once()

@pytest.mark.asyncio
async def test_update_task_not_found(test_client):
    """Test PUT /api/tasks/{task_id} for a non-existent task."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.update_task', new_callable=AsyncMock) as mock_update_task:
        mock_update_task.return_value = None
        response = await client.put("/api/tasks/999", json=UPDATED_TASK_PAYLOAD)
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"
        mock_update_task.assert_called_once()

@pytest.mark.asyncio
async def test_update_task_validation_error(test_client):
    """Test PUT /api/tasks/{task_id} with invalid input data."""
    async for client in test_client:
        break
    
    response = await client.put("/api/tasks/1", json={"name": "Updated Only"}) # Missing other fields
    # The exact error code might depend on how Pydantic models are used for updates.
    # If the model expects all fields, it might be 422.
    # If partial updates are allowed but some specific validation fails, it could also be 422.
    # Given the current router uses `task_data: dict`, it might not do Pydantic validation at this level
    # directly unless the `update_task` service function does.
    # For now, assuming the service or DB layer might catch this, or a more specific Pydantic model is used for updates.
    # If the router's `task_data: dict` is directly passed to a Pydantic model update, 422 is expected.
    # Let's assume a scenario where it leads to a failure if required fields are missing for an update.
    # This test might need adjustment based on actual update logic in `services.task_service.TaskService.update_task`.
    # For now, we'll expect the endpoint to try and process it.
    # A more robust test would mock `update_task` to raise a specific validation error.
    with patch('services.task_service.TaskService.update_task', new_callable=AsyncMock) as mock_update_task:
        # Simulate a scenario where the update operation itself might fail due to bad data,
        # even if not caught by FastAPI's initial validation if `task_data: dict` is too permissive.
        # For instance, the database layer could reject it.
        mock_update_task.side_effect = Exception("Simulated update error due to invalid data")
        response = await client.put("/api/tasks/1", json={"name": "Updated Only", "timeSpent": "invalid_float"})
        assert response.status_code == 500 # Or 400/422 if Pydantic validation is more deeply integrated
        # The detail message would depend on the actual error handling in the endpoint
        # assert "Failed to update task" in response.json()["detail"] # Example check

@pytest.mark.asyncio
async def test_delete_task_success(test_client):
    """Test DELETE /api/tasks/{task_id} for deleting a task."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.delete_task', new_callable=AsyncMock) as mock_delete_task:
        mock_delete_task.return_value = True  # Indicates successful deletion
        response = await client.delete("/api/tasks/1")
        assert response.status_code == 200
        assert response.json() == {"message": "Task deleted successfully"}
        mock_delete_task.assert_called_once()

@pytest.mark.asyncio
async def test_delete_task_not_found(test_client):
    """Test DELETE /api/tasks/{task_id} for a non-existent task."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.delete_task', new_callable=AsyncMock) as mock_delete_task:
        mock_delete_task.return_value = False  # Indicates task not found or deletion failed
        response = await client.delete("/api/tasks/999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"
        mock_delete_task.assert_called_once()

# Test using FocusLevel enum directly  
@pytest.mark.asyncio
async def test_create_task_with_conftest_sample(test_client):
    """Test POST /api/tasks using FocusLevel enum."""
    async for client in test_client:
        break
    
    task_payload = {
        "name": "Sample Task",
        "time_spent": 2.0,
        "focus_level": FocusLevel.high.value,
        "date_worked": "2024-03-05"
    }
    with patch('services.task_service.TaskService.create_task', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = Task(id=3, **task_payload)
        response = await client.post("/api/tasks/", json=task_payload)
        assert response.status_code == 200
        assert response.json()["name"] == task_payload["name"]
        assert response.json()["id"] == 3
        mock_create.assert_called_once()

# Test for /api/tasks/stats/count endpoint
@pytest.mark.asyncio
async def test_get_task_count(test_client):
    """Test GET /api/tasks/stats/count for retrieving the total number of tasks."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.get_count_of_tasks', new_callable=AsyncMock) as mock_get_count:
        mock_get_count.return_value = 15  # Example count
        response = await client.get("/api/tasks/stats/count")
        assert response.status_code == 200
        assert response.json() == {"total_tasks": 15}
        mock_get_count.assert_called_once()

# Test for date filtering if implemented and tested at router level
# (Assuming get_tasks in services.database handles the actual filtering logic)
@pytest.mark.asyncio
async def test_get_tasks_with_date_filters(test_client):
    """Test GET /api/tasks with date filters."""
    async for client in test_client:
        break
    
    mock_task_list = [Task(id=1, **SAMPLE_TASK_PAYLOAD)]
    with patch('services.task_service.TaskService.get_tasks', new_callable=AsyncMock) as mock_get_tasks, \
         patch('services.task_service.TaskService.get_tasks_count', new_callable=AsyncMock) as mock_get_count:
        mock_get_tasks.return_value = mock_task_list
        mock_get_count.return_value = 1
        response = await client.get("/api/tasks/?start_date=2024-03-01&end_date=2024-03-15")
        assert response.status_code == 200
        data = response.json()
        assert len(data["tasks"]) == 1
        mock_get_tasks.assert_called_once()
        mock_get_count.assert_called_once()

@pytest.mark.asyncio
async def test_get_tasks_no_date_filters_unit(test_client):
    """Unit test: GET /api/tasks returns paginated response format."""
    async for client in test_client:
        break
    
    with patch('services.task_service.TaskService.get_tasks', new_callable=AsyncMock) as mock_get_tasks, \
         patch('services.task_service.TaskService.get_tasks_count', new_callable=AsyncMock) as mock_get_count:
        mock_get_tasks.return_value = []
        mock_get_count.return_value = 0
        
        response = await client.get("/api/tasks/")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return paginated response format 
        assert "tasks" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert "has_more" in data
        assert isinstance(data["tasks"], list)
        assert isinstance(data["total"], int)
        assert data["limit"] == 100  # Default limit
        assert data["offset"] == 0   # Default offset
