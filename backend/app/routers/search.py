"""
Search routes
Handles NGO search with geolocation and capacity filtering
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import date
import math

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, NGOProfile, NGOLocation, NGOLocationCapacity
from app.models.ngo import NGOVerificationStatus, MealType
from app.services import capacity_service

router = APIRouter()


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    # Radius of Earth in kilometers
    R = 6371.0
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return round(distance, 2)


@router.get("/ngos")
async def search_ngos(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius: float = Query(10.0, ge=0.1, le=100, description="Search radius in kilometers"),
    donation_date: Optional[date] = Query(None, description="Filter by date with available capacity"),
    meal_type: Optional[MealType] = Query(None, description="Filter by meal type"),
    min_capacity: Optional[int] = Query(None, ge=1, description="Minimum available capacity"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search for verified NGOs within radius with optional capacity filtering
    Returns NGOs sorted by distance
    """
    # Get all verified NGOs with active locations
    query = select(NGOProfile, NGOLocation).join(
        NGOLocation, NGOProfile.id == NGOLocation.ngo_id
    ).where(
        and_(
            NGOProfile.verification_status == NGOVerificationStatus.VERIFIED,
            NGOLocation.is_active == True
        )
    )
    
    result = await db.execute(query)
    ngo_locations = result.all()
    
    # Filter by distance and capacity
    nearby_ngos = []
    
    for ngo_profile, location in ngo_locations:
        # Calculate distance
        distance = calculate_distance(
            latitude, longitude,
            location.latitude, location.longitude
        )
        
        # Skip if outside radius
        if distance > radius:
            continue
        
        # Check capacity if date and meal_type provided
        available_capacity = None
        if donation_date and meal_type:
            try:
                # Use capacity service to get proper capacity (defaults + manual overrides)
                capacity_data = await capacity_service.get_capacity_for_date(
                    db=db,
                    location_id=location.id,
                    target_date=donation_date,
                    meal_type=meal_type
                )
                
                available_capacity = capacity_data.get("available", 0)
                
                # Skip if doesn't meet minimum capacity requirement
                if min_capacity and available_capacity < min_capacity:
                    continue
            except Exception as e:
                # If capacity check fails, skip if min_capacity is required
                if min_capacity:
                    continue
                # Otherwise, include the location without capacity info
                available_capacity = None
        
        # Calculate average rating
        from app.models import Rating
        rating_result = await db.execute(
            select(func.avg(Rating.rating), func.count(Rating.id))
            .where(Rating.ngo_id == ngo_profile.id)
        )
        avg_rating_data = rating_result.one()
        avg_rating = round(float(avg_rating_data[0]), 2) if avg_rating_data[0] else None
        total_ratings = avg_rating_data[1] or 0
        
        nearby_ngos.append({
            "ngo_id": ngo_profile.id,
            "ngo_name": ngo_profile.organization_name,
            "location_id": location.id,
            "location_name": location.location_name,
            "address": {
                "line1": location.address_line1,
                "line2": location.address_line2,
                "city": location.city,
                "state": location.state,
                "zip_code": location.zip_code,
                "country": location.country
            },
            "coordinates": {
                "latitude": location.latitude,
                "longitude": location.longitude
            },
            "distance_km": distance,
            "available_capacity": available_capacity,
            "average_rating": avg_rating,
            "total_ratings": total_ratings,
            "contact": {
                "person": ngo_profile.contact_person,
                "phone": ngo_profile.phone
            }
        })
    
    # Sort by distance
    nearby_ngos.sort(key=lambda x: x["distance_km"])
    
    return {
        "total": len(nearby_ngos),
        "search_params": {
            "latitude": latitude,
            "longitude": longitude,
            "radius_km": radius,
            "date": donation_date.isoformat() if donation_date else None,
            "meal_type": meal_type.value if meal_type else None,
            "min_capacity": min_capacity
        },
        "ngos": nearby_ngos
    }


@router.get("/ngos/{location_id}/availability")
async def get_location_availability(
    location_id: int,
    start_date: date = Query(..., description="Start date for availability check"),
    end_date: date = Query(..., description="End date for availability check"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get capacity availability for a specific location across a date range
    Useful for calendar view in frontend
    """
    # Verify location exists
    location_result = await db.execute(
        select(NGOLocation).where(NGOLocation.id == location_id)
    )
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Build availability map using capacity service
    availability_by_date = {}
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        availability_by_date[date_str] = {}
        
        # Check each meal type
        for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.SNACKS, MealType.DINNER]:
            capacity_info = await capacity_service.get_capacity_for_date(
                db=db,
                location_id=location_id,
                target_date=current_date,
                meal_type=meal_type
            )
            
            availability_by_date[date_str][meal_type.value] = {
                "capacity": capacity_info['capacity'],
                "available": capacity_info['available'],
                "confirmed": capacity_info['confirmed'],
                "is_manual": capacity_info['is_manual']
            }
        
        # Move to next day
        from datetime import timedelta
        current_date += timedelta(days=1)
    
    return {
        "location_id": location_id,
        "location_name": location.location_name,
        "date_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "availability": availability_by_date
    }


@router.get("/nearby-summary")
async def get_nearby_summary(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius: float = Query(10.0, ge=0.1, le=100, description="Search radius in kilometers"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get summary statistics of NGOs in the area
    Useful for dashboard/overview display
    """
    # Get all verified NGOs with active locations
    query = select(NGOProfile, NGOLocation).join(
        NGOLocation, NGOProfile.id == NGOLocation.ngo_id
    ).where(
        and_(
            NGOProfile.verification_status == NGOVerificationStatus.VERIFIED,
            NGOLocation.is_active == True
        )
    )
    
    result = await db.execute(query)
    ngo_locations = result.all()
    
    # Count NGOs within radius
    total_ngos = 0
    total_locations = 0
    closest_ngo = None
    closest_distance = float('inf')
    
    for ngo_profile, location in ngo_locations:
        distance = calculate_distance(
            latitude, longitude,
            location.latitude, location.longitude
        )
        
        if distance <= radius:
            total_locations += 1
            
            if closest_distance == float('inf') or distance < closest_distance:
                closest_distance = distance
                closest_ngo = {
                    "name": ngo_profile.organization_name,
                    "location": location.location_name,
                    "distance_km": distance
                }
    
    # Count unique NGOs
    unique_ngo_ids = set()
    for ngo_profile, location in ngo_locations:
        distance = calculate_distance(
            latitude, longitude,
            location.latitude, location.longitude
        )
        if distance <= radius:
            unique_ngo_ids.add(ngo_profile.id)
    
    total_ngos = len(unique_ngo_ids)
    
    return {
        "search_center": {
            "latitude": latitude,
            "longitude": longitude
        },
        "radius_km": radius,
        "summary": {
            "total_ngos": total_ngos,
            "total_locations": total_locations,
            "closest_ngo": closest_ngo if closest_distance != float('inf') else None
        }
    }
