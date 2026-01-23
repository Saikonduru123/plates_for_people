import asyncio
import sys
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User, Notification

async def create_donor_notification(email: str):
    """Create a test notification for a donor"""
    async with AsyncSessionLocal() as db:
        # Find donor user
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User not found: {email}")
            return
            
        if user.role != 'donor':
            print(f"❌ User is not a donor: {email} (role: {user.role})")
            return
        
        print(f"\n✅ Found donor: {user.email}")
        print(f"   ID: {user.id}")
        
        # Create notification
        notification = Notification(
            user_id=user.id,
            title="New Feature: Meal Preferences",
            message="You can now set your preferred meal types when creating donations. Check out the new feature in Donate Now!",
            notification_type="feature_announcement",
            related_entity_type=None,
            related_entity_id=None
        )
        
        db.add(notification)
        await db.commit()
        
        print(f"\n🔔 Created notification:")
        print(f"   Title: {notification.title}")
        print(f"   Message: {notification.message}")
        print(f"   Type: {notification.notification_type}")
        
        # Check total notifications
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user.id, Notification.is_read == False)
        )
        unread_count = len(result.scalars().all())
        
        print(f"\n📊 Total unread notifications for {user.email}: {unread_count}")
        print(f"\n✨ The donor now has {unread_count} unread notifications (was 5, now should be 6)")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "testdonor@example.com"
    asyncio.run(create_donor_notification(email))
