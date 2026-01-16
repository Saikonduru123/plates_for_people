"""
Notification service
Helper functions to create notifications
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Notification


async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    related_entity_type: str = None,
    related_entity_id: int = None
) -> Notification:
    """
    Create a notification for a user
    
    Args:
        db: Database session
        user_id: ID of the user to notify
        title: Notification title
        message: Notification message
        notification_type: Type of notification (e.g., "donation_confirmed")
        related_entity_type: Type of related entity (e.g., "donation")
        related_entity_id: ID of related entity
        
    Returns:
        Created notification object
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id
    )
    
    db.add(notification)
    # Note: Don't commit here - let the caller handle transaction
    return notification


# Notification type constants
class NotificationType:
    """Notification type constants"""
    DONATION_CREATED = "donation_created"
    DONATION_CONFIRMED = "donation_confirmed"
    DONATION_REJECTED = "donation_rejected"
    DONATION_COMPLETED = "donation_completed"
    DONATION_CANCELLED = "donation_cancelled"
    NGO_VERIFIED = "ngo_verified"
    NGO_REJECTED = "ngo_rejected"
    RATING_RECEIVED = "rating_received"


# Helper functions for specific notification types
async def notify_donation_created(
    db: AsyncSession,
    ngo_user_id: int,
    donor_name: str,
    donation_id: int,
    quantity: int,
    meal_type: str,
    donation_date: str
):
    """Notify NGO when a new donation request is created"""
    return await create_notification(
        db=db,
        user_id=ngo_user_id,
        title="New Donation Request",
        message=f"{donor_name} wants to donate {quantity} plates of {meal_type} on {donation_date}",
        notification_type=NotificationType.DONATION_CREATED,
        related_entity_type="donation",
        related_entity_id=donation_id
    )


async def notify_donation_confirmed(
    db: AsyncSession,
    donor_user_id: int,
    ngo_name: str,
    donation_id: int,
    location_name: str
):
    """Notify donor when NGO confirms donation"""
    return await create_notification(
        db=db,
        user_id=donor_user_id,
        title="Donation Confirmed",
        message=f"{ngo_name} has confirmed your donation at {location_name}. Check details for pickup information.",
        notification_type=NotificationType.DONATION_CONFIRMED,
        related_entity_type="donation",
        related_entity_id=donation_id
    )


async def notify_donation_rejected(
    db: AsyncSession,
    donor_user_id: int,
    ngo_name: str,
    donation_id: int,
    reason: str = None
):
    """Notify donor when NGO rejects donation"""
    message = f"{ngo_name} had to decline your donation request."
    if reason:
        message += f" Reason: {reason}"
    
    return await create_notification(
        db=db,
        user_id=donor_user_id,
        title="Donation Request Declined",
        message=message,
        notification_type=NotificationType.DONATION_REJECTED,
        related_entity_type="donation",
        related_entity_id=donation_id
    )


async def notify_donation_completed(
    db: AsyncSession,
    donor_user_id: int,
    ngo_name: str,
    donation_id: int,
    quantity: int
):
    """Notify donor when donation is marked as completed"""
    return await create_notification(
        db=db,
        user_id=donor_user_id,
        title="Donation Completed!",
        message=f"Thank you! Your donation of {quantity} plates has been successfully delivered to {ngo_name}. Please rate your experience.",
        notification_type=NotificationType.DONATION_COMPLETED,
        related_entity_type="donation",
        related_entity_id=donation_id
    )


async def notify_donation_cancelled(
    db: AsyncSession,
    ngo_user_id: int,
    donor_name: str,
    donation_id: int
):
    """Notify NGO when donor cancels donation"""
    return await create_notification(
        db=db,
        user_id=ngo_user_id,
        title="Donation Cancelled",
        message=f"{donor_name} has cancelled their donation request.",
        notification_type=NotificationType.DONATION_CANCELLED,
        related_entity_type="donation",
        related_entity_id=donation_id
    )


async def notify_ngo_verified(
    db: AsyncSession,
    ngo_user_id: int,
    ngo_name: str
):
    """Notify NGO when their account is verified"""
    return await create_notification(
        db=db,
        user_id=ngo_user_id,
        title="Account Verified!",
        message=f"Congratulations! {ngo_name} has been verified. You can now start receiving donation requests.",
        notification_type=NotificationType.NGO_VERIFIED,
        related_entity_type="ngo",
        related_entity_id=None
    )


async def notify_ngo_rejected(
    db: AsyncSession,
    ngo_user_id: int,
    reason: str = None
):
    """Notify NGO when their verification is rejected"""
    message = "Unfortunately, your NGO verification request has been declined."
    if reason:
        message += f" Reason: {reason}"
    message += " You can update your information and resubmit."
    
    return await create_notification(
        db=db,
        user_id=ngo_user_id,
        title="Verification Declined",
        message=message,
        notification_type=NotificationType.NGO_REJECTED,
        related_entity_type="ngo",
        related_entity_id=None
    )


async def notify_rating_received(
    db: AsyncSession,
    ngo_user_id: int,
    donor_name: str,
    rating: int,
    donation_id: int
):
    """Notify NGO when they receive a rating"""
    stars = "⭐" * rating
    return await create_notification(
        db=db,
        user_id=ngo_user_id,
        title="New Rating Received",
        message=f"{donor_name} rated your service {stars} ({rating}/5)",
        notification_type=NotificationType.RATING_RECEIVED,
        related_entity_type="donation",
        related_entity_id=donation_id
    )
