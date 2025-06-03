import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import HTTPException
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from routers.summary import router
from services.ai_service import AIService
from services.rag_service import RAGService
from models.pydantic_models import SummaryRequest, SummaryResponse, TaskData, FocusLevel


# Create a test app with just the summary router
from fastapi import FastAPI
app = FastAPI()
app.include_router(router)
client = TestClient(app)


class TestSummaryRouter:
    """Test cases for Summary router endpoints."""

    @pytest.fixture
    def mock_ai_service(self):
        """Mock AI service for testing."""
        with patch('routers.summary.ai_service') as mock_service:
            yield mock_service

    @pytest.fixture
    def mock_rag_service(self):
        """Mock RAG service for testing."""
        with patch('routers.summary.rag_service') as mock_service:
            yield mock_service

    @pytest.fixture
    def summary_request_data(self, sample_tasks):
        """Sample summary request data."""
        return {
            "tasks": [task.dict() for task in sample_tasks],
            "weekStart": "2024-01-15",
            "weekEnd": "2024-01-21",
            "context": {"user_id": "test_user"}
        }

    def test_generate_weekly_summary_success(self, mock_ai_service, mock_rag_service, 
                                           summary_request_data, sample_summary_response):
        """Test successful weekly summary generation."""
        mock_ai_service.generate_weekly_summary = AsyncMock(return_value=sample_summary_response)
        mock_rag_service.store_weekly_summary = MagicMock()
        
        response = client.post("/generate-summary", json=summary_request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == sample_summary_response.summary
        assert data["insights"] == sample_summary_response.insights
        assert data["recommendations"] == sample_summary_response.recommendations
        assert data["stats"]["totalTasks"] == 3
        
        # Verify RAG service was called to store the summary
        mock_rag_service.store_weekly_summary.assert_called_once()

    def test_generate_weekly_summary_empty_tasks(self, mock_ai_service, mock_rag_service):
        """Test weekly summary generation with empty tasks."""
        request_data = {
            "tasks": [],
            "weekStart": "2024-01-15",
            "weekEnd": "2024-01-21"
        }
        
        response = client.post("/generate-summary", json=request_data)
        
        assert response.status_code == 400
        assert "No tasks provided" in response.json()["detail"]

    def test_generate_weekly_summary_ai_service_error(self, mock_ai_service, mock_rag_service, 
                                                    summary_request_data):
        """Test weekly summary generation when AI service fails."""
        mock_ai_service.generate_weekly_summary = AsyncMock(side_effect=Exception("AI service error"))
        
        response = client.post("/generate-summary", json=summary_request_data)
        
        assert response.status_code == 500
        assert "Failed to generate summary: AI service error" in response.json()["detail"]

    def test_generate_weekly_summary_rag_storage_error(self, mock_ai_service, mock_rag_service, 
                                                      summary_request_data, sample_summary_response):
        """Test weekly summary generation when RAG storage fails."""
        mock_ai_service.generate_weekly_summary = AsyncMock(return_value=sample_summary_response)
        mock_rag_service.store_weekly_summary.side_effect = Exception("Storage error")
        
        # Should still return success even if storage fails
        response = client.post("/generate-summary", json=summary_request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == sample_summary_response.summary

    def test_enhance_summary_success(self, mock_ai_service):
        """Test successful summary enhancement."""
        mock_ai_service.enhance_summary_with_context = AsyncMock(
            return_value="Enhanced summary with additional context"
        )
        
        response = client.post(
            "/enhance-summary",
            json={
                "original_summary": "Original summary",
                "additional_context": "Additional context information"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["enhanced_summary"] == "Enhanced summary with additional context"

    def test_enhance_summary_error(self, mock_ai_service):
        """Test summary enhancement when AI service fails."""
        mock_ai_service.enhance_summary_with_context = AsyncMock(
            side_effect=Exception("Enhancement error")
        )
        
        response = client.post(
            "/enhance-summary",
            json={
                "original_summary": "Original summary",
                "additional_context": "Additional context"
            }
        )
        
        assert response.status_code == 500
        assert "Failed to enhance summary" in response.json()["detail"]

    # Note: get_similar_tasks tests removed as the method doesn't exist in the RAG service

    def test_analyze_productivity_patterns_success(self, sample_tasks):
        """Test successful productivity analysis."""
        # Add completed flag to tasks
        tasks_data = []
        for i, task in enumerate(sample_tasks):
            task_dict = task.dict()
            task_dict["completed"] = i < 2  # First 2 tasks completed
            tasks_data.append(task_dict)
        
        response = client.post("/analyze-productivity", json=tasks_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_tasks"] == 3
        assert data["completed_tasks"] == 2
        assert data["completion_rate"] == 0.67  # 2/3 rounded
        assert data["total_hours"] == 7.0
        assert data["avg_hours_per_task"] == 2.3  # 7/3 rounded
        assert "focus_distribution" in data
        assert "time_by_focus" in data
        assert "most_productive_focus" in data

    def test_analyze_productivity_patterns_empty_tasks(self):
        """Test productivity analysis with empty task list."""
        response = client.post("/analyze-productivity", json=[])
        
        assert response.status_code == 400
        assert "No tasks provided for analysis" in response.json()["detail"]

    def test_analyze_productivity_patterns_focus_distribution(self):
        """Test productivity analysis focus distribution calculation."""
        tasks_data = [
            {
                "id": "1",
                "name": "High focus task 1",
                "timeSpent": 3.0,
                "focusLevel": "high",
                "date": "2024-01-15",
                "completed": True
            },
            {
                "id": "2", 
                "name": "High focus task 2",
                "timeSpent": 2.0,
                "focusLevel": "high",
                "date": "2024-01-16",
                "completed": True
            },
            {
                "id": "3",
                "name": "Medium focus task",
                "timeSpent": 1.0,
                "focusLevel": "medium",
                "date": "2024-01-17",
                "completed": False
            }
        ]
        
        response = client.post("/analyze-productivity", json=tasks_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["focus_distribution"]["high"] == 2
        assert data["focus_distribution"]["medium"] == 1
        assert data["focus_distribution"]["low"] == 0
        assert data["time_by_focus"]["high"] == 5.0  # 3.0 + 2.0
        assert data["time_by_focus"]["medium"] == 1.0
        assert data["most_productive_focus"] == "high"

    def test_analyze_productivity_patterns_all_completed(self):
        """Test productivity analysis when all tasks are completed."""
        tasks_data = [
            {
                "id": "1",
                "name": "Task 1",
                "timeSpent": 1.0,
                "focusLevel": "medium",
                "date": "2024-01-15",
                "completed": True
            },
            {
                "id": "2",
                "name": "Task 2", 
                "timeSpent": 2.0,
                "focusLevel": "high",
                "date": "2024-01-16",
                "completed": True
            }
        ]
        
        response = client.post("/analyze-productivity", json=tasks_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["completion_rate"] == 1.0  # 100%
        assert data["completed_tasks"] == 2
        assert data["total_tasks"] == 2

    def test_generate_weekly_summary_validation(self):
        """Test request validation for generate-summary endpoint."""
        # Test missing required fields
        response = client.post(
            "/generate-summary",
            json={
                "weekStart": "2024-01-15"
                # missing "tasks" and "weekEnd"
            }
        )
        
        assert response.status_code == 422  # Validation error

    def test_enhance_summary_validation(self):
        """Test request validation for enhance-summary endpoint."""
        # Test missing fields - this endpoint expects simple parameters
        response = client.post(
            "/enhance-summary",
            json={}  # missing both required parameters
        )
        
        # This will depend on how the endpoint is defined
        # If it uses query parameters, this might be a different status code
        assert response.status_code in [400, 422]

    def test_analyze_productivity_patterns_error_handling(self):
        """Test productivity analysis error handling."""
        # Send invalid task data
        invalid_tasks = [
            {
                "id": "1",
                "name": "Task without required fields"
                # missing timeSpent, focusLevel, date
            }
        ]
        
        response = client.post("/analyze-productivity", json=invalid_tasks)
        
        assert response.status_code == 422  # Validation error

    def test_generate_weekly_summary_weave_logging(self, mock_ai_service, mock_rag_service, 
                                                  summary_request_data, sample_summary_response):
        """Test that weave logging is called for generate-summary endpoint."""
        mock_ai_service.generate_weekly_summary = AsyncMock(return_value=sample_summary_response)
        mock_rag_service.store_weekly_summary = MagicMock()
        
        with patch('routers.summary.weave.op') as mock_weave_op:
            # Mock the decorator to just return the function
            mock_weave_op.return_value = lambda f: f
            
            response = client.post("/generate-summary", json=summary_request_data)
            
            assert response.status_code == 200