# Productivity Tracker Application - Updated Architecture

## Overview

This document incorporates fixes to the Mermaid diagram, aligns the agent naming, and clarifies summary-generation triggers.

## Functional Modules

* **Task Management**: React functional components and hooks to input, edit, delete daily tasks (name, time spent, focus level).
* **Storage Layer**: Backend REST API (Node.js) with PostgreSQL (in Docker).
* **Visualization**: React chart components (Recharts or Chart.js) for heatmaps and bar charts of productivity trends.
* **Weekly Summary Service**:

  * **Trigger**: Instead of only on-demand, summaries may be generated immediately after each week's last task is saved/edited, ensuring availability and eliminating first-search latency.
* **GenAI API Integration**: Use `https://ai.pydantic.dev/` and OpenAI for generating weekly summaries. The Summary Generator module will be responsible for collecting the week's task data and executing a prompt using the Pydantic AI library. It will return a one-paragraph summary and a list of suggestions.
* **Task & Vector Storage**: Postgres with the vector plugin running in Docker to store the tasks and summary texts + embeddings.
* **Search Agent**: AI agent that:

  1. Extracts key terms (e.g., "coding") from the user's query.
  2. Queries postgres for the terms.
  3. Merges and ranks results, returning a table of week‑dates and summary snippets.
* **Hosting & Infra**: Monolithic Docker Compose -- includes frontend, backend, and postgres.
* **Monitoring & Logging**: Plan for Sentry (frontend), Prometheus/Grafana (backend), with alerts on GenAI API failures and high-latency endpoints.

## Trade‑offs & Scaling

* **Monolith vs. Microservices**: Begin with a single Docker Compose stack; split into microservices if traffic and development velocity demand it.
* **Vector Store**: Postgres is easy to self‑host; if load increases, consider a managed vector DB for scalability.
* **Generative AI**: Set rate limits to avoid running up a high bill.

## Sample Data for Testing

To facilitate testing, especially for the historical search functionality (Gen-AI Task Part Two), sample data should be created. This data will simulate past user activity and generated weekly summaries.

*   **Structure**:
    *   **Tasks**: A collection of daily task entries. Each task should have a `task_id`, `user_id` (if multi-user is considered future-proof), `date_created`, `task_name`, `time_spent_hours`, `time_spent_minutes`, `focus_level` (e.g., 'low', 'medium', 'high'), and `week_number` or `year_week` (e.g., '2024-W20').
    *   **Weekly Summaries**: A collection of AI-generated summaries. Each summary should have a `summary_id`, `week_identifier` (e.g., '2024-W20'), `summary_text` (the one-paragraph report), `suggestions_text`, and `generation_date`.
*   **Population**:
    *   **Database (Postgres)**: A programmatic seed script should be provided to insert sample tasks and weekly summaries into the respective tables.
    *   **Vector Store (Postgres)**: After sample summaries are in the database, a script or utility should process these summaries: generate embeddings for `summary_text` and `suggestions_text` and store them in Postgres along with their `week_identifier` or `summary_id` as metadata.
*   **Content Ideas for Sample Data**:
    *   Varying levels of productivity across different weeks.
    *   Weeks with a focus on specific types of tasks (e.g., "coding", "meetings", "design work", "research").
    *   Weeks with different average focus levels.
    *   At least 4-6 weeks of diverse sample data would be beneficial for meaningful search testing.
    *   Example Task: `{ "date_created": "2024-05-13T09:00:00Z", "task_name": "Develop new API endpoint", "time_spent_hours": 3, "time_spent_minutes": 0, "focus_level": "high", "week_number": "2024-W20" }`
    *   Example Summary: `{ "week_identifier": "2024-W20", "summary_text": "This week, you demonstrated high productivity, completing 15 tasks, predominantly focused on development. Your average focus was high, especially on Monday and Tuesday. Consider allocating some time for documentation next week.", "suggestions_text": "Schedule dedicated blocks for documentation. Explore new IDE plugins for faster coding.", "generation_date": "2024-05-19T18:00:00Z" }`

This sample data will be crucial for developers and testers to validate the application's features without manually inputting large amounts of data.

## Next Steps

1. Finalize DB schema with week markers and triggers.
2. Implement DB event hooks for summary generation.
3. Validate the Search Agent logic.
4. Research helpful libraries for the frontend.
