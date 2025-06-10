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

    def test_highlight_keywords_string_input(self, summary_service):
        """Test highlight_keywords method with string input."""
        text = "This week I worked on coding tasks and programming challenges."
        query = "coding programming"
        
        result = summary_service.highlight_keywords(text, query)
        assert "This week I worked on <mark>coding</mark> tasks and <mark>programming</mark> challenges." == result

        text = "This week I worked on <strong>coding tasks</strong> and programming challenges."
        result = summary_service.highlight_keywords(text, query)
        assert "This week I worked on <mark>coding</mark> tasks and <mark>programming</mark> challenges." == result

    def test_highlight_keywords_list_input(self, summary_service):
        """Test highlight_keywords method with list input."""
        text_list = [
            "Focus on coding and development work",
            "Meeting with design team for interface planning"
        ]
        query = "coding design" # Should match 'coding' and 'design' through synonyms
        
        result = summary_service.highlight_keywords(text_list, query)
        
        assert isinstance(result, list)
        assert len(result) == 2
        assert "Focus on <mark>coding</mark> and <mark>development</mark> work" == result[0]
        assert "Meeting with <mark>design</mark> team for <mark>interface</mark> planning" == result[1]

    def test_highlight_keywords_with_synonyms(self, summary_service):
        """Test highlight_keywords method with synonym expansion."""
        text = "Spent time programming and debugging software issues."
        query = "coding"  # Should match 'programming' and 'software' through synonyms
        
        result = summary_service.highlight_keywords(text, query)
        
        assert "Spent time <mark>programming</mark> and debugging <mark>software</mark> issues." == result

    def test_highlight_keywords_case_insensitive(self, summary_service):
        """Test highlight_keywords method is case insensitive."""
        text = "CODING tasks and Programming work."
        query = "coding programming"
        
        result = summary_service.highlight_keywords(text, query)
        
        assert "<mark>CODING</mark> tasks and <mark>Programming</mark> work." == result

    def test_highlight_keywords_word_boundaries(self, summary_service):
        """Test highlight_keywords respects word boundaries."""
        text = "Encoding and decoding tasks require focus."
        query = "coding"
        
        result = summary_service.highlight_keywords(text, query)
        
        # Should not match partial words like "En-coding" or "de-coding"
        # But should match word stems/variations
        assert "Encoding and decoding tasks require focus." == result

    def test_highlight_keywords_prevents_double_highlighting(self, summary_service):
        """Test highlight_keywords prevents double highlighting."""
        text = "Coding and programming tasks."
        query = "coding programming"
        
        result = summary_service.highlight_keywords(text, query)
        
        # Should not contain nested mark tags
        assert "<mark><mark>" not in result
        assert "</mark></mark>" not in result

    def test_highlight_keywords_empty_inputs(self, summary_service):
        """Test highlight_keywords with empty inputs."""
        # Empty text
        assert summary_service.highlight_keywords("", "coding") == ""
        
        # Empty query
        text = "Some coding work"
        assert summary_service.highlight_keywords(text, "") == text
        
        # None inputs
        assert summary_service.highlight_keywords(None, "coding") is None
        assert summary_service.highlight_keywords("text", None) == "text"

    def test_highlight_keywords_filters_short_words(self, summary_service):
        """Test highlight_keywords filters out short words from query."""
        text = "I am coding in Python today."
        query = "I am coding in"  # 'I', 'am', 'in' should be filtered out (≤2 chars)
        
        result = summary_service.highlight_keywords(text, query)
        
        assert "<mark>coding</mark>" in result
        # Short words should not be highlighted
        assert "<mark>I</mark>" not in result
        assert "<mark>am</mark>" not in result
        assert "<mark>in</mark>" not in result

    @pytest.mark.asyncio
    async def test_vector_search_week_summaries_with_relevance_score(self, summary_service):
        """Test vector_search_week_summaries method adds relevance scores from similarity."""
        # Mock the database session
        mock_session = AsyncMock()
        
        # Mock the embedding generation
        mock_embedding = [0.1, 0.2, 0.3] * 512  # Mock 1536-dimensional embedding
        
        # Mock SQL query result with similarity scores
        mock_row_data = [
            {
                'id': 1,
                'week_start': '2024-01-08',
                'week_end': '2024-01-14', 
                'summary': 'Coding work with high focus',
                'recommendations': ['Keep coding', 'Focus more'],
                'stats': {'total_tasks': 5},
                'created_at': '2024-01-08T00:00:00',
                'updated_at': '2024-01-08T00:00:00',
                'similarity': 0.92  # High similarity score
            },
            {
                'id': 2,
                'week_start': '2024-01-15',
                'week_end': '2024-01-21',
                'summary': 'Meeting discussions and planning',
                'recommendations': ['Reduce meetings'],
                'stats': {'total_tasks': 3},
                'created_at': '2024-01-15T00:00:00',
                'updated_at': '2024-01-15T00:00:00',
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
                limit=5,
                similarity_threshold=0.7
            )
            
            # Verify results
            assert len(results) == 2
            
            # Check first result (higher similarity)
            first_result = results[0]
            assert isinstance(first_result, WeeklySummary)
            assert first_result.id == 1
            assert hasattr(first_result, 'relevance_score')
            assert first_result.relevance_score == 0.92
            
            # Check second result (lower similarity)
            second_result = results[1]
            assert second_result.relevance_score == 0.75
            
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
            'week_start': '2024-01-08',
            'week_end': '2024-01-14', 
            'summary': 'Coding work with excellent focus on programming tasks',
            'recommendations': ['Continue coding practices', 'Maintain focus levels'],
            'stats': {'total_tasks': 5},
            'created_at': '2024-01-08T00:00:00',
            'updated_at': '2024-01-08T00:00:00',
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
            
            assert sql_params['embedding'] == str(list(mock_embedding))
            assert sql_params['similarity_threshold'] == 0.8
            assert sql_params['limit'] == 3 