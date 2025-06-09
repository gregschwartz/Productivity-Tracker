import os
from typing import List, Dict, Any, Optional
import weave
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import RAGQuery, RAGResponse, RAGResult, WeeklySummaryCreate
from services.database_service import DatabaseService

class RAGService:
    """Service for Retrieval-Augmented Generation (RAG) operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize the RAGService with a database session and OpenAI client."""
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.db_service = DatabaseService(db)
    
    async def _generate_embedding(self, text: str) -> List[float]:
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
    
    @weave.op()
    async def store_weekly_summary(self, summary_data: WeeklySummaryCreate) -> Dict[str, Any]:
        """Store a weekly summary in the database with vector embedding."""
        try:
            # Generate embedding for the summary text
            embedding = await self._generate_embedding(
                f"""
                Week {summary_data.week_start} to {summary_data.week_end}
                Summary: {summary_data.summary}
                Total tasks: {summary_data.stats.get('totalTasks', 0)}
                Insights: {'; '.join(summary_data.insights or [])}
                Recommendations: {'; '.join(summary_data.recommendations or [])}
                """.strip()
            )
            
            # Store in PostgreSQL with pgvector
            result = await self.db_service.store_weekly_summary(summary_data, embedding)
            return {"status": "success", "message": "Weekly summary stored successfully", "id": result.id}
            
        except Exception as e:
            print(f"Error storing summary: {e}")
            return {"status": "error", "message": str(e)}
    
    @weave.op()
    async def search_similar_weeks(self, query: RAGQuery, similarity_threshold: float = 0.7) -> RAGResponse:
        """Search for similar weeks based on a query using vector similarity."""
        try:
            # Generate embedding for the query
            query_embedding = await self._generate_embedding(query.query)
            
            # Search for similar weeks using pgvector
            similar_weeks = await self.db_service.search_similar_weeks(
                query_embedding=query_embedding,
                limit=query.max_results,
                similarity_threshold=similarity_threshold
            )
            
            # Convert to RAGResult objects
            results = []
            for week in similar_weeks:
                # Create a content string from the week data
                content = f"""
                Week {week.week_start} to {week.week_end}
                Summary: {week.summary}
                Insights: {'; '.join(week.insights or [])}
                Recommendations: {'; '.join(week.recommendations or [])}
                """.strip()
                
                results.append(RAGResult(
                    content=content,
                    source=f"Week {week.week_start} to {week.week_end}",
                    relevance_score=getattr(week, 'similarity', 0.0),
                    metadata={
                        'week_start': week.week_start,
                        'week_end': week.week_end,
                        'stats': week.stats,
                        'insights': week.insights,
                        'recommendations': week.recommendations
                    }
                ))
            
            return RAGResponse(
                results=results,
                answer=None  # Can be filled in by a separate method if needed
            )
            
        except Exception as e:
            print(f"Error searching similar weeks: {e}")
            return RAGResponse(
                results=[],
                answer=f"Error: {str(e)}"
            )
    
    # we don't need to use this function, but could be fun for extra credit
    @weave.op()
    async def _generate_answer(self, query: str, context: str) -> str:
        """Generate an AI answer based on search results."""
        try:
            prompt = f"""
            Based on the user's productivity history, answer their question:
            
            Question: {query}
            
            Relevant weeks from history:
            {context}
            
            Provide a helpful answer based on the patterns you see.
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a productivity assistant. Analyze patterns and provide helpful insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception:
            return "Unable to generate analysis at this time."
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for the given text using OpenAI."""
        response = await self.client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding