#!/usr/bin/env python3
"""
Create test donation requests for Mumbai NGO
"""
import asyncio
import sys
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User, DonorProfile, NGOProfile, NGOLocation, DonationRequest

async def create_test_donations():
    async with AsyncSessionLocal() as db:
        try:
            # Get Mumbai NGO and its locations
            result = await db.execute(
                select(User).where(User.email == "mumbai.ngo@example.com")
            )
            mumbai_user = result.scalar_one_or_none()
            
            if not mumbai_user:
                print("❌ Mumbai NGO user not found!")
                return
            
            result = await db.execute(
                select(NGOProfile).where(NGOProfile.user_id == mumbai_user.id)
            )
            mumbai_ngo = result.scalar_one_or_none()
            
            if not mumbai_ngo:
                print("❌ Mumbai NGO profile not found!")
                return
            
            # Get Mumbai NGO locations
            result = await db.execute(
                select(NGOLocation).where(NGOLocation.ngo_id == mumbai_ngo.id)
            )
            locations = result.scalars().all()
            
            if not locations:
                print("❌ No locations found for Mumbai NGO!")
                print("Creating a default location...")
                
                # Create a default location
                location = NGOLocation(
                    ngo_id=mumbai_ngo.id,
                    name="Mumbai Main Center",
                    address_line1="123 MG Road",
                    address_line2="Andheri West",
                    city="Mumbai",
                    state="Maharashtra",
                    zip_code="400053",
                    latitude=19.1136,
                    longitude=72.8697,
                    contact_person="Priya Sharma",
                    contact_phone="+91-22-1234-5678",
                    operating_hours="9:00 AM - 6:00 PM",
                    is_active=True
                )
                db.add(location)
                await db.commit()
                await db.refresh(location)
                locations = [location]
                print(f"✅ Created location: {location.name}")
            
            # Get or create a donor
            result = await db.execute(
                select(User).where(User.email == "testdonor@example.com")
            )
            donor_user = result.scalar_one_or_none()
            
            if not donor_user:
                print("❌ Test donor not found!")
                return
            
            result = await db.execute(
                select(DonorProfile).where(DonorProfile.user_id == donor_user.id)
            )
            donor = result.scalar_one_or_none()
            
            if not donor:
                print("❌ Donor profile not found!")
                return
            
            # Create pending donation requests
            location = locations[0]
            today = datetime.now().date()
            
            donations_data = [
                {
                    "food_type": "Vegetarian Meals",
                    "quantity": 50,
                    "meal_type": "lunch",
                    "date": today + timedelta(days=1),
                    "pickup_start": "12:00 PM",
                    "pickup_end": "12:00 PM",
                },
                {
                    "food_type": "Mixed Meals",
                    "quantity": 30,
                    "meal_type": "dinner",
                    "date": today + timedelta(days=1),
                    "pickup_start": "6:00 PM",
                    "pickup_end": "6:00 PM",
                },
                {
                    "food_type": "Breakfast Items",
                    "quantity": 25,
                    "meal_type": "breakfast",
                    "date": today + timedelta(days=2),
                    "pickup_start": "8:00 AM",
                    "pickup_end": "8:00 AM",
                },
                {
                    "food_type": "Vegetarian Meals",
                    "quantity": 40,
                    "meal_type": "lunch",
                    "date": today + timedelta(days=2),
                    "pickup_start": "1:00 PM",
                    "pickup_end": "1:00 PM",
                },
                {
                    "food_type": "Non-Vegetarian Meals",
                    "quantity": 35,
                    "meal_type": "dinner",
                    "date": today + timedelta(days=3),
                    "pickup_start": "7:00 PM",
                    "pickup_end": "7:00 PM",
                },
            ]
            
            created_count = 0
            for data in donations_data:
                donation = DonationRequest(
                    donor_id=donor.id,
                    ngo_location_id=location.id,
                    food_type=data["food_type"],
                    quantity_plates=data["quantity"],
                    meal_type=data["meal_type"],
                    donation_date=data["date"],
                    pickup_time_start=data["pickup_start"],
                    pickup_time_end=data["pickup_end"],
                    pickup_address="Hotel Sunshine, Juhu",
                    pickup_latitude=19.0896,
                    pickup_longitude=72.8295,
                    status="pending",
                    special_instructions="Please bring insulated containers"
                )
                db.add(donation)
                created_count += 1
            
            await db.commit()
            
            print(f"\n✅ Successfully created {created_count} pending donations for Mumbai NGO!")
            print(f"📍 Location: {location.name}")
            print(f"👤 Donor: {donor.organization_name or 'Test Donor'}")
            print("\nDonation Details:")
            for i, data in enumerate(donations_data, 1):
                print(f"  {i}. {data['quantity']} plates of {data['food_type']} ({data['meal_type']}) - {data['date'].strftime('%b %d, %Y')}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(create_test_donations())
