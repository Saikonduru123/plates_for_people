"""
Script to create NGO test users
"""
import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.ngo import NGOProfile
from app.core.security import hash_password
from sqlalchemy import select

async def create_ngo_users():
    async with AsyncSessionLocal() as db:
        print("=== Checking Existing NGO Users ===\n")
        
        # Check existing NGO users
        result = await db.execute(select(User).where(User.role == "ngo"))
        existing_ngos = result.scalars().all()
        
        for user in existing_ngos:
            print(f"Email: {user.email}")
            ngo_result = await db.execute(select(NGOProfile).where(NGOProfile.user_id == user.id))
            ngo_profile = ngo_result.scalar_one_or_none()
            if ngo_profile:
                print(f"  Organization: {ngo_profile.organization_name}")
                print(f"  Verification Status: {ngo_profile.verification_status}")
            print()
        
        print("\n=== Creating/Updating NGO Test Users ===\n")
        
        # NGO users to create
        ngo_users = [
            {
                "email": "testngo@example.com",
                "password": "password123",
                "organization_name": "Test NGO Organization",
                "registration_number": "NGO123456",
                "contact_person": "John Doe",
                "phone": "+919876543210"
            },
            {
                "email": "chennai.ngo@example.com",
                "password": "chennai123",
                "organization_name": "Chennai Food Bank",
                "registration_number": "NGO789012",
                "contact_person": "Rajesh Kumar",
                "phone": "+919876543211"
            },
            {
                "email": "mumbai.ngo@example.com",
                "password": "mumbai123",
                "organization_name": "Mumbai Meals Foundation",
                "registration_number": "NGO345678",
                "contact_person": "Priya Sharma",
                "phone": "+919876543212"
            }
        ]
        
        for ngo_data in ngo_users:
            # Check if user exists
            result = await db.execute(select(User).where(User.email == ngo_data["email"]))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"✓ User exists: {ngo_data['email']}")
                # Update password and activate
                existing_user.password_hash = hash_password(ngo_data["password"])
                existing_user.is_active = True
                existing_user.is_verified = True
                
                # Check/update NGO profile
                ngo_result = await db.execute(select(NGOProfile).where(NGOProfile.user_id == existing_user.id))
                ngo_profile = ngo_result.scalar_one_or_none()
                
                if ngo_profile:
                    ngo_profile.organization_name = ngo_data["organization_name"]
                    ngo_profile.registration_number = ngo_data["registration_number"]
                    ngo_profile.contact_person = ngo_data["contact_person"]
                    ngo_profile.phone = ngo_data["phone"]
                    if ngo_profile.verification_status == "pending":
                        ngo_profile.verification_status = "verified"
                    print(f"  ✓ Updated NGO profile: {ngo_data['organization_name']}")
                else:
                    # Create NGO profile
                    new_ngo = NGOProfile(
                        user_id=existing_user.id,
                        organization_name=ngo_data["organization_name"],
                        registration_number=ngo_data["registration_number"],
                        contact_person=ngo_data["contact_person"],
                        phone=ngo_data["phone"],
                        verification_status="verified"
                    )
                    db.add(new_ngo)
                    print(f"  ✓ Created NGO profile: {ngo_data['organization_name']}")
            else:
                # Create new user
                new_user = User(
                    email=ngo_data["email"],
                    password_hash=hash_password(ngo_data["password"]),
                    role="ngo",
                    is_active=True,
                    is_verified=True
                )
                db.add(new_user)
                await db.flush()  # Get the user ID
                
                # Create NGO profile
                new_ngo = NGOProfile(
                    user_id=new_user.id,
                    organization_name=ngo_data["organization_name"],
                    registration_number=ngo_data["registration_number"],
                    contact_person=ngo_data["contact_person"],
                    phone=ngo_data["phone"],
                    verification_status="verified"
                )
                db.add(new_ngo)
                print(f"✓ Created new user: {ngo_data['email']}")
                print(f"  ✓ Created NGO profile: {ngo_data['organization_name']}")
            
            print(f"  Password: {ngo_data['password']}")
            print()
        
        await db.commit()
        print("\n✅ All NGO users created/updated successfully!")
        print("\n=== Login Credentials ===\n")
        print("1. testngo@example.com / password123")
        print("2. chennai.ngo@example.com / chennai123")
        print("3. mumbai.ngo@example.com / mumbai123")
        print()

if __name__ == "__main__":
    asyncio.run(create_ngo_users())
