# Productivity Tracker

A modern productivity tracking application with AI-powered insights, built with React frontend and Python FastAPI backend.



## Features

- 📝 **Task Management**: Track daily tasks with time spent and focus levels
- 📊 **Visualizations**: Interactive charts and heatmaps showing productivity patterns
- 🤖 **AI-Powered Summaries**: Weekly productivity insights using OpenAI GPT-4
- 🔍 **RAG-based Q&A**: Ask questions about productivity and get AI answers based on knowledge base
- 📅 **Date Navigation**: Browse tasks by date with calendar integration
- 🎨 **Multiple Themes**: Ready, Ready-Dark, and Tron themes
- ⚡ **Real-time Updates**: Instant UI updates with modern React patterns

## Architecture

### Frontend (React)
- **Framework**: React 18 with hooks
- **Styling**: Styled Components with theme system
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Charts**: Recharts for data visualization
- **Routing**: React Router for navigation
- **Testing**: Jest with React Testing Library

### Backend (Python FastAPI)
- **Framework**: FastAPI with Pydantic models
- **AI Integration**: OpenAI GPT-4 for summary generation
- **Vector Database**: ChromaDB for RAG functionality
- **Embeddings**: Sentence Transformers for document embeddings
- **Experiment Tracking**: Weights & Biases Weave
- **CORS**: Configured for frontend integration

### Key Technologies
- **Docker**: Containerized deployment
- **Weave**: Experiment tracking and monitoring
- **ChromaDB**: Vector storage for RAG
- **OpenAI**: GPT-4 for AI capabilities
- **Pydantic**: Data validation and serialization

## Installation

### Prerequisites
- Docker and Docker Compose
- OpenAI API key
- (Optional) Weights & Biases account for Weave tracking

### Steps
1. In terminal:

   ```bash
   # Clone the repository
   git clone https://github.com/gregschwartz/Productivity-Tracker.git
   cd Productivity-Tracker
  
   # Set up environment variables
   cp env.example .env
  
   # Start **just** the database
   docker-compose up -d postgres
   
   # Run database migrations
   cd backend
   alembic upgrade head
   cd ..
   ```

2. While that works, add your API keys to `.env`

3. In terminal, generate sample data:

   ```bash
   python backend/scripts/seed_data.py
   ```

4. In terminal, start everything else:
   ```bash
   docker-compose up --build
   ```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:8000
- Postgres on http://localhost:5432


## API Endpoints

### Task Management
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{task_id}` - Get a specific task
- `PUT /api/tasks/{task_id}` - Update a task
- `DELETE /api/tasks/{task_id}` - Delete a task
- `GET /api/tasks/stats/count` - Get total task count
- `POST /api/tasks/stats/calculate` - Calculate task statistics

### Summary Management
- `GET /api/summaries` - Get all summaries
- `POST /api/summaries` - Create a new summary
- `GET /api/summaries/{summary_id}` - Get a specific summary
- `PUT /api/summaries/{summary_id}` - Update a summary
- `DELETE /api/summaries/{summary_id}` - Delete a summary
- `GET /api/summaries/search` - Search summaries using vector similarity
- `GET /api/summaries/stats/count` - Get total summary count

### Admin
- `POST /api/admin/generate-sample-data` - Generate sample data
- `POST /api/admin/regenerate-embeddings` - Utility: Regenerate embeddings for summaries
- `GET /api/admin/health` - Admin health check endpoint

### Utility
- `GET /health` - Health check endpoint

## Features in Detail

### AI-Powered Weekly Summaries
- Analyzes task completion patterns, time allocation, and focus levels
- Generates personalized insights and recommendations
- Uses OpenAI GPT-4 for natural language generation
- Tracks generation metrics with Weave

### RAG-based Knowledge System
- Pre-loaded with productivity best practices
- Learns from your completed tasks
- Vector similarity search with ChromaDB
- AI-generated answers based on relevant context

### Comprehensive Analytics
- Daily and weekly productivity trends
- Focus level distribution analysis
- Time allocation breakdowns
- Interactive heatmaps and charts

### Modern UI/UX
- Responsive design for all screen sizes
- Multiple theme options
- Smooth animations with Framer Motion
- Accessible keyboard navigation

## Running Tests

Since this is a Docker-based application, tests should be run inside the containers:

**Frontend tests:**
```bash
# Run tests in the frontend container
docker-compose exec frontend npm test
```

**Backend tests:**
```bash
# Run tests in the backend container
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov=. --cov-report=html
```

## Project Structure

```
├── backend/              # Python FastAPI backend
│   ├── alembic/          # Database migrations
│   ├── config/           # Configuration files
│   ├── models/           # Data models
│   ├── routers/          # API endpoints
│   ├── scripts/          # Scripts
│   ├── services/         # Business logic
│   ├── tests/            # Backend tests
│   └── utils/            # Helper utilities
├── frontend/             # React frontend
│   ├── build/            # Production build output
│   ├── public/           # Static assets
│   └── src/              # Source code
├── instructions/          # Documents instructing the AI on how and what to build 
│   ├── 1-core_requirements.md # Core project requirements
│   ├── 2-architecture.md      # Architecture documentation
│   ├── 3-designs.md          # Design documentation
├── CLAUDE.md             # Claude AI assistant documentation
├── Dockerfile            # Production build
├── Dockerfile.backend    # Backend development
├── Dockerfile.frontend   # Frontend development
├── docker-compose.yml    # Development orchestration
├── README.md             # This file
├── env.example           # Environment variables template
└── nginx.conf            # Nginx configuration
```
