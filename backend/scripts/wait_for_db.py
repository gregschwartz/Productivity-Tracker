import os
import sys
import time
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Import database configuration from our config module
sys.path.append('/app')
from config.database import get_database_config

def wait_for_db():
    """Wait for PostgreSQL to be ready."""
    max_retries = 30
    retry_delay = 2  # seconds
    
    try:
        # Get database configuration using the same logic as the main app
        db_config = get_database_config()
        
        for i in range(max_retries):
            try:
                # Try to connect to the database
                conn = psycopg2.connect(
                    dbname=db_config['database'],
                    user=db_config['user'],
                    password=db_config['password'],
                    host=db_config['host'],
                    port=db_config['port']
                )
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
                conn.close()
                print("✅ Database is ready!")
                return
            except Exception as e:
                print(f"⚠️  Database connection failed (attempt {i + 1}/{max_retries}): {e}")
                if i == max_retries - 1:
                    print("❌ Max retries reached. Exiting...")
                    sys.exit(1)
                time.sleep(retry_delay)
    except Exception as e:
        print(f"❌ Error getting database configuration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    wait_for_db()
