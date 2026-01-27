import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.models import DonationRequest, NGOLocation, NGOProfile
from app.core.config import settings

async def check_donations():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Get Chennai NGO locations
            ngo_result = await session.execute(
                select(NGOLocation).where(
                    NGOLocation.ngo_id == (
                        select(NGOProfile.id).where(NGOProfile.organization_name == "Chennai Food Bank")
                    )
                )
            )
            locations = ngo_result.scalars().all()
            
            print("Chennai NGO Locations:")
            location_ids = []
            for loc in locations:
                print(f"  - ID: {loc.id}, Name: {loc.location_name}, Active: {loc.is_active}")
                location_ids.append(loc.id)
            
            if not location_ids:
                print("❌ No locations found for Chennai NGO")
                return
            
            # Check donations for each location
            print("\nDonations for each status:")
            
            statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
            
            for status in statuses:
                donation_result = await session.execute(
                    select(DonationRequest).where(
                        (DonationRequest.ngo_location_id.in_(location_ids)) &
                        (DonationRequest.status == status)
                    )
                )
                donations = donation_result.scalars().all()
                
                print(f"\n{status}: {len(donations)} donations")
                for don in donations[:5]:  # Show first 5
                    print(f"  - ID: {don.id}, Donor: {don.donor_id}, Plates: {don.quantity_plates}, Date: {don.donation_date}")
                
                if len(donations) > 5:
                    print(f"  ... and {len(donations) - 5} more")
            
            # Also check total donations regardless of location
            print("\n\n=== Raw Check ===")
            total_result = await session.execute(
                text(f"SELECT COUNT(*) FROM donation_requests WHERE ngo_location_id IN ({','.join(map(str, location_ids))})")
            )
            total = total_result.scalar()
            print(f"Total donations for these locations: {total}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_donations())
