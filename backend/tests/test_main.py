import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Productivity Tracker API is running" in response.json()["message"]

def test_generate_summary_validation():
    """Test summary generation endpoint with invalid data."""
    response = client.post("/api/summary", json={})
    assert response.status_code == 422  # Validation error

def test_ask_question_validation():
    """Test ask question endpoint with invalid data."""
    response = client.post("/api/ask", json={})
    assert response.status_code == 422  # Validation error

def test_tasks_endpoint():
    """Test tasks endpoint."""
    response = client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data

def test_summary_endpoint():
    """Test get saved summary endpoint."""
    response = client.get("/api/summary?week_start=2025-06-02")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "insights" in data
    assert "recommendations" in data
    assert "stats" in data
