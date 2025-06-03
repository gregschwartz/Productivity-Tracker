from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class FocusLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskData(BaseModel):
    id: str
    name: str
    timeSpent: float = Field(..., description="Time spent in hours")
    focusLevel: FocusLevel
    date: str = Field(..., description="Date in YYYY-MM-DD format")

class WeeklyStats(BaseModel):
    totalTasks: int
    totalHours: str
    avgFocus: str
    topFocus: FocusLevel

class SummaryRequest(BaseModel):
    tasks: List[TaskData]
    weekStart: str = Field(..., description="Week start date in YYYY-MM-DD format")
    weekEnd: str = Field(..., description="Week end date in YYYY-MM-DD format")

class SummaryResponse(BaseModel):
    summary: str = Field(..., description="AI-generated weekly summary")
    insights: List[str] = Field(..., description="Key insights from the week")
    recommendations: List[str] = Field(..., description="Recommendations for improvement")
    stats: WeeklyStats

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
    
class HealthResponse(BaseModel):
    status: str = Field(..., description="Health status")
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = Field("1.0.0", description="API version") 