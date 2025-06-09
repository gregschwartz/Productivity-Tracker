import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock

from main import app  # Import your FastAPI app
from models.models import WeeklySummary, Task
from models.pydantic_models import SummaryResponse, WeeklyStats, TaskData, FocusLevel # For AIService mock
from services.ai_service import AIService # To mock its methods

# Fixture for TestClient
@pytest.fixture
def client():
    return TestClient(app)

# Sample data from conftest.py can be used if imported, or defined here
SAMPLE_WEEK_START = "2024-03-04"
SAMPLE_WEEK_END = "2024-03-10"
SAMPLE_TASKS_PAYLOAD = [
    {"id": "1", "name": "Task 1", "timeSpent": 5.0, "focusLevel": "high", "date": "2024-03-05"},
    {"id": "2", "name": "Task 2", "timeSpent": 3.0, "focusLevel": "medium", "date": "2024-03-07"},
]
SAMPLE_WEEKLY_STATS_PAYLOAD = {"totalTasks": 2, "totalHours": "8.0", "avgFocus": "High"}

# This is what AIService.generate_weekly_summary is expected to return (pydantic model)
AI_GENERATED_SUMMARY = SummaryResponse(
    summary="Great week with high focus!",
    insights=["Insight 1"],
    recommendations=["Recommendation 1"],
    stats=WeeklyStats(totalTasks=2, totalHours="8.0", avgFocus="High")
)

# This is what the endpoint will store and return (database model)
STORED_SUMMARY_DB_MODEL = WeeklySummary(
    id=1, # Example ID from DB
    week_start=SAMPLE_WEEK_START,
    week_end=SAMPLE_WEEK_END,
    summary=AI_GENERATED_SUMMARY.summary,
    stats=AI_GENERATED_SUMMARY.stats.dict(), # Stored as dict in DB model
    recommendations=AI_GENERATED_SUMMARY.recommendations
)


def test_generate_summary_success(client, sample_tasks, sample_weekly_stats, sample_summary_response):
    """Test POST /api/summaries/ for generating weekly summaries successfully."""
    # Use fixtures from conftest for AIService mock return value
    # sample_summary_response is a SummaryResponse Pydantic model

    # Prepare the request payload for the endpoint
    # The endpoint expects a list of Task dicts, not TaskData objects directly in payload
    tasks_for_payload = [t.dict() for t in sample_tasks]

    summary_request_payload = {
        "tasks": tasks_for_payload,
        "week_start": SAMPLE_WEEK_START,
        "week_end": SAMPLE_WEEK_END,
        "week_stats": sample_weekly_stats.dict(), # Pass as dict
        "context_summaries": [] # Assuming no context summaries for this test
    }

    # Mock the AI service method
    with patch.object(AIService, 'generate_weekly_summary', new_callable=AsyncMock) as mock_ai_generate, \
         patch('services.database.create_weekly_summary', new_callable=AsyncMock) as mock_db_create_summary:

        mock_ai_generate.return_value = sample_summary_response # AIService returns Pydantic model

        # The create_weekly_summary in database.py will take data from AI response
        # and request, then return a WeeklySummary DB model instance
        mock_db_create_summary.return_value = WeeklySummary(
            id=1, # DB assigns an ID
            week_start=summary_request_payload["week_start"],
            week_end=summary_request_payload["week_end"],
            summary=sample_summary_response.summary,
            stats=sample_summary_response.stats.dict(),
            recommendations=sample_summary_response.recommendations
        )

        response = client.post("/api/summaries/", json=summary_request_payload)

        assert response.status_code == 200
        json_response = response.json()
        assert json_response["summary"] == sample_summary_response.summary
        assert json_response["week_start"] == SAMPLE_WEEK_START
        assert json_response["id"] == 1 # ID from mock_db_create_summary

        mock_ai_generate.assert_called_once()
        # Check that AI service was called with TaskData objects
        call_args = mock_ai_generate.call_args[1] # keyword arguments
        assert isinstance(call_args['tasks'][0], TaskData)
        assert call_args['week_stats'] == sample_weekly_stats


        mock_db_create_summary.assert_called_once()
        # Verify the data passed to create_weekly_summary
        db_call_args = mock_db_create_summary.call_args[0][0] # First positional argument
        assert isinstance(db_call_args, WeeklySummary)
        assert db_call_args.summary == sample_summary_response.summary

