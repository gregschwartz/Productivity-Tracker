"""
CRUD router for tasks (requirement: task persistence on refresh).
"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from models.models import Task, PaginatedTasksResponse
from services.task_service import TaskService
from services.database import get_session # For session dependency

router = APIRouter(prefix="/tasks", tags=["tasks"])

task_service = TaskService()
logger = logging.getLogger(__name__)

@router.post("/", response_model=Task)
async def create_new_task_route(task_payload: Task, db: AsyncSession = Depends(get_session)):
    """Create a new task that persists on page refresh."""
    try:
        return await task_service.create_task(session=db, task_data=task_payload)
    except Exception as e:
        logger.error("Failed to create task. Payload=%s", task_payload.model_dump(), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@router.get("/", response_model=PaginatedTasksResponse)
async def list_tasks_route(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_session)
):
    """Get tasks with pagination, optionally filtered by date range."""
    try:
        # Validate pagination parameters
        if limit <= 0 or limit > 100:
            raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
        if offset < 0:
            raise HTTPException(status_code=400, detail="Offset must be a positive integer")
        
        # Get tasks and total count
        tasks = await task_service.get_tasks(
            session=db, 
            start_date=start_date, 
            end_date=end_date,
            limit=limit,
            offset=offset
        )
        total = await task_service.get_tasks_count(
            session=db,
            start_date=start_date,
            end_date=end_date
        )
        
        return PaginatedTasksResponse(
            tasks=tasks,
            total=total,
            limit=limit,
            offset=offset,
            has_more=offset + len(tasks) < total
        )
    except HTTPException:
        raise  # Re-raise HTTPException as-is
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tasks: {str(e)}")

@router.get("/{task_id}", response_model=Task)
async def get_task_route(task_id: int, db: AsyncSession = Depends(get_session)):
    """Get a specific task by ID."""
    try:
        task = await task_service.get_task_by_id(session=db, task_id=task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException: # Re-raise HTTPException directly
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@router.put("/{task_id}", response_model=Task)
async def update_existing_task_route(task_id: int, task_data: dict, db: AsyncSession = Depends(get_session)):
    """Update a task."""
    try:
        task = await task_service.update_task(session=db, task_id=task_id, task_data=task_data)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException: # Re-raise HTTPException directly
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@router.delete("/{task_id}")
async def delete_existing_task_route(task_id: int, db: AsyncSession = Depends(get_session)):
    """Delete a task."""
    try:
        success = await task_service.delete_task(session=db, task_id=task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task deleted successfully"}
    except HTTPException: # Re-raise HTTPException directly
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

@router.get("/stats/count", response_model=dict)
async def get_task_count_route(db: AsyncSession = Depends(get_session)):
    """Get the count of tasks."""
    try:
        count = await task_service.get_count_of_tasks(session=db)
        return {"total_tasks": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task count: {str(e)}")


@router.post("/stats/calculate", response_model=dict)
async def calculate_task_statistics_route(
    tasks: List[Task]
):
    """
    Calculates statistics from a list of provided tasks.
    """
    if not tasks:
        raise HTTPException(
            status_code=400,
            detail="No tasks provided for statistics analysis."
        )

    try:
        analysis_results = task_service.analyze_task_statistics(tasks=tasks)
        return analysis_results
    except Exception as e:
        # Log the exception e for debugging
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze task patterns: {str(e)}"
        )