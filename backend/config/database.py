import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_config():
    """Get database configuration from environment variables."""
    config = {
        'user': os.getenv("POSTGRES_USER", "postgres"),
        'password': os.getenv("POSTGRES_PASSWORD", "postgres"),
        'host': os.getenv("POSTGRES_HOST", "localhost"),
        'port': os.getenv("POSTGRES_PORT", "5432"),
        'database': os.getenv("POSTGRES_DB", "productivity_tracker")
    }
    
    # Validate required environment variables
    if not all([config['host'], config['port'], config['database'], config['user'], config['password']]):
        raise ValueError("POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD must be set")
    
    return config

def get_database_url(driver: str = "asyncpg") -> str:
    """
    Get database URL with specified driver.
    
    Args:
        driver: Database driver ('asyncpg' for async, 'psycopg2' for sync)
    
    Returns:
        Complete database URL string
    """
    config = get_database_config()
    
    return f"postgresql+{driver}://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"

# Common URLs for convenience
ASYNC_DATABASE_URL = get_database_url("asyncpg")  # For FastAPI app
SYNC_DATABASE_URL = get_database_url("psycopg2")  # For Alembic 