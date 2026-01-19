"""
Add NGO locations near Mumbai for testing
Run with: python3 add_mumbai_ngo.py
"""
import asyncio
from datetime import date, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import User, NGOProfile, NGOLocation, NGOLocationCapacity
from app.models.ngo import NGOVerificationStatus, MealType
from app.models.user import UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def add_mumbai_ngos():
    async with AsyncSessionLocal() as db:
        # Create NGO user
        email = "mumbai_ngo@test.com"
        
        # Check if user exists
        result = await db.execute(select(User).where(User.email == email))
        ngo_user = result.scalar_one_or_none()
        
        if not ngo_user:
            ngo_user = User(
                email=email,
                password_hash=pwd_context.hash("password123"),
                role=UserRole.NGO,
                is_active=True
            )
            db.add(ngo_user)
            await db.flush()
            print(f"✓ Created NGO user: {email}")
        else:
            print(f"✓ NGO user already exists: {email}")
        
        # Check if NGO profile exists
        result = await db.execute(
            select(NGOProfile).where(NGOProfile.user_id == ngo_user.id)
        )
        ngo_profile = result.scalar_one_or_none()
        
        if not ngo_profile:
            ngo_profile = NGOProfile(
                user_id=ngo_user.id,
                organization_name="Mumbai Food Relief Center",
                registration_number="MH/2024/001",
                contact_person="Rajesh Kumar",
                phone="+919876543210",
                verification_status=NGOVerificationStatus.VERIFIED
            )
            db.add(ngo_profile)
            await db.flush()
            print(f"✓ Created NGO profile")
        else:
            print(f"✓ NGO profile already exists")
        
        # Add 2 locations near Mumbai
        locations_data = [
            {
                "name": "Andheri Distribution Center",
                "lat": 19.1136,  # Andheri, Mumbai
                "lon": 72.8697,
                "address": "Andheri West",
                "city": "Mumbai",
                "state": "Maharashtra"
            },
            {
                "name": "Bandra Coastal Center",
                "lat": 19.0596,  # Bandra, Mumbai
                "lon": 72.8295,
                "address": "Bandra West",
                "city": "Mumbai",
                "state": "Maharashtra"
            }
        ]
        
        for loc_data in locations_data:
            # Check if location exists
            result = await db.execute(
                select(NGOLocation).where(
                    NGOLocation.ngo_id == ngo_profile.id,
                    NGOLocation.location_name == loc_data["name"]
                )
            )
            location = result.scalar_one_or_none()
            
            if not location:
                location = NGOLocation(
                    ngo_id=ngo_profile.id,
                    location_name=loc_data["name"],
                    address_line1=loc_data["address"],
                    city=loc_data["city"],
                    state=loc_data["state"],
                    zip_code="400001",
                    country="India",
                    latitude=loc_data["lat"],
                    longitude=loc_data["lon"],
                    is_active=True
                )
                db.add(location)
                await db.flush()
                print(f"✓ Created location: {loc_data['name']}")
            else:
                print(f"✓ Location already exists: {loc_data['name']}")
            
            # Add capacity for next 30 days
            today = date.today()
            for days_ahead in range(30):
                capacity_date = today + timedelta(days=days_ahead)
                
                for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]:
                    # Check if capacity exists
                    result = await db.execute(
                        select(NGOLocationCapacity).where(
                            NGOLocationCapacity.location_id == location.id,
                            NGOLocationCapacity.date == capacity_date,
                            NGOLocationCapacity.meal_type == meal_type
                        )
                    )
                    existing = result.scalar_one_or_none()
                    
                    if not existing:
                        capacity = NGOLocationCapacity(
                            location_id=location.id,
                            date=capacity_date,
                            meal_type=meal_type,
                            total_capacity=150,
                            current_capacity=150
                        )
                        db.add(capacity)
            
            print(f"✓ Added capacity records for {loc_data['name']}")
        
        await db.commit()
        print("\n✅ Mumbai NGOs setup complete!")
        print(f"\nLogin credentials:")
        print(f"Email: {email}")
        print(f"Password: password123")


if __name__ == "__main__":
    asyncio.run(add_mumbai_ngos())
