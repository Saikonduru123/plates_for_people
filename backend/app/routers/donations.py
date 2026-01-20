"""
Donation request routes
Handles donation request creation and management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from datetime import date, datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    User, DonorProfile, NGOProfile, NGOLocation, NGOLocationCapacity,
    DonationRequest, UserRole, Notification, AuditLog
)
from app.models.donation import DonationStatus
from app.models.ngo import MealType
from app.schemas import DonationRequestCreate, DonationRequestResponse, DonationRequestUpdate
from app.services.notification_service import (
    notify_donation_created, notify_donation_confirmed, notify_donation_rejected,
    notify_donation_completed, notify_donation_cancelled
)


router = APIRouter()


@router.post("/requests", status_code=status.HTTP_201_CREATED)
async def create_donation_request(
    donation_data: DonationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new donation request (Donor only)
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can create donation requests"
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
    
    # Verify NGO location exists and is active
    location_result = await db.execute(
        select(NGOLocation).where(NGOLocation.id == donation_data.ngo_location_id)
    )
    location = location_result.scalar_one_or_none()
    
    if not location or not location.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO location not found or inactive"
        )
    
    # Check if NGO has capacity for this date and meal type
    capacity_result = await db.execute(
        select(NGOLocationCapacity).where(
            and_(
                NGOLocationCapacity.location_id == donation_data.ngo_location_id,
                NGOLocationCapacity.date == donation_data.donation_date,
                NGOLocationCapacity.meal_type == donation_data.meal_type
            )
        )
    )
    capacity = capacity_result.scalar_one_or_none()
    
    if not capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NGO has not set capacity for this date and meal type"
        )
    
    if capacity.current_capacity < donation_data.quantity_plates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient capacity. Available: {capacity.current_capacity} plates"
        )
    
    # Create donation request
    donation_request = DonationRequest(
        donor_id=donor_profile.id,
        ngo_location_id=donation_data.ngo_location_id,
        food_type=donation_data.food_type,
        quantity_plates=donation_data.quantity_plates,
        meal_type=donation_data.meal_type,
        donation_date=donation_data.donation_date,
        pickup_time_start=donation_data.pickup_time_start,
        pickup_time_end=donation_data.pickup_time_end,
        description=donation_data.description,
        special_instructions=donation_data.special_instructions,
        status=DonationStatus.PENDING
    )
    
    db.add(donation_request)
    
    # Update available capacity
    capacity.current_capacity -= donation_data.quantity_plates
    
    # Flush to get the donation ID
    await db.flush()
    
    # Get NGO user for notification
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.id == location.ngo_id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    # Create notification for NGO
    if ngo_profile:
        await notify_donation_created(
            db=db,
            ngo_user_id=ngo_profile.user_id,
            donor_name=donor_profile.organization_name,
            donation_id=donation_request.id,
            quantity=donation_data.quantity_plates,
            meal_type=donation_data.meal_type.value,
            donation_date=donation_data.donation_date.isoformat()
        )
    
    await db.commit()
    await db.refresh(donation_request)
    
    return {
        "id": donation_request.id,
        "status": donation_request.status.value,
        "message": "Donation request created successfully",
        "donation_date": donation_request.donation_date.isoformat(),
        "quantity_plates": donation_request.quantity_plates
    }


@router.get("/requests/my-donations")
async def get_my_donations(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all donation requests for the current donor
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can access this endpoint"
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
    
    # Build query
    query = select(DonationRequest).where(DonationRequest.donor_id == donor_profile.id)
    
    if status:
        try:
            status_enum = DonationStatus(status)
            query = query.where(DonationRequest.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: pending, confirmed, rejected, completed, cancelled"
            )
    
    result = await db.execute(query.order_by(DonationRequest.created_at.desc()))
    donations = result.scalars().all()
    
    # Fetch NGO details for each donation
    donation_list = []
    for d in donations:
        # Get NGO location details
        location_result = await db.execute(
            select(NGOLocation).where(NGOLocation.id == d.ngo_location_id)
        )
        location = location_result.scalar_one_or_none()
        
        ngo_name = None
        location_name = None
        if location:
            # Get NGO profile
            ngo_result = await db.execute(
                select(NGOProfile).where(NGOProfile.id == location.ngo_id)
            )
            ngo = ngo_result.scalar_one_or_none()
            if ngo:
                ngo_name = ngo.organization_name
            location_name = location.location_name
        
        donation_list.append({
            "id": d.id,
            "donor_id": donor_profile.id,
            "ngo_location_id": d.ngo_location_id,
            "food_type": d.food_type,
            "quantity_plates": d.quantity_plates,
            "meal_type": d.meal_type.value,
            "donation_date": d.donation_date.isoformat(),
            "pickup_time_start": d.pickup_time_start,
            "pickup_time_end": d.pickup_time_end,
            "description": d.description,
            "special_instructions": d.special_instructions,
            "status": d.status.value,
            "rejection_reason": d.rejection_reason,
            "created_at": d.created_at.isoformat(),
            "confirmed_at": d.confirmed_at.isoformat() if d.confirmed_at else None,
            "completed_at": d.completed_at.isoformat() if d.completed_at else None,
            "cancelled_at": d.cancelled_at.isoformat() if d.cancelled_at else None,
            "ngo_name": ngo_name,
            "location_name": location_name
        })
    
    return donation_list


@router.get("/requests/ngo-requests")
async def get_ngo_requests(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all donation requests for the current NGO's locations
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    # Get all location IDs for this NGO
    location_ids_result = await db.execute(
        select(NGOLocation.id).where(NGOLocation.ngo_id == ngo_profile.id)
    )
    location_ids = [row[0] for row in location_ids_result.all()]
    
    if not location_ids:
        return []
    
    # Build query
    query = select(DonationRequest).where(DonationRequest.ngo_location_id.in_(location_ids))
    
    if status:
        try:
            status_enum = DonationStatus(status)
            query = query.where(DonationRequest.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: pending, confirmed, rejected, completed, cancelled"
            )
    
    result = await db.execute(query.order_by(DonationRequest.created_at.desc()))
    donations = result.scalars().all()
    
    return [
        {
            "id": d.id,
            "donor_id": d.donor_id,
            "ngo_location_id": d.ngo_location_id,
            "food_type": d.food_type,
            "quantity_plates": d.quantity_plates,
            "meal_type": d.meal_type.value,
            "donation_date": d.donation_date.isoformat(),
            "pickup_time_start": d.pickup_time_start,
            "pickup_time_end": d.pickup_time_end,
            "description": d.description,
            "special_instructions": d.special_instructions,
            "status": d.status.value,
            "created_at": d.created_at.isoformat()
        }
        for d in donations
    ]


@router.get("/requests/{donation_id}")
async def get_donation_request(
    donation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific donation request
    """
    result = await db.execute(
        select(DonationRequest).where(DonationRequest.id == donation_id)
    )
    donation = result.scalar_one_or_none()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    # Verify access (donor owns it or NGO location belongs to them)
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
    
    # Get NGO location details
    location_result = await db.execute(
        select(NGOLocation).where(NGOLocation.id == donation.ngo_location_id)
    )
    location = location_result.scalar_one_or_none()
    
    ngo_name = None
    location_name = None
    if location:
        # Get NGO profile
        ngo_result = await db.execute(
            select(NGOProfile).where(NGOProfile.id == location.ngo_id)
        )
        ngo = ngo_result.scalar_one_or_none()
        if ngo:
            ngo_name = ngo.organization_name
        location_name = location.location_name
    
    return {
        "id": donation.id,
        "donor_id": donation.donor_id,
        "ngo_location_id": donation.ngo_location_id,
        "food_type": donation.food_type,
        "quantity_plates": donation.quantity_plates,
        "meal_type": donation.meal_type.value,
        "donation_date": donation.donation_date.isoformat(),
        "pickup_time_start": donation.pickup_time_start,
        "pickup_time_end": donation.pickup_time_end,
        "description": donation.description,
        "special_instructions": donation.special_instructions,
        "status": donation.status.value,
        "confirmed_at": donation.confirmed_at.isoformat() if donation.confirmed_at else None,
        "rejected_at": donation.rejected_at.isoformat() if donation.rejected_at else None,
        "rejection_reason": donation.rejection_reason,
        "completed_at": donation.completed_at.isoformat() if donation.completed_at else None,
        "cancelled_at": donation.cancelled_at.isoformat() if donation.cancelled_at else None,
        "created_at": donation.created_at.isoformat(),
        "updated_at": donation.updated_at.isoformat() if donation.updated_at else None,
        "ngo_name": ngo_name,
        "location_name": location_name
    }


