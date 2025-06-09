"""
Admin router.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from services.database import get_session
from scripts.seed_data import seed_database

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/generate-sample-data", response_model=dict)
async def generate_sample_data_route(db: AsyncSession = Depends(get_session)):
    """Generate sample tasks and summaries for demo purposes. Always clears existing data."""
    try:
        result = await seed_database()
        return {
            "message": "Sample data generated successfully",
            "tasks_created": result["tasks_created"],
            "summaries_created": result["summaries_created"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate sample data: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "healthy"}