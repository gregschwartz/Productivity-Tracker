import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock

from main import app  # Import your FastAPI app
from models.models import WeeklySummary, Task
from models.models import SummaryResponse, WeeklyStats, Task, FocusLevel
from services.ai_service import AIService # To mock its methods


# Sample data from conftest.py can be used if imported, or defined here
SAMPLE_WEEK_START = "2024-03-04"
SAMPLE_WEEK_END = "2024-03-10"
SAMPLE_TASKS_PAYLOAD = [
    {"id": "1", "name": "Task 1", "timeSpent": 5.0, "focusLevel": "high", "date": "2024-03-05"},
    {"id": "2", "name": "Task 2", "timeSpent": 3.0, "focusLevel": "medium", "date": "2024-03-07"},
]
SAMPLE_WEEKLY_STATS_PAYLOAD = {"total_tasks": 2, "total_hours": "8.0", "avg_focus": "medium"}

# This is what AIService.generate_weekly_summary is expected to return (pydantic model)
AI_GENERATED_SUMMARY = SummaryResponse(
    summary="Great week with high <mark>focus</mark>!",
    recommendations=["Keep your <mark>focus</mark> by touching grass."]
)

# This is what the endpoint will store and return (database model)
STORED_SUMMARY_DB_MODEL = WeeklySummary(
    id=1, # Example ID from DB
    week_start=SAMPLE_WEEK_START,
    week_end=SAMPLE_WEEK_END,
    summary=AI_GENERATED_SUMMARY.summary,
    stats={"total_tasks": 2, "total_hours": "8.0", "avg_focus": "medium"}, # Stored as dict in DB model
    recommendations=AI_GENERATED_SUMMARY.recommendations
)


@pytest.mark.asyncio
async def test_generate_summary_success(test_client, sample_tasks, sample_weekly_stats, sample_summary_response):
    """Test POST /api/summaries/ for generating weekly summaries successfully."""
    # Use fixtures from conftest for AIService mock return value
    # sample_summary_response is a SummaryResponse Pydantic model

    client = await test_client.__anext__()
    tasks = await sample_tasks.__anext__()

    # Prepare the request payload for the endpoint
    # The endpoint expects a list of Task dicts, not Task objects directly in payload
    tasks_for_payload = [t.model_dump() for t in tasks]

    summary_request_payload = {
        "tasks": tasks_for_payload,
        "week_start": SAMPLE_WEEK_START,
        "week_end": SAMPLE_WEEK_END,
        "week_stats": sample_weekly_stats.model_dump(), # Pass as dict
        "context_summaries": None
    }

    # Mock the AI service method
    with patch.object(AIService, 'generate_weekly_summary', new_callable=AsyncMock) as mock_ai_generate, \
         patch('services.summary_service.SummaryService.create_weekly_summary', new_callable=AsyncMock) as mock_db_create_summary:

        mock_ai_generate.return_value = sample_summary_response # AIService returns Pydantic model

        # The create_weekly_summary in database.py will take data from AI response
        # and request, then return a WeeklySummary DB model instance
        mock_db_create_summary.return_value = WeeklySummary(
            id=1, # DB assigns an ID
            week_start=summary_request_payload["week_start"],
            week_end=summary_request_payload["week_end"],
            summary=sample_summary_response.summary,
            stats=sample_weekly_stats.model_dump(),
            recommendations=sample_summary_response.recommendations
        )

        response = await client.post("/api/summaries/", json=summary_request_payload)

        assert response.status_code == 200
        json_response = response.json()
        assert json_response["summary"] == sample_summary_response.summary
        assert json_response["week_start"] == SAMPLE_WEEK_START
        assert json_response["id"] == 1 # ID from mock_db_create_summary

        mock_ai_generate.assert_called_once()
        # Check that AI service was called with Task objects
        call_args = mock_ai_generate.call_args[1] # keyword arguments
        assert isinstance(call_args['tasks'][0], Task)
        assert call_args['week_stats'] == sample_weekly_stats


        mock_db_create_summary.assert_called_once()
        # Verify the data passed to create_weekly_summary
        db_call_args = mock_db_create_summary.call_args[0][0] # First positional argument
        assert isinstance(db_call_args, WeeklySummary)
        assert db_call_args.summary == sample_summary_response.summary

