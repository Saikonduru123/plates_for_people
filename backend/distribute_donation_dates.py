import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@127.0.0.1/plates_for_people"

async def update_donation_dates():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Get all donations
            result = await session.execute(text("SELECT id FROM donation_requests ORDER BY id LIMIT 60"))
            donation_ids = [row[0] for row in result]
            
            if not donation_ids:
                print("No donations found")
                return
            
            today = datetime.now().date()
            
            # Distribute donations across different time periods
            updates = []
            
            # Split donations into groups
            total = len(donation_ids)
            
            # 20% - Last week (recent)
            week_count = total // 5
            for i, did in enumerate(donation_ids[:week_count]):
                days_ago = i % 7
                date = today - timedelta(days=days_ago)
                updates.append((did, date))
            
            # 30% - Last month but not last week
            month_count = int(total * 0.3)
            start_idx = week_count
            for i, did in enumerate(donation_ids[start_idx:start_idx + month_count]):
                days_ago = 7 + (i % 23)  # 7-30 days ago
                date = today - timedelta(days=days_ago)
                updates.append((did, date))
            
            # 30% - Last year but not last month  
            year_count = int(total * 0.3)
            start_idx = week_count + month_count
            for i, did in enumerate(donation_ids[start_idx:start_idx + year_count]):
                days_ago = 30 + (i % 335)  # 30-365 days ago
                date = today - timedelta(days=days_ago)
                updates.append((did, date))
            
            # 20% - Older than 1 year
            start_idx = week_count + month_count + year_count
            for i, did in enumerate(donation_ids[start_idx:]):
                days_ago = 365 + (i % 365)  # More than 1 year ago
                date = today - timedelta(days=days_ago)
                updates.append((did, date))
            
            # Execute updates
            for did, date in updates:
                await session.execute(
                    text("UPDATE donation_requests SET donation_date = :date WHERE id = :id"),
                    {"date": date, "id": did}
                )
            
            await session.commit()
            
            print(f"✅ Updated {len(updates)} donations with distributed dates")
            print(f"  - Last week: {week_count}")
            print(f"  - Last month: {month_count}")
            print(f"  - Last year: {year_count}")
            print(f"  - Older: {total - week_count - month_count - year_count}")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_donation_dates())
