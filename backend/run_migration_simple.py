import asyncio
import sys
import re
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

async def main():
    from sqlalchemy import text
    from app.core.database import engine
    
    # Read SQL file
    sql_file = Path(__file__).parent / "migrations" / "001_add_meal_type_capacity.sql"
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    print("🔄 Starting migration...")
    print(f"📄 Reading: {sql_file}")
    
    # Remove comments and split into individual statements
    # Remove SQL comments
    sql_content = re.sub(r'--.*$', '', sql_content, flags=re.MULTILINE)
    
    # Split by semicolons, but keep DO blocks together
    statements = []
    current = []
    in_do_block = False
    
    for line in sql_content.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        if line.upper().startswith('DO '):
            in_do_block = True
            
        current.append(line)
        
        if '$$;' in line and in_do_block:
            statements.append(' '.join(current))
            current = []
            in_do_block = False
        elif ';' in line and not in_do_block:
            statements.append(' '.join(current))
            current = []
    
    # Filter out empty statements
    statements = [s.strip() for s in statements if s.strip() and s.strip() not in ('BEGIN;', 'COMMIT;')]
    
    print(f"📝 Found {len(statements)} statements to execute\n")
    
    async with engine.begin() as conn:
        try:
            for idx, stmt in enumerate(statements, 1):
                # Show first 100 chars of statement
                preview = stmt[:100].replace('\n', ' ')
                print(f"  [{idx}/{len(statements)}] {preview}...")
                await conn.execute(text(stmt))
            
            print("\n✅ Migration completed successfully!")
        except Exception as e:
            print(f"\n❌ Migration failed at statement {idx}: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
