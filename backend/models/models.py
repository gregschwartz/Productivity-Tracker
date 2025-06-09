from datetime import datetime, time
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Literal, Union
from pydantic import BaseModel, Field, validator, field_validator
from sqlmodel import SQLModel, Field as SQLField
import sqlalchemy
from pydantic.networks import PostgresDsn
from pgvector.sqlalchemy import Vector

class FocusLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    no_tasks = "no_tasks"

class Task(SQLModel, table=True):
    """Task model - works for database, API input, and API output."""
    __tablename__ = "tasks"
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    name: str = SQLField(description="What the task was")
    time_spent: float = SQLField(description="Time spent in hours")
    focus_level: FocusLevel = SQLField(description="Focus level of the task, used to help understand how well I worked on it")
    date: datetime = SQLField(index=True, description="Date and time when the task was completed")
    created_at: Optional[datetime] = SQLField(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = SQLField(default_factory=datetime.utcnow)

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v

    @field_validator('time_spent')
    @classmethod
    def validate_time_spent(cls, v):
        if v < 0:
            raise ValueError('Time spent cannot be negative')
        return v

    @field_validator('date', mode='before')
    @classmethod
    def validate_date(cls, v):
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('Date must be a valid ISO format datetime string')
        elif isinstance(v, datetime):
            return v
        else:
            raise ValueError('Date must be a datetime object or ISO format string')

class WeeklyStats(BaseModel):
    total_tasks: int = Field(..., ge=0, description="Total number of tasks")
    total_hours: str = Field(..., description="Total hours worked")
    avg_focus: FocusLevel = Field(..., description="Average focus level")

    @field_validator('total_tasks')
    @classmethod
    def validate_total_tasks(cls, v):
        if v < 0:
            raise ValueError('Total tasks cannot be negative')
        return v

class SummaryRequest(BaseModel):
    tasks: List[Task] = Field(..., min_length=1, description="List of tasks (must not be empty)")
    week_start: str = Field(..., description="Week start date in YYYY-MM-DD format") 
    week_end: str = Field(..., description="Week end date in YYYY-MM-DD format")
    week_stats: WeeklyStats = Field(..., description="Weekly statistics")
    context_summaries: Optional[Dict[str, Any]] = Field(None, description="Surrounding week summaries for context")

    @field_validator('week_start')
    @classmethod
    def validate_week_start(cls, v):
        if not v or not v.strip():
            raise ValueError('Week start cannot be empty')
        return v

    @field_validator('week_end')
    @classmethod
    def validate_week_end(cls, v):
        if not v or not v.strip():
            raise ValueError('Week end cannot be empty')
        return v

class SearchResult(BaseModel):
    content: str
    source: str
    relevance_score: float
    metadata: Optional[Dict[str, Any]] = None

class WeeklySummary(SQLModel, table=True):
    """Weekly summary model - works for database, API input, and API output."""
    __tablename__ = "weekly_summaries"
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    week_start: str = SQLField(index=True)
    week_end: str = SQLField(index=True)
    summary: str = SQLField(description="Summary of the week's tasks and productivity metrics")
    stats: Dict[str, Any] = SQLField(default_factory=dict, sa_type=sqlalchemy.JSON, description="Weekly statistics")
    recommendations: List[str] = SQLField(default_factory=list, sa_type=sqlalchemy.JSON, description="Recommendations to improve efficiency or focus for the next week")
    embedding: Optional[List[float]] = SQLField(None, sa_type=Vector(1536), description="Embedding of the summary for vector search")
    created_at: Optional[datetime] = SQLField(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = SQLField(default_factory=datetime.utcnow)

    @field_validator('week_start')
    @classmethod
    def validate_week_start(cls, v):
        if not v or not v.strip():
            raise ValueError('Week start cannot be empty')
        return v

    @field_validator('week_end')
    @classmethod
    def validate_week_end(cls, v):
        if not v or not v.strip():
            raise ValueError('Week end cannot be empty')
        return v

    @field_validator('summary')
    @classmethod
    def validate_summary(cls, v):
        if not v or not v.strip():
            raise ValueError('Summary cannot be empty')
        return v

    class Config:
        arbitrary_types_allowed = True

class SummaryResponse(BaseModel):
    """Response model for AI-generated summaries."""
    summary: str = Field(..., description="AI generated summary")
    recommendations: List[str] = Field(..., description="AI generated recommendations")
