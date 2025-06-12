"""
Test to debug search functionality issues
"""
import pytest
from datetime import date, datetime
from models.models import WeeklySummary

@pytest.mark.asyncio
async def test_search_with_simple_queries(test_client, test_db):
    """Test search with simple queries like 'hi' and 'engaging' to debug search issues."""
    
    client = await test_client.__anext__()
    db = await test_db.__anext__()
    
    # Create test summary with the content mentioned by the user
    test_summary = WeeklySummary(
        week_start="2023-05-24",
        week_end="2023-05-30",
        summary="The week showcased a balanced distribution of tasks with an emphasis on high-focus activities, notably coding and security analysis, which maximized productive hours. Engaging in medium-focus meetings and mentoring sessions supported collaboration, while some lower focus tasks might have diluted overall concentration. The average focus level indicates an opportunity to enhance efficiency by minimizing distractions during critical task execution.",
        stats={"total_tasks": 13, "total_hours": "29.5", "avg_focus": "medium"},
        recommendations=["Focus on minimizing distractions during critical tasks", "Continue high-focus activities"]
    )
    
    db.add(test_summary)
    await db.commit()
    await db.refresh(test_summary)
    
    # Test search with "hi" - should find nothing with current implementation
    response = await client.get("/api/summaries/search?query=hi")
    print(f"Search for 'hi' returned: {response.status_code} - {response.json()}")
    
    # Test search with "engaging" - should find the test summary
    response = await client.get("/api/summaries/search?query=engaging")
    print(f"Search for 'engaging' returned: {response.status_code} - {response.json()}")
    
    # Test search with "coding" - should find the test summary  
    response = await client.get("/api/summaries/search?query=coding")
    print(f"Search for 'coding' returned: {response.status_code} - {response.json()}")
    
    # Let's also check if we can get all summaries
    response = await client.get("/api/summaries")
    print(f"Get all summaries returned: {response.status_code} - {len(response.json()) if response.status_code == 200 else response.json()}")

@pytest.mark.asyncio  
async def test_search_endpoint_exists(test_client):
    """Test that the search endpoint exists and returns proper format."""
    
    client = await test_client.__anext__()
    
    # Test with empty query
    response = await client.get("/api/summaries/search")
    print(f"Empty search query returned: {response.status_code} - {response.json()}")
    
    # Test with query parameter
    response = await client.get("/api/summaries/search?query=test")
    print(f"Search with 'test' returned: {response.status_code} - {response.json()}")