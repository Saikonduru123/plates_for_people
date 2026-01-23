"""
Admin routes
Handles admin operations including NGO verification
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, NGOProfile, DonationRequest, UserRole, DonorProfile
from app.models.ngo import NGOVerificationStatus
from app.schemas import NGOProfileResponse
from app.services.notification_service import notify_ngo_verified, notify_ngo_rejected

router = APIRouter()


class UpdateNGORequest(BaseModel):
    organization_name: str
    registration_number: str
    contact_person: str
    phone: str


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get admin dashboard statistics
    """
    # Count pending NGOs
    pending_result = await db.execute(
        select(func.count(NGOProfile.id))
        .where(NGOProfile.verification_status == NGOVerificationStatus.PENDING)
    )
    pending_ngos = pending_result.scalar() or 0
    
    # Count verified NGOs
    verified_result = await db.execute(
        select(func.count(NGOProfile.id))
        .where(NGOProfile.verification_status == NGOVerificationStatus.VERIFIED)
    )
    verified_ngos = verified_result.scalar() or 0
    
    # Count rejected NGOs
    rejected_result = await db.execute(
        select(func.count(NGOProfile.id))
        .where(NGOProfile.verification_status == NGOVerificationStatus.REJECTED)
    )
    rejected_ngos = rejected_result.scalar() or 0
    
    # Count total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    # Count active users
    active_users_result = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    active_users = active_users_result.scalar() or 0
    
    # Count total donations
    total_donations_result = await db.execute(select(func.count(DonationRequest.id)))
    total_donations = total_donations_result.scalar() or 0
    
    # Count completed donations
    completed_donations_result = await db.execute(
        select(func.count(DonationRequest.id))
        .where(DonationRequest.status == "completed")
    )
    completed_donations = completed_donations_result.scalar() or 0
    
    return {
        "pending_verifications": pending_ngos,
        "verified_ngos": verified_ngos,
        "rejected_ngos": rejected_ngos,
        "total_users": total_users,
        "active_users": active_users,
        "total_donations": total_donations,
        "completed_donations": completed_donations
    }


