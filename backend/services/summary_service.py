import os
from typing import List, Optional

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, func
from sqlmodel import select

from models.models import WeeklySummary

# OpenAI client for embeddings
# This is placed here as generate_embedding is part of this service.
aclient = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class SummaryService:
    async def generate_embedding(self, text_to_embed: str) -> List[float]:
        """Generate embeddings for text using OpenAI."""
        # Renamed 'text' parameter to 'text_to_embed' to avoid conflict with 'text' from sqlalchemy
        response = await aclient.embeddings.create(
            input=text_to_embed,
            model="text-embedding-3-small"  # Using the recommended small model
        )
        return response.data[0].embedding

    async def create_weekly_summary(self, session: AsyncSession, summary_data: WeeklySummary) -> WeeklySummary:
        """Store weekly summary with vector embedding for RAG search."""
        summary_text_to_embed = f"""
        Week {summary_data.week_start} to {summary_data.week_end}
        Summary: {summary_data.summary}
        Recommendations: {'; '.join(summary_data.recommendations or [])}
        """.strip()

        embedding = await self.generate_embedding(summary_text_to_embed)

        # Create WeeklySummary with embedding
        # Exclude fields that should not be set directly or are auto-generated
        summary_dict = summary_data.dict(exclude={'id', 'created_at', 'updated_at', 'embedding'}, exclude_none=True)
        db_summary = WeeklySummary(**summary_dict)
        db_summary.embedding = embedding  # Set the embedding separately

        session.add(db_summary)
        await session.commit()
        await session.refresh(db_summary)

        return db_summary

    async def get_weekly_summaries(
        self, session: AsyncSession,
        skip: int = 0,
        limit: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        query_text: Optional[str] = None # Renamed 'query' to 'query_text' to avoid confusion
    ) -> List[WeeklySummary]:
        """Get weekly summaries with optional filtering by date range or search query."""
        if query_text:
            # If search query provided, use vector search.
            # Note: search_similar_weeks itself needs a session.
            return await self.search_similar_weeks(session, query_text, limit)

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

    async def update_weekly_summary(self, session: AsyncSession, summary_id: int, summary_data: dict) -> Optional[WeeklySummary]:
        """Update a weekly summary."""
        query = select(WeeklySummary).where(WeeklySummary.id == summary_id)
        result = await session.execute(query)
        summary = result.scalars().first()

        if not summary:
            return None

        needs_new_embedding = False
        for key, value in summary_data.items():
            if hasattr(summary, key):
                if key in ['summary', 'recommendations'] and getattr(summary, key) != value:
                    needs_new_embedding = True
                setattr(summary, key, value)

        if needs_new_embedding:
            summary_text_to_embed = f"""
            Week {summary.week_start} to {summary.week_end}
            Summary: {summary.summary}
            Recommendations: {'; '.join(summary.recommendations or [])}
            """.strip()
            summary.embedding = await self.generate_embedding(summary_text_to_embed)

        session.add(summary)
        await session.commit()
        await session.refresh(summary)
        return summary

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

    async def search_similar_weeks(
        self, session: AsyncSession,
        query_text: str,  # Renamed 'query' to 'query_text'
        limit: int = 5,
        similarity_threshold: float = 0.7  # Default from original, can be adjusted
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
            # Ensure all fields required by WeeklySummary are present or handled
            summary_dict = dict(row_data)
            # 'similarity' is not part of the Pydantic model by default, handle as needed
            # If you want to pass it through, add it to the model or handle it separately
            # For now, we'll construct WeeklySummary without it if not in model

            # Pop 'similarity' if it's not in the model, or add it to the model
            # For now, let's assume we want to attach it to the model if possible,
            # or just use it for sorting and don't pass to constructor if not in model
            similarity_score = summary_dict.pop('similarity', None)

            summary = WeeklySummary(**summary_dict)
            if similarity_score is not None and hasattr(summary, 'similarity'): # If model is updated to have 'similarity'
                 summary.similarity = similarity_score
            summaries.append(summary)

        return summaries
