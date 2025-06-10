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

from models.models import Task, FocusLevel, WeeklyStats, SummaryResponse

@pytest.fixture
def sample_tasks() -> List[Task]:
    """Sample task data for testing."""
    return [
        Task(
            id=1,
            name="Code review",
            time_spent=2.5,
            focus_level=FocusLevel.high,
            date_worked="2024-01-15"
        ),
        Task(
            id=2,
            name="Bug fixing",
            time_spent=3.0,
            focus_level=FocusLevel.medium,
            date_worked="2024-01-16"
        ),
        Task(
            id=3,
            name="Documentation",
            time_spent=1.5,
            focus_level=FocusLevel.low,
            date_worked="2024-01-17"
        )
    ]

@pytest.fixture
def sample_weekly_stats() -> WeeklyStats:
    """Sample weekly stats for testing."""
    return WeeklyStats(
        total_tasks=3,
        total_hours="7.0",
        avg_focus=FocusLevel.medium
    )

@pytest.fixture
def sample_summary_response() -> SummaryResponse:
    """Sample summary response for testing."""
    return SummaryResponse(
        summary="This week showed good productivity with 3 tasks completed.",
        recommendations=[
            "Allocate more time for documentation",
            "Maintain high focus for code reviews",
            "Consider time-boxing bug fixes"
        ]
    )

# RAG-related fixtures removed as models not defined in current schema

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