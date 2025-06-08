import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List
import sys
import os
import warnings

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Filter out weave-related deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="weave.*")
warnings.filterwarnings("ignore", message=".*sentry_sdk.Hub.*")
warnings.filterwarnings("ignore", message=".*warn.*method.*deprecated.*")

# Configure pytest to ignore weave warnings at the start of testing
def pytest_configure(config):
    warnings.filterwarnings("ignore", category=DeprecationWarning, module="weave")
    warnings.filterwarnings("ignore", message=".*sentry_sdk.Hub.*")
    warnings.filterwarnings("ignore", message=".*warn.*method.*deprecated.*")

from models.pydantic_models import TaskData, FocusLevel, WeeklyStats, SummaryResponse, RAGQuery, RAGResult, RAGResponse

@pytest.fixture
def sample_tasks() -> List[TaskData]:
    """Sample task data for testing."""
    return [
        TaskData(
            id="1",
            name="Code review",
            timeSpent=2.5,
            focusLevel=FocusLevel.high,
            date="2024-01-15"
        ),
        TaskData(
            id="2",
            name="Bug fixing",
            timeSpent=3.0,
            focusLevel=FocusLevel.medium,
            date="2024-01-16"
        ),
        TaskData(
            id="3",
            name="Documentation",
            timeSpent=1.5,
            focusLevel=FocusLevel.low,
            date="2024-01-17"
        )
    ]

@pytest.fixture
def sample_weekly_stats() -> WeeklyStats:
    """Sample weekly stats for testing."""
    return WeeklyStats(
        totalTasks=3,
        totalHours="7.0",
        avgFocus="Medium"
    )

@pytest.fixture
def sample_summary_response() -> SummaryResponse:
    """Sample summary response for testing."""
    return SummaryResponse(
        summary="This week showed good productivity with 3 tasks completed.",
        insights=[
            "High focus on code reviews",
            "Medium focus on bug fixing",
            "Low focus on documentation"
        ],
        recommendations=[
            "Allocate more time for documentation",
            "Maintain high focus for code reviews",
            "Consider time-boxing bug fixes"
        ],
        stats=WeeklyStats(
            totalTasks=3,
            totalHours="7.0",
            avgFocus="Medium"
        )
    )

@pytest.fixture
def sample_rag_query() -> RAGQuery:
    """Sample RAG query for testing."""
    return RAGQuery(
        query="How can I improve my focus during code reviews?",
        max_results=5
    )

@pytest.fixture
def sample_rag_results() -> List[RAGResult]:
    """Sample RAG results for testing."""
    return [
        RAGResult(
            content="Week 2024-01-08 to 2024-01-14: High focus on code reviews resulted in better quality",
            source="Week 2024-01-08",
            relevance_score=0.95,
            metadata={
                "week_start": "2024-01-08",
                "week_end": "2024-01-14",
                "total_tasks": 5
            }
        ),
        RAGResult(
            content="Week 2024-01-15 to 2024-01-21: Medium focus tasks took longer than expected",
            source="Week 2024-01-15",
            relevance_score=0.82,
            metadata={
                "week_start": "2024-01-15",
                "week_end": "2024-01-21",
                "total_tasks": 4
            }
        )
    ]

@pytest.fixture
def sample_rag_response(sample_rag_results) -> RAGResponse:
    """Sample RAG response for testing."""
    return RAGResponse(
        results=sample_rag_results,
        answer="Based on your history, maintaining high focus during code reviews has led to better quality outcomes."
    )

@pytest.fixture
def mock_openai_response():
    """Mock OpenAI response for testing."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"summary": "Test summary", "insights": ["Test insight"], "recommendations": ["Test recommendation"]}'
    return mock_response

@pytest.fixture
def mock_chroma_collection():
    """Mock ChromaDB collection for testing."""
    mock_collection = MagicMock()
    mock_collection.count.return_value = 10
    mock_collection.query.return_value = {
        'documents': [['Test document content']],
        'metadatas': [[{'week_start': '2024-01-08', 'week_end': '2024-01-14', 'summary': 'Test summary'}]],
        'distances': [[0.1]]
    }
    mock_collection.add.return_value = None
    mock_collection.get.return_value = {'documents': ['doc1', 'doc2']}
    return mock_collection

@pytest.fixture
def mock_chroma_client(mock_chroma_collection):
    """Mock ChromaDB client for testing."""
    mock_client = MagicMock()
    mock_client.get_collection.return_value = mock_chroma_collection
    mock_client.create_collection.return_value = mock_chroma_collection
    return mock_client

import tempfile
import shutil

@pytest.fixture(scope="session")
def temp_chromadb_dir():
    temp_dir = tempfile.mkdtemp(prefix="chroma_test_")
    original_env_var = os.environ.get("CHROMA_PERSIST_DIRECTORY")
    os.environ["CHROMA_PERSIST_DIRECTORY"] = temp_dir
    print(f"ChromaDB persistence directory set to: {temp_dir}")

    yield temp_dir

    shutil.rmtree(temp_dir)
    if original_env_var is not None:
        os.environ["CHROMA_PERSIST_DIRECTORY"] = original_env_var
    else:
        if "CHROMA_PERSIST_DIRECTORY" in os.environ: # Ensure key exists before deleting
            del os.environ["CHROMA_PERSIST_DIRECTORY"]
    print(f"ChromaDB persistence directory {temp_dir} removed.")