import os
import json
from typing import List, Optional
from openai import AsyncOpenAI
import weave
from models.pydantic_models import TaskData, SummaryResponse, WeeklyStats, FocusLevel

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    @weave.op()
    async def generate_weekly_summary(
        self,
        tasks: List[TaskData],
        week_start: str,
        week_end: str
    ) -> SummaryResponse:
        """Generate a weekly productivity summary using OpenAI."""
        
        # Calculate basic statistics
        total_tasks = len(tasks)
        total_hours = sum(task.timeSpent for task in tasks)
        
        if total_tasks == 0 or total_hours == 0:
            return SummaryResponse(
                summary="No tasks completed this week.",
                insights=[],
                recommendations=[],
                stats=WeeklyStats(totalTasks=0, totalHours="0.0", avgFocus=FocusLevel.no_tasks)
            )

        # Calculate focus distribution by time spent
        focus_time = {"low": 0, "medium": 0, "high": 0}
        for task in tasks:
            focus_time[task.focusLevel] += task.timeSpent
        
        # Get average focus level
        focus_values = {"low": 1, "medium": 2, "high": 3}
        total_focus_score = sum(focus_values[task.focusLevel] for task in tasks)
        avg_focus = total_focus_score / total_tasks if total_tasks > 0 else 0
        avg_focus_label = FocusLevel.low if avg_focus < 1.5 else FocusLevel.medium if avg_focus < 2.5 else FocusLevel.high
        
        # Create task summary
        task_summary = "\n".join([
            f"- {task.name} ({task.timeSpent}h, {task.focusLevel} focus)"
            for task in tasks
        ])

        stats = WeeklyStats(
            totalTasks=total_tasks,
            totalHours=f"{total_hours:.1f}",
            avgFocus=avg_focus_label
        )
        
        
        # Generate AI summary
        prompt = f"""You are a productivity coach for software engineers at a startup.
        Analyze this week's productivity data and provide:

            1. A concise summary (2-3 sentences) of the week's productivity patterns
            2. 3-5 key insights about work habits and performance
            3. 3-5 specific, actionable recommendations for improvement


        Week: {week_start} to {week_end}
        Total Tasks: {total_tasks}
        Total Hours: {total_hours:.1f}
        Average Focus: {avg_focus_label}

        Tasks:
        {task_summary}

        Provide a JSON response with:
        {{
            "summary": "2-3 sentence summary of the week",
            "insights": ["insight 1", "insight 2", "insight 3"],
            "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
        }}
        """
        
        # Log the request with Weave
        print({
            "prompt_length": len(prompt),
            "task_count": total_tasks,
            "total_hours": total_hours,
            "avg_focus": avg_focus
        })
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",  # Use cheaper model
                messages=[
                    {"role": "system", "content": "You are a productivity coach for software engineers at a startup. Analyze the user's productivity data and provide a summary, insights, and recommendations. You must respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            ai_response = json.loads(content)
            
        except Exception as e:
            # Fallback response
            print({"summary_generation_error": str(e)})
            return SummaryResponse(
                summary="Unable to generate AI summary. Please try again later.",
                insights=[],
                recommendations=[],
                stats=stats
            )
        
        print({
                "success": True,
                "insights": ai_response.get("insights", []),
                "insights_count": len(ai_response.get("insights", [])),
                "recommendations": ai_response.get("recommendations", []),
                "recommendations_count": len(ai_response.get("recommendations", [])),
                "summary": ai_response.get("summary", "")
            })
        
        return SummaryResponse(
            summary=ai_response.get("summary", ""),
            insights=ai_response.get("insights", []),
            recommendations=ai_response.get("recommendations", []),
            stats=stats
        )

    @weave.op()
    async def enhance_summary_with_context(
        self,
        summary: str,
        additional_context: str
    ) -> str:
        """
        Enhance an existing summary with additional context.
        """
        try:
            prompt = f"""
            Enhance the following productivity summary with additional context:
            
            Original Summary: {summary}
            Additional Context: {additional_context}
            
            Provide an enhanced version that incorporates the new context while maintaining the original insights.
            Return only the enhanced summary text.
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a productivity expert. Enhance summaries with additional context while maintaining clarity and actionability."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=500
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print({"enhancement_error": str(e)})
            return summary  # Return original if enhancement fails 