@router.get("/ngos/all")
async def get_all_ngos(
    status: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all NGOs, optionally filtered by verification status
    """
    query = select(NGOProfile)
    
    if status:
        try:
            status_enum = NGOVerificationStatus(status)
            query = query.where(NGOProfile.verification_status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: pending, verified, rejected"
            )
    
    result = await db.execute(query.order_by(NGOProfile.created_at.desc()))
    ngos = result.scalars().all()
    
    return [
        {
            "id": ngo.id,
            "user_id": ngo.user_id,
            "organization_name": ngo.organization_name,
            "registration_number": ngo.registration_number,
            "contact_person": ngo.contact_person,
            "phone": ngo.phone,
            "verification_status": ngo.verification_status.value,
            "created_at": ngo.created_at.isoformat() if ngo.created_at else None,
            "verified_at": ngo.verified_at.isoformat() if ngo.verified_at else None
        }
        for ngo in ngos
    ]


@router.get("/ngos/pending")
async def get_pending_ngos(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all NGOs pending verification
    """
    result = await db.execute(
        select(NGOProfile)
        .where(NGOProfile.verification_status == NGOVerificationStatus.PENDING)
        .order_by(NGOProfile.created_at.desc())
    )
    pending_ngos = result.scalars().all()
    
    return [
        {
            "id": ngo.id,
            "user_id": ngo.user_id,
            "organization_name": ngo.organization_name,
            "registration_number": ngo.registration_number,
            "contact_person": ngo.contact_person,
            "phone": ngo.phone,
            "verification_status": ngo.verification_status.value,
            "verification_document_url": ngo.verification_document_url,
            "created_at": ngo.created_at.isoformat() if ngo.created_at else None
        }
        for ngo in pending_ngos
    ]


@router.get("/ngos/names")
async def get_ngo_names(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[str]:
    """
    Get list of all NGO organization names for filter dropdowns
    """
    try:
        result = await db.execute(
            select(NGOProfile.organization_name)
            .where(NGOProfile.verification_status == NGOVerificationStatus.VERIFIED)
            .order_by(NGOProfile.organization_name)
        )
        ngo_names = [name for name in result.scalars().all() if name]
        return ngo_names
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load NGO names: {str(e)}"
        )


@router.get("/donors/names")
async def get_donor_names(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[str]:
    """
    Get list of all donor names for filter dropdowns
    """
    try:
        result = await db.execute(
            select(DonorProfile.organization_name)
            .order_by(DonorProfile.organization_name)
        )
        donor_names = [name for name in result.scalars().all() if name]
        return donor_names
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load donor names: {str(e)}"
        )


@router.get("/ngos/{ngo_id}")
async def get_ngo_details(
    ngo_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific NGO
    """
    result = await db.execute(
        select(NGOProfile).where(NGOProfile.id == ngo_id)
    )
    ngo_profile = result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    return {
        "id": ngo_profile.id,
        "user_id": ngo_profile.user_id,
        "organization_name": ngo_profile.organization_name,
        "registration_number": ngo_profile.registration_number,
        "contact_person": ngo_profile.contact_person,
        "phone": ngo_profile.phone,
        "verification_status": ngo_profile.verification_status.value,
        "verification_document_url": ngo_profile.verification_document_url,
        "verified_at": ngo_profile.verified_at.isoformat() if ngo_profile.verified_at else None,
        "verified_by": ngo_profile.verified_by,
        "rejection_reason": ngo_profile.rejection_reason,
        "created_at": ngo_profile.created_at.isoformat() if ngo_profile.created_at else None,
        "updated_at": ngo_profile.updated_at.isoformat() if ngo_profile.updated_at else None
    }


@router.post("/ngos/{ngo_id}/verify")
async def verify_ngo(
    ngo_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> NGOProfileResponse:
    """
    Verify an NGO and activate their account
    """
    # Get NGO profile
    result = await db.execute(
        select(NGOProfile).where(NGOProfile.id == ngo_id)
    )
    ngo_profile = result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    if ngo_profile.verification_status != NGOVerificationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"NGO is already {ngo_profile.verification_status.value}"
        )
    
    # Update NGO verification status
    ngo_profile.verification_status = NGOVerificationStatus.VERIFIED
    ngo_profile.verified_at = datetime.utcnow()
    ngo_profile.verified_by = current_user.id
    
    # Activate the user account
    user_result = await db.execute(
        select(User).where(User.id == ngo_profile.user_id)
    )
    user = user_result.scalar_one_or_none()
    
    if user:
        user.is_active = True
    
    # Create notification for NGO
    await notify_ngo_verified(
        db=db,
        ngo_user_id=ngo_profile.user_id,
        ngo_name=ngo_profile.organization_name
    )
    
    await db.commit()
    await db.refresh(ngo_profile)
    
    return NGOProfileResponse.from_orm(ngo_profile)


@router.post("/ngos/{ngo_id}/reject")
async def reject_ngo(
    ngo_id: int,
    rejection_reason: str = Query(...),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> NGOProfileResponse:
    """
    Reject an NGO verification request
    """
    try:
        print(f"[DEBUG] Reject endpoint called: ngo_id={ngo_id}, reason={rejection_reason}")
        
        # Get NGO profile
        result = await db.execute(
            select(NGOProfile).where(NGOProfile.id == ngo_id)
        )
        ngo_profile = result.scalar_one_or_none()
        
        if not ngo_profile:
            print(f"[DEBUG] NGO not found: {ngo_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NGO not found"
            )
        
        print(f"[DEBUG] Found NGO: {ngo_profile.organization_name}, current status: {ngo_profile.verification_status}")
        
        if ngo_profile.verification_status != NGOVerificationStatus.PENDING:
            print(f"[DEBUG] NGO not pending: {ngo_profile.verification_status}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"NGO is already {ngo_profile.verification_status.value}"
            )
        
        # Update NGO verification status
        ngo_profile.verification_status = NGOVerificationStatus.REJECTED
        ngo_profile.rejection_reason = rejection_reason
        ngo_profile.verified_at = datetime.utcnow()
        ngo_profile.verified_by = current_user.id
        
        print(f"[DEBUG] Updated NGO status to: {ngo_profile.verification_status}")
        
        # Commit before creating notification
        await db.commit()
        print(f"[DEBUG] Database committed successfully")
        
        await db.refresh(ngo_profile)
        print(f"[DEBUG] NGO refreshed, status: {ngo_profile.verification_status}")
        
        # Create notification for NGO after commit
        try:
            await notify_ngo_rejected(
                db=db,
                ngo_user_id=ngo_profile.user_id,
                reason=rejection_reason
            )
            print(f"[DEBUG] Notification sent successfully")
        except Exception as notification_error:
            print(f"[DEBUG] Notification error (non-fatal): {notification_error}")
        
        return NGOProfileResponse.from_orm(ngo_profile)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Reject endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject NGO: {str(e)}"
        )


@router.put("/ngos/{ngo_id}")
async def update_ngo_profile(
    ngo_id: int,
    update_data: UpdateNGORequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update NGO profile information
    """
    # Get NGO profile
    result = await db.execute(
        select(NGOProfile).where(NGOProfile.id == ngo_id)
    )
    ngo_profile = result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    # Update fields
    ngo_profile.organization_name = update_data.organization_name
    ngo_profile.registration_number = update_data.registration_number
    ngo_profile.contact_person = update_data.contact_person
    ngo_profile.phone = update_data.phone
    
    await db.commit()
    await db.refresh(ngo_profile)
    
    return {
        "id": ngo_profile.id,
        "user_id": ngo_profile.user_id,
        "organization_name": ngo_profile.organization_name,
        "registration_number": ngo_profile.registration_number,
        "contact_person": ngo_profile.contact_person,
        "phone": ngo_profile.phone,
        "verification_status": ngo_profile.verification_status.value,
        "created_at": ngo_profile.created_at.isoformat() if ngo_profile.created_at else None,
        "verified_at": ngo_profile.verified_at.isoformat() if ngo_profile.verified_at else None
    }


# User Management Endpoints
@router.get("/users")
async def get_all_users(
    role: str | None = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users, optionally filtered by role
    """
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Activate a user account
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a user account
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    
    return user


# Reports Endpoints
@router.get("/reports/system")
async def get_system_report(
    start_date: str | None = None,
    end_date: str | None = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get system report with statistics
    """
    from datetime import datetime, timedelta
    
    # Parse dates
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
        except:
            start = datetime(2020, 1, 1)
    else:
        start = datetime(2020, 1, 1)
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            end = end.replace(hour=23, minute=59, second=59)
        except:
            end = datetime.now()
    else:
        end = datetime.now()
    
    # Get donation statistics
    total_donations_result = await db.execute(
        select(func.count(DonationRequest.id)).where(
            DonationRequest.created_at.between(start, end)
        )
    )
    total_donations = total_donations_result.scalar() or 0
    
    completed_donations_result = await db.execute(
        select(func.count(DonationRequest.id)).where(
            (DonationRequest.status == 'completed') &
            (DonationRequest.created_at.between(start, end))
        )
    )
    completed_donations = completed_donations_result.scalar() or 0
    
    pending_donations_result = await db.execute(
        select(func.count(DonationRequest.id)).where(
            (DonationRequest.status == 'pending') &
            (DonationRequest.created_at.between(start, end))
        )
    )
    pending_donations = pending_donations_result.scalar() or 0
    
    # Get user statistics
    total_users_result = await db.execute(
        select(func.count(User.id)).where(
            User.created_at.between(start, end)
        )
    )
    total_users = total_users_result.scalar() or 0
    
    active_users_result = await db.execute(
        select(func.count(User.id)).where(
            (User.is_active == True) &
            (User.created_at.between(start, end))
        )
    )
    active_users = active_users_result.scalar() or 0
    
    # Get NGO statistics
    verified_ngos_result = await db.execute(
        select(func.count(NGOProfile.id)).where(
            (NGOProfile.verification_status == NGOVerificationStatus.VERIFIED) &
            (NGOProfile.created_at.between(start, end))
        )
    )
    verified_ngos = verified_ngos_result.scalar() or 0
    
    pending_verifications_result = await db.execute(
        select(func.count(NGOProfile.id)).where(
            (NGOProfile.verification_status == NGOVerificationStatus.PENDING) &
            (NGOProfile.created_at.between(start, end))
        )
    )
    pending_verifications = pending_verifications_result.scalar() or 0
    
    return {
        "total_donations": total_donations,
        "completed_donations": completed_donations,
        "pending_donations": pending_donations,
        "total_users": total_users,
        "active_users": active_users,
        "verified_ngos": verified_ngos,
        "pending_verifications": pending_verifications,
        "date_range": f"{start_date} to {end_date}"
    }


@router.get("/donations")
async def get_all_donations(
    status: str = Query(None, description="Filter by donation status"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get all donations in the system
    """
    try:
        query = select(DonationRequest).order_by(DonationRequest.created_at.desc())
        
        # Filter by status if provided
        if status and status != "all":
            query = query.where(DonationRequest.status == status)
        
        result = await db.execute(query)
        donations = result.scalars().all()
        
        # Convert to dict format
        donations_list = []
        for donation in donations:
            # Get NGO location info
            ngo_name = ""
            location_name = ""
            
            try:
                if donation.ngo_location:
                    location_name = donation.ngo_location.location_name or ""
                    if donation.ngo_location.ngo:
                        ngo_name = donation.ngo_location.ngo.organization_name or ""
            except Exception as e:
                print(f"Error loading related data: {e}")
            
            status_str = donation.status.value if hasattr(donation.status, 'value') else str(donation.status)
            
            donations_list.append({
                "id": donation.id,
                "donor_id": donation.donor_id,
                "ngo_location_id": donation.ngo_location_id,
                "food_type": donation.food_type,
                "quantity_plates": donation.quantity_plates,
                "meal_type": str(donation.meal_type.value) if hasattr(donation.meal_type, 'value') else str(donation.meal_type),
                "donation_date": donation.donation_date.isoformat() if donation.donation_date else None,
                "pickup_time_start": donation.pickup_time_start,
                "pickup_time_end": donation.pickup_time_end,
                "description": donation.description,
                "special_instructions": donation.special_instructions,
                "status": status_str,
                "rejection_reason": donation.rejection_reason,
                "created_at": donation.created_at.isoformat() if donation.created_at else None,
                "confirmed_at": donation.confirmed_at.isoformat() if donation.confirmed_at else None,
                "completed_at": donation.completed_at.isoformat() if donation.completed_at else None,
                "cancelled_at": donation.cancelled_at.isoformat() if donation.cancelled_at else None,
                "ngo_name": ngo_name,
                "location_name": location_name,
            })
        
        return donations_list
    except Exception as e:
        print(f"Error in get_all_donations: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load donations: {str(e)}"
        )
