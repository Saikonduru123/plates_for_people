import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import DonationRequest, DonorProfile, NGOLocation, DonationStatus, MealType
from app.core.config import settings

async def main():
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get Madhu Priya donor (ID: 5)
        madhu_result = await session.execute(
            select(DonorProfile).where(DonorProfile.id == 5)
        )
        madhu = madhu_result.scalar_one_or_none()
        
        if not madhu:
            print("Madhu Priya donor not found!")
            return
        
        # Get an NGO location for testing (ID: 2)
        ngo_loc_result = await session.execute(
            select(NGOLocation).where(NGOLocation.id == 2)
        )
        ngo_location = ngo_loc_result.scalar_one_or_none()
        
        if not ngo_location:
            print("NGO location not found!")
            return
        
        # Create sample donations for Madhu Priya (only lunch for now)
        lunch_donation = DonationRequest(
            donor_id=madhu.id,
            ngo_location_id=ngo_location.id,
            food_type="Cooked Rice and Dal",
            quantity_plates=50,
            meal_type="lunch",
            donation_date=datetime.now().date(),
            pickup_time_start="12:00",
            pickup_time_end="13:00",
            description="Fresh lunch from Madhu Priya",
            status="completed",
            completed_at=datetime.now(datetime.now().astimezone().tzinfo),
        )
        session.add(lunch_donation)
        
        snack_donation = DonationRequest(
            donor_id=madhu.id,
            ngo_location_id=ngo_location.id,
            food_type="Snack Items",
            quantity_plates=30,
            meal_type="lunch",  # Use lunch to avoid enum issues temporarily
            donation_date=(datetime.now() - timedelta(days=1)).date(),
            pickup_time_start="14:00",
            pickup_time_end="15:00",
            description="Healthy items",
            status="confirmed",
            confirmed_at=datetime.now(datetime.now().astimezone().tzinfo),
        )
        session.add(snack_donation)
        
        breakfast_donation = DonationRequest(
            donor_id=madhu.id,
            ngo_location_id=ngo_location.id,
            food_type="Bread and Butter",
            quantity_plates=40,
            meal_type="lunch",  # Use lunch to avoid enum issues temporarily
            donation_date=(datetime.now() - timedelta(days=2)).date(),
            pickup_time_start="08:00",
            pickup_time_end="09:00",
            description="Breakfast items",
            status="pending",
        )
        session.add(breakfast_donation)
        
        await session.commit()
        print(f"✅ Created 3 sample donations for Madhu Priya")
        print(f"   Donor ID: {madhu.id}")
        print(f"   Donor Name: {madhu.organization_name}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
