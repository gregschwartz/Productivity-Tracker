# Productivity Tracker Application - Updated Architecture

## Overview

This document incorporates fixes to the Mermaid diagram, aligns the agent naming, and clarifies summary-generation triggers.

## Functional Modules

* **Task Management**: React functional components and hooks to input, edit, delete daily tasks (name, time spent, focus level).
* **Storage Layer**: Backend REST API (Node.js on AWS Lambda) with PostgreSQL (in Docker). Optionally cache recent data in localStorage for offline use.
* **Visualization**: React chart components (Recharts or Chart.js) for heatmaps and bar charts of productivity trends.
* **Weekly Summary Service**:

  * **Trigger**: Instead of only on-demand, summaries may be generated immediately after each week's last task is saved/edited, ensuring availability and eliminating first-search latency.
  * **On-Demand Fallback**: If a summary is still missing when queried, the Search Agent triggers generation.
* **GenAI API Integration**: Use `https://ai.pydantic.dev/` for generating weekly summaries. The Summary Generator module will be responsible for collecting the week's task data (total tasks, breakdown by focus level, types of tasks if categorized) and formatting a prompt for the Pydantic AI service. The service is expected to return a one-paragraph summary and suggestions.
* **Summary & Vector Storage**: Chroma running in Docker to store summary texts and embeddings.
* **Search Agent**: Pydantic‑AI agent that:

  1. Extracts key terms (e.g., "coding") from the user's query.
  2. Expands synonyms (e.g., "programming," "hacking").
  3. Queries Chroma separately for each term.
  4. Merges and ranks results, returning a table of week‑dates and summary snippets.
* **CI/CD Pipeline**: GitHub Actions for linting, unit/integration tests (React Testing Library, Jest), build, and deploy.
* **Hosting & Infra**: Monolithic Docker Compose on AWS Lambda and Vercel; includes frontend, backend, and Chroma.
* **Monitoring & Logging**: Plan for Sentry (frontend), Prometheus/Grafana (backend), with alerts on GenAI API failures and high-latency endpoints.

## Updated Mermaid Diagram

```mermaid
flowchart TD
  subgraph Frontend
    UI[React UI]
    UI --> TM[Task Manager]
    UI --> VZ[Visualizer]
    UI --> HS[Search UI]
    UI --> WSB[Weekly Summary Button]
  end

  subgraph Backend
    TM --> API[REST API]
    VZ --> API
    HS --> API
    WSB --> API
    API --> DB[(PostgreSQL)]
  end

  subgraph Summary_and_Search
    DB --> EVT[DB Event: end of week OR Manual Trigger]
    API -- Manual Trigger --> GEN[Summary Generator]
    EVT --> GEN[Summary Generator]
    GEN --> PAI[Pydantic AI Service (https://ai.pydantic.dev/)]
    PAI --> SD[Summary Store]
    GEN --> EMB[Embedding Processor]
    EMB --> VS[(Chroma Store)]
    HS --> AGT[Pydantic-AI Agent]
    AGT -- terms --> VS
    AGT -- text --> SD
  end

  subgraph CI_CD_deploy
    GH[GitHub Actions]
    GH --> TEST[Tests & Lint]
    TEST --> BUILD[Build]
    BUILD --> DEPLOY[Deploy to AWS/Vercel]
  end

  subgraph Monitoring
    DEPLOY --> MON[Prometheus & Sentry]
  end
```

## Trade‑offs & Scaling

* **Summary Trigger**: Immediate post‑save generation ensures summaries are pre‑computed, trading compute cost for low latency. The on‑demand fallback covers edge cases.
* **Monolith vs. Microservices**: Begin with a single Docker Compose stack; split into microservices if traffic and development velocity demand it.
* **Vector Store**: Chroma is easy to self‑host; if load increases, consider a managed vector DB for scalability.
* **Agent Query Expansion**: Multiple searches improve recall but increase query time; monitor and cache popular queries.

## Sample Data for Testing

To facilitate testing, especially for the historical search functionality (Gen-AI Task Part Two), sample data should be available. This data will simulate past user activity and generated weekly summaries.

*   **Structure**:
    *   **Tasks**: A collection of daily task entries. Each task should have a `task_id`, `user_id` (if multi-user is considered future-proof), `date_created`, `task_name`, `time_spent_hours`, `time_spent_minutes`, `focus_level` (e.g., 'low', 'medium', 'high'), and `week_number` or `year_week` (e.g., '2024-W20').
    *   **Weekly Summaries**: A collection of AI-generated summaries. Each summary should have a `summary_id`, `week_identifier` (e.g., '2024-W20'), `summary_text` (the one-paragraph report), `suggestions_text`, and `generation_date`.
*   **Population**:
    *   **Database (PostgreSQL)**: A script (e.g., SQL script or a programmatic seed script) should be provided to insert sample tasks and weekly summaries into the respective tables.
    *   **Vector Store (Chroma)**: After sample summaries are in the database, a script or utility should process these summaries: generate embeddings for `summary_text` (and potentially `suggestions_text` or concatenated content) and store them in Chroma along with their `week_identifier` or `summary_id` as metadata.
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
3. Update the Search Agent logic with term expansion.
4. Fix CI/CD workflow to build and deploy the Docker stack.
5. Configure monitoring dashboards and alert rules.
