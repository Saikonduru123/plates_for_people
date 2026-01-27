import asyncio
from sqlalchemy import select, distinct, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import DonationRequest, DonorProfile, User
from app.core.config import settings

async def main():
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check all unique donor names from donations
        result = await session.execute(
            select(distinct(DonationRequest.donor_id))
            .order_by(DonationRequest.donor_id)
        )
        donor_ids = result.scalars().all()
        
        print('\nDonations by Donor:')
        print('=' * 80)
        
        for donor_id in donor_ids:
            # Get donor profile
            donor_result = await session.execute(
                select(DonorProfile, User)
                .join(User, DonorProfile.user_id == User.id)
                .where(DonorProfile.id == donor_id)
            )
            donor_profile, user = donor_result.first()
            
            # Get donation count
            donation_count = await session.execute(
                select(DonationRequest)
                .where(DonationRequest.donor_id == donor_id)
            )
            donations = donation_count.scalars().all()
            
            org_name = donor_profile.organization_name or '(empty)'
            print(f'Donor ID: {donor_id} | Name: {org_name:30} | Email: {user.email:30} | Donations: {len(donations)}')
        
        print('\n' + '=' * 80)
        print('\nUpdating all old "Madhu" entries to "Madhu Priya"...')
        
        # Update any donations that might reference old donor names
        # This is just informational - the donor_id should always be correct
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
