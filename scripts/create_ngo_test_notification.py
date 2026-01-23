#!/usr/bin/env python3
"""
Create test notifications for NGO users to verify the notification system
"""
import asyncio
import sys
sys.path.insert(0, '/home/whirldata/plates_for_people/backend')

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import User, Notification, NGOProfile
from app.database import DATABASE_URL


async def create_test_notifications():
    """Create test notifications for all NGO users"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Find all NGO users
        result = await db.execute(
            select(User, NGOProfile)
            .join(NGOProfile, User.id == NGOProfile.user_id)
            .where(User.role == 'ngo')
        )
        ngo_users = result.all()
        
        if not ngo_users:
            print("❌ No NGO users found in database")
            return
        
        print(f"✅ Found {len(ngo_users)} NGO user(s)")
        
        for user, ngo_profile in ngo_users:
            print(f"\n📝 Creating test notification for: {ngo_profile.organization_name} ({user.email})")
            
            # Check existing notifications
            existing = await db.execute(
                select(Notification)
                .where(Notification.user_id == user.id)
            )
            existing_count = len(existing.scalars().all())
            print(f"   Existing notifications: {existing_count}")
            
            # Create a test notification
            notification = Notification(
                user_id=user.id,
                title="🎉 Test Notification",
                message=f"This is a test notification for {ngo_profile.organization_name}. Your notification system is working!",
                notification_type="donation_created",
                related_entity_type="donation",
                related_entity_id=1,
                is_read=False
            )
            
            db.add(notification)
            await db.commit()
            
            print(f"   ✅ Test notification created (ID: {notification.id})")
            
            # Verify
            verify = await db.execute(
                select(Notification)
                .where(Notification.user_id == user.id, Notification.is_read == False)
            )
            unread_count = len(verify.scalars().all())
            print(f"   📬 Unread notifications: {unread_count}")
    
    await engine.dispose()
    print("\n✅ Done! Refresh the NGO dashboard to see the notification.")


if __name__ == "__main__":
    asyncio.run(create_test_notifications())
