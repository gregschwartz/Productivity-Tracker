import os
from typing import List, Optional
import weave
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, func
from sqlmodel import select

from models.models import WeeklySummary

class SummaryService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embeddings for the given text using OpenAI's API."""
        try:
            response = await self.client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            raise
    
    async def create_weekly_summary(self, session: AsyncSession, summary_data: WeeklySummary) -> WeeklySummary:
        """Store weekly summary with vector embedding for RAG search."""
        summary_text_to_embed = f"""
        Week {summary_data.week_start} to {summary_data.week_end}
        Summary: {summary_data.summary}
        Recommendations: {'; '.join(summary_data.recommendations or [])}
        """.strip()

        # Create WeeklySummary, exclude fields that should not be set directly or are auto-generated
        summary_dict = summary_data.dict(exclude={'id', 'created_at', 'updated_at', 'embedding'}, exclude_none=True)
        db_summary = WeeklySummary(**summary_dict)
        
        # Generate embedding and set it on the WeeklySummary
        embedding = await self.generate_embedding(summary_text_to_embed)
        db_summary.embedding = embedding

        session.add(db_summary)
        await session.commit() # Commit the transaction
        await session.refresh(db_summary)

        return db_summary

    async def get_weekly_summaries(
        self, session: AsyncSession,
        skip: int = 0,
        limit: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[WeeklySummary]:
        """Get weekly summaries with optional filtering by date range or search query.
        
        Parameters:
            session: AsyncSession - The database session
            skip: int - The number of summaries to skip (default: 0)
            limit: int - The number of summaries to return (default: 10)
            start_date: Optional[str] - The start date of the summaries (default: None)
            end_date: Optional[str] - The end date of the summaries (default: None)
        """

        sql_query_stmt = select(WeeklySummary)

        if start_date and end_date:
            sql_query_stmt = sql_query_stmt.where(
                WeeklySummary.week_start >= start_date,
                WeeklySummary.week_start <= end_date
            )
        elif start_date:
            sql_query_stmt = sql_query_stmt.where(WeeklySummary.week_start == start_date)
        elif end_date: # Added this condition, was missing in original get_weekly_summaries
            sql_query_stmt = sql_query_stmt.where(WeeklySummary.week_start <= end_date)


        sql_query_stmt = sql_query_stmt.offset(skip).limit(limit).order_by(WeeklySummary.week_start.desc())
        result = await session.execute(sql_query_stmt)
        summaries = result.scalars().all()
        return summaries

    async def get_weekly_summary_by_id(self, session: AsyncSession, summary_id: int) -> Optional[WeeklySummary]:
        """Get a weekly summary by ID."""
        query = select(WeeklySummary).where(WeeklySummary.id == summary_id)
        result = await session.execute(query)
        return result.scalars().first()

    # No need to update weekly summaries, it's not done manually
    # async def update_weekly_summary(self, session: AsyncSession, summary_id: int, summary_data: dict) -> Optional[WeeklySummary]:

    async def delete_weekly_summary(self, session: AsyncSession, summary_id: int) -> bool:
        """Delete a weekly summary."""
        query = select(WeeklySummary).where(WeeklySummary.id == summary_id)
        result = await session.execute(query)
        summary = result.scalars().first()

        if not summary:
            return False

        await session.delete(summary)
        await session.commit()
        return True

    async def get_count_of_summaries(self, session: AsyncSession) -> int:
        """Get the count of summaries."""
        query = select(func.count(WeeklySummary.id)) # Corrected to select(func.count(WeeklySummary.id))
        result = await session.execute(query)
        count = result.scalar()
        return count if count is not None else 0

    @weave.op()
    async def vector_search_week_summaries(
        self, session: AsyncSession,
        query_text: str,
        limit: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[WeeklySummary]:
        """Search for similar weeks using vector similarity (RAG requirement)."""
        query_embedding = await self.generate_embedding(query_text)

        # Using pgvector's <=> operator for cosine distance. 1 - cosine_distance = cosine_similarity
        # Ensure the 'embedding' column in weekly_summaries is of type VECTOR(embedding_size)
        # The size should match OpenAI's "text-embedding-3-small" model (1536 dimensions).
        sql_query = text("""
            SELECT id, week_start, week_end, summary, stats, recommendations, created_at, updated_at,
                   1 - (embedding <=> :embedding::vector) as similarity
            FROM weekly_summaries
            WHERE embedding IS NOT NULL AND (1 - (embedding <=> :embedding::vector)) >= :similarity_threshold
            ORDER BY similarity DESC
            LIMIT :limit
        """)

        result = await session.execute(sql_query, {
            "embedding": str(list(query_embedding)), # pgvector expects list-like string for vector
            "similarity_threshold": similarity_threshold,
            "limit": limit
        })

        rows = result.mappings().all() # Use mappings() to get dict-like rows
        summaries = []

        for row_data in rows:
            # Convert row_data (which is a RowMapping) to a dict for WeeklySummary unpacking
            summary_dict = dict(row_data)

            # Create WeeklySummary object from the dict
            summaries.append(WeeklySummary(**summary_dict))

        return summaries
