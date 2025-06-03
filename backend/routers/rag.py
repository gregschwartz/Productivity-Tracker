from fastapi import APIRouter, HTTPException
import weave
from models.pydantic_models import RAGQuery, RAGResponse
from services.rag_service import RAGService

router = APIRouter()
rag_service = RAGService()

@router.post("/search", response_model=RAGResponse)
@weave.op()
async def search_knowledge_base(query: RAGQuery):
    """
    Search the productivity knowledge base using RAG.
    
    This endpoint searches through productivity tips, best practices,
    and historical task data to provide relevant information and AI-generated answers.
    """
    try:
        if not query.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )

        # Search for similar weeks
        results = await rag_service.search_similar_weeks(query)
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.post("/ask")
@weave.op()
async def ask_productivity_question(
    question: str,
    context: dict = None,
    max_results: int = 5
):
    """
    Ask a productivity question and get an AI-generated answer based on RAG.
    
    This is a simplified endpoint that takes a plain text question
    and returns an AI answer along with relevant sources.
    """
    try:
        if not question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty"
            )
        
        # Create RAG query
        rag_query = RAGQuery(
            query=question,
            context=context,
            max_results=max_results
        )
        
        # Search knowledge base
        result = await rag_service.search_knowledge(rag_query)
        
        return {
            "question": question,
            "answer": result.answer,
            "sources": [
                {
                    "content": r.content,
                    "source": r.source,
                    "relevance": round(r.relevance_score, 2)
                }
                for r in result.results[:3]  # Top 3 sources
            ],
            "query_time": result.query_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {str(e)}"
        )

@router.get("/knowledge-stats")
@weave.op()
async def get_knowledge_base_stats():
    """
    Get statistics about the knowledge base.
    """
    try:
        productivity_count = rag_service.productivity_collection.count()
        tasks_count = rag_service.tasks_collection.count()
        
        stats = {
            "productivity_tips": productivity_count,
            "historical_tasks": tasks_count,
            "total_documents": productivity_count + tasks_count,
            "collections": ["productivity_tips", "historical_tasks"]
        }
        
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get knowledge base stats: {str(e)}"
        )

@router.post("/add-knowledge")
@weave.op()
async def add_knowledge_document(
    content: str,
    source: str,
    category: str = "general",
    metadata: dict = None
):
    """
    Add a new document to the productivity knowledge base.
    
    This endpoint allows adding custom productivity tips or knowledge.
    """
    try:
        if not content.strip():
            raise HTTPException(
                status_code=400,
                detail="Content cannot be empty"
            )
        
        # Generate unique ID
        import uuid
        doc_id = str(uuid.uuid4())
        
        # Prepare metadata
        doc_metadata = {
            "source": source,
            "category": category,
            **(metadata or {})
        }
        
        # Add to productivity collection
        rag_service.productivity_collection.add(
            documents=[content],
            metadatas=[doc_metadata],
            ids=[doc_id]
        )
        
        return {
            "message": "Knowledge document added successfully",
            "document_id": doc_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add knowledge document: {str(e)}"
        )

@router.get("/categories")
@weave.op()
async def get_knowledge_categories():
    """
    Get available knowledge categories.
    """
    try:
        # This is a simple implementation - in a real system you'd query the database
        categories = [
            "time_management",
            "focus",
            "prioritization",
            "review",
            "goal_setting",
            "productivity_tools",
            "work_life_balance",
            "general"
        ]
        
        return {"categories": categories}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get categories: {str(e)}"
        ) 