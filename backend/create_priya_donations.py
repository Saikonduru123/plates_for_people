import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import DonationRequest, DonorProfile, NGOLocation
from app.core.config import settings

async def main():
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get Priya donor (ID: 4)
        priya_result = await session.execute(
            select(DonorProfile).where(DonorProfile.id == 4)
        )
        priya = priya_result.scalar_one_or_none()
        
        if not priya:
            print("Priya donor not found!")
            return
        
        # Get an NGO location for testing (ID: 3)
        ngo_loc_result = await session.execute(
            select(NGOLocation).where(NGOLocation.id == 3)
        )
        ngo_location = ngo_loc_result.scalar_one_or_none()
        
        if not ngo_location:
            print("NGO location not found!")
            return
        
        # Create sample donations for Priya
        lunch_donation = DonationRequest(
            donor_id=priya.id,
            ngo_location_id=ngo_location.id,
            food_type="Cooked Biryani",
            quantity_plates=35,
            meal_type="lunch",
            donation_date=datetime.now().date(),
            pickup_time_start="11:30",
            pickup_time_end="13:00",
            description="Fresh biryani from Priya",
            status="completed",
            completed_at=datetime.now(datetime.now().astimezone().tzinfo),
        )
        session.add(lunch_donation)
        
        dinner_donation = DonationRequest(
            donor_id=priya.id,
            ngo_location_id=ngo_location.id,
            food_type="Dal and Roti",
            quantity_plates=25,
            meal_type="lunch",
            donation_date=(datetime.now() - timedelta(days=3)).date(),
            pickup_time_start="18:00",
            pickup_time_end="19:30",
            description="Dinner items from Priya",
            status="confirmed",
            confirmed_at=datetime.now(datetime.now().astimezone().tzinfo),
        )
        session.add(dinner_donation)
        
        snack_donation = DonationRequest(
            donor_id=priya.id,
            ngo_location_id=ngo_location.id,
            food_type="Samosa and Chutney",
            quantity_plates=45,
            meal_type="lunch",
            donation_date=(datetime.now() - timedelta(days=5)).date(),
            pickup_time_start="15:00",
            pickup_time_end="16:00",
            description="Snack items",
            status="pending",
        )
        session.add(snack_donation)
        
        await session.commit()
        print(f"✅ Created 3 sample donations for Priya")
        print(f"   Donor ID: {priya.id}")
        print(f"   Donor Name: {priya.organization_name}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
