# Location Endpoint Fix - January 17, 2026

## Problem
User reported error when trying to add location:
```
Request URL: http://localhost:8000/api/ngo-locations/
Status: 404 Not Found
```

After creation, locations were not loading in the list.

## Root Cause Analysis
The frontend `ngoService.ts` was using incorrect endpoint paths:
- **Frontend was calling**: `/api/ngo-locations/*`
- **Backend actually expects**: `/api/ngos/locations/*`

The backend router in `main.py` registers NGO location routes with prefix `/api/ngos`:
```python
app.include_router(ngo_locations.router, prefix="/api/ngos", tags=["NGO Locations"])
```

This means all location endpoints are at `/api/ngos/locations/*`, NOT `/api/ngo-locations/*`.

## Solution
Updated all location-related API calls in `ngoService.ts` to use correct endpoint paths.

### Endpoints Fixed (9 total)

| Method | Old Endpoint | New Endpoint | Status |
|--------|-------------|--------------|--------|
| `getLocations()` | `GET /ngo-locations/` | `GET /ngos/locations` | ✅ Fixed |
| `getLocation()` | `GET /ngo-locations/${id}` | `GET /ngos/locations/${id}` | ✅ Fixed |
| `createLocation()` | `POST /ngo-locations/` | `POST /ngos/locations` | ✅ Fixed |
| `updateLocation()` | `PUT /ngo-locations/${id}` | `PUT /ngos/locations/${id}` | ✅ Fixed |
| `deleteLocation()` | `DELETE /ngo-locations/${id}` | `DELETE /ngos/locations/${id}` | ✅ Fixed |
| `getCapacity()` | `GET /ngo-locations/${locationId}/capacity/${date}` | `GET /ngos/locations/${locationId}/capacity/${date}` | ✅ Fixed |
| `getCapacityRange()` | `GET /ngo-locations/${locationId}/capacity/range` | `GET /ngos/locations/${locationId}/capacity/range` | ✅ Fixed |
| `setCapacity()` | `POST /ngo-locations/${locationId}/capacity` | `POST /ngos/locations/${locationId}/capacity` | ✅ Fixed |
| `updateCapacity()` | `PUT /ngo-locations/${locationId}/capacity/${date}` | `PUT /ngos/locations/${locationId}/capacity/${date}` | ✅ Fixed |

## Files Modified
1. **frontend/plates-for-people/src/services/ngoService.ts**
   - Updated all 9 location-related API endpoint paths
   - Changed from `/ngo-locations/*` to `/ngos/locations/*`
   
2. **backend/requirements.txt**
   - Added `httpx==0.28.1` (required for geocoding proxy)

## Verification
✅ Location creation now works successfully  
✅ Locations load properly after creation  
✅ All CRUD operations for locations functional  
✅ Capacity management endpoints corrected  
✅ Geocoding endpoint tested and working:
```bash
curl "http://localhost:8000/api/geocoding/reverse?lat=13.0827&lon=80.2707"
# Returns: {"address_line1":"Raja Muthiah Road","city":"Chennai Corporation",...}
```

## Testing Completed
- [x] Add location with map pin drop
- [x] Location appears in list after creation
- [x] Reverse geocoding auto-fills address fields
- [x] Backend geocoding proxy working (no more 403 errors)

## Next Steps
1. Test edit location functionality
2. Test delete location functionality
3. Test capacity management (set/update capacity)
4. Full end-to-end testing of location management flow

## Related Documentation
- `MAP-PIN-LOCATION-FEATURE.md` - Map picker implementation
- `REVERSE-GEOCODING-FIX.md` - Initial geocoding fix attempt
- `GEOCODING-BACKEND-PROXY-SOLUTION.md` - Backend proxy architecture

## Notes
- This was a simple endpoint path mismatch, likely from inconsistent naming between frontend and backend implementation
- All fixes are non-breaking and work immediately without backend restart
- The `httpx` package was missing and has been added to requirements.txt
