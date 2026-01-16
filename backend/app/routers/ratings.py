"""
Rating routes
Handles ratings and feedback for completed donations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, DonorProfile, NGOProfile, Rating, DonationRequest, UserRole
from app.models.donation import DonationStatus
from app.schemas import RatingCreate, RatingResponse, NGORatingsSummary
from app.services.notification_service import notify_rating_received

router = APIRouter()


@router.post("/", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def create_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a rating for a completed donation (Donor only)
    Can only rate once per donation
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can create ratings"
        )
    
    # Get donor profile
    donor_result = await db.execute(
        select(DonorProfile).where(DonorProfile.user_id == current_user.id)
    )
    donor_profile = donor_result.scalar_one_or_none()
    
    if not donor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found"
        )
    
    # Get donation
    donation_result = await db.execute(
        select(DonationRequest).where(DonationRequest.id == rating_data.donation_id)
    )
    donation = donation_result.scalar_one_or_none()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    # Verify donor owns this donation
    if donation.donor_id != donor_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only rate your own donations"
        )
    
    # Verify donation is completed
    if donation.status != DonationStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only rate completed donations"
        )
    
    # Check if already rated
    existing_rating_result = await db.execute(
        select(Rating).where(Rating.donation_id == rating_data.donation_id)
    )
    if existing_rating_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already rated this donation"
        )
    
    # Get NGO profile from donation location
    from app.models import NGOLocation
    location_result = await db.execute(
        select(NGOLocation).where(NGOLocation.id == donation.ngo_location_id)
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO location not found"
        )
    
    # Create rating
    new_rating = Rating(
        donation_id=rating_data.donation_id,
        donor_id=donor_profile.id,
        ngo_id=location.ngo_id,
        rating=rating_data.rating,
        feedback=rating_data.feedback
    )
    
    db.add(new_rating)
    await db.flush()
    
    # Get NGO profile for notification
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.id == location.ngo_id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    # Create notification for NGO
    if ngo_profile:
        await notify_rating_received(
            db=db,
            ngo_user_id=ngo_profile.user_id,
            donor_name=donor_profile.organization_name,
            rating=rating_data.rating,
            donation_id=rating_data.donation_id
        )
    
    await db.commit()
    await db.refresh(new_rating)
    
    return new_rating


@router.get("/my-ratings", response_model=List[RatingResponse])
async def get_my_ratings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all ratings given by the current donor
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can view their ratings"
        )
    
    # Get donor profile
    donor_result = await db.execute(
        select(DonorProfile).where(DonorProfile.user_id == current_user.id)
    )
    donor_profile = donor_result.scalar_one_or_none()
    
    if not donor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found"
        )
    
    # Get all ratings by this donor
    result = await db.execute(
        select(Rating)
        .where(Rating.donor_id == donor_profile.id)
        .order_by(Rating.created_at.desc())
    )
    ratings = result.scalars().all()
    
    return ratings


@router.get("/ngo/{ngo_id}", response_model=NGORatingsSummary)
async def get_ngo_ratings(
    ngo_id: int,
    limit: int = Query(10, ge=1, le=50, description="Number of recent ratings to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get ratings summary for a specific NGO
    Includes average rating, distribution, and recent ratings
    """
    # Verify NGO exists
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.id == ngo_id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    # Get all ratings for this NGO
    ratings_result = await db.execute(
        select(Rating).where(Rating.ngo_id == ngo_id)
    )
    all_ratings = ratings_result.scalars().all()
    
    # Calculate statistics
    total_ratings = len(all_ratings)
    
    if total_ratings == 0:
        return {
            "ngo_id": ngo_id,
            "ngo_name": ngo_profile.organization_name,
            "total_ratings": 0,
            "average_rating": 0.0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "recent_ratings": []
        }
    
    # Calculate average
    total_score = sum(r.rating for r in all_ratings)
    average_rating = round(total_score / total_ratings, 2)
    
    # Calculate distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in all_ratings:
        rating_distribution[rating.rating] += 1
    
    # Get recent ratings
    recent_ratings_result = await db.execute(
        select(Rating)
        .where(Rating.ngo_id == ngo_id)
        .order_by(Rating.created_at.desc())
        .limit(limit)
    )
    recent_ratings = recent_ratings_result.scalars().all()
    
    return {
        "ngo_id": ngo_id,
        "ngo_name": ngo_profile.organization_name,
        "total_ratings": total_ratings,
        "average_rating": average_rating,
        "rating_distribution": rating_distribution,
        "recent_ratings": recent_ratings
    }


@router.get("/ngo/{ngo_id}/average")
async def get_ngo_average_rating(
    ngo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get just the average rating for an NGO (lightweight endpoint)
    """
    # Verify NGO exists
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.id == ngo_id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    # Calculate average rating using SQL
    avg_result = await db.execute(
        select(
            func.count(Rating.id).label('total'),
            func.avg(Rating.rating).label('average')
        ).where(Rating.ngo_id == ngo_id)
    )
    stats = avg_result.one()
    
    return {
        "ngo_id": ngo_id,
        "ngo_name": ngo_profile.organization_name,
        "total_ratings": stats.total or 0,
        "average_rating": round(float(stats.average), 2) if stats.average else 0.0
    }


@router.get("/donation/{donation_id}", response_model=Optional[RatingResponse])
async def get_donation_rating(
    donation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get rating for a specific donation (if exists)
    """
    # Get donation
    donation_result = await db.execute(
        select(DonationRequest).where(DonationRequest.id == donation_id)
    )
    donation = donation_result.scalar_one_or_none()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    # Verify access (donor or NGO)
    if current_user.role == UserRole.DONOR:
        donor_result = await db.execute(
            select(DonorProfile).where(DonorProfile.user_id == current_user.id)
        )
        donor_profile = donor_result.scalar_one_or_none()
        if not donor_profile or donation.donor_id != donor_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    elif current_user.role == UserRole.NGO:
        from app.models import NGOLocation
        ngo_result = await db.execute(
            select(NGOProfile).where(NGOProfile.user_id == current_user.id)
        )
        ngo_profile = ngo_result.scalar_one_or_none()
        
        location_result = await db.execute(
            select(NGOLocation).where(
                and_(
                    NGOLocation.id == donation.ngo_location_id,
                    NGOLocation.ngo_id == ngo_profile.id
                )
            )
        )
        if not location_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    else:
        # Admin can view any rating
        pass
    
    # Get rating
    rating_result = await db.execute(
        select(Rating).where(Rating.donation_id == donation_id)
    )
    rating = rating_result.scalar_one_or_none()
    
    return rating


@router.delete("/{rating_id}")
async def delete_rating(
    rating_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a rating (Donor can delete their own ratings, Admin can delete any)
    """
    # Get rating
    rating_result = await db.execute(
        select(Rating).where(Rating.id == rating_id)
    )
    rating = rating_result.scalar_one_or_none()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    # Verify permission
    if current_user.role == UserRole.DONOR:
        donor_result = await db.execute(
            select(DonorProfile).where(DonorProfile.user_id == current_user.id)
        )
        donor_profile = donor_result.scalar_one_or_none()
        
        if not donor_profile or rating.donor_id != donor_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own ratings"
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors and admins can delete ratings"
        )
    
    await db.delete(rating)
    await db.commit()
    
    return {
        "message": "Rating deleted successfully",
        "rating_id": rating_id
    }
