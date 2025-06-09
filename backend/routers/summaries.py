"""
CRUD router for weekly summaries with AI generation and search capabilities.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import weave

from models.models import WeeklySummary, SummaryRequest
from services.database import (
    create_weekly_summary, get_weekly_summaries, get_weekly_summary_by_id,
    update_weekly_summary, delete_weekly_summary, get_count_of_summaries
)
from services.ai_service import AIService

router = APIRouter(prefix="/summaries", tags=["summaries"])
ai_service = AIService()

@router.post("/", response_model=WeeklySummary)
@weave.op()
async def generate_summary(request: SummaryRequest):
    """Generate a weekly productivity summary using AI and store in vector database."""
    try:
        if not request.tasks:
            raise HTTPException(
                status_code=400,
                detail="No tasks provided for summary generation"
            )
  
        # Generate summary using AI service
        ai_response = await ai_service.generate_weekly_summary(
            tasks=request.tasks,
            week_start=request.week_start,
            week_end=request.week_end,
            week_stats=request.week_stats,
            context_summaries=request.context_summaries
        )
        
        if ai_response.summary == "" or ai_response.recommendations == []:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate summary, AI response is empty"
            )
        
        # Store in vector database
        summary_data = WeeklySummary(
            week_start=request.week_start,
            week_end=request.week_end,
            summary=ai_response.summary,
            stats=request.week_stats.dict(),
            recommendations=ai_response.recommendations
        )
        
        # Store with vector embedding for future RAG searches
        stored_summary = await create_weekly_summary(summary_data)
        
        return stored_summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )

@router.get("/", response_model=List[WeeklySummary])
@weave.op()
async def get_summaries(
    skip: int = 0,
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    query: Optional[str] = None
):
    """
    Get weekly summaries with optional filtering:
    - No params: paginated list
    - start_date: get summary for specific week
    - start_date + end_date: get summaries in date range
    - query: semantic search using vector similarity
    """
    try:
        summaries = await get_weekly_summaries(
            skip=skip,
            limit=limit,
            start_date=start_date,
            end_date=end_date,
            query=query
        )
        return summaries
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get summaries: {str(e)}"
        )

@router.get("/{summary_id}", response_model=WeeklySummary)
@weave.op()
async def get_summary_by_id(summary_id: int):
    """Get a specific weekly summary by ID."""
    try:
        summary = await get_weekly_summary_by_id(summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Weekly summary not found")
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")

@router.put("/{summary_id}", response_model=WeeklySummary)
@weave.op()
async def update_summary(summary_id: int, summary_data: dict):
    """Update a weekly summary (regenerates embedding if content changed)."""
    try:
        summary = await update_weekly_summary(summary_id, summary_data)
        if not summary:
            raise HTTPException(status_code=404, detail="Weekly summary not found")
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update summary: {str(e)}")

@router.delete("/{summary_id}")
@weave.op()
async def delete_summary(summary_id: int):
    """Delete a weekly summary."""
    try:
        success = await delete_weekly_summary(summary_id)
        if not success:
            raise HTTPException(status_code=404, detail="Weekly summary not found")
        return {"message": "Weekly summary deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete summary: {str(e)}")

@router.get("/stats/count")
@weave.op()
async def get_summary_count():
    """Get total count of weekly summaries."""
    try:
        return {"total_summaries": await get_count_of_summaries()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary count: {str(e)}") 