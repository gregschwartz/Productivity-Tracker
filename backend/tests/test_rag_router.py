import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import HTTPException
import uuid
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from routers.rag import router
from services.rag_service import RAGService
from models.pydantic_models import RAGQuery, RAGResponse, RAGResult


# Create a test app with just the rag router
from fastapi import FastAPI
app = FastAPI()
app.include_router(router)
client = TestClient(app)


class TestRAGRouter:
    """Test cases for RAG router endpoints."""

    @pytest.fixture
    def mock_rag_service(self):
        """Mock RAG service for testing."""
        with patch('routers.rag.rag_service') as mock_service:
            yield mock_service

    def test_search_knowledge_base_success(self, mock_rag_service, sample_rag_response):
        """Test successful knowledge base search."""
        mock_rag_service.search_similar_weeks = AsyncMock(return_value=sample_rag_response)
        
        response = client.post(
            "/search",
            json={
                "query": "How can I improve my focus?",
                "max_results": 5
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "answer" in data
        assert len(data["results"]) >= 2

    def test_search_knowledge_base_empty_query(self, mock_rag_service):
        """Test search with empty query."""
        response = client.post(
            "/search",
            json={
                "query": "   ",
                "max_results": 5
            }
        )
        
        assert response.status_code == 400
        assert "Query cannot be empty" in response.json()["detail"]

    def test_search_knowledge_base_service_error(self, mock_rag_service):
        """Test search when service throws an error."""
        mock_rag_service.search_similar_weeks = AsyncMock(side_effect=Exception("Service error"))
        
        response = client.post(
            "/search",
            json={
                "query": "test query",
                "max_results": 5
            }
        )
        
        assert response.status_code == 500
        assert "Search failed: Service error" in response.json()["detail"]

    def test_get_knowledge_base_stats_success(self, mock_rag_service):
        """Test successful retrieval of knowledge base stats."""
        # Mock the collections
        mock_productivity_collection = MagicMock()
        mock_productivity_collection.count.return_value = 25
        mock_tasks_collection = MagicMock()
        mock_tasks_collection.count.return_value = 100
        
        mock_rag_service.productivity_collection = mock_productivity_collection
        mock_rag_service.tasks_collection = mock_tasks_collection
        
        response = client.get("/knowledge-stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["productivity_tips"] == 25
        assert data["historical_tasks"] == 100
        assert data["total_documents"] == 125
        assert "productivity_tips" in data["collections"]
        assert "historical_tasks" in data["collections"]

    def test_get_knowledge_base_stats_error(self, mock_rag_service):
        """Test knowledge base stats when collections throw errors."""
        mock_rag_service.productivity_collection.count.side_effect = Exception("Collection error")
        
        response = client.get("/knowledge-stats")
        
        assert response.status_code == 500
        assert "Failed to get knowledge base stats" in response.json()["detail"]

    def test_add_knowledge_document_success(self, mock_rag_service):
        """Test successful addition of knowledge document."""
        mock_collection = MagicMock()
        mock_rag_service.productivity_collection = mock_collection
        
        with patch('uuid.uuid4', return_value=MagicMock(hex='test-uuid-123')):
            response = client.post(
                "/add-knowledge",
                json={
                    "content": "This is a productivity tip about time management",
                    "source": "productivity_book",
                    "category": "time_management",
                    "metadata": {"author": "Test Author"}
                }
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Knowledge document added successfully"
        assert "document_id" in data
        
        # Verify the collection.add was called
        mock_collection.add.assert_called_once()

    def test_add_knowledge_document_empty_content(self, mock_rag_service):
        """Test adding knowledge document with empty content."""
        response = client.post(
            "/add-knowledge",
            json={
                "content": "   ",
                "source": "test_source"
            }
        )
        
        assert response.status_code == 400
        assert "Content cannot be empty" in response.json()["detail"]

    def test_add_knowledge_document_minimal_data(self, mock_rag_service):
        """Test adding knowledge document with minimal required data."""
        mock_collection = MagicMock()
        mock_rag_service.productivity_collection = mock_collection
        
        response = client.post(
            "/add-knowledge",
            json={
                "content": "Test productivity tip",
                "source": "test_source"
            }
        )
        
        assert response.status_code == 200
        mock_collection.add.assert_called_once()
        
        # Check the call arguments
        call_args = mock_collection.add.call_args
        assert call_args[1]['documents'] == ["Test productivity tip"]
        assert call_args[1]['metadatas'][0]["source"] == "test_source"
        assert call_args[1]['metadatas'][0]["category"] == "general"  # default

    def test_add_knowledge_document_service_error(self, mock_rag_service):
        """Test adding knowledge document when service throws error."""
        mock_collection = MagicMock()
        mock_collection.add.side_effect = Exception("Storage error")
        mock_rag_service.productivity_collection = mock_collection
        
        response = client.post(
            "/add-knowledge",
            json={
                "content": "Test content",
                "source": "test_source"
            }
        )
        
        assert response.status_code == 500
        assert "Failed to add knowledge document" in response.json()["detail"]

    def test_get_knowledge_categories_success(self):
        """Test successful retrieval of knowledge categories."""
        response = client.get("/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        categories = data["categories"]
        assert "time_management" in categories
        assert "focus" in categories
        assert "prioritization" in categories
        assert "general" in categories
        assert len(categories) == 8

    def test_search_knowledge_base_validation(self):
        """Test request validation for search endpoint."""
        # Test missing required field
        response = client.post(
            "/search",
            json={
                "max_results": 5
                # missing "query"
            }
        )
        
        assert response.status_code == 422  # Validation error

    def test_add_knowledge_document_validation(self):
        """Test request validation for add-knowledge endpoint."""
        # Test missing required fields
        response = client.post(
            "/add-knowledge",
            json={
                "category": "test"
                # missing "content" and "source"
            }
        )
        
        assert response.status_code == 422  # Validation error

    def test_add_knowledge_document_with_custom_metadata(self, mock_rag_service):
        """Test adding knowledge document with custom metadata."""
        mock_collection = MagicMock()
        mock_rag_service.productivity_collection = mock_collection
        
        custom_metadata = {
            "author": "John Doe",
            "difficulty": "intermediate",
            "tags": ["time-management", "efficiency"]
        }
        
        response = client.post(
            "/add-knowledge",
            json={
                "content": "Advanced productivity technique",
                "source": "expert_guide",
                "category": "advanced_tips",
                "metadata": custom_metadata
            }
        )
        
        assert response.status_code == 200
        
        # Verify custom metadata was included
        call_args = mock_collection.add.call_args
        stored_metadata = call_args[1]['metadatas'][0]
        assert stored_metadata["author"] == "John Doe"
        assert stored_metadata["difficulty"] == "intermediate"
        assert stored_metadata["tags"] == ["time-management", "efficiency"]
        assert stored_metadata["category"] == "advanced_tips"
        assert stored_metadata["source"] == "expert_guide"

    def test_ask_success(self, mock_rag_service, sample_rag_response): # sample_rag_response from conftest
        """Test successful question asking via /ask endpoint."""
        mock_rag_service.search_similar_weeks = AsyncMock(return_value=sample_rag_response)

        response = client.post(
            "/ask",
            params={"question": "How to be productive?", "max_results": 3}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["question"] == "How to be productive?"
        assert data["answer"] == sample_rag_response.answer
        assert len(data["sources"]) == len(sample_rag_response.results)
        if sample_rag_response.results: # Ensure there are results to check
            assert data["sources"][0]["content"] == sample_rag_response.results[0].content
            assert data["sources"][0]["relevance"] == round(sample_rag_response.results[0].relevance_score, 2)

        mock_rag_service.search_similar_weeks.assert_called_once()
        # Check the RAGQuery object passed to the service call
        called_args, called_kwargs = mock_rag_service.search_similar_weeks.call_args
        assert len(called_args) == 1 # First positional argument is the RAGQuery object
        called_rag_query = called_args[0]

        assert isinstance(called_rag_query, RAGQuery)
        assert called_rag_query.query == "How to be productive?"
        assert called_rag_query.max_results == 3
        assert called_rag_query.context is None # Default context

    def test_ask_empty_question(self, mock_rag_service):
        """Test /ask endpoint with an empty question."""
        response = client.post(
            "/ask",
            params={"question": "   "}
        )

        assert response.status_code == 400
        assert "Question cannot be empty" in response.json()["detail"]
        mock_rag_service.search_similar_weeks.assert_not_called()

    def test_ask_service_error(self, mock_rag_service):
        """Test /ask endpoint when the service throws an error."""
        mock_rag_service.search_similar_weeks = AsyncMock(side_effect=Exception("Service failure"))

        response = client.post(
            "/ask",
            params={"question": "This will fail"}
        )

        assert response.status_code == 500
        assert "Failed to process question: Service failure" in response.json()["detail"]
        mock_rag_service.search_similar_weeks.assert_called_once()