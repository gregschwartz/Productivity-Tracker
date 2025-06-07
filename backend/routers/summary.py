from typing import List
from fastapi import APIRouter, HTTPException
import weave
from models.pydantic_models import SummaryRequest, SummaryResponse, TaskData
from services.ai_service import AIService
from services.rag_service import RAGService

router = APIRouter()

# Initialize services
ai_service = AIService()
rag_service = RAGService()

@router.post("/generate-summary", response_model=SummaryResponse)
@weave.op()
async def generate_weekly_summary(request: SummaryRequest):
    """Generate a weekly productivity summary using AI."""
    print("starting")
    try:
        if not request.tasks:
            raise HTTPException(
                status_code=400,
                detail="No tasks provided for summary generation"
            )
  
        # Generate summary using AI service
        summary = await ai_service.generate_weekly_summary(
            tasks=request.tasks,
            week_start=request.weekStart,
            week_end=request.weekEnd,
            week_stats=request.weekStats
        )
        
        if summary.summary == "" or summary.recommendations == []:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate summary, AI response is empty"
            )
        
        # Store the summary in vector database for future searches
        summary_data = {
            "week_start": request.weekStart,
            "week_end": request.weekEnd,
            "summary": summary.summary,
            "recommendations": summary.recommendations
        }
        rag_service.store_weekly_summary(summary_data)
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )


@router.get("/similar-tasks/{task_name}")
@weave.op()
async def get_similar_tasks(
    task_name: str,
    focus_level: str = "medium",
    limit: int = 5
):
    """
    Find similar historical tasks for recommendations.
    """
    try:
        similar_tasks = await rag_service.get_similar_tasks(
            task_name=task_name,
            focus_level=focus_level,
            limit=limit
        )
        
        return {"similar_tasks": similar_tasks}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find similar tasks: {str(e)}"
        )

@router.post("/analyze-productivity")
@weave.op()
async def analyze_productivity_patterns(tasks: List[TaskData]):
    """
    Analyze productivity patterns from task data.
    """
    try:
        if not tasks:
            raise HTTPException(
                status_code=400,
                detail="No tasks provided for analysis"
            )
        
        # Calculate basic metrics
        total_hours = sum(task.timeSpent for task in tasks)
        completed_tasks = [task for task in tasks if task.completed]
        completion_rate = len(completed_tasks) / len(tasks) if tasks else 0
        
        # Focus level distribution
        focus_distribution = {"low": 0, "medium": 0, "high": 0}
        for task in tasks:
            focus_distribution[task.focusLevel] += 1
        
        # Time distribution by focus level
        time_by_focus = {"low": 0, "medium": 0, "high": 0}
        for task in tasks:
            time_by_focus[task.focusLevel] += task.timeSpent
        
        analysis = {
            "total_tasks": len(tasks),
            "completed_tasks": len(completed_tasks),
            "completion_rate": round(completion_rate, 2),
            "total_hours": round(total_hours, 1),
            "avg_hours_per_task": round(total_hours / len(tasks), 1) if tasks else 0,
            "focus_distribution": focus_distribution,
            "time_by_focus": time_by_focus,
            "most_productive_focus": max(time_by_focus, key=time_by_focus.get)
        }
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze productivity: {str(e)}"
        ) 