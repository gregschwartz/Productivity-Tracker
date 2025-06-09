"""
Consolidated database service with connection, initialization, and CRUD operations.
Everything database-related lives here for simplicity.
"""
import os
from typing import List, Optional
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text, func
from sqlmodel import SQLModel, select

from models.models import WeeklySummary, Task

from config.database import ASYNC_DATABASE_URL as DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)

# OpenAI client for embeddings
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ==========================================
# DATABASE SESSION
# ==========================================
async def get_session() -> AsyncSession:
    """Get a database session."""
    return AsyncSession(engine)

# ==========================================
# TASK CRUD OPERATIONS
# ==========================================

async def create_task(task_data: Task) -> Task:
    """Create a new task that persists on refresh."""
    async with get_session() as session:
        task = Task(**task_data.dict(exclude={'id', 'created_at', 'updated_at'}))
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task

async def get_tasks(start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Task]:
    """Get tasks, optionally filtered by date range."""
    async with get_session() as session:
        query = select(Task)
        if start_date and end_date:
            query = query.where(Task.date >= start_date, Task.date < end_date)
        elif start_date:
            query = query.where(Task.date >= start_date)
        elif end_date:
            query = query.where(Task.date < end_date)
        result = await session.execute(query.order_by(Task.date.desc()))
        return result.scalars().all()

async def get_task_by_id(task_id: int) -> Optional[Task]:
    """Get a task by ID."""
    async with get_session() as session:
        query = select(Task).where(Task.id == task_id)
        result = await session.execute(query)
        return result.scalars().first()

async def update_task(task_id: int, task_data: dict) -> Optional[Task]:
    """Update a task."""
    async with get_session() as session:
        query = select(Task).where(Task.id == task_id)
        result = await session.execute(query)
        task = result.scalars().first()
        
        if not task:
            return None
            
        for key, value in task_data.items():
            if hasattr(task, key):
                setattr(task, key, value)
                
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task

async def delete_task(task_id: int) -> bool:
    """Delete a task."""
    async with get_session() as session:
        query = select(Task).where(Task.id == task_id)
        result = await session.execute(query)
        task = result.scalars().first()
        
        if not task:
            return False
            
        await session.delete(task)
        await session.commit()
        return True

async def get_count_of_tasks() -> int:
    """Get the count of tasks."""
    async with get_session() as session:
        query = select(func.count(Task.id))
        result = await session.execute(query)
        return result.scalar()

# ==========================================
# WEEKLY SUMMARY CRUD OPERATIONS
# ==========================================

async def create_weekly_summary(summary_data: WeeklySummary) -> WeeklySummary:
    """Store weekly summary with vector embedding for RAG search."""
    async with get_session() as session:
        # Generate embedding for the combined summary text
        summary_text = f"""
        Week {summary_data.week_start} to {summary_data.week_end}
        Summary: {summary_data.summary}
        Recommendations: {'; '.join(summary_data.recommendations or [])}
        """.strip()
        
        embedding = await generate_embedding(summary_text)
        
        # Create WeeklySummary with embedding
        db_summary = WeeklySummary(**summary_data.dict(exclude={'id', 'created_at', 'updated_at'}))
        db_summary.embedding = embedding
        
        session.add(db_summary)
        await session.commit()
        await session.refresh(db_summary)
        
        return db_summary

async def get_weekly_summaries(
    skip: int = 0, 
    limit: int = 10, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    query: Optional[str] = None
) -> List[WeeklySummary]:
    """Get weekly summaries with optional filtering by date range or search query."""
    async with get_session() as session:
        # If search query provided, use vector search
        if query:
            return await search_similar_weeks(query, limit)
        
        # Build query with optional date filters
        sql_query = select(WeeklySummary)
        
        if start_date and end_date:
            sql_query = sql_query.where(
                WeeklySummary.week_start >= start_date, 
                WeeklySummary.week_start <= end_date
            )
        elif start_date:
            sql_query = sql_query.where(WeeklySummary.week_start == start_date)
        elif end_date:
            sql_query = sql_query.where(WeeklySummary.week_start <= end_date)
        
        sql_query = sql_query.offset(skip).limit(limit).order_by(WeeklySummary.week_start.desc())
        result = await session.execute(sql_query)
        summaries = result.scalars().all()
        return summaries

async def get_weekly_summary_by_id(summary_id: int) -> Optional[WeeklySummary]:
    """Get a weekly summary by ID."""
    async with get_session() as session:
        query = select(WeeklySummary).where(WeeklySummary.id == summary_id)
        result = await session.execute(query)
        return result.scalars().first()

async def update_weekly_summary(summary_id: int, summary_data: dict) -> Optional[WeeklySummary]:
    """Update a weekly summary."""
    async with get_session() as session:
        query = select(WeeklySummary).where(WeeklySummary.id == summary_id)
        result = await session.execute(query)
        summary = result.scalars().first()
        
        if not summary:
            return None
            
        for key, value in summary_data.items():
            if hasattr(summary, key):
                setattr(summary, key, value)
                
        # Regenerate embedding if summary text changed
        if 'summary' in summary_data or 'recommendations' in summary_data:
            summary_text = f"""
            Week {summary.week_start} to {summary.week_end}
            Summary: {summary.summary}
            Recommendations: {'; '.join(summary.recommendations or [])}
            """.strip()
            summary.embedding = await generate_embedding(summary_text)
                
        session.add(summary)
        await session.commit()
        await session.refresh(summary)
        return summary

async def delete_weekly_summary(summary_id: int) -> bool:
    """Delete a weekly summary."""
    async with get_session() as session:
        query = select(WeeklySummary).where(WeeklySummary.id == summary_id)
        result = await session.execute(query)
        summary = result.scalars().first()
        
        if not summary:
            return False
            
        await session.delete(summary)
        await session.commit()
        return True

async def get_count_of_summaries() -> int:
    """Get the count of summaries."""
    async with get_session() as session:
        query = select(func.count(WeeklySummary.id))
        result = await session.execute(query)
        return result.scalar()

# ==========================================
# VECTOR SEARCH OPERATIONS
# ==========================================

async def search_similar_weeks(query: str, limit: int = 5, similarity_threshold: float = 0.7) -> List[WeeklySummary]:
    """Search for similar weeks using vector similarity (RAG requirement)."""
    async with get_session() as session:
        # Generate embedding for the search query
        query_embedding = await generate_embedding(query)
        
        # Use pgvector for similarity search
        sql_query = text("""
            SELECT *, 1 - (embedding <=> :embedding::vector) as similarity
            FROM weekly_summaries 
            WHERE embedding IS NOT NULL AND similarity >= :similarity_threshold
            ORDER BY similarity DESC 
            LIMIT :limit
        """)
        
        result = await session.execute(sql_query, {
            "embedding": str(query_embedding),
            "similarity_threshold": similarity_threshold,
            "limit": limit
        })
        
        rows = result.mappings().all()
        summaries = []
        
        for row in rows:
            summary = WeeklySummary(
                id=row.id,
                week_start=row.week_start,
                week_end=row.week_end,
                summary=row.summary,
                stats=row.stats,
                recommendations=row.recommendations,
                similarity=row.similarity,
                created_at=row.created_at,
                updated_at=row.updated_at
            )
            summaries.append(summary)
            
        return summaries 

async def generate_embedding(text: str) -> List[float]:
    """Generate embeddings for text using OpenAI."""
    response = await client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

