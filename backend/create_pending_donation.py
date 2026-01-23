#!/usr/bin/env python3
"""Create test donations with various statuses"""

import asyncio
from datetime import date, time, datetime
from sqlalchemy import select
from app.database import get_db
from app.models import DonationRequest, DonationStatus, MealType, DonorProfile, NGOLocation

async def create_test_donations():
    async for db in get_db():
        try:
            # Get first donor
            donor_result = await db.execute(select(DonorProfile).limit(1))
            donor = donor_result.scalar_one_or_none()
            
            if not donor:
                print("No donor found")
                return
            
            # Get first NGO location
            location_result = await db.execute(select(NGOLocation).limit(1))
            location = location_result.scalar_one_or_none()
            
            if not location:
                print("No NGO location found")
                return
            
            donations_created = []
            
            # Create CONFIRMED donation
            confirmed_donation = DonationRequest(
                donor_id=donor.id,
                ngo_location_id=location.id,
                food_type="Confirmed Test Meals",
                quantity_plates=20,
                meal_type=MealType.DINNER,
                donation_date=date(2026, 2, 5),
                pickup_time_start="18:00",
                pickup_time_end="19:00",
                description="Test confirmed donation for UI verification",
                status=DonationStatus.CONFIRMED,
                confirmed_at=datetime.utcnow()
            )
            db.add(confirmed_donation)
            donations_created.append(("CONFIRMED", confirmed_donation))
            
            # Create REJECTED donation
            rejected_donation = DonationRequest(
                donor_id=donor.id,
                ngo_location_id=location.id,
                food_type="Rejected Test Meals",
                quantity_plates=10,
                meal_type=MealType.BREAKFAST,
                donation_date=date(2026, 2, 10),
                pickup_time_start="08:00",
                pickup_time_end="09:00",
                description="Test rejected donation for UI verification",
                status=DonationStatus.REJECTED,
                rejected_at=datetime.utcnow(),
                rejection_reason="Insufficient capacity for this date"
            )
            db.add(rejected_donation)
            donations_created.append(("REJECTED", rejected_donation))
            
            await db.commit()
            
            print(f"✅ Created {len(donations_created)} test donations:\n")
            for status, don in donations_created:
                await db.refresh(don)
                print(f"   [{status}] ID: {don.id}")
                print(f"      Food: {don.food_type}")
                print(f"      Meal: {don.meal_type.value}")
                print(f"      Date: {don.donation_date}")
                print()
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()
        
        break

if __name__ == "__main__":
    asyncio.run(create_test_donations())
