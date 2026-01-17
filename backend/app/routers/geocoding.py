"""
Geocoding API endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict
import logging

from app.utils.geocoding import reverse_geocode

router = APIRouter(prefix="/geocoding", tags=["geocoding"])
logger = logging.getLogger(__name__)


@router.get("/reverse")
async def reverse_geocode_endpoint(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180)
) -> Dict:
    """
    Reverse geocode coordinates to address
    
    This endpoint acts as a proxy to Nominatim API to avoid CORS issues
    and properly set User-Agent headers
    
    Args:
        lat: Latitude coordinate (-90 to 90)
        lon: Longitude coordinate (-180 to 180)
        
    Returns:
        Dictionary with address components:
        - address_line1: Street address
        - city: City name
        - state: State/Province
        - country: Country name
        - zip_code: Postal code
        - raw_address: Full formatted address
        
    Example:
        GET /api/geocoding/reverse?lat=13.0827&lon=80.2707
        
    Response:
        {
            "address_line1": "Raja Muthiah Road",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "zip_code": "600001",
            "raw_address": "Raja Muthiah Road, Chennai, Tamil Nadu, 600001, India"
        }
    """
    try:
        logger.info(f"Reverse geocoding request for: {lat}, {lon}")
        
        result = await reverse_geocode(lat, lon)
        
        if result:
            logger.info(f"Successfully geocoded to: {result.get('city')}, {result.get('state')}")
            return result
        else:
            logger.warning(f"No address found for coordinates: {lat}, {lon}")
            raise HTTPException(
                status_code=404,
                detail="No address found for the provided coordinates"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reverse geocoding error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to geocode coordinates. Please try again or enter address manually."
        )
