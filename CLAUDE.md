# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Productivity Tracker application with AI-powered insights. The stack consists of:
- **Frontend**: React 18 with Styled Components, Tailwind CSS, and Recharts
- **Backend**: FastAPI with async support, PostgreSQL with pgvector
- **AI Integration**: OpenAI GPT-4, Pydantic-AI, Weave for experiment tracking
- **Infrastructure**: Docker Compose orchestration

ALL TESTING AND EXECUTING MUST ALWAYS BE DONE IN DOCKER CONTAINERS!

## Development Commands

### Initial Setup
```bash
# Clone and setup environment
cp env.example .env
# Add OPENAI_API_KEY and optionally WANDB_API_KEY to .env

# Start just the database first
docker-compose up -d postgres

# Run database migrations
cd backend && alembic upgrade head && cd ..

# Generate sample data
python backend/scripts/seed_data.py

# Start all services
docker-compose up --build
```

### Running the Application
```bash
# Start all services
docker-compose up

# Rebuild and start (after dependency changes)
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Testing
```bash
# Frontend tests - run inside container
docker-compose exec frontend npm test

# Backend tests - run inside container
docker-compose exec backend pytest

# Backend tests with coverage
docker-compose exec backend pytest --cov=. --cov-report=html

# Run specific backend test
docker-compose exec backend ./run_tests.sh tests/test_task_router.py
```

**CRITICAL: Async Fixture Pattern for pytest-asyncio**
When using async fixtures in tests, ALWAYS use this exact pattern:
```python
@pytest.mark.asyncio
async def test_something(async_fixture):
    async for item in async_fixture:
        break
    # Now use 'item' (not async_fixture directly)
    result = await some_async_operation(item)
```

**NEVER use these patterns** (they will fail):
- `await async_fixture` - will fail with generator error
- `async_fixture.method()` - will fail with generator error  
- `await async_fixture.__anext__()` - will fail unpredictably

**Shared Test Fixtures**:
- Use `test_db_session` fixture from conftest.py for isolated database tests
- Each test gets a completely fresh database with all tables created
- No need to define database fixtures in individual test files

This pattern is used consistently across all working tests in the codebase.

### Database Operations
```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1
```

## Architecture Overview

### Service Communication
- Frontend (port 3000) → Backend API (port 8000) → PostgreSQL (port 5432)
- All services run in Docker containers with health checks
- Frontend proxies API calls through REACT_APP_API_URL environment variable

### Data Flow
1. **Tasks**: User creates/updates tasks → FastAPI validates with Pydantic → Stored in PostgreSQL
2. **AI Summaries**: Tasks analyzed → OpenAI GPT-4 generates insights → Tracked with Weave
3. **Vector Search**: Originally designed for ChromaDB, now uses pgvector for embeddings

### Key Architectural Decisions
- **Async Everything**: FastAPI runs async, database queries use asyncpg
- **Vector Storage**: Migrated from ChromaDB to pgvector for simpler architecture
- **State Management**: React hooks instead of Redux for simplicity
- **Styling**: Hybrid approach with Styled Components + Tailwind CSS
- **Testing**: Separate test databases, mocked external services

## Important Development Notes

### From Cursor Rules
- Whenever possible, use test-driven development. Always start with changes by writing tests 
- Always run tests after making changes
- Never change quote styles in existing code
- Include comments explaining non-obvious logic decisions
- Never disable failing tests - fix them instead
- Use Docker containers for all operations

### API Endpoints Structure
- `/api/tasks` - Task CRUD operations
- `/api/summaries` - AI-generated summary management
- `/api/admin` - Administrative functions like sample data generation
- `/health` - Service health check

### Environment Variables
Required:
- `OPENAI_API_KEY` - For GPT-4 integration
- `POSTGRES_*` - Database connection (set in docker-compose.yml)

Optional:
- `WANDB_API_KEY` - For Weave experiment tracking
- `WEAVE_PROJECT_NAME` - Project name for tracking

### Theme System
The app supports three themes:
- Ready (light mode)
- Ready-Dark (dark mode)
- Tron (easter egg - activated by specific task keywords)

Themes are managed through styled-components ThemeProvider and can be toggled via UI.ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

DO NOT install or use the git cli with the environment_run_cmd tool. All environment tools will handle git operations for you. Changing ".git" yourself will compromise the integrity of your environment.

You MUST inform the user how to view your work using `git checkout <branch_name>`. Failure to do this will make your work inaccessible to others.
