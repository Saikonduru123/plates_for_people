"""
NGO Location routes
Handles NGO location and capacity management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, NGOProfile, NGOLocation, NGOLocationCapacity, UserRole, MealType
from app.schemas import (
    NGOLocationCreate, NGOLocationUpdate, NGOLocationResponse,
    CapacityCreate, CapacityUpdate, CapacityResponse
)
from app.services import capacity_service

router = APIRouter()


# ====================
# Location Management
# ====================

@router.get("/locations", response_model=List[NGOLocationResponse])
async def list_ngo_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all locations for the current NGO
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
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
    
    # Get all locations
    locations_result = await db.execute(
        select(NGOLocation)
        .where(NGOLocation.ngo_id == ngo_profile.id)
        .order_by(NGOLocation.created_at)
    )
    locations = locations_result.scalars().all()
    
    return locations


@router.post("/locations", response_model=NGOLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_ngo_location(
    location_data: NGOLocationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new location for the current NGO
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
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
    
    # Create location
    new_location = NGOLocation(
        ngo_id=ngo_profile.id,
        **location_data.model_dump()
    )
    
    db.add(new_location)
    await db.commit()
    await db.refresh(new_location)
    
    # Notify admins about new location
    from app.services.notification_service import notify_admins_location_added
    try:
        await notify_admins_location_added(
            db=db,
            ngo_name=ngo_profile.organization_name,
            location_name=new_location.location_name,
            location_id=new_location.id,
            ngo_id=ngo_profile.id
        )
        await db.commit()
    except Exception as e:
        # Don't fail location creation if notification fails
        print(f"Failed to create notification: {e}")
    
    return new_location


@router.get("/locations/{location_id}", response_model=NGOLocationResponse)
async def get_ngo_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific location by ID
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
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
    
    # Get location
    location_result = await db.execute(
        select(NGOLocation)
        .where(
            NGOLocation.id == location_id,
            NGOLocation.ngo_id == ngo_profile.id
        )
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return location


@router.put("/locations/{location_id}", response_model=NGOLocationResponse)
async def update_ngo_location(
    location_id: int,
    location_update: NGOLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a specific location
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
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
    
    # Get location
    location_result = await db.execute(
        select(NGOLocation)
        .where(
            NGOLocation.id == location_id,
            NGOLocation.ngo_id == ngo_profile.id
        )
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Update fields
    update_data = location_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    await db.commit()
    await db.refresh(location)
    
    return location


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ngo_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a specific location
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Get NGO profile
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
    
    # Check if location exists
    location_result = await db.execute(
        select(NGOLocation)
        .where(
            NGOLocation.id == location_id,
            NGOLocation.ngo_id == ngo_profile.id
        )
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Delete location (capacities will be cascaded)
    await db.delete(location)
    await db.commit()
    
    return None


# ====================
# Capacity Management
# ====================

@router.get("/locations/{location_id}/capacity")
async def get_location_capacity(
    location_id: int,
    target_date: date = Query(..., description="Date to get capacity for"),
    meal_type: Optional[MealType] = Query(None, description="Specific meal type or all if omitted"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get capacity for a specific location and date.
    Returns capacity for specific meal type or all meal types.
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    location_result = await db.execute(
        select(NGOLocation).where(
            NGOLocation.id == location_id,
            NGOLocation.ngo_id == ngo_profile.id
        )
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Get capacity using service
    if meal_type:
        # Get specific meal type
        capacity_data = await capacity_service.get_capacity_for_date(
            db, location_id, target_date, meal_type
        )
        capacity_data['meal_type'] = meal_type.value
        capacity_data['location_id'] = location_id
        capacity_data['date'] = target_date
        return capacity_data
    else:
        # Get all meal types
        capacities = await capacity_service.get_all_meal_capacities(
            db, location_id, target_date
        )
        for cap in capacities:
            cap['location_id'] = location_id
            cap['date'] = target_date
        return capacities


@router.post("/locations/{location_id}/capacity", status_code=status.HTTP_201_CREATED)
async def set_location_capacity(
    location_id: int,
    capacity_data: CapacityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Set manual capacity override for a specific date and meal type.
    Creates or updates the capacity override.
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    location_result = await db.execute(
        select(NGOLocation).where(
            NGOLocation.id == location_id,
            NGOLocation.ngo_id == ngo_profile.id
        )
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Set manual capacity using service
    try:
        capacity_record = await capacity_service.set_manual_capacity(
            db=db,
            location_id=location_id,
            target_date=capacity_data.date,
            meal_type=capacity_data.meal_type,
            capacity=capacity_data.capacity,
            notes=capacity_data.notes
        )
        
        return {
            "id": capacity_record.id,
            "location_id": location_id,
            "date": capacity_record.date,
            "meal_type": capacity_record.meal_type.value,
            "capacity": capacity_record.capacity,
            "notes": capacity_record.notes,
            "message": "Capacity set successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set capacity: {str(e)}"
        )


@router.delete("/locations/{location_id}/capacity", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location_capacity(
    location_id: int,
    target_date: date = Query(..., description="Date to delete capacity for"),
    meal_type: MealType = Query(..., description="Meal type to delete"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete manual capacity override (revert to default).
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    location_result = await db.execute(
        select(NGOLocation).where(
            NGOLocation.id == location_id,
            NGOLocation.ngo_id == ngo_profile.id
        )
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Delete manual capacity using service
    deleted = await capacity_service.delete_manual_capacity(
        db, location_id, target_date, meal_type
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manual capacity override not found"
        )
    
    return None


@router.get("/locations/{location_id}/capacity/manual")
async def list_manual_capacity_overrides(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all manual capacity overrides for a location.
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
    ngo_result = await db.execute(
        select(NGOProfile).where(NGOProfile.user_id == current_user.id)
    )
    ngo_profile = ngo_result.scalar_one_or_none()
    
    if not ngo_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    location_result = await db.execute(
        select(NGOLocation).where(
            NGOLocation.id == location_id,
            NGOLocation.ngo_id == ngo_profile.id
        )
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Get all manual overrides
    capacity_result = await db.execute(
        select(NGOLocationCapacity)
        .where(NGOLocationCapacity.location_id == location_id)
        .order_by(NGOLocationCapacity.date, NGOLocationCapacity.meal_type)
    )
    capacities = capacity_result.scalars().all()
    
    return [
        {
            "id": cap.id,
            "date": cap.date,
            "meal_type": cap.meal_type.value,
            "capacity": cap.capacity,
            "notes": cap.notes,
            "created_at": cap.created_at
        }
        for cap in capacities
    ]

