"""
Admin routes
Handles admin operations including NGO verification
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, NGOProfile, DonationRequest, UserRole
from app.models.ngo import NGOVerificationStatus
from app.schemas import NGOProfileResponse
from app.services.notification_service import notify_ngo_verified, notify_ngo_rejected

router = APIRouter()


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
):
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
    
    return {
        "message": "NGO verified successfully",
        "ngo_id": ngo_id,
        "status": "verified"
    }


@router.post("/ngos/{ngo_id}/reject")
async def reject_ngo(
    ngo_id: int,
    rejection_reason: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject an NGO verification request
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
    ngo_profile.verification_status = NGOVerificationStatus.REJECTED
    ngo_profile.rejection_reason = rejection_reason
    ngo_profile.verified_by = current_user.id
    
    # Create notification for NGO
    await notify_ngo_rejected(
        db=db,
        ngo_user_id=ngo_profile.user_id,
        reason=rejection_reason
    )
    
    await db.commit()
    await db.refresh(ngo_profile)
    
    return {
        "message": "NGO rejected",
        "ngo_id": ngo_id,
        "status": "rejected",
        "reason": rejection_reason
    }
