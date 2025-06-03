import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.ai_service import AIService
from models.pydantic_models import TaskData, FocusLevel, SummaryResponse, WeeklyStats


class TestAIService:
    """Test cases for AIService."""

    @pytest.fixture
    def ai_service(self):
        """Create AIService instance for testing."""
        with patch('services.ai_service.AsyncOpenAI'):
            return AIService()

    @pytest.mark.asyncio
    async def test_generate_weekly_summary_success(self, ai_service, sample_tasks, mock_openai_response):
        """Test successful weekly summary generation."""
        # Mock the OpenAI client response
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_openai_response)
        
        result = await ai_service.generate_weekly_summary(
            tasks=sample_tasks,
            week_start="2024-01-15",
            week_end="2024-01-21"
        )
        
        assert isinstance(result, SummaryResponse)
        assert result.summary == "Test summary"
        assert result.insights == ["Test insight"]
        assert result.recommendations == ["Test recommendation"]
        assert result.stats.totalTasks == 3
        assert result.stats.totalHours == "7.0"
        assert result.stats.avgFocus == FocusLevel.medium

    @pytest.mark.asyncio
    async def test_generate_weekly_summary_empty_tasks(self, ai_service):
        """Test weekly summary generation with empty tasks."""
        result = await ai_service.generate_weekly_summary(
            tasks=[],
            week_start="2024-01-15",
            week_end="2024-01-21"
        )
        
        assert isinstance(result, SummaryResponse)
        assert result.stats.totalTasks == 0
        assert result.stats.totalHours == "0.0"
        assert result.stats.avgFocus == FocusLevel.no_tasks

    @pytest.mark.asyncio
    async def test_generate_weekly_summary_api_error(self, ai_service, sample_tasks):
        """Test weekly summary generation when OpenAI API fails."""
        # Mock API failure
        ai_service.client.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))
        
        result = await ai_service.generate_weekly_summary(
            tasks=sample_tasks,
            week_start="2024-01-15",
            week_end="2024-01-21"
        )
        
        assert isinstance(result, SummaryResponse)
        assert "Unable to generate AI summary" in result.summary
        assert result.insights == []
        assert result.recommendations == []
        assert result.stats.avgFocus == FocusLevel.no_tasks

    @pytest.mark.asyncio
    async def test_generate_weekly_summary_invalid_json(self, ai_service, sample_tasks):
        """Test weekly summary generation when OpenAI returns invalid JSON."""
        # Mock invalid JSON response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Invalid JSON response"
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await ai_service.generate_weekly_summary(
            tasks=sample_tasks,
            week_start="2024-01-15",
            week_end="2024-01-21"
        )
        
        assert isinstance(result, SummaryResponse)
        assert "Unable to generate AI summary" in result.summary
        assert result.stats.avgFocus == FocusLevel.no_tasks

    @pytest.mark.asyncio
    async def test_generate_weekly_summary_focus_calculations(self, ai_service):
        """Test focus level calculations in weekly summary."""
        # Create tasks with specific focus levels
        high_focus_tasks = [
            TaskData(id="1", name="Task 1", timeSpent=1.0, focusLevel=FocusLevel.high, date="2024-01-15"),
            TaskData(id="2", name="Task 2", timeSpent=1.0, focusLevel=FocusLevel.high, date="2024-01-16"),
            TaskData(id="3", name="Task 3", timeSpent=1.0, focusLevel=FocusLevel.high, date="2024-01-17")
        ]
        
        # Mock successful API response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"summary": "High focus week", "insights": [], "recommendations": []}'
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await ai_service.generate_weekly_summary(
            tasks=high_focus_tasks,
            week_start="2024-01-15",
            week_end="2024-01-21"
        )
        
        assert result.stats.avgFocus == FocusLevel.high
        assert result.stats.totalHours == "3.0"

    @pytest.mark.asyncio
    async def test_enhance_summary_with_context_success(self, ai_service):
        """Test successful summary enhancement."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Enhanced summary with additional context"
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await ai_service.enhance_summary_with_context(
            summary="Original summary",
            additional_context="Additional context information"
        )
        
        assert result == "Enhanced summary with additional context"
        ai_service.client.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_enhance_summary_with_context_error(self, ai_service):
        """Test summary enhancement when API fails."""
        ai_service.client.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))
        
        original_summary = "Original summary"
        result = await ai_service.enhance_summary_with_context(
            summary=original_summary,
            additional_context="Additional context"
        )
        
        # Should return original summary on error
        assert result == original_summary

    @pytest.mark.asyncio 
    async def test_generate_weekly_summary_mixed_focus_levels(self, ai_service):
        """Test weekly summary with mixed focus levels."""
        mixed_tasks = [
            TaskData(id="1", name="Low focus task", timeSpent=2.0, focusLevel=FocusLevel.low, date="2024-01-15"),
            TaskData(id="2", name="Medium focus task", timeSpent=3.0, focusLevel=FocusLevel.medium, date="2024-01-16"),
            TaskData(id="3", name="High focus task", timeSpent=1.0, focusLevel=FocusLevel.high, date="2024-01-17")
        ]
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"summary": "Mixed focus week", "insights": [], "recommendations": []}'
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await ai_service.generate_weekly_summary(
            tasks=mixed_tasks,
            week_start="2024-01-15",
            week_end="2024-01-21"
        )
        
        assert result.stats.totalTasks == 3
        assert result.stats.totalHours == "6.0"
        assert result.stats.avgFocus == FocusLevel.medium  # Average of 1,2,3 = 2 (medium)

    @pytest.mark.asyncio
    async def test_enhance_summary_strips_whitespace(self, ai_service):
        """Test that enhanced summary strips whitespace."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "  Enhanced summary with whitespace  "
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await ai_service.enhance_summary_with_context(
            summary="Original summary",
            additional_context="Additional context"
        )
        
        assert result == "Enhanced summary with whitespace"
        assert not result.startswith(" ")
        assert not result.endswith(" ")

    @pytest.mark.asyncio
    async def test_generate_weekly_summary_no_tasks(self, ai_service):
        """Test weekly summary generation with no tasks."""
        result = await ai_service.generate_weekly_summary(
            tasks=[],
            week_start="2024-01-15",
            week_end="2024-01-21"
        )
        assert result.stats.totalTasks == 0
        assert result.stats.totalHours == "0.0"
        assert result.stats.avgFocus == FocusLevel.no_tasks
        assert result.summary == "No tasks completed this week."
        assert result.insights == []
        assert result.recommendations == []