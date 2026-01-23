"""
Test script to create admin notifications
Run: cd backend && python3 test_admin_notification.py
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import DATABASE_URL
from app.models import User, UserRole, Notification
from app.services.notification_service import notify_admins_custom, create_notification


async def test_admin_notifications():
    """Test creating admin notifications"""
    
    # Create database engine and session
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        print("\n" + "="*60)
        print("Testing Admin Notifications")
        print("="*60 + "\n")
        
        # Get all admin users
        result = await db.execute(
            select(User).where(User.role == UserRole.ADMIN)
        )
        admins = result.scalars().all()
        
        if not admins:
            print("❌ No admin users found in database!")
            print("   Please create an admin user first.")
            return
        
        print(f"📋 Found {len(admins)} admin user(s):")
        for admin in admins:
            print(f"   - {admin.email} (ID: {admin.id})")
        print()
        
        # Test 1: Use notify_admins_custom helper
        print("Test 1: Creating notification using notify_admins_custom()...")
        await notify_admins_custom(
            db=db,
            title="🧪 Test Notification",
            message="This is a test notification sent to all admins",
            notification_type="test"
        )
        await db.commit()
        print("✅ Notification created via helper function\n")
        
        # Test 2: Create custom notification directly
        print("Test 2: Creating custom notification directly...")
        for admin in admins:
            await create_notification(
                db=db,
                user_id=admin.id,
                title="📊 System Report",
                message="Daily system report: All systems operational",
                notification_type="system_report"
            )
        await db.commit()
        print("✅ Custom notifications created\n")
        
        # Test 3: Create milestone notification
        print("Test 3: Creating milestone notification...")
        await notify_admins_custom(
            db=db,
            title="🎉 Milestone Reached!",
            message="Platform has reached 100 successful donations",
            notification_type="milestone"
        )
        await db.commit()
        print("✅ Milestone notification created\n")
        
        # Verify notifications
        print("Verifying notifications...")
        for admin in admins:
            # Count unread notifications
            count_result = await db.execute(
                select(Notification)
                .where(Notification.user_id == admin.id)
                .where(Notification.is_read == False)
                .order_by(Notification.created_at.desc())
            )
            unread_notifications = count_result.scalars().all()
            
            print(f"\n👤 {admin.email}:")
            print(f"   📬 {len(unread_notifications)} unread notification(s)")
            
            if unread_notifications:
                print(f"   Recent notifications:")
                for notif in unread_notifications[:5]:  # Show last 5
                    print(f"      • {notif.title}")
        
        print("\n" + "="*60)
        print("✅ Test completed successfully!")
        print("="*60)
        print("\n📱 Open admin dashboard and check the bell icon!")
        print("   The notifications should appear automatically.\n")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_admin_notifications())
