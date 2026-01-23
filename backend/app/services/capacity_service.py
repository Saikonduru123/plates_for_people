"""
Capacity Calculator Service
Implements two-tier capacity system: manual overrides + location defaults
"""
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, List, Optional

from app.models import NGOLocation, NGOLocationCapacity, DonationRequest, DonationStatus, MealType


async def get_capacity_for_date(
    db: AsyncSession,
    location_id: int,
    target_date: date,
    meal_type: MealType
) -> Dict:
    """
    Get capacity for a specific location, date, and meal type.
    Returns manual capacity if exists, otherwise location default.
    
    Args:
        db: Database session
        location_id: ID of the NGO location
        target_date: Target date
        meal_type: Meal type (breakfast, lunch, snacks, dinner)
    
    Returns:
        {
            'capacity': int,           # Max capacity
            'is_manual': bool,         # True if from manual override
            'available': int,          # capacity - confirmed bookings
            'confirmed': int,          # Number of confirmed bookings
            'notes': str | None        # Notes from manual override
        }
    """
    # Step 1: Check for manual capacity override
    manual_query = select(NGOLocationCapacity).where(
        NGOLocationCapacity.location_id == location_id,
        NGOLocationCapacity.date == target_date,
        NGOLocationCapacity.meal_type == meal_type
    )
    manual_result = await db.execute(manual_query)
    manual_capacity = manual_result.scalar_one_or_none()
    
    if manual_capacity:
        capacity = manual_capacity.capacity
        is_manual = True
        notes = manual_capacity.notes
    else:
        # Step 2: Fallback to location defaults
        location_query = select(NGOLocation).where(NGOLocation.id == location_id)
        location_result = await db.execute(location_query)
        location = location_result.scalar_one_or_none()
        
        if not location:
            raise ValueError(f"Location {location_id} not found")
        
        # Get default capacity based on meal type
        default_field = f'default_{meal_type.value}_capacity'
        capacity = getattr(location, default_field, 0)
        is_manual = False
        notes = None
    
    # Step 3: Calculate confirmed bookings
    confirmed_query = select(func.coalesce(func.sum(DonationRequest.quantity_plates), 0)).where(
        DonationRequest.ngo_location_id == location_id,
        DonationRequest.donation_date == target_date,
        DonationRequest.meal_type == meal_type,
        DonationRequest.status.in_([DonationStatus.CONFIRMED, DonationStatus.COMPLETED])
    )
    confirmed_result = await db.execute(confirmed_query)
    confirmed_count = confirmed_result.scalar() or 0
    
    return {
        'capacity': capacity,
        'is_manual': is_manual,
        'available': max(0, capacity - confirmed_count),
        'confirmed': confirmed_count,
        'notes': notes
    }


async def get_all_meal_capacities(
    db: AsyncSession,
    location_id: int,
    target_date: date
) -> List[Dict]:
    """
    Get capacities for all meal types on a specific date.
    
    Args:
        db: Database session
        location_id: ID of the NGO location
        target_date: Target date
    
    Returns:
        List of capacity dictionaries for all 4 meal types
    """
    meal_types = [MealType.BREAKFAST, MealType.LUNCH, MealType.SNACKS, MealType.DINNER]
    capacities = []
    
    for meal_type in meal_types:
        capacity_data = await get_capacity_for_date(db, location_id, target_date, meal_type)
        capacity_data['meal_type'] = meal_type.value
        capacities.append(capacity_data)
    
    return capacities


async def set_manual_capacity(
    db: AsyncSession,
    location_id: int,
    target_date: date,
    meal_type: MealType,
    capacity: int,
    notes: Optional[str] = None
) -> NGOLocationCapacity:
    """
    Set manual capacity override for a specific date and meal type.
    
    Args:
        db: Database session
        location_id: ID of the NGO location
        target_date: Target date
        meal_type: Meal type
        capacity: Capacity value
        notes: Optional notes
    
    Returns:
        Created or updated NGOLocationCapacity record
    """
    # Check if manual override already exists
    query = select(NGOLocationCapacity).where(
        NGOLocationCapacity.location_id == location_id,
        NGOLocationCapacity.date == target_date,
        NGOLocationCapacity.meal_type == meal_type
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update existing
        existing.capacity = capacity
        existing.notes = notes
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        # Create new
        new_capacity = NGOLocationCapacity(
            location_id=location_id,
            date=target_date,
            meal_type=meal_type,
            capacity=capacity,
            notes=notes
        )
        db.add(new_capacity)
        await db.commit()
        await db.refresh(new_capacity)
        return new_capacity


async def delete_manual_capacity(
    db: AsyncSession,
    location_id: int,
    target_date: date,
    meal_type: MealType
) -> bool:
    """
    Delete manual capacity override (revert to default).
    
    Args:
        db: Database session
        location_id: ID of the NGO location
        target_date: Target date
        meal_type: Meal type
    
    Returns:
        True if deleted, False if not found
    """
    query = select(NGOLocationCapacity).where(
        NGOLocationCapacity.location_id == location_id,
        NGOLocationCapacity.date == target_date,
        NGOLocationCapacity.meal_type == meal_type
    )
    result = await db.execute(query)
    capacity = result.scalar_one_or_none()
    
    if capacity:
        await db.delete(capacity)
        await db.commit()
        return True
    return False


async def get_available_locations(
    db: AsyncSession,
    ngo_id: int,
    target_date: date,
    meal_type: MealType,
    min_capacity: int = 1
) -> List[Dict]:
    """
    Get all locations for an NGO with available capacity.
    
    Args:
        db: Database session
        ngo_id: ID of the NGO
        target_date: Target date
        meal_type: Meal type
        min_capacity: Minimum available capacity required
    
    Returns:
        List of location data with capacity information
    """
    # Get all active locations for the NGO
    locations_query = select(NGOLocation).where(
        NGOLocation.ngo_id == ngo_id,
        NGOLocation.is_active == True
    )
    locations_result = await db.execute(locations_query)
    locations = locations_result.scalars().all()
    
    available_locations = []
    
    for location in locations:
        capacity_data = await get_capacity_for_date(db, location.id, target_date, meal_type)
        
        if capacity_data['available'] >= min_capacity:
            available_locations.append({
                'location_id': location.id,
                'location_name': location.location_name,
                'address': location.address_line1,
                'city': location.city,
                'capacity': capacity_data['capacity'],
                'available': capacity_data['available'],
                'is_manual': capacity_data['is_manual'],
                'notes': capacity_data['notes']
            })
    
    return available_locations


async def bulk_set_capacity(
    db: AsyncSession,
    location_id: int,
    start_date: date,
    end_date: date,
    meal_type: MealType,
    capacity: int,
    notes: Optional[str] = None
) -> int:
    """
    Set capacity for a date range (bulk operation).
    
    Args:
        db: Database session
        location_id: ID of the NGO location
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
        meal_type: Meal type
        capacity: Capacity value
        notes: Optional notes
    
    Returns:
        Number of records created/updated
    """
    from datetime import timedelta
    
    count = 0
    current_date = start_date
    
    while current_date <= end_date:
        await set_manual_capacity(db, location_id, current_date, meal_type, capacity, notes)
        count += 1
        current_date += timedelta(days=1)
    
    return count
