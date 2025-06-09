"""
CRUD router for tasks (requirement: task persistence on refresh).
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import weave

from models.models import Task
from services.database import (
    create_task, get_tasks, get_task_by_id, 
    update_task, delete_task, get_count_of_tasks
)

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=Task)
@weave.op()
async def create_new_task(task: Task):
    """Create a new task that persists on page refresh."""
    try:
        return await create_task(task)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@router.get("/", response_model=List[Task])
@weave.op()
async def list_tasks(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get all tasks, optionally filtered by date range."""
    try:
        return await get_tasks(start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tasks: {str(e)}")

@router.get("/{task_id}", response_model=Task)
@weave.op()
async def get_task(task_id: int):
    """Get a specific task by ID."""
    try:
        task = await get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@router.put("/{task_id}", response_model=Task)
@weave.op()
async def update_existing_task(task_id: int, task_data: dict):
    """Update a task."""
    try:
        task = await update_task(task_id, task_data)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@router.delete("/{task_id}")
@weave.op()
async def delete_existing_task(task_id: int):
    """Delete a task."""
    try:
        success = await delete_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

@router.get("/stats/count")
@weave.op()
async def get_task_count():
    """Get the count of tasks."""
    return {"total_tasks": await get_count_of_tasks()}