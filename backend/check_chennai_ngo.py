import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.models import User, NGOProfile, NGOLocation
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_chennai_ngo():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check for the Chennai NGO user
            result = await session.execute(
                select(User).where(User.email == "chennai.ngo@example.com")
            )
            user = result.scalar_one_or_none()
            
            if user:
                print(f"✅ User found:")
                print(f"   Email: {user.email}")
                print(f"   ID: {user.id}")
                print(f"   Role: {user.role}")
                print(f"   Active: {user.is_active}")
                print(f"   Verified: {user.is_verified}")
                
                # Check password
                test_password = "chennai123"
                is_valid = pwd_context.verify(test_password, user.password_hash)
                print(f"   Password 'chennai123' valid: {is_valid}")
                
                # Check NGO profile
                ngo_result = await session.execute(
                    select(NGOProfile).where(NGOProfile.user_id == user.id)
                )
                ngo_profile = ngo_result.scalar_one_or_none()
                
                if ngo_profile:
                    print(f"\n✅ NGO Profile found:")
                    print(f"   Organization: {ngo_profile.organization_name}")
                    print(f"   Status: {ngo_profile.verification_status}")
                    
                    # Check locations
                    loc_result = await session.execute(
                        select(NGOLocation).where(NGOLocation.ngo_id == ngo_profile.id)
                    )
                    locations = loc_result.scalars().all()
                    
                    print(f"\n✅ NGO Locations ({len(locations)}):")
                    for loc in locations:
                        print(f"   - {loc.location_name} (ID: {loc.id}, Active: {loc.is_active})")
                else:
                    print(f"\n❌ No NGO profile found for user {user.id}")
            else:
                print(f"❌ No user found with email: chennai.ngo@example.com")
                
                # Check if there are any NGO users
                all_ngos = await session.execute(
                    select(User).where(User.role == "ngo")
                )
                ngo_users = all_ngos.scalars().all()
                print(f"\n📋 All NGO users in database:")
                for ngo_user in ngo_users:
                    print(f"   - {ngo_user.email} (ID: {ngo_user.id})")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_chennai_ngo())
