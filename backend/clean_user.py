#!/usr/bin/env python3
import asyncio
from sqlalchemy import text
from app.database import engine

async def clean_user():
    async with engine.begin() as conn:
        # Clear foreign key reference
        await conn.execute(text("UPDATE ngo_profiles SET verified_by = NULL WHERE verified_by = 1"))
        # Delete user
        result = await conn.execute(text("DELETE FROM users WHERE id = 1"))
        print(f"Deleted {result.rowcount} user(s)")
        # Check count
        count = await conn.execute(text("SELECT COUNT(*) FROM users"))
        print(f"Remaining users: {count.scalar()}")

if __name__ == "__main__":
    asyncio.run(clean_user())
