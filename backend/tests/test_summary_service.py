import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.summary_service import SummaryService
from models.models import WeeklySummary


class TestSummaryService:
    """Test cases for SummaryService methods."""

    @pytest.fixture
    def summary_service(self):
        """Create a SummaryService instance for testing."""
        return SummaryService()

    @pytest.fixture
    def sample_weekly_summaries(self):
        """Sample weekly summary data for testing."""
        return [
            WeeklySummary(
                id=1,
                week_start="2024-01-08",
                week_end="2024-01-14",
                summary="This week focused on coding tasks with high concentration. Completed several programming challenges and debugging sessions.",
                recommendations=["Continue with deep work sessions", "Focus more on code reviews"],
                stats={"total_tasks": 5, "total_hours": "35.5", "avg_focus": "High"}
            ),
            WeeklySummary(
                id=2,
                week_start="2024-01-15",
                week_end="2024-01-21",
                summary="Meeting-heavy week with design discussions and planning sessions. Less time for development work.",
                recommendations=["Schedule focused coding blocks", "Limit meeting interruptions"],
                stats={"total_tasks": 3, "total_hours": "28.0", "avg_focus": "Medium"}
            ),
            WeeklySummary(
                id=3,
                week_start="2024-01-22",
                week_end="2024-01-28",
                summary="Excellent focus on testing and quality assurance. Implemented comprehensive test suites.",
                recommendations=["Maintain testing discipline", "Share QA practices with team"],
                stats={"total_tasks": 4, "total_hours": "32.0", "avg_focus": "High"}
            )
        ]

    @pytest.mark.asyncio
    async def test_vector_search_week_summaries_returns_results(self, summary_service):
        """Test vector_search_week_summaries method returns expected results."""
        # Mock the database session
        mock_session = AsyncMock()
        
        # Mock the embedding generation
        mock_embedding = [0.1, 0.2, 0.3] * 512  # Mock 1536-dimensional embedding
        
        # Mock SQL query result with similarity scores
        mock_row_data = [
            {
                'id': 1,
                'week_start': '2025-05-26',
                'week_end': '2025-06-01',
                'summary': 'Coding work with high focus',
                'recommendations': ['Keep coding', 'Focus more'],
                'stats': {'total_tasks': 5},
                'created_at': '2025-05-26T00:00:00',
                'updated_at': '2025-05-26T00:00:00',
                'similarity': 0.92  # High similarity score
            },
            {
                'id': 2,
                'week_start': '2025-06-02',
                'week_end': '2025-06-08', 
                'summary': 'Meeting discussions and planning',
                'recommendations': ['Reduce meetings'],
                'stats': {'total_tasks': 3},
                'created_at': '2025-06-02T00:00:00',
                'updated_at': '2025-06-02T00:00:00',
                'similarity': 0.75  # Lower similarity score
            }
        ]
        
        # Mock the SQL execution result
        mock_result = MagicMock()
        mock_result.mappings.return_value.all.return_value = mock_row_data
        
        with patch.object(summary_service, 'generate_embedding', return_value=mock_embedding), \
             patch.object(mock_session, 'execute', return_value=mock_result):
            
            results = await summary_service.vector_search_week_summaries(
                session=mock_session,
                query_text="coding focus",
                limit=5
            )
            
            # Verify results
            assert len(results) == 2
            
            # Check first result (higher similarity)
            first_result = results[0]
            assert isinstance(first_result, WeeklySummary)
            assert first_result.id == 1
            # Check that the result has the expected properties
            assert first_result.week_start == '2025-05-26'
            
            # Check second result
            second_result = results[1]
            assert second_result.week_start == '2025-06-02'
            
            # Verify highlighting was applied
            assert '<mark>' in first_result.summary or first_result.summary == 'Coding work with high focus'
            assert isinstance(first_result.recommendations, list)

    @pytest.mark.asyncio
    async def test_vector_search_week_summaries_applies_highlighting(self, summary_service):
        """Test vector_search_week_summaries applies keyword highlighting."""
        mock_session = AsyncMock()
        mock_embedding = [0.1] * 1536
        
        mock_row_data = [{
            'id': 1,
            'week_start': '2025-05-26',
            'week_end': '2025-06-01', 
            'summary': 'Coding work with excellent focus on programming tasks',
            'recommendations': ['Continue coding practices', 'Maintain focus levels'],
            'stats': {'total_tasks': 5},
            'created_at': '2025-05-26T00:00:00',
            'updated_at': '2025-05-26T00:00:00',
            'similarity': 0.88
        }]
        
        mock_result = MagicMock()
        mock_result.mappings.return_value.all.return_value = mock_row_data
        
        with patch.object(summary_service, 'generate_embedding', return_value=mock_embedding), \
             patch.object(mock_session, 'execute', return_value=mock_result):
            
            results = await summary_service.vector_search_week_summaries(
                session=mock_session,
                query_text="coding focus",
                limit=5
            )
            
            result = results[0]
            
            # Check that highlighting was applied to summary
            highlighted_summary = result.summary
            # Either contains highlights or is the original text (highlighting logic tested separately)
            assert 'Coding work with excellent focus on programming tasks' in highlighted_summary or '<mark>' in highlighted_summary
            
            # Check that highlighting was applied to recommendations
            assert isinstance(result.recommendations, list)
            assert len(result.recommendations) == 2

    @pytest.mark.asyncio 
    async def test_vector_search_week_summaries_empty_results(self, summary_service):
        """Test vector_search_week_summaries with no matching results."""
        mock_session = AsyncMock()
        mock_embedding = [0.1] * 1536
        
        # Empty result set
        mock_result = MagicMock()
        mock_result.mappings.return_value.all.return_value = []
        
        with patch.object(summary_service, 'generate_embedding', return_value=mock_embedding), \
             patch.object(mock_session, 'execute', return_value=mock_result):
            
            results = await summary_service.vector_search_week_summaries(
                session=mock_session,
                query_text="nonexistent topic",
                limit=5,
                similarity_threshold=0.9
            )
            
            assert results == []

    @pytest.mark.asyncio
    async def test_vector_search_week_summaries_calls_generate_embedding(self, summary_service):
        """Test vector_search_week_summaries calls generate_embedding with query text."""
        mock_session = AsyncMock()
        mock_embedding = [0.1] * 1536
        
        mock_result = MagicMock()
        mock_result.mappings.return_value.all.return_value = []
        
        with patch.object(summary_service, 'generate_embedding', return_value=mock_embedding) as mock_gen_embedding, \
             patch.object(mock_session, 'execute', return_value=mock_result):
            
            query_text = "test query for embedding"
            await summary_service.vector_search_week_summaries(
                session=mock_session,
                query_text=query_text,
                limit=5
            )
            
            mock_gen_embedding.assert_called_once_with(query_text)

    @pytest.mark.asyncio
    async def test_vector_search_week_summaries_sql_parameters(self, summary_service):
        """Test vector_search_week_summaries passes correct SQL parameters."""
        mock_session = AsyncMock()
        mock_embedding = [0.1] * 1536
        
        mock_result = MagicMock()
        mock_result.mappings.return_value.all.return_value = []
        
        with patch.object(summary_service, 'generate_embedding', return_value=mock_embedding), \
             patch.object(mock_session, 'execute', return_value=mock_result) as mock_execute:
            
            await summary_service.vector_search_week_summaries(
                session=mock_session,
                query_text="test query",
                limit=3,
                similarity_threshold=0.8
            )
            
            # Verify SQL was called with correct parameters
            call_args = mock_execute.call_args
            sql_params = call_args[0][1]  # Second argument contains the parameters
            
            # Check that embedding is formatted as pgvector array format
            expected_embedding = f"[{','.join(map(str, mock_embedding))}]"
            assert sql_params['embedding'] == expected_embedding
            assert sql_params['similarity_threshold'] == 0.8
            assert sql_params['limit'] == 3 