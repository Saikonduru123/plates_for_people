import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import User, NGOProfile, NGOLocation, UserRole, NGOVerificationStatus
from app.core.config import settings
from app.core.security import hash_password

async def create_chennai_university_ekkatuthangal():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            email = "chennai.university.ekt@ngo.com"
            password = "ChennaiUniv@2026"
            organization_name = "Chennai University - Ekkatuthangal"
            
            # Check if user already exists
            user_result = await session.execute(
                select(User).where(User.email == email)
            )
            existing_user = user_result.scalar_one_or_none()
            
            if existing_user:
                print(f"❌ User already exists with email: {email}")
                print(f"Password: {password}")
                return
            
            # Create user
            new_user = User(
                email=email,
                password_hash=hash_password(password),
                role=UserRole.NGO,
                is_active=True,
                is_verified=True
            )
            session.add(new_user)
            await session.flush()
            
            # Create NGO profile
            new_ngo = NGOProfile(
                user_id=new_user.id,
                organization_name=organization_name,
                registration_number="NGO_UNIV_001",
                contact_person="Dr. Ramakrishnan",
                phone="+91-9876543210",
                verification_status=NGOVerificationStatus.VERIFIED
            )
            session.add(new_ngo)
            await session.flush()
            
            # Create location
            new_location = NGOLocation(
                ngo_id=new_ngo.id,
                location_name="Ekkatuthangal",
                address_line1="Chennai University Campus",
                address_line2="Ekkatuthangal",
                city="Chennai",
                state="Tamil Nadu",
                zip_code="600096",
                country="India",
                latitude=13.0083,
                longitude=80.2502,
                contact_person="Dr. Ramakrishnan",
                contact_phone="+91-9876543210",
                is_active=True,
                default_breakfast_capacity=100,
                default_lunch_capacity=150,
                default_snacks_capacity=50,
                default_dinner_capacity=120
            )
            session.add(new_location)
            
            await session.commit()
            
            print("✅ Chennai University - Ekkatuthangal NGO created successfully!")
            print(f"\n📧 Login Credentials:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print(f"\n🏢 NGO Details:")
            print(f"   Organization: {organization_name}")
            print(f"   Registration: NGO_UNIV_001")
            print(f"   Contact: Dr. Ramakrishnan")
            print(f"   Phone: +91-9876543210")
            print(f"\n📍 Location: Ekkatuthangal")
            print(f"   Address: Chennai University Campus, Ekkatuthangal")
            print(f"   City: Chennai, Tamil Nadu 600096")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_chennai_university_ekkatuthangal())
