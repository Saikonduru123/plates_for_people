import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, selectinload, joinedload

from app.models import DonationRequest, DonorProfile, NGOLocation, User
from app.core.config import settings

async def main():
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get all donations with eager loaded donor
        query = (
            select(DonationRequest)
            .options(
                selectinload(DonationRequest.ngo_location),
                joinedload(DonationRequest.donor).joinedload(DonorProfile.user)
            )
            .order_by(DonationRequest.created_at.desc())
        )
        
        result = await session.execute(query)
        donations = result.scalars().all()
        
        print(f'\nTotal Donations: {len(donations)}')
        print('=' * 100)
        print(f"{'ID':<5} {'Donor Name':<30} {'Status':<12} {'Donation Date':<15}")
        print('=' * 100)
        
        # Show first 20
        for donation in donations[:20]:
            donor_name = "Unknown"
            if donation.donor:
                if donation.donor.organization_name:
                    donor_name = donation.donor.organization_name
                elif donation.donor.user:
                    donor_name = donation.donor.user.email.split('@')[0]
            
            donation_date = donation.donation_date.isoformat() if donation.donation_date else 'N/A'
            print(f"{donation.id:<5} {donor_name:<30} {str(donation.status):<12} {donation_date:<15}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
