"""
Admin router.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import List, Dict
from services.database import get_session
from services.summary_service import SummaryService
from services.task_service import TaskService
from services.ai_service import AIService
from models.models import Task, WeeklySummary, FocusLevel
from scripts.seed_data import seed_database, generate_week_summary
from utils.date_utils import group_tasks_by_week

router = APIRouter(prefix="/admin", tags=["admin"])
summary_service = SummaryService()
task_service = TaskService()
ai_service = AIService()

@router.post("/generate-sample-data", response_model=dict)
async def generate_sample_data_route(db: AsyncSession = Depends(get_session)):
    """Generate sample tasks and summaries for demo purposes. Always clears existing data."""
    try:
        result = await seed_database()
        return {
            "message": "Sample data generated successfully",
            "tasks_created": result["tasks_created"],
            "summaries_created": result["summaries_created"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate sample data: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.post("/regenerate-embeddings", response_model=dict)
async def regenerate_embeddings_route(db: AsyncSession = Depends(get_session)):
    """Generate all summaries for available task data, and embeddings for existing summaries missing them. Particularly useful after changing the summary generation prompt."""
    try:
        # Step 1: Get all existing weeks with summaries
        existing_summaries = await summary_service.get_weekly_summaries(session=db, limit=1000)
        existing_weeks = {summary.week_start for summary in existing_summaries}
        
        # Step 2: Get all tasks and group by week
        all_tasks = await task_service.get_tasks(session=db)
        weeks_with_tasks = group_tasks_by_week(all_tasks)
        
        # Step 3: Generate summaries for weeks that have tasks but no summaries
        summaries_created = 0
        for week_start, week_tasks in weeks_with_tasks.items():
            if week_start not in existing_weeks and len(week_tasks) > 0:
                week_start_date = datetime.strptime(week_start, '%Y-%m-%d').date()
                week_end_date = week_start_date + timedelta(days=6)
                summary = await generate_week_summary(ai_service, week_tasks, week_start_date, week_end_date)
                if summary:
                    await summary_service.create_weekly_summary(session=db, summary_data=summary)
                    summaries_created += 1
        
        # Step 4: Generate embeddings for existing summaries that don't have them
        embeddings_updated = 0
        all_summaries = await summary_service.get_weekly_summaries(session=db, limit=1000)
        
        for summary in all_summaries:
            if summary.embedding is None:
                # Generate embedding text using the same format as create_weekly_summary
                summary_text_to_embed = f"""
                Week {summary.week_start} to {summary.week_end}
                Summary: {summary.summary}
                Recommendations: {'; '.join(summary.recommendations or [])}
                """.strip()
                
                # Generate and update embedding using existing service method
                embedding = await summary_service.generate_embedding(summary_text_to_embed)
                summary.embedding = summary_service.ensure_embedding_is_list(embedding)
                db.add(summary)
                embeddings_updated += 1
        
        await db.commit()
        
        return {
            "message": f"Successfully created {summaries_created} new summaries and updated embeddings for {embeddings_updated} existing summaries",
            "summaries_created": summaries_created,
            "embeddings_updated": embeddings_updated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate summaries and embeddings: {str(e)}")

