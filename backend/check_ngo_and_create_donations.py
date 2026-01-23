"""
Check which NGO has no donations and create test donations for them
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import DATABASE_URL
from app.models import User, NGOProfile, NGOLocation, DonationRequest, DonorProfile
from app.models.ngo import MealType
from app.models.donation import DonationStatus


async def check_and_create():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        print("\n" + "="*60)
        print("Checking NGO Donation Status")
        print("="*60 + "\n")
        
        # Get all NGO users
        result = await db.execute(select(User).where(User.role == 'ngo'))
        ngos = result.scalars().all()
        
        # Get a donor for creating donations
        donor_result = await db.execute(select(User).where(User.role == 'donor').limit(1))
        donor_user = donor_result.scalar_one_or_none()
        
        if not donor_user:
            print("❌ No donor found. Please create a donor first.")
            return
        
        donor_profile_result = await db.execute(
            select(DonorProfile).where(DonorProfile.user_id == donor_user.id)
        )
        donor_profile = donor_profile_result.scalar_one_or_none()
        
        print(f"Using donor: {donor_user.email} (ID: {donor_user.id})\n")
        
        for ngo_user in ngos:
            # Get NGO profile
            profile_result = await db.execute(
                select(NGOProfile).where(NGOProfile.user_id == ngo_user.id)
            )
            ngo_profile = profile_result.scalar_one_or_none()
            
            if not ngo_profile:
                print(f"⚠️  {ngo_user.email} - No profile")
                continue
            
            # Get locations
            loc_result = await db.execute(
                select(NGOLocation).where(NGOLocation.ngo_id == ngo_profile.id)
            )
            locations = loc_result.scalars().all()
            
            print(f"NGO: {ngo_user.email}")
            print(f"  Organization: {ngo_profile.organization_name}")
            print(f"  Locations: {len(locations)}")
            
            if not locations:
                print(f"  ❌ No locations - Cannot create donations\n")
                continue
            
            # Check existing donations
            location_ids = [loc.id for loc in locations]
            don_result = await db.execute(
                select(DonationRequest).where(
                    DonationRequest.ngo_location_id.in_(location_ids)
                )
            )
            existing_donations = don_result.scalars().all()
            
            print(f"  Existing donations: {len(existing_donations)}")
            
            if len(existing_donations) == 0:
                print(f"  📝 Creating test donations...")
                
                # Create 5 test donations with different statuses
                location = locations[0]  # Use first location
                
                statuses = [
                    DonationStatus.PENDING,
                    DonationStatus.PENDING,
                    DonationStatus.CONFIRMED,
                    DonationStatus.COMPLETED,
                    DonationStatus.REJECTED
                ]
                
                meal_types = ["breakfast", "lunch", "dinner", "breakfast", "lunch"]
                quantities = [20, 30, 25, 15, 10]
                
                tomorrow = datetime.now() + timedelta(days=1)
                
                for i, (status, meal, qty) in enumerate(zip(statuses, meal_types, quantities)):
                    donation = DonationRequest(
                        donor_id=donor_profile.id if donor_profile else donor_user.id,
                        ngo_location_id=location.id,
                        food_type="Mixed vegetables and rice",
                        quantity_plates=qty,
                        meal_type=meal,
                        donation_date=(tomorrow + timedelta(days=i)).date(),
                        pickup_time_start="10:00",
                        pickup_time_end="14:00",
                        description=f"Test donation {i+1}",
                        status=status
                    )
                    db.add(donation)
                
                await db.commit()
                print(f"  ✅ Created 5 test donations (pending, pending, confirmed, completed, rejected)")
            else:
                # Show status breakdown
                status_counts = {}
                for d in existing_donations:
                    status_counts[d.status.value] = status_counts.get(d.status.value, 0) + 1
                
                print(f"  Status breakdown:")
                for status, count in status_counts.items():
                    print(f"    - {status}: {count}")
            
            print()
        
        print("="*60)
        print("✅ Check complete!")
        print("="*60)
        print("\nNow refresh the NGO donations page to see the data!\n")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check_and_create())
