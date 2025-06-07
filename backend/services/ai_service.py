import os
import json
from typing import List, Optional
from openai import AsyncOpenAI
import weave
from models.pydantic_models import TaskData, SummaryResponse, WeeklyStats, FocusLevel
from pydantic_ai import Agent

SUMMARY_PROMPT = """You are a productivity coach for software engineers at a startup.
Analyze this week's productivity data and generate:
  1. A concise summary (2-3 sentences) of the week's tasks and productivity metrics. The summary should not mention the dates nor that this is a summary; focus on summarizing the actions taken and any correlation between action, focus, and time spent.
  2. 1-3 specific, actionable recommendations to improve efficiency or focus for the next week BASED UPON THE WEEK'S TASKS AND PRODUCTIVITY METRICS. Each should be a single sentence, with the most important part in bold HTML tags e.g. 
    - Set aside <b>1-2 days free from lower focus tasks</b> to help your concentration.
    - Try to <b>pair up during low-focus tasks</b> so you can help each other stay on track.


Week: {week_start} to {week_end}
Total Tasks: {total_tasks}
Total Hours: {total_hours}
Average Focus: {avg_focus}

Tasks:
{task_summary}

{adjacent_week_summaries}

Do not suggest introducing a time tracking tool, that is what is being used to track these   tasks.

Provide a JSON response with:
{{
"summary": "2-3 sentence summary of the week",
"recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}}
"""

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    @weave.op()
    async def generate_weekly_summary(
        self,
        tasks: List[TaskData],
        week_start: str,
        week_end: str,
        week_stats: WeeklyStats,
        context_summaries: Optional[dict] = None
    ) -> SummaryResponse:
        """Generate a weekly productivity summary using OpenAI."""
        if week_stats.totalTasks == 0 or week_stats.totalHours == 0:
            return SummaryResponse(
                summary="No tasks completed this week.",
                recommendations=[]
            )
        
        # Create task summary
        task_summary = "\n".join([
            f"- {task.name} ({task.timeSpent}h, {task.focusLevel.value} focus)"
            for task in tasks
        ])
        
        # Build context section from surrounding summaries
        adjacent_week_summaries = ""
        if context_summaries:
            context_parts = []
            
            if context_summaries.get("before"):
                before_summaries = context_summaries["before"]
                context_parts.append("PREVIOUS WEEKS:")
                for summary in before_summaries:
                    context_parts.append(f"* {summary.get('weekRange', 'Unknown week')}: {summary.get('summary', '')}")
                    if summary.get('recommendations'):
                        context_parts.append(f"  Recommendations: {', '.join(summary['recommendations'])}")
            
            if context_summaries.get("after"):
                after_summaries = context_summaries["after"]
                context_parts.append("\nWEEKS AFTER:")
                for summary in after_summaries:
                    context_parts.append(f"* {summary.get('weekRange', 'Unknown week')}: {summary.get('summary', '')}")
                    if summary.get('recommendations'):
                        context_parts.append(f"  Recommendations: {', '.join(summary['recommendations'])}")
            
            if context_parts:
                adjacent_week_summaries = "IMPORTANT: Use this context from previous and future weeks to provide DIFFERENT advice than what was already given. Avoid repeating recommendations and focus on new insights or next steps in the user's productivity journey. Praise them for ways they have implemented past recommendations or improved their productivity.\n\n" + "\n".join(context_parts)
        
        # Generate AI summary
        prompt = SUMMARY_PROMPT.format(
            week_start=week_start,
            week_end=week_end,
            total_tasks=week_stats.totalTasks,
            total_hours=week_stats.totalHours,
            avg_focus=week_stats.avgFocus,
            task_summary=task_summary,
            adjacent_week_summaries=adjacent_week_summaries
        )
        print("prompt: ", prompt)
        
        try:
            agent = Agent(
                'openai:gpt-4o-mini',
                system_prompt=SUMMARY_PROMPT,
                temperature=0.7,
                output_type=SummaryResponse
            )
            result = await agent.run(prompt)
            print("result: ", result)
            
            # Extract the SummaryResponse from the AgentRunResult
            ai_response = result.output
            
            print({
                    "recommendations": ai_response.recommendations,
                    "summary": ai_response.summary
                })
            
            return ai_response
        except Exception as e:
            # Fallback response
            print({"summary_generation_error": str(e)})
            return SummaryResponse(
                summary="Unable to generate AI summary. Please try again later.",
                recommendations=[]
            )
