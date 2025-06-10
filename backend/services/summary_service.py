import os
import re
from typing import List, Optional, Union
import weave
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, func
from sqlmodel import select
import numpy as np

from models.models import WeeklySummary

class SummaryService:
    """Service for managing weekly summaries with AI-powered search and embeddings."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embeddings for the given text using OpenAI's API."""
        try:
            response = await self.client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            embedding = response.data[0].embedding
            return self.ensure_embedding_is_list(embedding)
        except Exception as e:
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
        db_summary.embedding = self.ensure_embedding_is_list(embedding)

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

    def ensure_embedding_is_list(self, embedding: Union[List[float], np.ndarray]) -> List[float]:
        """Ensure embedding is a list, not numpy array. Postgres can't store numpy arrays."""
        return list(embedding) if hasattr(embedding, '__iter__') and not isinstance(embedding, str) else embedding

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
                   1 - (embedding <=> :embedding) as similarity
            FROM weekly_summaries
            WHERE embedding IS NOT NULL AND (1 - (embedding <=> :embedding)) >= :similarity_threshold
            ORDER BY similarity DESC
            LIMIT :limit
        """)

        result = await session.execute(sql_query, {
            "embedding": str(query_embedding), # Convert list to string for pgvector
            "similarity_threshold": similarity_threshold,
            "limit": limit
        })

        rows = result.mappings().all() # Use mappings() to get dict-like rows
        summaries = []

        for row_data in rows:
            # Convert row_data (which is a RowMapping) to a dict for WeeklySummary unpacking
            summary_dict = dict(row_data)

            # Extract similarity score as relevance score
            relevance_score = summary_dict.pop('similarity', 0.0)

            # Apply keyword highlighting to text fields
            summary_dict['summary'] = self.highlight_keywords(summary_dict['summary'], query_text)
            summary_dict['recommendations'] = self.highlight_keywords(summary_dict['recommendations'], query_text)

            # Create WeeklySummary object and add relevance score as additional attribute
            summary_obj = WeeklySummary(**summary_dict)
            summary_obj.relevance_score = relevance_score  # Add similarity as relevance score
            
            summaries.append(summary_obj)

        return summaries

    def highlight_keywords(self, text: Union[str, List[str]], query_text: str) -> Union[str, List[str]]:
        """
        Highlight keywords in text based on query terms.
        
        Parameters:
            text: The text to highlight (can be string or list of strings)
            query_text: The search query containing keywords to highlight
            
        Returns:
            The text with highlighted keywords wrapped in <mark> tags
        """
        if not text or not query_text:
            return text
            
        # Extract keywords from query, filtering out short words
        keywords = [word.strip() for word in query_text.lower().split() if len(word.strip()) > 2]
        
        # Expand keywords with synonyms for better matching
        expanded_keywords = []
        synonyms = {
            'coding': ['programming', 'development', 'software', 'code'],
            'meeting': ['meetings', 'call', 'discussion', 'collaboration'],
            'design': ['ui', 'ux', 'interface', 'mockup', 'wireframe'],
            'testing': ['qa', 'debug', 'bug', 'test'],
            'focus': ['concentration', 'productivity', 'deep work'],
            'planning': ['strategy', 'roadmap', 'organize']
        }
        
        for keyword in keywords:
            expanded_keywords.append(keyword)
            if keyword in synonyms:
                expanded_keywords.extend(synonyms[keyword])
        
        def highlight_text(input_text: str) -> str:
            """Helper function to highlight keywords in a single text string."""
            if not input_text:
                return input_text
                
            highlighted_text = input_text

            # Remove any existing <strong> tags
            highlighted_text = re.sub(r'<strong>', '', highlighted_text)
            highlighted_text = re.sub(r'</strong>', '', highlighted_text)
            
            # Sort keywords by length (longest first) to avoid partial replacements
            sorted_keywords = sorted(set(expanded_keywords), key=len, reverse=True)
            
            for keyword in sorted_keywords:
                # Use word boundaries to match whole words only
                pattern = re.compile(rf'\b{re.escape(keyword)}\w*', re.IGNORECASE)
                highlighted_text = pattern.sub(lambda m: f'<mark>{m.group()}</mark>', highlighted_text)
            
            # Clean up any double highlighting
            highlighted_text = re.sub(r'<mark><mark>', '<mark>', highlighted_text)
            highlighted_text = re.sub(r'</mark></mark>', '</mark>', highlighted_text)
            
            return highlighted_text
        
        # Handle both string and list inputs
        if isinstance(text, str):
            return highlight_text(text)
        elif isinstance(text, list):
            return [highlight_text(item) for item in text if item]
        else:
            return text