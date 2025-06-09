from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlmodel import select

from models.models import Task


class TaskService:
    async def create_task(self, session: AsyncSession, task_data: Task) -> Task:
        """Create a new task that persists on refresh."""
        # Exclude fields that should not be set directly or are auto-generated
        task_dict = task_data.dict(exclude={'id', 'created_at', 'updated_at'}, exclude_none=True)
        # Date_worked can be cranky
        if isinstance(task_dict.get('date_worked'), str):
            from datetime import date
            task_dict['date_worked'] = date.fromisoformat(task_dict['date_worked'])
        task = Task(**task_dict)
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task

    async def get_tasks(self, session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Task]:
        """Get tasks, optionally filtered by date range."""
        query = select(Task)
        if start_date and end_date:
            query = query.where(Task.date >= start_date, Task.date < end_date)
        elif start_date:
            query = query.where(Task.date >= start_date)
        elif end_date:
            query = query.where(Task.date < end_date)
        result = await session.execute(query.order_by(Task.date.desc()))
        return result.scalars().all()

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

    def analyze_task_patterns(self, tasks: List[Task]) -> dict:
        """
        Analyzes a list of tasks to extract productivity patterns.
        Calculations include: total tasks, total hours, avg hours per task,
        focus distribution, time by focus, and most productive focus.
        """
        if not tasks:
            return {
                "total_tasks": 0,
                "completed_tasks": 0, # Assuming all provided tasks are 'completed' for now
                "completion_rate": 0,
                "total_hours": 0.0,
                "average_hours_per_task": 0.0,
                "focus_distribution": {}, # e.g., {'high': 0.5, 'medium': 0.3, 'low': 0.2}
                "time_by_focus": {},    # e.g., {'high': 10.5, 'medium': 5.0, 'low': 3.0}
                "most_productive_focus": "N/A", # Focus level with most hours
            }

        total_tasks = len(tasks)
        # Assuming all tasks in the list are "completed" for this analysis
        # If Task model had a status, filter by status == 'completed'
        completed_tasks = total_tasks
        completion_rate = (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0

        total_hours = sum(task.timeSpent for task in tasks if task.timeSpent is not None)
        average_hours_per_task = total_hours / total_tasks if total_tasks > 0 else 0

        focus_distribution_counts = {}
        time_by_focus = {}

        for task in tasks:
            focus = task.focusLevel.value if hasattr(task.focusLevel, 'value') else task.focusLevel # Handle Enum
            if focus: # Ensure focus is not None
                focus_distribution_counts[focus] = focus_distribution_counts.get(focus, 0) + 1
                if task.timeSpent is not None:
                    time_by_focus[focus] = time_by_focus.get(focus, 0) + task.timeSpent

        focus_distribution_percentages = {
            focus: (count / total_tasks) * 100 for focus, count in focus_distribution_counts.items()
        } if total_tasks > 0 else {}

        most_productive_focus = "N/A"
        if time_by_focus:
            most_productive_focus = max(time_by_focus, key=time_by_focus.get)

        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": round(completion_rate, 2),
            "total_hours": round(total_hours, 2),
            "average_hours_per_task": round(average_hours_per_task, 2),
            "focus_distribution_percentages": focus_distribution_percentages,
            "time_by_focus": time_by_focus,
            "most_productive_focus": most_productive_focus,
        }