def test_generate_summary_no_tasks(client):
    """Test POST /api/summaries/ with an empty task list."""
    summary_request_payload = {
        "tasks": [],
        "week_start": SAMPLE_WEEK_START,
        "week_end": SAMPLE_WEEK_END,
        "week_stats": SAMPLE_WEEKLY_STATS_PAYLOAD,
        "context_summaries": []
    }
    response = client.post("/api/summaries/", json=summary_request_payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "No tasks provided for summary generation"

def test_generate_summary_ai_failure(client, sample_tasks, sample_weekly_stats):
    """Test POST /api/summaries/ when AI service fails to generate a proper summary."""
    tasks_for_payload = [t.dict() for t in sample_tasks]
    summary_request_payload = {
        "tasks": tasks_for_payload,
        "week_start": SAMPLE_WEEK_START,
        "week_end": SAMPLE_WEEK_END,
        "week_stats": sample_weekly_stats.dict(),
        "context_summaries": []
    }
    # Simulate AI returning an empty/invalid response
    empty_ai_response = SummaryResponse(summary="", insights=[], recommendations=[], stats=sample_weekly_stats)

    with patch.object(AIService, 'generate_weekly_summary', new_callable=AsyncMock) as mock_ai_generate:
        mock_ai_generate.return_value = empty_ai_response

        response = client.post("/api/summaries/", json=summary_request_payload)
        assert response.status_code == 500 # As per router logic for empty AI response
        assert "Failed to generate summary, AI response is empty" in response.json()["detail"]

def test_get_summaries_success(client):
    """Test GET /api/summaries/ for retrieving stored summaries."""
    mock_summaries_list = [STORED_SUMMARY_DB_MODEL.dict()] # Convert to dict for response matching
    with patch('services.database.get_weekly_summaries', new_callable=AsyncMock) as mock_get_all_summaries:
        mock_get_all_summaries.return_value = [STORED_SUMMARY_DB_MODEL] # DB service returns list of DB models

        response = client.get("/api/summaries/")
        assert response.status_code == 200
        json_response = response.json()
        assert len(json_response) == 1
        assert json_response[0]["summary"] == STORED_SUMMARY_DB_MODEL.summary
        assert json_response[0]["id"] == STORED_SUMMARY_DB_MODEL.id
        mock_get_all_summaries.assert_called_once_with(skip=0, limit=10, start_date=None, end_date=None, query=None)

def test_get_summary_by_id_success(client):
    """Test GET /api/summaries/{summary_id} for retrieving a single summary."""
    with patch('services.database.get_weekly_summary_by_id', new_callable=AsyncMock) as mock_get_summary:
        mock_get_summary.return_value = STORED_SUMMARY_DB_MODEL

        response = client.get(f"/api/summaries/{STORED_SUMMARY_DB_MODEL.id}")
        assert response.status_code == 200
        assert response.json()["summary"] == STORED_SUMMARY_DB_MODEL.summary
        mock_get_summary.assert_called_with(STORED_SUMMARY_DB_MODEL.id)

def test_get_summary_by_id_not_found(client):
    """Test GET /api/summaries/{summary_id} for a non-existent summary."""
    with patch('services.database.get_weekly_summary_by_id', new_callable=AsyncMock) as mock_get_summary:
        mock_get_summary.return_value = None
        response = client.get("/api/summaries/999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Weekly summary not found"

# Tests for PUT and DELETE can be added similarly, mocking database update/delete functions.
# For RAG search, it seems the GET /api/summaries endpoint itself has a 'query' parameter.
# So, RAG testing for search will be part of testing that endpoint with the query param.

def test_get_summaries_with_query_rag_search(client, sample_rag_response):
    """Test GET /api/summaries/ with a query for RAG search."""
    # The get_weekly_summaries service function is expected to handle the RAG search
    # if a query is provided. We mock its return value.
    # Let's assume if a query is passed, it returns a list of WeeklySummary like objects
    # that are relevant, possibly augmented with RAG scores if the model supports it,
    # or just the filtered summaries.

    # The `sample_rag_response` from conftest has `results` which are `RAGResult` objects.
    # The `get_weekly_summaries` function in `services/database.py` would internally call
    # the RAG service and then map those RAG results to `WeeklySummary` DB models.
    # For this test, we'll mock `get_weekly_summaries` to return summaries that would
    # have been found by a RAG query.

    mock_rag_matched_summaries = [
        WeeklySummary(id=10, week_start="2024-01-08", week_end="2024-01-14", summary="Summary about focus in code reviews", stats={}, recommendations=[]),
        WeeklySummary(id=11, week_start="2024-01-15", week_end="2024-01-21", summary="Summary about time management", stats={}, recommendations=[])
    ]

    with patch('services.database.get_weekly_summaries', new_callable=AsyncMock) as mock_get_summaries_rag:
        mock_get_summaries_rag.return_value = mock_rag_matched_summaries

        search_query = "improve focus"
        response = client.get(f"/api/summaries/?query={search_query}")
        
        assert response.status_code == 200
        json_response = response.json()
        assert len(json_response) == 2
        assert json_response[0]["summary"] == mock_rag_matched_summaries[0].summary
        
        # Verify that the service was called with the query
        mock_get_summaries_rag.assert_called_once_with(
            skip=0, limit=10, start_date=None, end_date=None, query=search_query
        )

def test_get_summary_count(client):
    """Test GET /api/summaries/stats/count for retrieving the total number of summaries."""
    with patch('services.database.get_count_of_summaries', new_callable=AsyncMock) as mock_get_count:
        mock_get_count.return_value = 5 # Example count
        response = client.get("/api/summaries/stats/count")
        assert response.status_code == 200
        assert response.json() == {"total_summaries": 5}
        mock_get_count.assert_called_once()

# Note: The original request mentioned mocking RAGService.store_weekly_summary.
# Looking at `routers/summaries.py`, the `create_weekly_summary` function from
# `services/database.py` is called. This database function is responsible for
# storing the summary, which might internally use RAGService or directly interact
# with ChromaDB for vector embeddings. So, mocking `create_weekly_summary` (as done
# in `test_generate_summary_success`) covers the storage part.
# If RAGService has a distinct `store_weekly_summary` method that is *directly* called
# from the router, then that specific method would need to be mocked.
# However, the current `summaries.py` router calls `ai_service.generate_weekly_summary`
# and then `database.create_weekly_summary`. The latter is expected to handle embeddings.
# I'll assume `services.database.create_weekly_summary` handles the storage and vector embedding.
# The RAG search test (`test_get_summaries_with_query_rag_search`) mocks `get_weekly_summaries`
# which is assumed to use the RAG capabilities for querying.
# No separate `rag_router.py` was found, implying RAG is integrated here.
# No `/api/rag/knowledge-stats` endpoint seems to exist in `summaries.py` or `main.py`.
# The RAG functionalities are primarily search via `GET /api/summaries?query=...`
# and implicitly, storage of embeddings when summaries are created.
