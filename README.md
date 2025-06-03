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

1. **Clone the repository**
   ```bash
   git clone https://github.com/gregschwartz/Productivity-Tracker.git
   cd Productivity-Tracker
   ```

2. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   ```
   
   Add your API keys to `backend/.env`

3. **Start development environment**
   ```bash
   docker-compose up --build
   ```

   This will start:
   - Frontend on http://localhost:3000
   - Backend API on http://localhost:8000
   - API documentation on http://localhost:8000/docs

## API Endpoints

### Summary Generation
- `POST /api/generate-summary` - Generate weekly productivity summary
- `POST /api/enhance-summary` - Enhance existing summary with context
- `POST /api/analyze-productivity` - Analyze productivity patterns

### RAG Knowledge Base
- `POST /api/search` - Search knowledge base with RAG
- `POST /api/ask` - Ask productivity questions
- `GET /api/knowledge-stats` - Get knowledge base statistics
- `POST /api/add-knowledge` - Add documents to knowledge base

### Utility
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation

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

**Frontend tests:**
```bash
npm test
```

**Backend tests:**
```bash
cd backend
pytest
```

## Code Structure

```
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── themes/            # Theme definitions
│   └── tests/             # Frontend tests
├── backend/               # Python FastAPI backend
│   ├── models/            # Pydantic models
│   ├── services/          # Business logic services
│   ├── routers/           # API route handlers
│   └── main.py           # FastAPI app entry point
├── Dockerfile             # Production build
├── Dockerfile.frontend    # Frontend development
├── Dockerfile.backend     # Backend development
└── docker-compose.yml     # Development orchestration
```
