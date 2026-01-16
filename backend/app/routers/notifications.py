"""
Notification routes
Handles in-app notifications for users
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Notification
from app.schemas import NotificationResponse, NotificationListResponse

router = APIRouter()


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's notifications with pagination
    """
    # Build query
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    # Get total count
    count_query = select(func.count()).select_from(Notification).where(
        Notification.user_id == current_user.id
    )
    if unread_only:
        count_query = count_query.where(Notification.is_read == False)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get unread count
    unread_query = select(func.count()).select_from(Notification).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    unread_result = await db.execute(unread_query)
    unread_count = unread_result.scalar()
    
    # Get notifications
    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return {
        "total": total,
        "unread_count": unread_count,
        "notifications": notifications
    }


@router.get("/unread", response_model=NotificationListResponse)
async def get_unread_notifications(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get only unread notifications (for notification bell dropdown)
    """
    # Get unread notifications
    query = select(Notification).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    ).order_by(Notification.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Get unread count
    count_query = select(func.count()).select_from(Notification).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    count_result = await db.execute(count_query)
    unread_count = count_result.scalar()
    
    return {
        "total": unread_count,
        "unread_count": unread_count,
        "notifications": notifications
    }


@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a specific notification as read
    """
    # Get notification
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == current_user.id
            )
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Mark as read if not already
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await db.commit()
    
    return {
        "message": "Notification marked as read",
        "notification_id": notification_id
    }


@router.put("/read-all")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark all user's notifications as read
    """
    # Update all unread notifications
    stmt = (
        update(Notification)
        .where(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_read == False
            )
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return {
        "message": "All notifications marked as read",
        "count": result.rowcount
    }


@router.delete("/clear-all")
async def clear_all_notifications(
    read_only: bool = Query(True, description="If true, only delete read notifications"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Clear user's notifications
    By default, only clears read notifications
    """
    # Build delete query
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if read_only:
        query = query.where(Notification.is_read == True)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Delete notifications
    for notification in notifications:
        await db.delete(notification)
    
    await db.commit()
    
    return {
        "message": f"Cleared {'read' if read_only else 'all'} notifications",
        "count": len(notifications)
    }


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a specific notification
    """
    # Get notification
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == current_user.id
            )
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    await db.delete(notification)
    await db.commit()
    
    return {
        "message": "Notification deleted",
        "notification_id": notification_id
    }
