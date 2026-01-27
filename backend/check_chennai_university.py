import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import User, NGOProfile, NGOLocation
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_chennai_university():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check for Chennai University NGO
            ngo_result = await session.execute(
                select(NGOProfile).where(NGOProfile.organization_name.contains("Chennai University"))
            )
            ngo_profiles = ngo_result.scalars().all()
            
            if not ngo_profiles:
                print("❌ No Chennai University NGO found in database")
                return
            
            print(f"Found {len(ngo_profiles)} Chennai University NGO(s):\n")
            
            for ngo_profile in ngo_profiles:
                print(f"Organization: {ngo_profile.organization_name}")
                print(f"Status: {ngo_profile.verification_status}")
                print(f"User ID: {ngo_profile.user_id}")
                
                # Get user details
                user_result = await session.execute(
                    select(User).where(User.id == ngo_profile.user_id)
                )
                user = user_result.scalar_one_or_none()
                
                if user:
                    print(f"📧 Email: {user.email}")
                    print(f"   Active: {user.is_active}")
                    print(f"   Verified: {user.is_verified}")
                    
                    # Check locations
                    loc_result = await session.execute(
                        select(NGOLocation).where(NGOLocation.ngo_id == ngo_profile.id)
                    )
                    locations = loc_result.scalars().all()
                    
                    print(f"📍 Locations ({len(locations)}):")
                    for loc in locations:
                        print(f"   - {loc.location_name} (ID: {loc.id}, Active: {loc.is_active})")
                else:
                    print("❌ User not found for this NGO")
                print()
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_chennai_university())
