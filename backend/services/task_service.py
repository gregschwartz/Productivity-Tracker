from typing import List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlmodel import select

from models.models import Task


def get_local_today() -> date:
    """Get today's date in local timezone (system timezone)."""
    return datetime.now().date()


class TaskService:
    async def create_task(self, session: AsyncSession, task_data: Task) -> Task:
        """Create a new task that persists on refresh."""
        # Exclude fields that should not be set directly or are auto-generated
        task_dict = task_data.model_dump(exclude={'id', 'created_at', 'updated_at'}, exclude_none=True)
        # Date_worked can be cranky
        if isinstance(task_dict.get('date_worked'), str):
            from datetime import date
            task_dict['date_worked'] = date.fromisoformat(task_dict['date_worked'])
        task = Task(**task_dict)
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task

    async def get_tasks(
        self, 
        session: AsyncSession, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Task]:
        """Get tasks with pagination, optionally filtered by date range."""
        query = select(Task)
        
        if start_date and end_date:
            start_date_obj = date.fromisoformat(start_date)
            end_date_obj = date.fromisoformat(end_date)
            query = query.where(
                Task.date_worked >= start_date_obj, 
                Task.date_worked < end_date_obj
            )
        elif start_date or end_date:
            raise ValueError("Both start_date and end_date must be provided together")
        
        # Apply pagination
        query = query.order_by(Task.date_worked.desc()).limit(limit).offset(offset)
        
        result = await session.execute(query)
        return result.scalars().all()

    async def get_tasks_count(
        self, 
        session: AsyncSession, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None
    ) -> int:
        """Get total count of tasks matching the filter criteria."""
        query = select(func.count(Task.id))
        
        if start_date and end_date:
            start_date_obj = date.fromisoformat(start_date)
            end_date_obj = date.fromisoformat(end_date)
            query = query.where(
                Task.date_worked >= start_date_obj, 
                Task.date_worked < end_date_obj
            )
        elif start_date or end_date:
            raise ValueError("Both start_date and end_date must be provided together")
        
        result = await session.execute(query)
        return result.scalar() or 0

    async def get_task_by_id(self, session: AsyncSession, task_id: int) -> Optional[Task]:
        """Get a task by ID."""
        query = select(Task).where(Task.id == task_id)
        result = await session.execute(query)
        return result.scalars().first()

    async def update_task(self, session: AsyncSession, task_id: int, task_data: dict) -> Optional[Task]:
        """Update a task."""
        query = select(Task).where(Task.id == task_id)
        result = await session.execute(query)
        task = result.scalars().first()

        if not task:
            return None

        for key, value in task_data.items():
            if hasattr(task, key):
                setattr(task, key, value)

        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task

    async def delete_task(self, session: AsyncSession, task_id: int) -> bool:
        """Delete a task."""
        query = select(Task).where(Task.id == task_id)
        result = await session.execute(query)
        task = result.scalars().first()

        if not task:
            return False

        await session.delete(task)
        await session.commit()
        return True

    async def get_count_of_tasks(self, session: AsyncSession) -> int:
        """Get the count of tasks."""
        query = select(func.count(Task.id)) # Corrected to select(func.count(Task.id))
        result = await session.execute(query)
        count = result.scalar()
        return count if count is not None else 0

    def analyze_task_statistics(self, tasks: List[Task]) -> dict:
        """
        Analyzes a list of tasks to extract productivity patterns.
        Calculations include: total tasks, total hours, avg hours per task,
        focus distribution, time by focus, and most productive focus.
        """
        if not tasks:
            return {
                "total_tasks": 0,
                "total_hours": 0.0,
                "average_hours_per_task": 0.0,
                "focus_count": {}, # e.g., {'high': 0.5, 'medium': 0.3, 'low': 0.2}
                "focus_hours": {},    # e.g., {'high': 10.5, 'medium': 5.0, 'low': 3.0}
                "focus_with_most_hours": "N/A",
            }

        total_tasks = len(tasks)
        total_hours = sum(task.time_spent for task in tasks if task.time_spent is not None)
        average_hours_per_task = total_hours / total_tasks if total_tasks > 0 else 0

        focus_count = {}
        focus_hours = {}

        for task in tasks:
            focus = task.focus_level.value if hasattr(task.focus_level, 'value') else task.focus_level # Handle Enum
            if focus: # Ensure focus is not None
                focus_count[focus] = focus_count.get(focus, 0) + 1
                if task.time_spent is not None:
                    focus_hours[focus] = focus_hours.get(focus, 0) + task.time_spent

        focus_count_percentages = {
            focus: (count / total_tasks) * 100 for focus, count in focus_count.items()
        } if total_tasks > 0 else {}

        focus_with_most_hours = "N/A"
        if focus_hours:
            focus_with_most_hours = max(focus_hours, key=focus_hours.get)

        return {
            "total_tasks": total_tasks,
            "total_hours": round(total_hours, 2),
            "average_hours_per_task": round(average_hours_per_task, 2),
            "focus_count_percentages": focus_count_percentages,
            "focus_hours": focus_hours,
            "focus_with_most_hours": focus_with_most_hours,
        }