@router.post("/requests/{donation_id}/confirm")
async def confirm_donation_request(
    donation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirm a donation request (NGO only)
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can confirm donation requests"
        )
    
    result = await db.execute(
        select(DonationRequest).where(DonationRequest.id == donation_id)
    )
    donation = result.scalar_one_or_none()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    if donation.status != DonationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm donation with status: {donation.status.value}"
        )
    
    # Verify NGO owns this location
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
    
    donation.status = DonationStatus.CONFIRMED
    donation.confirmed_at = datetime.utcnow()
    
    # Get donor user and NGO name for notification
    donor_result = await db.execute(
        select(DonorProfile).where(DonorProfile.id == donation.donor_id)
    )
    donor_profile = donor_result.scalar_one_or_none()
    
    location_result = await db.execute(
        select(NGOLocation).where(NGOLocation.id == donation.ngo_location_id)
    )
    location = location_result.scalar_one_or_none()
    
    # Create notification for donor
    if donor_profile and ngo_profile and location:
        await notify_donation_confirmed(
            db=db,
            donor_user_id=donor_profile.user_id,
            ngo_name=ngo_profile.organization_name,
            donation_id=donation_id,
            location_name=location.location_name
        )
    
    await db.commit()
    
    return {
        "message": "Donation request confirmed",
        "donation_id": donation_id,
        "status": "confirmed"
    }