@pytest.mark.asyncio
async def test_generate_summary_no_tasks(test_client):
    """Test POST /api/summaries/ with an empty task list."""
    client = await test_client.__anext__()
    
    summary_request_payload = {
        "tasks": [],
        "week_start": SAMPLE_WEEK_START,
        "week_end": SAMPLE_WEEK_END,
        "week_stats": SAMPLE_WEEKLY_STATS_PAYLOAD,
        "context_summaries": None
    }
    response = await client.post("/api/summaries/", json=summary_request_payload)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_generate_summary_ai_failure(test_client, sample_tasks, sample_weekly_stats):
    """Test POST /api/summaries/ when AI service fails to generate a proper summary."""
    client = await test_client.__anext__()
    tasks = await sample_tasks.__anext__()
    
    tasks_for_payload = [t.model_dump() for t in tasks]
    summary_request_payload = {
        "tasks": tasks_for_payload,
        "week_start": SAMPLE_WEEK_START,
        "week_end": SAMPLE_WEEK_END,
        "week_stats": sample_weekly_stats.model_dump(),
        "context_summaries": None
    }
    # Simulate AI returning an empty/invalid response
    empty_ai_response = SummaryResponse(summary="", recommendations=[])

    with patch.object(AIService, 'generate_weekly_summary', new_callable=AsyncMock) as mock_ai_generate:
        mock_ai_generate.return_value = empty_ai_response

        response = await client.post("/api/summaries/", json=summary_request_payload)
        assert response.status_code == 500 # As per router logic for empty AI response
        assert "Failed to generate summary, AI response is empty" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_summaries_success(test_client):
    """Test GET /api/summaries/ for retrieving stored summaries."""
    client = await test_client.__anext__()
    
    mock_summaries_list = [STORED_SUMMARY_DB_MODEL.model_dump()] # Convert to dict for response matching
    with patch('services.summary_service.SummaryService.get_weekly_summaries', new_callable=AsyncMock) as mock_get_all_summaries:
        mock_get_all_summaries.return_value = [STORED_SUMMARY_DB_MODEL] # DB service returns list of DB models

        response = await client.get("/api/summaries/")
        assert response.status_code == 200
        json_response = response.json()
        assert len(json_response) == 1
        assert json_response[0]["summary"] == STORED_SUMMARY_DB_MODEL.summary
        assert json_response[0]["id"] == STORED_SUMMARY_DB_MODEL.id
        mock_get_all_summaries.assert_called_once()

@pytest.mark.asyncio
async def test_get_summary_by_id_success(test_client):
    """Test GET /api/summaries/{summary_id} for retrieving a single summary."""
    client = await test_client.__anext__()
    
    with patch('services.summary_service.SummaryService.get_weekly_summary_by_id', new_callable=AsyncMock) as mock_get_summary:
        mock_get_summary.return_value = STORED_SUMMARY_DB_MODEL

        response = await client.get(f"/api/summaries/{STORED_SUMMARY_DB_MODEL.id}")
        assert response.status_code == 200
        assert response.json()["summary"] == STORED_SUMMARY_DB_MODEL.summary
        mock_get_summary.assert_called_once()

@pytest.mark.asyncio
async def test_get_summary_by_id_not_found(test_client):
    """Test GET /api/summaries/{summary_id} for a non-existent summary."""
    client = await test_client.__anext__()
    
    with patch('services.summary_service.SummaryService.get_weekly_summary_by_id', new_callable=AsyncMock) as mock_get_summary:
        mock_get_summary.return_value = None
        response = await client.get("/api/summaries/999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Weekly summary not found"

@pytest.mark.asyncio
async def test_get_summary_count(test_client):
    """Test GET /api/summaries/stats/count for retrieving the total number of summaries."""
    client = await test_client.__anext__()
    
    with patch('services.summary_service.SummaryService.get_count_of_summaries', new_callable=AsyncMock) as mock_get_count:
        mock_get_count.return_value = 5 # Example count
        response = await client.get("/api/summaries/stats/count")
        assert response.status_code == 200
        assert response.json() == {"total_summaries": 5}
        mock_get_count.assert_called_once()
