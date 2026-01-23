"""
Script to create Chennai University NGO user for testing
"""
import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.ngo import NGOProfile
from app.core.security import hash_password
from sqlalchemy import select

async def create_chennai_university_ngo():
    async with AsyncSessionLocal() as db:
        print("=== Creating Chennai University NGO ===\n")
        
        # NGO details
        email = "chennai.university@ngo.com"
        password = "ChennaiNGO@2026"
        organization_name = "Chennai University"
        registration_number = "NGO0987"
        contact_person = "Ramya"
        phone = "1234567890"
        
        # Check if user exists
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"✗ User already exists: {email}")
            print(f"  Organization: {organization_name}")
            print(f"  Password: {password}")
            return
        
        try:
            # Create new user
            new_user = User(
                email=email,
                password_hash=hash_password(password),
                role="ngo",
                is_active=False,  # Not active until admin approves
                is_verified=True
            )
            db.add(new_user)
            await db.flush()  # Get the user ID
            
            # Create NGO profile
            new_ngo = NGOProfile(
                user_id=new_user.id,
                organization_name=organization_name,
                registration_number=registration_number,
                contact_person=contact_person,
                phone=phone,
                verification_status="pending"  # Waiting for admin approval
            )
            db.add(new_ngo)
            
            await db.commit()
            
            print(f"✅ NGO created successfully!\n")
            print(f"📋 NGO Details:")
            print(f"   Organization: {organization_name}")
            print(f"   Registration No: {registration_number}")
            print(f"   Contact Person: {contact_person}")
            print(f"   Phone: {phone}")
            print(f"\n🔐 Login Credentials:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print(f"\n⏳ Status: PENDING (awaiting admin approval in Verify NGOs page)")
            print(f"\n📝 Next Steps:")
            print(f"   1. Go to Admin → Verify NGOs")
            print(f"   2. Find '{organization_name}' in Pending tab")
            print(f"   3. Click 'Approve' button")
            print(f"   4. Then NGO can login with above credentials")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating NGO: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(create_chennai_university_ngo())
