"""
NGO routes
Handles NGO profile management and dashboard
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, NGOProfile, DonationRequest, Rating, UserRole
from app.models.ngo import NGOVerificationStatus
from app.schemas import NGOProfileUpdate, NGOProfileResponse

router = APIRouter()


@router.get("/profile", response_model=NGOProfileResponse)
async def get_ngo_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current NGO's profile
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
    result = await db.execute(
        select(NGOProfile)
        .where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    return ngo_profile


@router.put("/profile", response_model=NGOProfileResponse)
async def update_ngo_profile(
    profile_update: NGOProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current NGO's profile
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
    result = await db.execute(
        select(NGOProfile)
        .where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    # Update fields (excluding verification fields that only admins can change)
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ngo_profile, field, value)
    
    await db.commit()
    await db.refresh(ngo_profile)
    
    return ngo_profile


@router.get("/dashboard")
async def get_ngo_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get NGO dashboard statistics
    Returns:
    - verification_status: Current verification status
    - total_donations_received: Total number of donations received
    - completed_donations: Number of completed donations
    - pending_donations: Number of pending donations
    - rejected_donations: Number of rejected donations
    - average_rating: Average rating received
    - total_meals_received: Total meals across all donations
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile first
    ngo_result = await db.execute(
        select(NGOProfile)
        .where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    # Get total donations count (from all NGO locations)
    from app.models import NGOLocation
    location_ids_result = await db.execute(
        select(NGOLocation.id)
        .where(NGOLocation.ngo_id == ngo_profile.id)
    )
    location_ids = [row[0] for row in location_ids_result.all()]
    
    if not location_ids:
        # No locations yet, return zeros
        return {
            "verification_status": ngo_profile.verification_status.value,
            "total_donations_received": 0,
            "completed_donations": 0,
            "pending_donations": 0,
            "rejected_donations": 0,
            "average_rating": 0.0,
            "total_meals_received": 0
        }
    
    # Get total donations count
    total_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(DonationRequest.ngo_location_id.in_(location_ids))
    )
    total_donations = total_result.scalar() or 0
    
    # Get completed donations count
    completed_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(
            DonationRequest.ngo_location_id.in_(location_ids),
            DonationRequest.status == "completed"
        )
    )
    completed_donations = completed_result.scalar() or 0
    
    # Get pending donations count
    pending_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(
            DonationRequest.ngo_location_id.in_(location_ids),
            DonationRequest.status == "pending"
        )
    )
    pending_donations = pending_result.scalar() or 0
    
    # Get rejected donations count
    rejected_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(
            DonationRequest.ngo_location_id.in_(location_ids),
            DonationRequest.status == "rejected"
        )
    )
    rejected_donations = rejected_result.scalar() or 0
    
    # Get average rating received
    rating_result = await db.execute(
        select(func.avg(Rating.rating))
        .where(Rating.ngo_id == ngo_profile.id)
    )
    avg_rating = rating_result.scalar()
    average_rating = float(avg_rating) if avg_rating else 0.0
    
    # Get total meals received
    meals_result = await db.execute(
        select(func.sum(DonationRequest.quantity_plates))
        .where(
            DonationRequest.ngo_location_id.in_(location_ids),
            DonationRequest.status == "completed"
        )
    )
    total_meals = meals_result.scalar()
    total_meals_received = int(total_meals) if total_meals else 0
    
    return {
        "verification_status": ngo_profile.verification_status.value,
        "total_donations_received": total_donations,
        "completed_donations": completed_donations,
        "pending_donations": pending_donations,
        "rejected_donations": rejected_donations,
        "average_rating": round(average_rating, 2),
        "total_meals_received": total_meals_received
    }
