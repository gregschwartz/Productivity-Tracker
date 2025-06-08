import os
import json
from typing import List, Dict, Any
import chromadb
import weave
from openai import AsyncOpenAI
from models.pydantic_models import RAGQuery, RAGResponse, RAGResult

class RAGService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Initialize ChromaDB
        chroma_path = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chromadb_data")
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        
        # Create collection for weekly summaries
        try:
            self.summaries_collection = self.chroma_client.get_collection("weekly_summaries")
            print({"knowledge_base_loaded": True, "documents_added": len(self.summaries_collection.get())})
        except:
            self.summaries_collection = self.chroma_client.create_collection("weekly_summaries")
            print({"knowledge_base_initialized": True, "documents_added": 0})
    
    @weave.op()
    def store_weekly_summary(self, summary_data: Dict[str, Any]):
        """Store a weekly summary in the vector database."""
        try:
            week_id = f"week_{summary_data['week_start']}_{summary_data['week_end']}"
            
            # Create searchable text from summary data
            searchable_text = f"""
            Week {summary_data['week_start']} to {summary_data['week_end']}
            Summary: {summary_data['summary']}
            Total tasks: {summary_data['stats']['totalTasks']}
            Total hours: {summary_data['stats']['totalHours']}
            Average focus: {summary_data['stats']['avgFocus']}
            Insights: {' '.join(summary_data['insights'])}
            Recommendations: {' '.join(summary_data['recommendations'])}
            """
            
            self.summaries_collection.add(
                documents=[searchable_text],
                metadatas=[summary_data],
                ids=[week_id]
            )
            print({"knowledge_base_initialized": True, "documents_added": len(searchable_text)})
            
        except Exception as e:
            print(f"Error storing summary: {e}")
    
    @weave.op()
    async def search_similar_weeks(self, query: RAGQuery) -> RAGResponse:
        """Search for similar weekly productivity patterns."""
        try:
            # Search the collection
            results = self.summaries_collection.query(
                query_texts=[query.query],
                n_results=min(query.max_results, 5)
            )
            
            # Format results
            rag_results = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i]
                    distance = results['distances'][0][i] if results['distances'] else 0.5
                    relevance_score = max(0.0, 1.0 - distance)
                    
                    rag_results.append(RAGResult(
                        content=f"Week {metadata['week_start']} to {metadata['week_end']}: {metadata['summary']}",
                        source=f"Week {metadata['week_start']}",
                        relevance_score=relevance_score,
                        metadata=metadata
                    ))
            
            # Generate AI answer
            if rag_results:
                context = "\n".join([f"- {result.content}" for result in rag_results[:3]])
                answer = await self._generate_answer(query.query, context)
            else:
                answer = "No similar productivity patterns found in your history."
            
            return RAGResponse(
                results=rag_results,
                answer=answer
            )
            
        except Exception as e:
            return RAGResponse(
                results=[],
                answer=f"Search failed: {str(e)}"
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