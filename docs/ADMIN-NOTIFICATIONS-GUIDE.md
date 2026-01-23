# Admin Notifications Guide

## How Admin Notifications Work

The admin notification system automatically displays notifications in the **bell icon** at the top-right corner of the Admin Dashboard.

### Current Flow:

1. **Notification Created** → Stored in database with `user_id` = admin user ID
2. **Backend API** → Returns unread notifications via `/api/notifications/unread`
3. **NotificationBell Component** → Fetches and displays in bell icon with badge count
4. **Auto-refresh** → Updates every 30 seconds

---

## Existing Admin Notification Functions

### 1. NGO Registration Notification

**When**: A new NGO registers on the platform  
**Function**: `notify_admins_ngo_registration()`

```python
from app.services.notification_service import notify_admins_ngo_registration

# In your route handler (e.g., after NGO registration):
await notify_admins_ngo_registration(
    db=db,
    ngo_name="Chennai Food Bank",
    ngo_id=12
)
await db.commit()
```

**Result**: All admins get notification: _"Chennai Food Bank has registered and is pending verification"_

---

### 2. Location Added Notification

**When**: An NGO adds a new pickup location  
**Function**: `notify_admins_location_added()`

```python
from app.services.notification_service import notify_admins_location_added

# In your route handler (e.g., after location creation):
await notify_admins_location_added(
    db=db,
    ngo_name="Chennai Food Bank",
    location_name="Anna Nagar Branch",
    location_id=5,
    ngo_id=12
)
await db.commit()
```

**Result**: All admins get notification: _"Chennai Food Bank added new location: Anna Nagar Branch"_

---

## How to Create Custom Admin Notifications

### Method 1: Notify All Admins (Recommended)

Create a new helper function in `notification_service.py`:

```python
async def notify_admins_custom(
    db: AsyncSession,
    title: str,
    message: str,
    notification_type: str,
    related_entity_type: str = None,
    related_entity_id: int = None
):
    """
    Send notification to all admin users

    Args:
        db: Database session
        title: Notification title
        message: Notification message
        notification_type: Type identifier (e.g., "donation_issue")
        related_entity_type: Optional - "donation", "ngo", "user", etc.
        related_entity_id: Optional - ID of the related entity
    """
    from app.models import User, UserRole
    from sqlalchemy import select

    # Get all admin users
    result = await db.execute(
        select(User).where(User.role == UserRole.ADMIN)
    )
    admin_users = result.scalars().all()

    notifications = []
    for admin in admin_users:
        notification = await create_notification(
            db=db,
            user_id=admin.id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id
        )
        notifications.append(notification)

    return notifications
```

**Usage Example:**

```python
from app.services.notification_service import notify_admins_custom

# Example 1: Report issue
await notify_admins_custom(
    db=db,
    title="User Report",
    message="User flagged donation #123 as inappropriate",
    notification_type="user_report",
    related_entity_type="donation",
    related_entity_id=123
)
await db.commit()

# Example 2: System alert
await notify_admins_custom(
    db=db,
    title="System Alert",
    message="Storage capacity is reaching 90%",
    notification_type="system_alert"
)
await db.commit()

# Example 3: New donor registration milestone
await notify_admins_custom(
    db=db,
    title="Milestone Reached!",
    message="Platform has reached 1000 registered donors",
    notification_type="milestone"
)
await db.commit()
```

---

### Method 2: Notify Specific Admin (Less Common)

If you need to notify a specific admin:

```python
from app.services.notification_service import create_notification

# Get specific admin's user_id (e.g., from database or context)
admin_user_id = 14

await create_notification(
    db=db,
    user_id=admin_user_id,
    title="Assigned Task",
    message="You have been assigned to verify Chennai Food Bank",
    notification_type="task_assigned",
    related_entity_type="ngo",
    related_entity_id=12
)
await db.commit()
```

---

## Integration Examples

### Example 1: Notify Admins When Donation Count Reaches Threshold