@router.post("/requests/{donation_id}/reject")
async def reject_donation_request(
    donation_id: int,
    rejection_reason: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a donation request (NGO only)
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can reject donation requests"
        )
    
    result = await db.execute(
        select(DonationRequest).where(DonationRequest.id == donation_id)
    )
    donation = result.scalar_one_or_none()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    if donation.status != DonationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject donation with status: {donation.status.value}"
        )
    
    # Verify NGO owns this location
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
    
    donation.status = DonationStatus.REJECTED
    donation.rejected_at = datetime.utcnow()
    donation.rejection_reason = rejection_reason
    
    # Restore capacity
    capacity_result = await db.execute(
        select(NGOLocationCapacity).where(
            and_(
                NGOLocationCapacity.location_id == donation.ngo_location_id,
                NGOLocationCapacity.date == donation.donation_date,
                NGOLocationCapacity.meal_type == donation.meal_type
            )
        )
    )
    capacity = capacity_result.scalar_one_or_none()
    if capacity:
        capacity.current_capacity += donation.quantity_plates
    
    # Get donor user for notification
    donor_result = await db.execute(
        select(DonorProfile).where(DonorProfile.id == donation.donor_id)
    )
    donor_profile = donor_result.scalar_one_or_none()
    
    # Create notification for donor
    if donor_profile and ngo_profile:
        await notify_donation_rejected(
            db=db,
            donor_user_id=donor_profile.user_id,
            ngo_name=ngo_profile.organization_name,
            donation_id=donation_id,
            reason=rejection_reason
        )
    
    await db.commit()
    
    return {
        "message": "Donation request rejected",
        "donation_id": donation_id,
        "status": "rejected",
        "reason": rejection_reason
    }


@router.post("/requests/{donation_id}/complete")
async def complete_donation_request(
    donation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a donation request as completed (NGO only)
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can complete donation requests"
        )
    
    result = await db.execute(
        select(DonationRequest).where(DonationRequest.id == donation_id)
    )
    donation = result.scalar_one_or_none()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    if donation.status != DonationStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only complete confirmed donations. Current status: {donation.status.value}"
        )
    
    # Verify NGO owns this location
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
    
    donation.status = DonationStatus.COMPLETED
    donation.completed_at = datetime.utcnow()
    
    # Get donor user for notification
    donor_result = await db.execute(
        select(DonorProfile).where(DonorProfile.id == donation.donor_id)
    )
    donor_profile = donor_result.scalar_one_or_none()
    
    # Create notification for donor
    if donor_profile and ngo_profile:
        await notify_donation_completed(
            db=db,
            donor_user_id=donor_profile.user_id,
            ngo_name=ngo_profile.organization_name,
            donation_id=donation_id,
            quantity=donation.quantity_plates
        )
    
    await db.commit()
    
    return {
        "message": "Donation request marked as completed",
        "donation_id": donation_id,
        "status": "completed"
    }


@router.post("/requests/{donation_id}/cancel")
async def cancel_donation_request(
    donation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a donation request (Donor only)
    """
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can cancel donation requests"
        )
    
    result = await db.execute(
        select(DonationRequest).where(DonationRequest.id == donation_id)
    )
    donation = result.scalar_one_or_none()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    # Verify donor owns this donation
    donor_result = await db.execute(
        select(DonorProfile).where(DonorProfile.user_id == current_user.id)
    )
    donor_profile = donor_result.scalar_one_or_none()
    if not donor_profile or donation.donor_id != donor_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if donation.status in [DonationStatus.COMPLETED, DonationStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel donation with status: {donation.status.value}"
        )
    
    donation.status = DonationStatus.CANCELLED
    donation.cancelled_at = datetime.utcnow()
    
    # Restore capacity if not yet confirmed
    if donation.status == DonationStatus.PENDING:
        capacity_result = await db.execute(
            select(NGOLocationCapacity).where(
                and_(
                    NGOLocationCapacity.location_id == donation.ngo_location_id,
                    NGOLocationCapacity.date == donation.donation_date,
                    NGOLocationCapacity.meal_type == donation.meal_type
                )
            )
        )
        capacity = capacity_result.scalar_one_or_none()
        if capacity:
            capacity.current_capacity += donation.quantity_plates
    
    # Get NGO user for notification
    location_result = await db.execute(
        select(NGOLocation).where(NGOLocation.id == donation.ngo_location_id)
    )
    location = location_result.scalar_one_or_none()
    
    if location:
        ngo_result = await db.execute(
            select(NGOProfile).where(NGOProfile.id == location.ngo_id)
        )
        ngo_profile = ngo_result.scalar_one_or_none()
        
        # Create notification for NGO
        if ngo_profile and donor_profile:
            await notify_donation_cancelled(
                db=db,
                ngo_user_id=ngo_profile.user_id,
                donor_name=donor_profile.organization_name,
                donation_id=donation_id
            )
    
    await db.commit()
    
    return {
        "message": "Donation request cancelled",
        "donation_id": donation_id,
        "status": "cancelled"
    }
