import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import weave
import asyncio

from routers.tasks import router as tasks_router
from routers.summaries import router as summaries_router
from routers.admin import router as admin_router
from services.database import get_session
from routers.admin import regenerate_embeddings_route

# Load environment variables
load_dotenv()

# Initialize Weave for experiment tracking (skip during tests)
if not os.getenv("TESTING"):
    weave.init("Productivity Tracker API")

app = FastAPI(
    title="Productivity Tracker API",
    description="Clean API for productivity tracking with AI-powered insights and vector search",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(tasks_router, prefix="/api")
app.include_router(summaries_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Run regenerate embeddings on server startup."""
    try:
        print("🚀 Starting up...")
        
        # Generate any missing summaries or embeddings
        async for db in get_session():
            result = await regenerate_embeddings_route(db)
            print(f"✅ Startup complete: {result['message']}")
            break  # Only need first session from the generator
    except Exception as e:
        print(f"⚠️  Warning: Failed to regenerate embeddings on startup: {str(e)}")
        print("   Server will continue running, but some summaries may be missing. If so, try calling POST /api/admin/regenerate-embeddings")

@app.get("/")
async def root():
    return {"message": "Productivity Tracker API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 