```python
# In donation routes (e.g., after creating donation)
from sqlalchemy import select, func
from app.services.notification_service import notify_admins_custom

# Count total donations
result = await db.execute(select(func.count(DonationRequest.id)))
total_donations = result.scalar()

# Check milestone
if total_donations in [100, 500, 1000, 5000]:
    await notify_admins_custom(
        db=db,
        title=f"🎉 {total_donations} Donations Milestone!",
        message=f"Platform has successfully facilitated {total_donations} donations",
        notification_type="milestone"
    )
    await db.commit()
```

---

### Example 2: Notify Admins About Suspicious Activity

```python
# In your security/monitoring logic
from app.services.notification_service import notify_admins_custom

# If you detect suspicious activity
if failed_login_attempts > 5:
    await notify_admins_custom(
        db=db,
        title="⚠️ Security Alert",
        message=f"User {user_email} has {failed_login_attempts} failed login attempts",
        notification_type="security_alert",
        related_entity_type="user",
        related_entity_id=user_id
    )
    await db.commit()
```

---

### Example 3: Daily/Weekly Reports

```python
# In a scheduled task or cron job
from app.services.notification_service import notify_admins_custom

# Generate daily report
await notify_admins_custom(
    db=db,
    title="📊 Daily Report",
    message=f"Today: {new_donations} donations, {new_users} new users, {active_ngos} active NGOs",
    notification_type="daily_report"
)
await db.commit()
```

---

## Notification Types Reference

Add custom notification types to `NotificationType` class in `notification_service.py`:

```python
class NotificationType:
    """Notification type constants"""
    # Existing types
    DONATION_CREATED = "donation_created"
    DONATION_CONFIRMED = "donation_confirmed"
    NGO_VERIFIED = "ngo_verified"
    NGO_REGISTRATION = "ngo_registration"
    LOCATION_ADDED = "location_added"

    # Custom admin notification types
    SYSTEM_ALERT = "system_alert"
    USER_REPORT = "user_report"
    MILESTONE = "milestone"
    SECURITY_ALERT = "security_alert"
    DAILY_REPORT = "daily_report"
    TASK_ASSIGNED = "task_assigned"
```

---

## Frontend - How Notifications Appear

### In Admin Dashboard Header:

1. **Bell Icon** with notification count badge
2. **Popover** shows list of notifications when clicked
3. **Auto-refresh** every 30 seconds
4. **Mark as read** when notification is clicked
5. **Navigate** to related page if applicable

### Component Path:

- `frontend/plates-for-people/src/components/NotificationBell.tsx`
- Already integrated in:
  - `/admin/dashboard` (AdminDashboard.tsx)
  - `/ngo/dashboard` (NGODashboard.tsx)
  - `/donor/dashboard` (DonorDashboard.tsx)

---

## Testing Admin Notifications

### Quick Test Script:

Create `backend/test_admin_notification.py`:

```python
import asyncio
from sqlalchemy import select
from app.database import async_session
from app.models import User, UserRole
from app.services.notification_service import notify_admins_custom

async def test_admin_notification():
    async with async_session() as db:
        # Test notification
        await notify_admins_custom(
            db=db,
            title="🧪 Test Notification",
            message="This is a test notification for admin users",
            notification_type="test"
        )
        await db.commit()
        print("✅ Test notification sent to all admins!")

        # Verify
        result = await db.execute(
            select(User).where(User.role == UserRole.ADMIN)
        )
        admins = result.scalars().all()
        print(f"📬 Sent to {len(admins)} admin(s)")

if __name__ == "__main__":
    asyncio.run(test_admin_notification())
```

Run: `cd backend && python test_admin_notification.py`

---

## Summary

### ✅ Admin notifications work automatically via:

1. **Database**: Notifications stored with admin user IDs
2. **API**: `/api/notifications/unread` returns unread notifications
3. **Frontend**: NotificationBell component displays in header
4. **Auto-refresh**: Updates every 30 seconds

### ✅ To create admin notifications:

1. **Use existing functions**: `notify_admins_ngo_registration()`, `notify_admins_location_added()`
2. **Create custom function**: Add new helper in `notification_service.py`
3. **Call from routes**: After specific events/actions
4. **Always commit**: `await db.commit()` after creating notifications

### ✅ Notifications appear in:

- Bell icon with count badge
- Popover dropdown when clicked
- Auto-refresh keeps them updated
