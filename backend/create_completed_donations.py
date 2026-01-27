import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import DonationRequest, NGOLocation, NGOProfile
from app.core.config import settings

async def create_completed_donations():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Get Chennai NGO locations
            ngo_result = await session.execute(
                select(NGOProfile).where(NGOProfile.organization_name == "Chennai Food Bank")
            )
            ngo = ngo_result.scalar_one_or_none()
            
            if not ngo:
                print("❌ Chennai Food Bank NGO not found")
                return
            
            loc_result = await session.execute(
                select(NGOLocation).where(NGOLocation.ngo_id == ngo.id)
            )
            locations = loc_result.scalars().all()
            
            if not locations:
                print("❌ No locations found")
                return
            
            main_location = locations[0]  # Main Branch - Ekkatuthangal
            
            # Create completed donations with different dates
            today = datetime.now().date()
            
            completed_donations = [
                {
                    "donor_id": 1,
                    "ngo_location_id": main_location.id,
                    "quantity_plates": 50,
                    "meal_type": "LUNCH",
                    "food_type": "Rice and Curry",
                    "description": "Hot lunch boxes",
                    "status": "COMPLETED",
                    "donation_date": today - timedelta(days=5),
                    "pickup_time_start": "12:00",
                    "pickup_time_end": "14:00",
                    "completed_at": (today - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S'),
                },
                {
                    "donor_id": 2,
                    "ngo_location_id": main_location.id,
                    "quantity_plates": 30,
                    "meal_type": "BREAKFAST",
                    "food_type": "Idli and Sambar",
                    "description": "South Indian breakfast",
                    "status": "COMPLETED",
                    "donation_date": today - timedelta(days=3),
                    "pickup_time_start": "08:00",
                    "pickup_time_end": "10:00",
                    "completed_at": (today - timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S'),
                },
                {
                    "donor_id": 1,
                    "ngo_location_id": main_location.id,
                    "quantity_plates": 45,
                    "meal_type": "DINNER",
                    "food_type": "Dosa and Chutney",
                    "description": "Evening dinner boxes",
                    "status": "COMPLETED",
                    "donation_date": today - timedelta(days=2),
                    "pickup_time_start": "18:00",
                    "pickup_time_end": "20:00",
                    "completed_at": (today - timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S'),
                },
                {
                    "donor_id": 3,
                    "ngo_location_id": main_location.id,
                    "quantity_plates": 40,
                    "meal_type": "LUNCH",
                    "food_type": "Biryani and Raita",
                    "description": "Special biryani donation",
                    "status": "COMPLETED",
                    "donation_date": today - timedelta(days=1),
                    "pickup_time_start": "12:30",
                    "pickup_time_end": "14:30",
                    "completed_at": (today - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S'),
                },
            ]
            
            for don_data in completed_donations:
                completed_at_str = don_data.pop("completed_at")
                completed_at = datetime.fromisoformat(completed_at_str)
                
                donation = DonationRequest(
                    **don_data,
                    completed_at=completed_at
                )
                session.add(donation)
            
            await session.commit()
            
            print(f"✅ Created {len(completed_donations)} completed donations for Chennai NGO")
            print(f"\nLocation: {main_location.location_name}")
            print(f"Donations created:")
            for i, don_data in enumerate(completed_donations, 1):
                print(f"  {i}. {don_data['quantity_plates']} plates ({don_data['meal_type']}) - {don_data['donation_date']}")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_completed_donations())
