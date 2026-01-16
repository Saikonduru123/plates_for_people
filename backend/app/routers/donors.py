"""
Donor routes
Handles donor profile management and dashboard
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, DonorProfile, DonationRequest, Rating, UserRole
from app.schemas import DonorProfileUpdate, DonorProfileResponse

router = APIRouter()


@router.get("/profile", response_model=DonorProfileResponse)
async def get_donor_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current donor's profile
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can access this endpoint"
        )
    
    # Get donor profile with eager loading
    result = await db.execute(
        select(DonorProfile)
        .where(DonorProfile.user_id == current_user.id)
    )
    donor_profile = result.scalar_one_or_none()
    
    if not donor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found"
        )
    
    return donor_profile


@router.put("/profile", response_model=DonorProfileResponse)
async def update_donor_profile(
    profile_update: DonorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current donor's profile
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can access this endpoint"
        )
    
    # Get donor profile
    result = await db.execute(
        select(DonorProfile)
        .where(DonorProfile.user_id == current_user.id)
    )
    donor_profile = result.scalar_one_or_none()
    
    if not donor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found"
        )
    
    # Update fields
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donor_profile, field, value)
    
    await db.commit()
    await db.refresh(donor_profile)
    
    return donor_profile


@router.get("/dashboard")
async def get_donor_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get donor dashboard statistics
    Returns:
    - total_donations: Total number of donations made
    - completed_donations: Number of completed donations
    - pending_donations: Number of pending donations
    - cancelled_donations: Number of cancelled donations
    - average_rating: Average rating received
    - total_meals_donated: Total meals across all donations
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can access this endpoint"
        )
    
    # Get donor profile first
    donor_result = await db.execute(
        select(DonorProfile)
        .where(DonorProfile.user_id == current_user.id)
    )
    donor_profile = donor_result.scalar_one_or_none()
    
    if not donor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found"
        )
    
    # Get total donations count
    total_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(DonationRequest.donor_id == donor_profile.id)
    )
    total_donations = total_result.scalar() or 0
    
    # Get completed donations count
    completed_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(
            DonationRequest.donor_id == donor_profile.id,
            DonationRequest.status == "completed"
        )
    )
    completed_donations = completed_result.scalar() or 0
    
    # Get pending donations count
    pending_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(
            DonationRequest.donor_id == donor_profile.id,
            DonationRequest.status == "pending"
        )
    )
    pending_donations = pending_result.scalar() or 0
    
    # Get cancelled donations count
    cancelled_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(
            DonationRequest.donor_id == donor_profile.id,
            DonationRequest.status == "cancelled"
        )
    )
    cancelled_donations = cancelled_result.scalar() or 0
    
    # Get average rating given by this donor
    rating_result = await db.execute(
        select(func.avg(Rating.rating))
        .where(Rating.donor_id == donor_profile.id)
    )
    avg_rating = rating_result.scalar()
    average_rating = float(avg_rating) if avg_rating else 0.0
    
    # Get total meals donated
    meals_result = await db.execute(
        select(func.sum(DonationRequest.quantity_plates))
        .where(
            DonationRequest.donor_id == donor_profile.id,
            DonationRequest.status == "completed"
        )
    )
    total_meals = meals_result.scalar()
    total_meals_donated = int(total_meals) if total_meals else 0
    
    return {
        "total_donations": total_donations,
        "completed_donations": completed_donations,
        "pending_donations": pending_donations,
        "cancelled_donations": cancelled_donations,
        "average_rating": round(average_rating, 2),
        "total_meals_donated": total_meals_donated
    }
