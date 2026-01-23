#!/usr/bin/env python3
"""
Create a test notification for an NGO user
Usage: python3 create_test_notification.py NGO_USER_EMAIL
"""
import sys
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.insert(0, '/home/whirldata/plates_for_people/backend')

from app.models import User, Notification
from app.database import DATABASE_URL


async def create_test_notification(email: str):
    """Create a test notification for NGO user"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Find NGO user
        result = await db.execute(
            select(User).where(User.email == email, User.role == 'ngo')
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ NGO user with email '{email}' not found")
            return
        
        print(f"✅ Found NGO user: {user.email} (ID: {user.id})")
        
        # Create test notification
        notification = Notification(
            user_id=user.id,
            title="🎉 Test Notification",
            message="This is a test notification to verify the bell icon is working. You can now create donations to receive real notifications!",
            notification_type="donation_created",
            related_entity_type="donation",
            related_entity_id=1,
            is_read=False
        )
        
        db.add(notification)
        await db.commit()
        
        print(f"✅ Test notification created successfully!")
        print(f"   - Title: {notification.title}")
        print(f"   - Message: {notification.message}")
        print("\n📱 Now check the bell icon in your NGO dashboard!")
    
    await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 create_test_notification.py NGO_USER_EMAIL")
        print("\nExample:")
        print("  python3 create_test_notification.py testngo@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    asyncio.run(create_test_notification(email))
