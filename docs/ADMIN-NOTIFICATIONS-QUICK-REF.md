# Quick Reference: Admin Notifications

## ✅ Admin notifications are already working!

The bell icon in the Admin Dashboard header automatically shows notifications.

---

## 🚀 Quick Start - Create Admin Notification

### Option 1: Use the Helper Function (Recommended)

```python
from app.services.notification_service import notify_admins_custom

# In any route handler:
await notify_admins_custom(
    db=db,
    title="Your Title",
    message="Your message here",
    notification_type="custom_type"
)
await db.commit()
```

### Option 2: For Specific Admin

```python
from app.services.notification_service import create_notification

await create_notification(
    db=db,
    user_id=14,  # specific admin user ID
    title="Your Title",
    message="Your message",
    notification_type="custom_type"
)
await db.commit()
```

---

## 📋 Real Examples

### 1. System Alert

```python
await notify_admins_custom(
    db=db,
    title="⚠️ System Alert",
    message="Server CPU usage is above 90%",
    notification_type="system_alert"
)
await db.commit()
```

### 2. User Report

```python
await notify_admins_custom(
    db=db,
    title="📢 User Report",
    message=f"User reported donation #{donation_id}",
    notification_type="user_report",
    related_entity_type="donation",
    related_entity_id=donation_id
)
await db.commit()
```

### 3. Milestone

```python
await notify_admins_custom(
    db=db,
    title="🎉 Milestone!",
    message=f"{total_donations} donations completed",
    notification_type="milestone"
)
await db.commit()
```

---

## 🧪 Test Notifications

Run this command to send test notifications to all admins:

```bash
cd backend && python3 test_admin_notification.py
```

Then open Admin Dashboard and check the bell icon! 🔔

---

## 📍 Where Notifications Appear

1. **Bell Icon** - Top right of Admin Dashboard header
2. **Badge Count** - Shows number of unread notifications
3. **Dropdown** - Click bell to see list of notifications
4. **Auto-refresh** - Updates every 30 seconds

---

## ✅ Already Integrated For:

- **NGO Registration** - When new NGO signs up
- **Location Added** - When NGO adds new location

---

## 📂 Files Reference

- **Helper Functions**: `backend/app/services/notification_service.py`
- **Frontend Component**: `frontend/plates-for-people/src/components/NotificationBell.tsx`
- **Test Script**: `backend/test_admin_notification.py`
- **Full Guide**: `docs/ADMIN-NOTIFICATIONS-GUIDE.md`
