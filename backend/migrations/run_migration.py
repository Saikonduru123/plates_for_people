"""
Run database migration for meal-type capacity system
"""
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()


# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import get_async_engine


async def run_migration():
    """Run the migration SQL script"""
    engine = get_async_engine()
    
    # Read migration file
    migration_file = Path(__file__).parent / "001_add_meal_type_capacity.sql"
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    print("Starting migration...")
    
    async with engine.begin() as conn:
        # Execute migration
        try:
            await conn.execute(text(migration_sql))
            print("✅ Migration completed successfully!")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_migration())
