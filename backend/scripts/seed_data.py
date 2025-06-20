#!/usr/bin/env python3
"""
Seed data script for generating sample tasks and weekly summaries.

This script can be run to populate the database with sample data,
or the functions can be imported and used by API endpoints.
"""

import os
import sys
import random
from datetime import datetime, timedelta
from typing import List

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, select
from models.models import Task, WeeklySummary, FocusLevel
from config.database import SYNC_DATABASE_URL
from utils.date_utils import get_week_boundaries

async def generate_sample_data(reference_date: datetime = None) -> tuple[List[Task], List[WeeklySummary]]:
    """
    Generate sample tasks and summaries for the last 60 days.
    Generates summaries as we go when hitting new Sundays.
    
    Args:
        reference_date: The date to generate data relative to. Defaults to current date.
    
    Returns:
        Tuple of (tasks, summaries)
    """
    if reference_date is None:
        reference_date = datetime.utcnow()
    
    # Import AI service here to avoid circular imports
    from services.ai_service import AIService
    from models.models import WeeklyStats
    
    ai_service = AIService()
    
    # Task templates with time ranges and focus levels
    task_templates = [
        # Today's tasks (first 3 will be used for the reference date)
        {"name": "Get a beverage", "timeMinMax": [0.25, 0.25], "focus_level": FocusLevel.low},
        {"name": "Test Greg's app", "timeMinMax": [0.5, 0.5], "focus_level": FocusLevel.medium},
        {"name": "Request to hire Greg ;)", "timeMinMax": [1, 1], "focus_level": FocusLevel.high},
        
        # Development tasks
        {"name": "Frontend component development", "timeMinMax": [2, 6], "focus_level": FocusLevel.high},
        {"name": "Backend API implementation", "timeMinMax": [3, 5], "focus_level": FocusLevel.high},
        {"name": "Database optimization work", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Code review for authentication module", "timeMinMax": [1, 3], "focus_level": FocusLevel.high},
        {"name": "Bug fixes in payment processing", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Performance optimization analysis", "timeMinMax": [2, 5], "focus_level": FocusLevel.high},
        {"name": "Code refactoring - authentication", "timeMinMax": [3, 6], "focus_level": FocusLevel.high},
        {"name": "API endpoint design", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Unit testing implementation", "timeMinMax": [1, 3], "focus_level": FocusLevel.medium},
        {"name": "Integration testing setup", "timeMinMax": [2, 4], "focus_level": FocusLevel.medium},
        {"name": "Microservices architecture implementation", "timeMinMax": [4, 8], "focus_level": FocusLevel.high},
        {"name": "GraphQL schema development", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "CI/CD pipeline optimization", "timeMinMax": [3, 5], "focus_level": FocusLevel.high},
        {"name": "Cloud infrastructure setup", "timeMinMax": [4, 6], "focus_level": FocusLevel.high},
        {"name": "Security vulnerability fixes", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Mobile app feature development", "timeMinMax": [3, 6], "focus_level": FocusLevel.high},
        {"name": "Database migration script", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        
        # Meetings and collaboration
        {"name": "Team standup meeting", "timeMinMax": [0.25, 0.5], "focus_level": FocusLevel.medium},
        {"name": "Sprint planning session", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Client meeting - project requirements", "timeMinMax": [0.5, 1.5], "focus_level": FocusLevel.medium},
        {"name": "Weekly retrospective", "timeMinMax": [0.5, 1], "focus_level": FocusLevel.medium},
        {"name": "Architecture discussion", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Code review session", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Mentoring junior developer", "timeMinMax": [0.5, 1.5], "focus_level": FocusLevel.medium},
        {"name": "Cross-team collaboration", "timeMinMax": [1, 2], "focus_level": FocusLevel.high},
        {"name": "Product roadmap planning", "timeMinMax": [2, 3], "focus_level": FocusLevel.high},
        {"name": "Tech debt discussion", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Team performance review", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Project kickoff meeting", "timeMinMax": [1.5, 2.5], "focus_level": FocusLevel.medium},
        {"name": "Stakeholder presentation", "timeMinMax": [1, 2], "focus_level": FocusLevel.high},
        {"name": "Team building workshop", "timeMinMax": [2, 3], "focus_level": FocusLevel.low},
        {"name": "Technical interview", "timeMinMax": [1, 1.5], "focus_level": FocusLevel.high},
        {"name": "Release planning meeting", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        
        # Documentation and admin
        {"name": "Design system documentation", "timeMinMax": [1, 3], "focus_level": FocusLevel.medium},
        {"name": "Technical specification writing", "timeMinMax": [2, 4], "focus_level": FocusLevel.medium},
        {"name": "Documentation updates", "timeMinMax": [1, 3], "focus_level": FocusLevel.low},
        {"name": "Email and administrative tasks", "timeMinMax": [0.5, 1.5], "focus_level": FocusLevel.low},
        {"name": "Weekly planning session", "timeMinMax": [1, 2], "focus_level": FocusLevel.low},
        {"name": "Project status reporting", "timeMinMax": [0.5, 1], "focus_level": FocusLevel.low},
        {"name": "Time tracking and reporting", "timeMinMax": [0.25, 0.5], "focus_level": FocusLevel.low},
        {"name": "API documentation writing", "timeMinMax": [2, 4], "focus_level": FocusLevel.medium},
        {"name": "Architecture decision records", "timeMinMax": [1, 2], "focus_level": FocusLevel.high},
        {"name": "Release notes preparation", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Team process documentation", "timeMinMax": [1, 3], "focus_level": FocusLevel.medium},
        {"name": "Onboarding guide updates", "timeMinMax": [2, 3], "focus_level": FocusLevel.medium},
        {"name": "Security compliance report", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Performance metrics report", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        
        # Research and learning
        {"name": "Research new React patterns", "timeMinMax": [1, 3], "focus_level": FocusLevel.high},
        {"name": "Technology evaluation", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Learning new framework", "timeMinMax": [2, 5], "focus_level": FocusLevel.low},
        {"name": "Security research and analysis", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Industry best practices review", "timeMinMax": [1, 3], "focus_level": FocusLevel.medium},
        {"name": "ChatGPT prompt engineering", "timeMinMax": [1, 2], "focus_level": FocusLevel.high},
        {"name": "Claude API integration research", "timeMinMax": [2, 3], "focus_level": FocusLevel.high},
        {"name": "Gemini Pro capabilities exploration", "timeMinMax": [1.5, 3], "focus_level": FocusLevel.medium},
        {"name": "AI model fine-tuning research", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "LLM performance benchmarking", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "AI ethics and safety review", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "ML model deployment patterns", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "AI cost optimization research", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Vector database evaluation", "timeMinMax": [2, 3], "focus_level": FocusLevel.high},
        
        # QA and testing
        {"name": "Testing and QA session", "timeMinMax": [1, 3], "focus_level": FocusLevel.medium},
        {"name": "Manual testing workflow", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium},
        {"name": "Automated test maintenance", "timeMinMax": [1, 3], "focus_level": FocusLevel.medium},
        {"name": "Bug investigation and analysis", "timeMinMax": [1, 4], "focus_level": FocusLevel.low},
        {"name": "Performance optimization", "timeMinMax": [1, 3], "focus_level": FocusLevel.high},
        {"name": "Load testing implementation", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Security penetration testing", "timeMinMax": [3, 5], "focus_level": FocusLevel.high},
        {"name": "Cross-browser compatibility testing", "timeMinMax": [2, 3], "focus_level": FocusLevel.medium},
        {"name": "API integration testing", "timeMinMax": [2, 4], "focus_level": FocusLevel.medium},
        {"name": "User acceptance testing", "timeMinMax": [1, 3], "focus_level": FocusLevel.medium},
        {"name": "Test automation framework setup", "timeMinMax": [3, 5], "focus_level": FocusLevel.high},
        {"name": "Performance benchmark testing", "timeMinMax": [2, 4], "focus_level": FocusLevel.high},
        {"name": "Mobile app testing", "timeMinMax": [2, 3], "focus_level": FocusLevel.medium},
        {"name": "Accessibility testing", "timeMinMax": [1, 2], "focus_level": FocusLevel.medium}
    ]

    sample_tasks = []
    sample_summaries = []
    weeks_data = {}  # Dictionary to store tasks by week

    # Generate tasks for the last 60 days (going backwards from reference date)
    for day_offset in range(60):
        task_date = reference_date - timedelta(days=day_offset)
        
        # Calculate week boundaries (Sunday to Saturday)
        week_start, week_end = get_week_boundaries(task_date)
        week_key = week_start.strftime('%Y-%m-%d')
        
        # Initialize week data if not exists
        if week_key not in weeks_data:
            weeks_data[week_key] = {
                'tasks': [],
                'start': week_start,
                'end': week_end
            }
        
        # Determine number of tasks for this day
        if day_offset == 0:
            task_count = 3  # Ensure all focus levels are represented
        else:
            is_weekend = task_date.weekday() >= 5
            task_count = random.randint(0, 2) if is_weekend else random.randint(1, 4)
        
        # Generate tasks for this day
        for i in range(task_count):
            if day_offset == 0 and i < 3:
                template_index = i  # Use first three templates for variety
            else:
                template_index = random.randint(0, len(task_templates) - 1)
            
            template = task_templates[template_index]
            
            time_min, time_max = template["timeMinMax"]
            time_spent = time_min + random.random() * (time_max - time_min)
            time_spent = round(time_spent * 4) / 4
            
            task = Task(
                name=template["name"],
                time_spent=time_spent,
                focus_level=template["focus_level"],
                date_worked=task_date,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            sample_tasks.append(task)
            weeks_data[week_key]['tasks'].append(task)

    # Get current week boundaries to exclude it from summary generation
    current_week_start, current_week_end = get_week_boundaries(reference_date.date())
    current_week_key = current_week_start.strftime('%Y-%m-%d')
    
    # Generate summaries for all weeks that have tasks, except the current week
    for week_key in sorted(weeks_data.keys()):
        # Skip the current week
        if week_key == current_week_key:
            continue
            
        week_info = weeks_data[week_key]
        if week_info['tasks']:
            summary = await generate_week_summary(ai_service, week_info['tasks'], week_info['start'], week_info['end'])
            if summary:
                sample_summaries.append(summary)

    return sample_tasks, sample_summaries

async def generate_week_summary(ai_service, week_tasks: List[Task], week_start: datetime, week_end: datetime) -> WeeklySummary:
    """Generate a summary for a week's worth of tasks."""
    if not week_tasks:
        return None
    
    week_start_str = week_start.strftime('%Y-%m-%d')
    week_end_str = week_end.strftime('%Y-%m-%d')
    
    try:
        ai_response = await ai_service.generate_weekly_summary(
            tasks=week_tasks,
            week_start=week_start_str,
            week_end=week_end_str,
            context_summaries=None
        )
        
        # Calculate stats for storage (AI service calculates them internally too)
        total_tasks = len(week_tasks)
        total_hours = sum(task.time_spent for task in week_tasks)
        
        focus_values = {"low": 1, "medium": 2, "high": 3}
        avg_focus_numeric = sum(focus_values[task.focus_level.value if hasattr(task.focus_level, 'value') else task.focus_level] for task in week_tasks) / total_tasks
        
        if avg_focus_numeric < 1.5:
            avg_focus = "low"
        elif avg_focus_numeric < 2.5:
            avg_focus = "medium"
        else:
            avg_focus = "high"
        
        return WeeklySummary(
            week_start=week_start_str,
            week_end=week_end_str,
            summary=ai_response.summary,
            stats={
                "total_tasks": total_tasks,
                "total_hours": str(round(total_hours, 1)),
                "avg_focus": avg_focus
            },
            recommendations=ai_response.recommendations,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
    except Exception as e:
        print(f"Failed to generate AI summary for week {week_start_str}: {e}")
        
        # Calculate stats for fallback summary too
        total_tasks = len(week_tasks)
        total_hours = sum(task.time_spent for task in week_tasks)
        
        focus_values = {"low": 1, "medium": 2, "high": 3}
        avg_focus_numeric = sum(focus_values[task.focus_level.value if hasattr(task.focus_level, 'value') else task.focus_level] for task in week_tasks) / total_tasks
        
        if avg_focus_numeric < 1.5:
            avg_focus = "low"
        elif avg_focus_numeric < 2.5:
            avg_focus = "medium"
        else:
            avg_focus = "high"
        
        return WeeklySummary(
            week_start=week_start_str,
            week_end=week_end_str,
            summary="Week completed with various tasks across different focus levels.",
            stats={
                "total_tasks": total_tasks,
                "total_hours": str(round(total_hours, 1)),
                "avg_focus": avg_focus
            },
            recommendations=["Continue maintaining consistent productivity patterns"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )



async def seed_database() -> dict:
    """
    Seed the database with sample tasks and summaries.
    Always clears existing data and uses current date.
    
    Returns:
        Dictionary with counts of created records
    """
    engine = create_engine(SYNC_DATABASE_URL)
    
    with Session(engine) as session:
        # Always clear existing data
        session.query(Task).delete()
        session.query(WeeklySummary).delete()
        session.commit()
        print("Cleared existing data")
        
        # Generate sample data (tasks and summaries together)
        print("Generating sample tasks and AI summaries...")
        sample_tasks, sample_summaries = await generate_sample_data()
        
        # Add tasks to session
        for task in sample_tasks:
            session.add(task)
        
        # Add summaries to session
        for summary in sample_summaries:
            session.add(summary)
        
        session.commit()
        
        print(f"Created {len(sample_tasks)} sample tasks")
        print(f"Created {len(sample_summaries)} sample summaries")
        
        return {
            "tasks_created": len(sample_tasks),
            "summaries_created": len(sample_summaries)
        }

if __name__ == "__main__":
    """
    Run this script directly to seed the database with sample data.
    Always clears existing data and uses current date.
    
    Usage:
        python seed_data.py
    """
    try:
        import asyncio
        print("Seeding database with sample data...")
        result = asyncio.run(seed_database())
        print(f"\nSeeding completed successfully!")
        print(f"Tasks created: {result['tasks_created']}")
        print(f"Summaries created: {result['summaries_created']}")
    except Exception as e:
        print(f"Error seeding database: {e}")
        sys.exit(1) 