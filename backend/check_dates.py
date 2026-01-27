import asyncio
import asyncpg

async def check_dates():
    conn = await asyncpg.connect('postgresql://postgres:postgres@127.0.0.1/plates_for_people')
    
    try:
        # Check donation dates
        result = await conn.fetch('''
            SELECT donation_date::date, COUNT(*) as count 
            FROM donation_requests 
            GROUP BY donation_date::date 
            ORDER BY donation_date::date DESC 
            LIMIT 20;
        ''')
        
        print("\n=== Donation Dates Distribution ===")
        for row in result:
            print(f"Date: {row['donation_date']}, Count: {row['count']}")
        
        # Check date range
        result2 = await conn.fetchrow('''
            SELECT 
                MIN(donation_date)::date as earliest, 
                MAX(donation_date)::date as latest,
                COUNT(*) as total
            FROM donation_requests;
        ''')
        
        print("\n=== Date Range ===")
        print(f"Earliest: {result2['earliest']}, Latest: {result2['latest']}, Total: {result2['total']}")
    finally:
        await conn.close()

asyncio.run(check_dates())
