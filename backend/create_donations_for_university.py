import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import DonationRequest, NGOLocation, NGOProfile, DonorProfile
from app.core.config import settings

async def create_donations_for_university():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Get Chennai University location
            ngo_result = await session.execute(
                select(NGOProfile).where(NGOProfile.organization_name.like("%Chennai University%Ekkatuthangal%"))
            )
            ngo = ngo_result.scalar_one_or_none()
            
            if not ngo:
                print("❌ Chennai University NGO not found")
                return
            
            loc_result = await session.execute(
                select(NGOLocation).where(NGOLocation.ngo_id == ngo.id)
            )
            location = loc_result.scalar_one_or_none()
            
            if not location:
                print("❌ Location not found for Chennai University")
                return
            
            # Get some donors to create donations from
            donor_result = await session.execute(
                select(DonorProfile).limit(5)
            )
            donors = donor_result.scalars().all()
            
            if not donors:
                print("❌ No donors found in database")
                return
            
            today = datetime.now().date()
            
            # Create donations with different statuses
            donations_data = [
                # PENDING donations
                {
                    "donor_id": donors[0].id,
                    "ngo_location_id": location.id,
                    "quantity_plates": 50,
                    "meal_type": "LUNCH",
                    "food_type": "Rice and Curry",
                    "description": "Lunch donation",
                    "status": "PENDING",
                    "donation_date": today,
                    "pickup_time_start": "12:00",
                    "pickup_time_end": "14:00",
                },
                {
                    "donor_id": donors[1].id if len(donors) > 1 else donors[0].id,
                    "ngo_location_id": location.id,
                    "quantity_plates": 40,
                    "meal_type": "BREAKFAST",
                    "food_type": "Idli and Sambar",
                    "description": "Breakfast donation",
                    "status": "PENDING",
                    "donation_date": today + timedelta(days=1),
                    "pickup_time_start": "08:00",
                    "pickup_time_end": "10:00",
                },
                # CONFIRMED donation
                {
                    "donor_id": donors[2].id if len(donors) > 2 else donors[0].id,
                    "ngo_location_id": location.id,
                    "quantity_plates": 60,
                    "meal_type": "LUNCH",
                    "food_type": "Biryani",
                    "description": "Confirmed lunch",
                    "status": "CONFIRMED",
                    "donation_date": today + timedelta(days=2),
                    "pickup_time_start": "12:30",
                    "pickup_time_end": "13:30",
                    "confirmed_at": datetime.now(),
                },
                # COMPLETED donation
                {
                    "donor_id": donors[3].id if len(donors) > 3 else donors[0].id,
                    "ngo_location_id": location.id,
                    "quantity_plates": 45,
                    "meal_type": "DINNER",
                    "food_type": "Dosa and Chutney",
                    "description": "Completed dinner",
                    "status": "COMPLETED",
                    "donation_date": today - timedelta(days=1),
                    "pickup_time_start": "18:00",
                    "pickup_time_end": "20:00",
                    "completed_at": datetime.now() - timedelta(days=1),
                },
                # REJECTED donation
                {
                    "donor_id": donors[4].id if len(donors) > 4 else donors[0].id,
                    "ngo_location_id": location.id,
                    "quantity_plates": 30,
                    "meal_type": "LUNCH",
                    "food_type": "Samosa",
                    "description": "Rejected donation",
                    "status": "REJECTED",
                    "donation_date": today - timedelta(days=2),
                    "pickup_time_start": "15:00",
                    "pickup_time_end": "17:00",
                    "rejected_at": datetime.now() - timedelta(days=2),
                    "rejection_reason": "Unable to receive due to capacity constraints",
                },
            ]
            
            for don_data in donations_data:
                donation = DonationRequest(**don_data)
                session.add(donation)
            
            await session.commit()
            
            print(f"✅ Created {len(donations_data)} donations for Chennai University - Ekkatuthangal")
            print(f"\n📍 Location: {location.location_name}")
            print(f"📊 Donations created:")
            print(f"   - 2 PENDING donations")
            print(f"   - 1 CONFIRMED donation")
            print(f"   - 1 COMPLETED donation")
            print(f"   - 1 REJECTED donation")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_donations_for_university())
