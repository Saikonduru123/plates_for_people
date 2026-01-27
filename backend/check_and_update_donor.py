import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import DonorProfile, User
from app.core.config import settings

async def main():
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check all donors
        result = await session.execute(
            select(DonorProfile, User)
            .join(User, DonorProfile.user_id == User.id)
        )
        donors = result.all()
        
        print('\nCurrent Donor Profiles:')
        print('=' * 80)
        for donor_profile, user in donors:
            org_name = donor_profile.organization_name or '(empty)'
            print(f'ID: {donor_profile.id:3} | Org: {org_name:30} | Email: {user.email}')
        
        print('\n' + '=' * 80)
        
        # Check if we need to add/update "Madhu Priya"
        email_to_check = input('\nEnter donor email to update (or press Enter to skip): ').strip()
        
        if email_to_check:
            new_org_name = input('Enter organization name (e.g., "Madhu Priya"): ').strip()
            
            if new_org_name:
                # Find user by email
                user_result = await session.execute(
                    select(User).where(User.email == email_to_check)
                )
                user = user_result.scalar_one_or_none()
                
                if user:
                    # Update donor profile
                    await session.execute(
                        update(DonorProfile)
                        .where(DonorProfile.user_id == user.id)
                        .values(organization_name=new_org_name)
                    )
                    await session.commit()
                    print(f'\n✅ Updated donor profile for {email_to_check} to "{new_org_name}"')
                else:
                    print(f'\n❌ User with email {email_to_check} not found')
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
