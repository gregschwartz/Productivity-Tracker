import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from main import app
from models.models import WeeklySummary

@pytest.fixture
def client():
    return TestClient(app)

def test_rag_search_via_summaries_endpoint(client):
    """
    Test RAG search functionality
    """
    mock_search_results = [
        WeeklySummary(id=1, week_start="2024-01-08", week_end="2024-01-14", summary="Relevant week 1", stats={}, recommendations=[]),
        WeeklySummary(id=2, week_start="2024-01-15", week_end="2024-01-21", summary="Relevant week 2", stats={}, recommendations=[])
    ]

    with patch('services.summary_service.SummaryService.vector_search_week_summaries', new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_search_results

        search_query = "how to improve productivity"
        response = client.get(f"/api/summaries/search?query={search_query}")
        
        assert response.status_code == 200
        json_response = response.json()
        assert len(json_response) == 2
        assert json_response[0]["summary"] == mock_search_results[0].summary

        # Check that the method was called with correct parameters
        # The vector_search_week_summaries method signature is:
        # async def vector_search_week_summaries(self, session, query_text, limit=5, similarity_threshold=0.7)
        mock_search.assert_called_once()

def test_rag_search_no_results(client):
    """
    Test RAG search via GET /api/summaries/search when no results are found.
    """
    with patch('services.summary_service.SummaryService.vector_search_week_summaries', new_callable=AsyncMock) as mock_search:
        mock_search.return_value = [] # No results found
        
        search_query = "obscure query with no matches"
        response = client.get(f"/api/summaries/search?query={search_query}")
        
        assert response.status_code == 200
        assert response.json() == []

        mock_search.assert_called_once()

def test_rag_search_error_handling(client):
    """
    Test RAG search error handling when search service fails.
    """
    with patch('services.summary_service.SummaryService.vector_search_week_summaries', new_callable=AsyncMock) as mock_search:
        mock_search.side_effect = Exception("Database connection failed")
        
        search_query = "test query"
        response = client.get(f"/api/summaries/search?query={search_query}")
        
        assert response.status_code == 500
        json_response = response.json()
        assert "Failed to search summaries" in json_response["detail"]

def test_rag_search_missing_query(client):
    """
    Test RAG search with missing query parameter.
    """
    response = client.get("/api/summaries/search")
    
    # FastAPI should return 422 for missing required query parameter
    assert response.status_code == 422
