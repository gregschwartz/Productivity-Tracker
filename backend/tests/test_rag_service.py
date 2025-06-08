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

import asyncio

# --- Integration Tests for RAGService (real ChromaDB) ---
@pytest.mark.integration # Mark this class to be potentially run separately
class TestRAGServiceIntegration:
    """Integration tests for RAGService with a real ChromaDB instance."""

    sample_summary_1 = {
        "week_start": "2023-01-02", "week_end": "2023-01-08",
        "summary": "Focused on project Alpha, good progress.",
        "insights": ["Deep work sessions effective"], "recommendations": ["Continue deep work"],
        "stats": {"totalTasks": 10, "totalHours": "35.0", "avgFocus": "High"}
    }
    sample_summary_2 = {
        "week_start": "2023-01-09", "week_end": "2023-01-15",
        "summary": "Bug fixes and code reviews, many interruptions.",
        "insights": ["Context switching high"], "recommendations": ["Batch similar tasks"],
        "stats": {"totalTasks": 25, "totalHours": "40.0", "avgFocus": "Low"}
    }
    sample_summary_3 = { # Similar to summary 1 for search testing
        "week_start": "2023-01-16", "week_end": "2023-01-22",
        "summary": "Continued Alpha project, maintained good focus.",
        "insights": ["Morning hours productive"], "recommendations": ["Prioritize mornings"],
        "stats": {"totalTasks": 12, "totalHours": "38.0", "avgFocus": "High"}
    }

    @pytest.fixture(autouse=True)
    def use_temp_chromadb(self, temp_chromadb_dir):
        """Ensures CHROMA_PERSIST_DIRECTORY is set by temp_chromadb_dir fixture."""
        # This fixture is auto-used by tests in this class.
        # temp_chromadb_dir (from conftest.py) sets and unsets the env var.
        # No need to do anything here, its presence activates the temp_chromadb_dir fixture.
        pass

    @pytest.fixture
    def temp_rag_service(self):
        """Provides a RAGService instance for integration tests, with mocked OpenAI."""
        # CHROMA_PERSIST_DIRECTORY is already set by use_temp_chromadb -> temp_chromadb_dir
        # So RAGService() will use the temporary directory.
        # We mock OpenAI to prevent actual API calls during these DB-focused tests.
        with patch('services.rag_service.AsyncOpenAI') as mock_openai_constructor:
            mock_openai_instance = AsyncMock()
            mock_openai_constructor.return_value = mock_openai_instance

            # Setup mock for chat.completions.create
            mock_openai_instance.chat = MagicMock()
            mock_openai_instance.chat.completions = MagicMock()
            mock_openai_instance.chat.completions.create = AsyncMock(
                return_value=MagicMock(choices=[MagicMock(message=MagicMock(content="Mocked AI (integration)"))])
            )

            service = RAGService()
            return service

    @pytest.mark.asyncio
    async def test_store_and_retrieve_weekly_summary(self, temp_rag_service):
        """Test storing and retrieving a weekly summary from a real ChromaDB instance."""
        rag_service = temp_rag_service
        week_id = f"week_{self.sample_summary_1['week_start']}_{self.sample_summary_1['week_end']}"

        rag_service.store_weekly_summary(self.sample_summary_1)

        # Optional: brief pause for disk operations, though usually not critical for PersistentClient
        # await asyncio.sleep(0.05)

        retrieved = rag_service.summaries_collection.get(ids=[week_id])

        assert retrieved is not None, "Failed to retrieve any data."
        assert len(retrieved['ids']) == 1, f"Expected 1 ID, got {len(retrieved['ids'])}. DB content: {rag_service.summaries_collection.get()}"
        assert retrieved['ids'][0] == week_id
        assert retrieved['metadatas'][0]['summary'] == self.sample_summary_1['summary']
        assert self.sample_summary_1['summary'] in retrieved['documents'][0] # Check if summary part of searchable text
        assert rag_service.summaries_collection.count() == 1

    @pytest.mark.asyncio
    async def test_search_similar_weeks_integration(self, temp_rag_service):
        """Test searching for similar weeks using a real ChromaDB instance."""
        rag_service = temp_rag_service
        rag_service.store_weekly_summary(self.sample_summary_1) # Alpha project
        rag_service.store_weekly_summary(self.sample_summary_2) # Bug fixes
        rag_service.store_weekly_summary(self.sample_summary_3) # Alpha project again

        # await asyncio.sleep(0.05)
        assert rag_service.summaries_collection.count() == 3

        query_text = "Tell me about project Alpha focus" # Should match summary 1 and 3
        rag_query = RAGQuery(query=query_text, max_results=3)

        response = await rag_service.search_similar_weeks(rag_query)

        assert response is not None
        assert len(response.results) > 0, "Should find at least one similar week for 'project Alpha'"
        assert response.answer == "Mocked AI (integration)" # Check if mocked AI response is returned

        found_alpha_related = any("Alpha" in res.content for res in response.results)
        assert found_alpha_related, "Search results should contain 'Alpha' related content"

        for r_idx, r_val in enumerate(response.results):
            assert 0.0 <= r_val.relevance_score <= 1.0, f"Relevance score out of bounds for result {r_idx}"

    @pytest.mark.asyncio
    async def test_chromadb_persistence(self, temp_chromadb_dir): # Uses temp_chromadb_dir to ensure env var is set
        """Test that ChromaDB data persists between RAGService instances using the same path."""

        # Instance 1: Store data
        # Mock OpenAI for the first instance
        with patch('services.rag_service.AsyncOpenAI') as mock_openai_constructor_s1:
            mock_openai_instance_s1 = AsyncMock()
            mock_openai_constructor_s1.return_value = mock_openai_instance_s1
            mock_openai_instance_s1.chat.completions.create = AsyncMock(return_value=MagicMock(choices=[MagicMock(message=MagicMock(content="S1 AI"))]))
            service1 = RAGService() # Uses CHROMA_PERSIST_DIRECTORY from temp_chromadb_dir

        service1.store_weekly_summary(self.sample_summary_1)
        # await asyncio.sleep(0.05)
        count1 = service1.summaries_collection.count()
        week_id_1 = f"week_{self.sample_summary_1['week_start']}_{self.sample_summary_1['week_end']}"

        assert count1 == 1, "Service 1 should have 1 item after storing."
        # Explicitly delete to simulate service stop or a different process accessing the DB
        del service1
        # await asyncio.sleep(0.1) # Optional: small delay for OS to release file locks if any

        # Instance 2: Re-initialize and check data
        # Mock OpenAI for the second instance
        with patch('services.rag_service.AsyncOpenAI') as mock_openai_constructor_s2:
            mock_openai_instance_s2 = AsyncMock()
            mock_openai_constructor_s2.return_value = mock_openai_instance_s2
            mock_openai_instance_s2.chat.completions.create = AsyncMock(return_value=MagicMock(choices=[MagicMock(message=MagicMock(content="S2 AI"))]))
            service2 = RAGService() # Should load from the same path in temp_chromadb_dir

        assert service2.summaries_collection.count() == count1, \
            f"Service 2 count mismatch. Expected {count1}, got {service2.summaries_collection.count()}."

        retrieved_by_s2 = service2.summaries_collection.get(ids=[week_id_1])
        assert len(retrieved_by_s2['ids']) == 1, "Service 2 failed to retrieve the persisted item."
        assert retrieved_by_s2['metadatas'][0]['summary'] == self.sample_summary_1['summary']
        del service2