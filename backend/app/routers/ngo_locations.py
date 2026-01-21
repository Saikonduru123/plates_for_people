"""
NGO Location routes
Handles NGO location and capacity management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, NGOProfile, NGOLocation, NGOLocationCapacity, UserRole
from app.models.ngo import MealType
from app.schemas import (
    NGOLocationCreate, NGOLocationUpdate, NGOLocationResponse,
    NGOLocationCapacityCreate, NGOLocationCapacityUpdate, NGOLocationCapacityResponse
)

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

@router.get("/locations/{location_id}/capacity", response_model=List[NGOLocationCapacityResponse])
async def list_location_capacity(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List capacity for a specific location
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
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
    
    # Get capacity records
    capacity_result = await db.execute(
        select(NGOLocationCapacity)
        .where(NGOLocationCapacity.location_id == location_id)
        .order_by(NGOLocationCapacity.date, NGOLocationCapacity.meal_type)
    )
    capacities = capacity_result.scalars().all()
    
    return capacities


@router.post("/locations/{location_id}/capacity", response_model=NGOLocationCapacityResponse, status_code=status.HTTP_201_CREATED)
async def create_location_capacity(
    location_id: int,
    capacity_data: NGOLocationCapacityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create capacity for a specific location and date/meal type
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
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
    
    # Check if capacity already exists for this date and meal type
    existing_result = await db.execute(
        select(NGOLocationCapacity)
        .where(
            NGOLocationCapacity.location_id == location_id,
            NGOLocationCapacity.date == capacity_data.date,
            NGOLocationCapacity.meal_type == capacity_data.meal_type
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Capacity already exists for {capacity_data.date} - {capacity_data.meal_type.value}"
        )
    
    # Create capacity
    new_capacity = NGOLocationCapacity(
        location_id=location_id,
        date=capacity_data.date,
        meal_type=capacity_data.meal_type,
        total_capacity=capacity_data.total_capacity,
        available_capacity=capacity_data.total_capacity  # Initially, available equals total
    )
    
    db.add(new_capacity)
    await db.commit()
    await db.refresh(new_capacity)
    
    return new_capacity


@router.put("/locations/{location_id}/capacity/{capacity_id}", response_model=NGOLocationCapacityResponse)
async def update_location_capacity(
    location_id: int,
    capacity_id: int,
    capacity_update: NGOLocationCapacityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update capacity for a specific location
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
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
    
    # Get capacity
    capacity_result = await db.execute(
        select(NGOLocationCapacity)
        .where(
            NGOLocationCapacity.id == capacity_id,
            NGOLocationCapacity.location_id == location_id
        )
    )
    capacity = capacity_result.scalar_one_or_none()
    
    if not capacity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Capacity not found"
        )
    
    # Update fields
    update_data = capacity_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(capacity, field, value)
    
    await db.commit()
    await db.refresh(capacity)
    
    return capacity


@router.delete("/locations/{location_id}/capacity/{capacity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location_capacity(
    location_id: int,
    capacity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete capacity for a specific location
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    # Verify location belongs to current NGO
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
    
    # Get capacity
    capacity_result = await db.execute(
        select(NGOLocationCapacity)
        .where(
            NGOLocationCapacity.id == capacity_id,
            NGOLocationCapacity.location_id == location_id
        )
    )
    capacity = capacity_result.scalar_one_or_none()
    
    if not capacity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Capacity not found"
        )
    
    # Delete capacity
    await db.delete(capacity)
    await db.commit()
    
    return None
