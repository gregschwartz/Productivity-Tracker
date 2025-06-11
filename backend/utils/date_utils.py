"""
Date utility functions for the productivity tracker.
"""
from datetime import date, timedelta
from typing import List, Dict, Tuple
from models.models import Task


def get_week_boundaries(target_date: date) -> Tuple[date, date]:
    """
    Get the start (Sunday) and end (Saturday) dates for the week containing the target date.
    
    Args:
        target_date: The date to find the week boundaries for
        
    Returns:
        Tuple of (week_start, week_end) where:
        - week_start is the Sunday of that week
        - week_end is the Saturday of that week
    """
    days_since_sunday = (target_date.weekday() + 1) % 7
    week_start = target_date - timedelta(days=days_since_sunday)
    week_end = week_start + timedelta(days=6)
    return week_start, week_end


def get_week_start(target_date: date) -> date:
    """
    Get the start date (Sunday) for the week containing the target date.
    
    Args:
        target_date: The date to find the week start for
        
    Returns:
        The Sunday date that starts the week containing target_date
    """
    days_since_sunday = (target_date.weekday() + 1) % 7
    return target_date - timedelta(days=days_since_sunday)


def group_tasks_by_week(tasks: List[Task]) -> Dict[str, List[Task]]:
    """
    Group tasks by week start date (Sunday to Saturday).
    
    Args:
        tasks: List of Task objects to group
        
    Returns:
        Dictionary mapping week start date strings (YYYY-MM-DD) to lists of tasks
    """
    weeks: Dict[str, List[Task]] = {}
    
    for task in tasks:
        week_start = get_week_start(task.date_worked)
        week_start_str = week_start.strftime('%Y-%m-%d')
        
        if week_start_str not in weeks:
            weeks[week_start_str] = []
        weeks[week_start_str].append(task)
    
    return weeks