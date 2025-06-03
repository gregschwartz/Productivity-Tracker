import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import weave

from routers import summary, rag

# Load environment variables
load_dotenv()

# Initialize Weave for experiment tracking
weave.init("Productivity Tracker API")

app = FastAPI(
    title="Productivity Tracker API",
    description="Backend API for productivity tracking with AI-powered insights",
    version="0.0.1"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(summary.router, prefix="/api", tags=["summary"])
app.include_router(rag.router, prefix="/api", tags=["search"])

@app.get("/")
async def root():
    return {"message": "Productivity Tracker API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
    print("API is running on http://localhost:8000")