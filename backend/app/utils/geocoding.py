"""
Geocoding utilities for reverse geocoding (coordinates to address)
"""
import httpx
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

async def reverse_geocode(latitude: float, longitude: float) -> Optional[Dict]:
    """
    Reverse geocode coordinates to address using Nominatim API
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        
    Returns:
        Dictionary with address details or None if failed
    """
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": latitude,
            "lon": longitude,
            "zoom": 18,
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "PlatesForPeople/1.0 (https://platesforpeople.com; support@platesforpeople.com)"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                
                if "address" in data:
                    address = data["address"]
                    
                    # Extract and structure address components
                    return {
                        "address_line1": _build_address_line(address),
                        "city": (
                            address.get("city") or 
                            address.get("town") or 
                            address.get("village") or 
                            address.get("municipality") or 
                            ""
                        ),
                        "state": (
                            address.get("state") or 
                            address.get("province") or 
                            address.get("region") or 
                            ""
                        ),
                        "country": address.get("country", ""),
                        "zip_code": address.get("postcode", ""),
                        "raw_address": data.get("display_name", "")
                    }
                else:
                    logger.warning(f"No address data in response for {latitude}, {longitude}")
                    return None
            else:
                logger.error(f"Nominatim returned status {response.status_code}")
                return None
                
    except Exception as e:
        logger.error(f"Reverse geocoding failed: {e}")
        return None


def _build_address_line(address: Dict) -> str:
    """Build address line 1 from address components"""
    house_number = address.get("house_number", "")
    road = address.get("road") or address.get("street", "")
    
    if house_number and road:
        return f"{house_number} {road}".strip()
    elif road:
        return road
    else:
        # Fallback to suburb or neighbourhood
        return (
            address.get("suburb") or 
            address.get("neighbourhood") or 
            address.get("hamlet") or 
            ""
        )
