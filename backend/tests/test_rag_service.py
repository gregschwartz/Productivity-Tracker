import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.rag_service import RAGService
from models.pydantic_models import RAGQuery, RAGResponse, RAGResult


class TestRAGService:
    """Test cases for RAGService."""

    @pytest.fixture
    def rag_service(self, mock_chroma_client):
        """Create RAGService instance for testing."""
        with patch('services.rag_service.chromadb.PersistentClient', return_value=mock_chroma_client), \
             patch('services.rag_service.AsyncOpenAI'):
            service = RAGService()
            return service

    def test_init_existing_collection(self, mock_chroma_client):
        """Test RAGService initialization with existing collection."""
        mock_chroma_client.get_collection.return_value = mock_chroma_client
        
        with patch('services.rag_service.chromadb.PersistentClient', return_value=mock_chroma_client), \
             patch('services.rag_service.AsyncOpenAI'), \
             patch('builtins.print') as mock_print:
            
            service = RAGService()
            
            mock_chroma_client.get_collection.assert_called_once_with("weekly_summaries")
            assert service.summaries_collection == mock_chroma_client

    def test_init_create_new_collection(self, mock_chroma_client):
        """Test RAGService initialization when collection doesn't exist."""
        mock_chroma_client.get_collection.side_effect = Exception("Collection not found")
        mock_chroma_client.create_collection.return_value = mock_chroma_client
        
        with patch('services.rag_service.chromadb.PersistentClient', return_value=mock_chroma_client), \
             patch('services.rag_service.AsyncOpenAI'), \
             patch('builtins.print') as mock_print:
            
            service = RAGService()
            
            mock_chroma_client.create_collection.assert_called_once_with("weekly_summaries")
            assert service.summaries_collection == mock_chroma_client

    def test_store_weekly_summary_success(self, rag_service):
        """Test successful storage of weekly summary."""
        summary_data = {
            "week_start": "2024-01-15",
            "week_end": "2024-01-21",
            "summary": "Good productivity week",
            "insights": ["High focus", "Good time management"],
            "recommendations": ["Keep it up", "Try time blocking"],
            "stats": {
                "totalTasks": 5,
                "totalHours": "40.0",
                "avgFocus": "High"
            }
        }
        
        with patch('builtins.print') as mock_print:
            rag_service.store_weekly_summary(summary_data)
        
        # Verify the collection.add was called with correct parameters
        rag_service.summaries_collection.add.assert_called_once()
        call_args = rag_service.summaries_collection.add.call_args
        
        assert call_args[1]['ids'] == ["week_2024-01-15_2024-01-21"]
        assert call_args[1]['metadatas'] == [summary_data]
        assert "Week 2024-01-15 to 2024-01-21" in call_args[1]['documents'][0]
        assert "Good productivity week" in call_args[1]['documents'][0]

    def test_store_weekly_summary_error(self, rag_service):
        """Test storage error handling."""
        rag_service.summaries_collection.add.side_effect = Exception("Storage error")
        
        summary_data = {
            "week_start": "2024-01-15",
            "week_end": "2024-01-21",
            "summary": "Test summary",
            "insights": [],
            "recommendations": [],
            "stats": {}
        }
        
        with patch('builtins.print') as mock_print:
            rag_service.store_weekly_summary(summary_data)
            mock_print.assert_called_with("Error storing summary: Storage error")

    @pytest.mark.asyncio
    async def test_search_similar_weeks_success(self, rag_service, sample_rag_query):
        """Test successful search for similar weeks."""
        # Mock search results
        rag_service.summaries_collection.query.return_value = {
            'documents': [['Week content 1', 'Week content 2']],
            'metadatas': [[
                {
                    'week_start': '2024-01-08',
                    'week_end': '2024-01-14',
                    'summary': 'High productivity week'
                },
                {
                    'week_start': '2024-01-15',
                    'week_end': '2024-01-21',
                    'summary': 'Medium productivity week'
                }
            ]],
            'distances': [[0.1, 0.3]]
        }
        
        # Mock AI answer generation
        rag_service._generate_answer = AsyncMock(return_value="AI generated answer")
        
        result = await rag_service.search_similar_weeks(sample_rag_query)
        
        assert isinstance(result, RAGResponse)
        assert len(result.results) == 2
        assert result.results[0].relevance_score == 0.9  # 1.0 - 0.1
        assert result.results[1].relevance_score == 0.7  # 1.0 - 0.3
        assert result.answer == "AI generated answer"
        
        # Verify query was called correctly
        rag_service.summaries_collection.query.assert_called_once_with(
            query_texts=[sample_rag_query.query],
            n_results=5
        )

    @pytest.mark.asyncio
    async def test_search_similar_weeks_no_results(self, rag_service, sample_rag_query):
        """Test search when no similar weeks are found."""
        # Mock empty search results
        rag_service.summaries_collection.query.return_value = {
            'documents': [[]],
            'metadatas': [[]],
            'distances': [[]]
        }
        
        result = await rag_service.search_similar_weeks(sample_rag_query)
        
        assert isinstance(result, RAGResponse)
        assert len(result.results) == 0
        assert result.answer == "No similar productivity patterns found in your history."

    @pytest.mark.asyncio
    async def test_search_similar_weeks_error(self, rag_service, sample_rag_query):
        """Test search error handling."""
        rag_service.summaries_collection.query.side_effect = Exception("Search error")
        
        result = await rag_service.search_similar_weeks(sample_rag_query)
        
        assert isinstance(result, RAGResponse)
        assert len(result.results) == 0
        assert "Search failed: Search error" in result.answer

    @pytest.mark.asyncio
    async def test_search_similar_weeks_max_results_limit(self, rag_service):
        """Test that max_results is properly limited."""
        query = RAGQuery(query="test query", max_results=10)
        
        rag_service.summaries_collection.query.return_value = {
            'documents': [[]],
            'metadatas': [[]],
            'distances': [[]]
        }
        
        await rag_service.search_similar_weeks(query)
        
        # Should limit to 5 even though 10 was requested
        rag_service.summaries_collection.query.assert_called_once_with(
            query_texts=["test query"],
            n_results=5
        )

    @pytest.mark.asyncio
    async def test_generate_answer_success(self, rag_service):
        """Test successful AI answer generation."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Generated AI answer"
        
        rag_service.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await rag_service._generate_answer(
            query="How can I improve productivity?",
            context="Week 1: High focus\nWeek 2: Medium focus"
        )
        
        assert result == "Generated AI answer"
        rag_service.client.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_answer_error(self, rag_service):
        """Test AI answer generation error handling."""
        rag_service.client.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))
        
        result = await rag_service._generate_answer(
            query="test query",
            context="test context"
        )
        
        assert result == "Unable to generate analysis at this time."

    @pytest.mark.asyncio
    async def test_search_similar_weeks_no_distances(self, rag_service, sample_rag_query):
        """Test search when distances are not provided."""
        # Mock search results without distances
        rag_service.summaries_collection.query.return_value = {
            'documents': [['Week content']],
            'metadatas': [[{
                'week_start': '2024-01-08',
                'week_end': '2024-01-14',
                'summary': 'Test week'
            }]],
            'distances': None
        }
        
        rag_service._generate_answer = AsyncMock(return_value="AI answer")
        
        result = await rag_service.search_similar_weeks(sample_rag_query)
        
        assert len(result.results) == 1
        assert result.results[0].relevance_score == 0.5  # Default when no distance

    @pytest.mark.asyncio
    async def test_search_similar_weeks_context_generation(self, rag_service, sample_rag_query):
        """Test that context is properly generated for AI answer."""
        # Mock search results
        rag_service.summaries_collection.query.return_value = {
            'documents': [['Doc 1', 'Doc 2', 'Doc 3', 'Doc 4']],
            'metadatas': [[
                {'week_start': '2024-01-01', 'week_end': '2024-01-07', 'summary': 'Week 1'},
                {'week_start': '2024-01-08', 'week_end': '2024-01-14', 'summary': 'Week 2'},
                {'week_start': '2024-01-15', 'week_end': '2024-01-21', 'summary': 'Week 3'},
                {'week_start': '2024-01-22', 'week_end': '2024-01-28', 'summary': 'Week 4'}
            ]],
            'distances': [[0.1, 0.2, 0.3, 0.4]]
        }
        
        # Mock AI answer generation and capture the context
        captured_context = None
        async def capture_context(query, context):
            nonlocal captured_context
            captured_context = context
            return "AI answer"
        
        rag_service._generate_answer = AsyncMock(side_effect=capture_context)
        
        await rag_service.search_similar_weeks(sample_rag_query)
        
        # Should only use top 3 results for context
        assert captured_context.count('Week 2024-01-01 to 2024-01-07') == 1
        assert captured_context.count('Week 2024-01-08 to 2024-01-14') == 1
        assert captured_context.count('Week 2024-01-15 to 2024-01-21') == 1
        assert captured_context.count('Week 2024-01-22 to 2024-01-28') == 0  # 4th result not included 