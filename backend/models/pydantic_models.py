from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class FocusLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    no_tasks = "no_tasks"

class TaskData(BaseModel):
    name: str
    timeSpent: float = Field(..., description="Time spent in hours")
    focusLevel: FocusLevel = Field(..., description="Focus level of the task, used to help understand how well you worked on it")
    date: str = Field(..., description="Date in YYYY-MM-DD format")

class WeeklyStats(BaseModel):
    totalTasks: int
    totalHours: str
    avgFocus: FocusLevel

class SummaryRequest(BaseModel):
    tasks: List[TaskData]
    weekStart: str = Field(..., description="Week start date in YYYY-MM-DD format")
    weekEnd: str = Field(..., description="Week end date in YYYY-MM-DD format")
    weekStats: WeeklyStats = Field(..., description="Weekly statistics")
    contextSummaries: Optional[Dict[str, Any]] = Field(None, description="Surrounding week summaries for context")

class SummaryResponse(BaseModel):
    summary: str = Field(..., description="Summary report of the tasks and productivity metrics collected over the week")
    recommendations: List[str] = Field(..., description="Recommendations to improve efficiency or focus for the next week")

class RAGQuery(BaseModel):
    query: str = Field(..., description="User query for searching productivity history")
    max_results: int = Field(5, description="Maximum number of results to return")

class RAGResult(BaseModel):
    content: str = Field(..., description="Retrieved content")
    source: str = Field(..., description="Source of the content")
    relevance_score: float = Field(..., description="Relevance score")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class RAGResponse(BaseModel):
    results: List[RAGResult] = Field(..., description="Search results")
    answer: Optional[str] = Field(None, description="AI-generated answer based on search results")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")
