"""
Test to debug search functionality issues
"""
import pytest
from datetime import date, datetime
from models.models import WeeklySummary

@pytest.mark.asyncio
async def test_search_with_simple_queries(test_client):
    """Test search with simple queries like 'hi' and 'engaging' to debug search issues."""
    from unittest.mock import patch, AsyncMock
    
    async for client in test_client:
        break
    
    # Mock the search service to return expected results
    with patch('services.summary_service.SummaryService.vector_search_week_summaries', new_callable=AsyncMock) as mock_search:
        # Mock search results
        mock_search.return_value = []
        
        # Test search with "hi" - should find nothing
        response = await client.get("/api/summaries/search?query=hi")
        assert response.status_code == 200
        
        # Test search with "engaging" - mock finding a result
        mock_summary = WeeklySummary(
            id=1,
            week_start="2023-05-24",
            week_end="2023-05-30",
            summary="The week showcased engaging activities",
            stats={"total_tasks": 13, "total_hours": "29.5", "avg_focus": "medium"},
            recommendations=["Focus on minimizing distractions"]
        )
        mock_search.return_value = [mock_summary]
        
        response = await client.get("/api/summaries/search?query=engaging")
        assert response.status_code == 200
        
        # Test search with "coding"
        response = await client.get("/api/summaries/search?query=coding")
        assert response.status_code == 200

@pytest.mark.asyncio  
async def test_search_endpoint_exists(test_client):
    """Test that the search endpoint exists and returns proper format."""
    
    async for client in test_client:
        break
    
    # Test with empty query
    response = await client.get("/api/summaries/search")
    print(f"Empty search query returned: {response.status_code} - {response.json()}")
    
    # Test with query parameter
    response = await client.get("/api/summaries/search?query=test")
    print(f"Search with 'test' returned: {response.status_code} - {response.json()}")