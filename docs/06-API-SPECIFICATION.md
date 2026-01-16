# API Specification - Plates for People

## Base Information

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.platesforpeople.org/api/v1` |
| **Protocol** | HTTPS only |
| **Content-Type** | `application/json` |
| **Authentication** | JWT Bearer Token |
| **API Version** | v1 |

---

## Authentication

### Headers
All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

### JWT Token Structure
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "donor|ngo|admin",
  "is_verified": true,
  "exp": 1704635400
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "message": "Field-specific error"
      }
    ]
  },
  "timestamp": "2026-01-16T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 422 | Unprocessable Entity | Semantic validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `ALREADY_EXISTS` | Duplicate resource |
| `NGO_NOT_VERIFIED` | NGO account not verified by admin |
| `INSUFFICIENT_CAPACITY` | Not enough capacity available |
| `INVALID_STATUS_TRANSITION` | Invalid status change |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Endpoints

## 1. Authentication & User Management

### 1.1 Register User
Creates a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** None  
**Rate Limit:** 10 requests/hour per IP

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "donor"
}
```

**Field Validations:**
- `email`: Valid email format, unique
- `password`: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- `full_name`: 2-255 characters
- `phone`: Valid phone with country code
- `role`: One of: `donor`, `ngo`, `admin`

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "role": "donor",
      "is_active": true,
      "is_verified": false,
      "created_at": "2026-01-16T10:30:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  },
  "message": "User registered successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email already registered"
      },
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  },
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 1.2 Login
Authenticates a user and returns JWT tokens.

**Endpoint:** `POST /auth/login`  
**Authentication:** None  
**Rate Limit:** 20 requests/hour per IP

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "role": "donor",
      "is_verified": true
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  },
  "message": "Login successful",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid email or password"
  },
  "timestamp": "2026-01-16T10:30:00Z"
}
```

**Error Response (403) - NGO Not Verified:**
```json
{
  "success": false,
  "error": {
    "code": "NGO_NOT_VERIFIED",
    "message": "Your NGO account is pending verification. Please wait for admin approval."
  },
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 1.3 Get Current User
Returns the authenticated user's profile.

**Endpoint:** `GET /auth/me`  
**Authentication:** Required  
**Allowed Roles:** All

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "donor",
    "is_active": true,
    "is_verified": true,
    "created_at": "2026-01-16T10:30:00Z",
    "updated_at": "2026-01-16T10:30:00Z"
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 1.4 Change Password
Changes the authenticated user's password.

**Endpoint:** `PUT /auth/change-password`  
**Authentication:** Required  
**Allowed Roles:** All

**Request Body:**
```json
{
  "old_password": "OldSecurePass123!",
  "new_password": "NewSecurePass456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 1.5 Refresh Token
Refreshes the access token using a valid refresh token.

**Endpoint:** `POST /auth/refresh`  
**Authentication:** None (requires refresh token)

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  },
  "message": "Token refreshed successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 1.6 Logout
Invalidates the current tokens (optional, client-side token removal is sufficient).

**Endpoint:** `POST /auth/logout`  
**Authentication:** Required  
**Allowed Roles:** All

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## 2. Donor Endpoints

### 2.1 Get Donor Profile
Retrieves the donor's profile information.

**Endpoint:** `GET /donors/profile`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_name": "Joe's Restaurant",
    "organization_type": "Restaurant",
    "address": "123 Main St",
    "city": "Chicago",
    "state": "Illinois",
    "country": "USA",
    "zip_code": "60601",
    "government_id_type": "EIN",
    "government_id_number": "XX-XXXXXXX",
    "latitude": 41.8781,
    "longitude": -87.6298,
    "created_at": "2026-01-16T10:30:00Z",
    "updated_at": "2026-01-16T10:30:00Z"
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 2.2 Create/Update Donor Profile
Creates or updates the donor's profile.

**Endpoint:** `PUT /donors/profile`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Request Body:**
```json
{
  "organization_name": "Joe's Restaurant",
  "organization_type": "Restaurant",
  "address": "123 Main St",
  "city": "Chicago",
  "state": "Illinois",
  "country": "USA",
  "zip_code": "60601",
  "government_id_type": "EIN",
  "government_id_number": "12-3456789",
  "latitude": 41.8781,
  "longitude": -87.6298
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_name": "Joe's Restaurant",
    // ... full profile
  },
  "message": "Profile updated successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 2.3 Get Donor Dashboard
Returns dashboard statistics for the donor.

**Endpoint:** `GET /donors/dashboard`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_donations_completed": 15,
    "total_plates_donated": 750,
    "pending_requests": 2,
    "confirmed_requests": 1,
    "avg_rating_received": 4.5,
    "recent_donations": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "ngo_name": "Feeding Hands NGO",
        "location_name": "Downtown Branch",
        "city": "Chicago",
        "donation_date": "2026-01-15",
        "meal_type": "dinner",
        "num_plates": 50,
        "status": "completed",
        "created_at": "2026-01-15T15:00:00Z"
      }
      // ... more recent donations
    ]
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## 3. NGO Search & Discovery

### 3.1 Search NGOs
Searches for NGOs based on location, date, and filters.

**Endpoint:** `GET /donations/search`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | float | Yes | Donor's latitude |
| `longitude` | float | Yes | Donor's longitude |
| `radius` | int | No | Search radius in km (default: 10) |
| `date` | date | No | Donation date (YYYY-MM-DD, default: today) |
| `meal_type` | string | No | breakfast, lunch, or dinner |
| `ngo_name` | string | No | Filter by NGO name (partial match) |
| `min_capacity` | int | No | Minimum available capacity |

**Example Request:**
```
GET /donations/search?latitude=41.8781&longitude=-87.6298&radius=10&date=2026-01-20&meal_type=lunch
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "ngos": [
      {
        "ngo_id": "880e8400-e29b-41d4-a716-446655440000",
        "ngo_name": "Feeding Hands NGO",
        "location_id": "990e8400-e29b-41d4-a716-446655440000",
        "location_name": "Downtown Branch",
        "address": "456 Oak St",
        "city": "Chicago",
        "state": "Illinois",
        "country": "USA",
        "latitude": 41.8850,
        "longitude": -87.6200,
        "distance_km": 1.2,
        "available_capacity": 100,
        "total_capacity": 150,
        "meal_type": "lunch",
        "date": "2026-01-20",
        "avg_rating": 4.7,
        "total_donations_received": 45,
        "description": "We serve the homeless community in downtown Chicago."
      }
      // ... more NGOs
    ],
    "total_results": 5
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## 4. Donation Requests

### 4.1 Create Donation Request
Creates a new donation request to an NGO.

**Endpoint:** `POST /donations/requests`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Request Body:**
```json
{
  "ngo_location_id": "990e8400-e29b-41d4-a716-446655440000",
  "meal_type": "lunch",
  "num_plates": 50,
  "food_description": "Vegetable pasta with garlic bread",
  "donation_date": "2026-01-20",
  "notes": "Please call 30 minutes before pickup"
}
```

**Field Validations:**
- `num_plates`: Must not exceed `available_capacity`
- `donation_date`: Must be >= current date
- `meal_type`: Must match capacity record for that date

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "donor_id": "660e8400-e29b-41d4-a716-446655440000",
    "ngo_location_id": "990e8400-e29b-41d4-a716-446655440000",
    "meal_type": "lunch",
    "num_plates": 50,
    "food_description": "Vegetable pasta with garlic bread",
    "donation_date": "2026-01-20",
    "status": "pending",
    "notes": "Please call 30 minutes before pickup",
    "created_at": "2026-01-16T10:30:00Z",
    "updated_at": "2026-01-16T10:30:00Z"
  },
  "message": "Donation request created successfully. NGO has been notified.",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

**Error Response (422):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CAPACITY",
    "message": "The requested number of plates exceeds available capacity",
    "details": [
      {
        "field": "num_plates",
        "message": "Available capacity: 30, Requested: 50"
      }
    ]
  },
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 4.2 List Donor's Donation Requests
Lists all donation requests created by the donor.

**Endpoint:** `GET /donations/requests`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status |
| `page` | int | No | Page number (default: 1) |
| `per_page` | int | No | Items per page (default: 20, max: 100) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "ngo_name": "Feeding Hands NGO",
        "location_name": "Downtown Branch",
        "city": "Chicago",
        "meal_type": "lunch",
        "num_plates": 50,
        "donation_date": "2026-01-20",
        "status": "pending",
        "created_at": "2026-01-16T10:30:00Z",
        "ngo_contact_person": null,
        "ngo_contact_phone": null
      }
      // ... more requests
    ],
    "total": 15,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 4.3 Get Donation Request Details
Retrieves detailed information about a specific donation request.

**Endpoint:** `GET /donations/requests/{request_id}`  
**Authentication:** Required  
**Allowed Roles:** `donor` (own requests), `ngo` (incoming requests), `admin`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "donor": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "organization_name": "Joe's Restaurant",
      "phone": "+1234567890",
      "email": "joe@restaurant.com",
      "address": "123 Main St, Chicago, IL"
    },
    "ngo": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "ngo_name": "Feeding Hands NGO",
      "location_name": "Downtown Branch",
      "contact_person": "Jane Smith",
      "phone": "+9876543210",
      "email": "contact@feedinghands.org",
      "address": "456 Oak St, Chicago, IL"
    },
    "meal_type": "lunch",
    "num_plates": 50,
    "food_description": "Vegetable pasta with garlic bread",
    "donation_date": "2026-01-20",
    "status": "confirmed",
    "notes": "Please call 30 minutes before pickup",
    "created_at": "2026-01-16T10:30:00Z",
    "confirmed_at": "2026-01-16T11:00:00Z",
    "completed_at": null
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

**Note:** Contact details are only visible after request is confirmed.

---

### 4.4 Cancel Donation Request
Cancels a pending donation request.

**Endpoint:** `DELETE /donations/requests/{request_id}`  
**Authentication:** Required  
**Allowed Roles:** `donor` (own requests only)

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Donation request cancelled successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

**Error Response (422):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Only pending requests can be cancelled"
  },
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## 5. NGO Endpoints

### 5.1 Create NGO Profile
Creates a new NGO profile (during registration).

**Endpoint:** `POST /ngos/profile`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Request Body:**
```json
{
  "ngo_name": "Feeding Hands NGO",
  "registration_number": "NGO12345",
  "registration_doc_url": "https://storage.example.com/docs/ngo_cert.pdf",
  "website": "https://feedinghands.org",
  "description": "We provide meals to homeless individuals in Chicago",
  "established_year": 2010,
  "contact_person_name": "Jane Smith",
  "contact_person_phone": "+9876543210"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "ngo_name": "Feeding Hands NGO",
    "registration_number": "NGO12345",
    "verification_status": "pending",
    "created_at": "2026-01-16T10:30:00Z"
  },
  "message": "NGO profile created. Verification pending. You'll be notified once approved.",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 5.2 Get NGO Profile
Retrieves the NGO's profile information.

**Endpoint:** `GET /ngos/profile`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "ngo_name": "Feeding Hands NGO",
    "registration_number": "NGO12345",
    "registration_doc_url": "https://storage.example.com/docs/ngo_cert.pdf",
    "verification_status": "approved",
    "verified_by": "admin_user_id",
    "verified_at": "2026-01-16T12:00:00Z",
    "website": "https://feedinghands.org",
    "description": "We provide meals to homeless individuals in Chicago",
    "established_year": 2010,
    "contact_person_name": "Jane Smith",
    "contact_person_phone": "+9876543210",
    "avg_rating": 4.7,
    "total_donations_received": 45,
    "created_at": "2026-01-16T10:30:00Z",
    "updated_at": "2026-01-16T12:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 5.3 Get NGO Dashboard
Returns dashboard statistics for the NGO.

**Endpoint:** `GET /ngos/dashboard`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_donations_received": 45,
    "total_plates_received": 2250,
    "pending_requests": 3,
    "avg_rating": 4.7,
    "total_locations": 3,
    "capacity_today": {
      "breakfast": {
        "total": 300,
        "available": 200,
        "utilization_percent": 33.33
      },
      "lunch": {
        "total": 450,
        "available": 150,
        "utilization_percent": 66.67
      },
      "dinner": {
        "total": 600,
        "available": 400,
        "utilization_percent": 33.33
      }
    },
    "recent_donations": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "donor_name": "Joe's Restaurant",
        "donation_date": "2026-01-15",
        "meal_type": "dinner",
        "num_plates": 50,
        "status": "completed",
        "rating": 5
      }
      // ... more recent donations
    ]
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## 6. NGO Locations

### 6.1 List NGO Locations
Lists all locations for the authenticated NGO.

**Endpoint:** `GET /ngos/locations`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "location_name": "Downtown Branch",
        "address": "456 Oak St",
        "city": "Chicago",
        "state": "Illinois",
        "country": "USA",
        "zip_code": "60602",
        "latitude": 41.8850,
        "longitude": -87.6200,
        "is_active": true,
        "created_at": "2026-01-16T10:30:00Z"
      }
      // ... more locations
    ],
    "total": 3
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 6.2 Create NGO Location
Adds a new location for the NGO.

**Endpoint:** `POST /ngos/locations`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Request Body:**
```json
{
  "location_name": "North Side Branch",
  "address": "789 Elm St",
  "city": "Chicago",
  "state": "Illinois",
  "country": "USA",
  "zip_code": "60614",
  "latitude": 41.9200,
  "longitude": -87.6500
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440000",
    "ngo_profile_id": "880e8400-e29b-41d4-a716-446655440000",
    "location_name": "North Side Branch",
    "address": "789 Elm St",
    "city": "Chicago",
    "state": "Illinois",
    "country": "USA",
    "zip_code": "60614",
    "latitude": 41.9200,
    "longitude": -87.6500,
    "is_active": true,
    "created_at": "2026-01-16T10:30:00Z"
  },
  "message": "Location added successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 6.3 Update NGO Location
Updates an existing location.

**Endpoint:** `PUT /ngos/locations/{location_id}`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Request Body:** (all fields optional)
```json
{
  "location_name": "Downtown Branch - Renovated",
  "is_active": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    // ... updated location
  },
  "message": "Location updated successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 6.4 Delete NGO Location
Deletes (deactivates) a location.

**Endpoint:** `DELETE /ngos/locations/{location_id}`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Location deleted successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## 7. NGO Capacity Management

### 7.1 Get Location Capacity
Retrieves capacity settings for a location.

**Endpoint:** `GET /ngos/locations/{location_id}/capacity`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | date | No | Start date (default: today) |
| `end_date` | date | No | End date (default: today + 7 days) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "capacity_records": [
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440000",
        "date": "2026-01-20",
        "meal_type": "breakfast",
        "total_capacity": 100,
        "available_capacity": 80,
        "is_available": true
      },
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440000",
        "date": "2026-01-20",
        "meal_type": "lunch",
        "total_capacity": 150,
        "available_capacity": 100,
        "is_available": true
      }
      // ... more records
    ]
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 7.2 Set/Update Capacity
Sets or updates capacity for a location, meal type, and date.

**Endpoint:** `POST /ngos/locations/{location_id}/capacity`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Request Body:**
```json
{
  "date": "2026-01-20",
  "meal_type": "lunch",
  "total_capacity": 150,
  "is_available": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "ngo_location_id": "990e8400-e29b-41d4-a716-446655440000",
    "date": "2026-01-20",
    "meal_type": "lunch",
    "total_capacity": 150,
    "available_capacity": 150,
    "is_available": true,
    "created_at": "2026-01-16T10:30:00Z"
  },
  "message": "Capacity set successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 7.3 Bulk Set Capacity
Sets capacity for multiple dates/meals at once.

**Endpoint:** `POST /ngos/locations/{location_id}/capacity/bulk`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Request Body:**
```json
{
  "start_date": "2026-01-20",
  "end_date": "2026-01-27",
  "capacities": {
    "breakfast": 100,
    "lunch": 150,
    "dinner": 200
  },
  "is_available": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "records_created": 21,
    "date_range": "2026-01-20 to 2026-01-27"
  },
  "message": "Bulk capacity set successfully",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

## 8. NGO Donation Management

### 8.1 List Incoming Donation Requests
Lists all donation requests for the NGO's locations.

**Endpoint:** `GET /donations/incoming`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status |
| `location_id` | uuid | No | Filter by location |
| `page` | int | No | Page number |
| `per_page` | int | No | Items per page |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "donor_name": "Joe's Restaurant",
        "donor_phone": "+1234567890",
        "location_name": "Downtown Branch",
        "meal_type": "lunch",
        "num_plates": 50,
        "food_description": "Vegetable pasta with garlic bread",
        "donation_date": "2026-01-20",
        "status": "pending",
        "notes": "Please call 30 minutes before pickup",
        "created_at": "2026-01-16T10:30:00Z"
      }
      // ... more requests
    ],
    "total": 5,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  },
  "message": "Success",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

---

### 8.2 Confirm Donation Request
NGO confirms acceptance of a donation request.

**Endpoint:** `PUT /donations/requests/{request_id}/confirm`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "status": "confirmed",
    "confirmed_at": "2026-01-16T11:00:00Z",
    "donor_contact": {
      "name": "Joe's Restaurant",
      "phone": "+1234567890",
      "email": "joe@restaurant.com",
      "address": "123 Main St, Chicago, IL"
    }
  },
  "message": "Donation request confirmed. Donor has been notified with your contact details.",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 8.3 Reject Donation Request
NGO rejects a donation request.

**Endpoint:** `PUT /donations/requests/{request_id}/reject`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Request Body:**
```json
{
  "rejection_reason": "Insufficient storage capacity on that date"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "status": "rejected",
    "updated_at": "2026-01-16T11:00:00Z"
  },
  "message": "Donation request rejected. Donor has been notified.",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 8.4 Mark Donation Complete
Marks a confirmed donation as completed.

**Endpoint:** `PUT /donations/requests/{request_id}/complete`  
**Authentication:** Required  
**Allowed Roles:** `ngo`, `donor`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "completed_at": "2026-01-20T14:00:00Z"
  },
  "message": "Donation marked as completed. Thank you!",
  "timestamp": "2026-01-20T14:00:00Z"
}
```

---

## 9. Ratings & Feedback

### 9.1 Create Rating
Creates a rating for a completed donation.

**Endpoint:** `POST /ratings`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Request Body:**
```json
{
  "donation_request_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "rating": 5,
  "feedback_text": "Great coordination, smooth pickup process!"
}
```

**Validations:**
- `rating`: 1-5 (integer)
- Donation must be in "completed" status
- One rating per donation

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440000",
    "donation_request_id": "aa0e8400-e29b-41d4-a716-446655440000",
    "rating": 5,
    "feedback_text": "Great coordination, smooth pickup process!",
    "created_at": "2026-01-20T15:00:00Z"
  },
  "message": "Rating submitted successfully",
  "timestamp": "2026-01-20T15:00:00Z"
}
```

---

### 9.2 Get Ratings Given (Donor)
Lists all ratings given by the donor.

**Endpoint:** `GET /ratings/donor`  
**Authentication:** Required  
**Allowed Roles:** `donor`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "ratings": [
      {
        "id": "ee0e8400-e29b-41d4-a716-446655440000",
        "ngo_name": "Feeding Hands NGO",
        "donation_date": "2026-01-20",
        "rating": 5,
        "feedback_text": "Great coordination!",
        "created_at": "2026-01-20T15:00:00Z"
      }
      // ... more ratings
    ],
    "avg_rating_given": 4.5
  },
  "message": "Success",
  "timestamp": "2026-01-20T15:00:00Z"
}
```

---

### 9.3 Get Ratings Received (NGO)
Lists all ratings received by the NGO.

**Endpoint:** `GET /ratings/ngo`  
**Authentication:** Required  
**Allowed Roles:** `ngo`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "ratings": [
      {
        "id": "ee0e8400-e29b-41d4-a716-446655440000",
        "donor_name": "Joe's Restaurant",
        "donation_date": "2026-01-20",
        "rating": 5,
        "feedback_text": "Great coordination!",
        "created_at": "2026-01-20T15:00:00Z"
      }
      // ... more ratings
    ],
    "avg_rating": 4.7,
    "total_ratings": 45,
    "rating_distribution": {
      "5": 30,
      "4": 10,
      "3": 3,
      "2": 1,
      "1": 1
    }
  },
  "message": "Success",
  "timestamp": "2026-01-20T15:00:00Z"
}
```

---

## 10. Notifications

### 10.1 List Notifications
Lists all notifications for the authenticated user.

**Endpoint:** `GET /notifications`  
**Authentication:** Required  
**Allowed Roles:** All

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_read` | boolean | No | Filter by read status |
| `page` | int | No | Page number |
| `per_page` | int | No | Items per page |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ff0e8400-e29b-41d4-a716-446655440000",
        "type": "request_confirmed",
        "title": "Donation Request Confirmed",
        "message": "Your donation request for 50 plates has been confirmed by Feeding Hands NGO",
        "related_entity_type": "donation_request",
        "related_entity_id": "aa0e8400-e29b-41d4-a716-446655440000",
        "is_read": false,
        "created_at": "2026-01-16T11:00:00Z"
      }
      // ... more notifications
    ],
    "total": 10,
    "unread_count": 3,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  },
  "message": "Success",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 10.2 Get Unread Count
Returns the count of unread notifications.

**Endpoint:** `GET /notifications/unread`  
**Authentication:** Required  
**Allowed Roles:** All

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "unread_count": 3
  },
  "message": "Success",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 10.3 Mark Notification as Read
Marks a single notification as read.

**Endpoint:** `PUT /notifications/{notification_id}/read`  
**Authentication:** Required  
**Allowed Roles:** All

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Notification marked as read",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 10.4 Mark All as Read
Marks all notifications as read.

**Endpoint:** `PUT /notifications/read-all`  
**Authentication:** Required  
**Allowed Roles:** All

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "marked_read": 5
  },
  "message": "All notifications marked as read",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

## 11. Admin Endpoints

### 11.1 Admin Dashboard
Returns platform-wide statistics for admin.

**Endpoint:** `GET /admin/dashboard`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "total_donors": 80,
    "total_ngos": 20,
    "pending_ngo_verifications": 5,
    "total_donations": 500,
    "completed_donations": 450,
    "total_plates_donated": 25000,
    "donations_this_month": 120,
    "top_donors": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Joe's Restaurant",
        "total_donations": 50,
        "total_plates": 2500
      }
      // ... more
    ],
    "top_ngos": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "name": "Feeding Hands NGO",
        "total_donations": 100,
        "avg_rating": 4.7
      }
      // ... more
    ],
    "recent_activity": [
      {
        "type": "donation_completed",
        "description": "Joe's Restaurant donated 50 plates to Feeding Hands NGO",
        "timestamp": "2026-01-16T14:00:00Z"
      }
      // ... more
    ]
  },
  "message": "Success",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 11.2 List Pending NGO Verifications
Lists all NGOs awaiting verification.

**Endpoint:** `GET /admin/ngos/pending`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "pending_ngos": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "ngo_name": "Hope Kitchen",
        "registration_number": "NGO67890",
        "registration_doc_url": "https://storage.example.com/docs/hope_cert.pdf",
        "email": "contact@hopekitchen.org",
        "phone": "+1122334455",
        "num_locations": 2,
        "created_at": "2026-01-15T10:00:00Z"
      }
      // ... more
    ],
    "total": 5
  },
  "message": "Success",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 11.3 Verify NGO
Approves an NGO registration.

**Endpoint:** `PUT /admin/ngos/{ngo_id}/verify`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "ngo_name": "Hope Kitchen",
    "verification_status": "approved",
    "verified_by": "admin_user_id",
    "verified_at": "2026-01-16T11:30:00Z"
  },
  "message": "NGO verified successfully. They can now login and start receiving donations.",
  "timestamp": "2026-01-16T11:30:00Z"
}
```

---

### 11.4 Reject NGO
Rejects an NGO registration.

**Endpoint:** `PUT /admin/ngos/{ngo_id}/reject`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Request Body:**
```json
{
  "rejection_reason": "Invalid registration documents. Please resubmit with valid NGO certificate."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "verification_status": "rejected",
    "rejection_reason": "Invalid registration documents..."
  },
  "message": "NGO registration rejected. User has been notified.",
  "timestamp": "2026-01-16T11:30:00Z"
}
```

---

### 11.5 List All Users
Lists all users with filtering.

**Endpoint:** `GET /admin/users`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | string | No | Filter by role |
| `is_active` | boolean | No | Filter by active status |
| `search` | string | No | Search by name or email |
| `page` | int | No | Page number |
| `per_page` | int | No | Items per page |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john@example.com",
        "full_name": "John Doe",
        "role": "donor",
        "is_active": true,
        "is_verified": true,
        "created_at": "2026-01-10T10:00:00Z"
      }
      // ... more users
    ],
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "message": "Success",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 11.6 Update User
Updates user information (admin override).

**Endpoint:** `PUT /admin/users/{user_id}`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Request Body:** (all fields optional)
```json
{
  "full_name": "John Updated Doe",
  "phone": "+1234567891",
  "is_active": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    // ... updated user
  },
  "message": "User updated successfully",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 11.7 Suspend User
Suspends a user account.

**Endpoint:** `PUT /admin/users/{user_id}/suspend`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Request Body:**
```json
{
  "reason": "Suspicious activity detected"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "is_active": false
  },
  "message": "User suspended successfully",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 11.8 List All Donations
Lists all donations with advanced filtering.

**Endpoint:** `GET /admin/donations`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | date | No | Filter from date |
| `end_date` | date | No | Filter to date |
| `status` | string | No | Filter by status |
| `ngo_id` | uuid | No | Filter by NGO |
| `donor_id` | uuid | No | Filter by donor |
| `page` | int | No | Page number |
| `per_page` | int | No | Items per page |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "donor_name": "Joe's Restaurant",
        "ngo_name": "Feeding Hands NGO",
        "location": "Downtown Branch",
        "city": "Chicago",
        "meal_type": "lunch",
        "num_plates": 50,
        "donation_date": "2026-01-20",
        "status": "completed",
        "rating": 5,
        "created_at": "2026-01-16T10:30:00Z",
        "completed_at": "2026-01-20T14:00:00Z"
      }
      // ... more donations
    ],
    "total": 500,
    "page": 1,
    "per_page": 50,
    "total_pages": 10
  },
  "message": "Success",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

### 11.9 Export Reports
Exports donation data as CSV.

**Endpoint:** `GET /admin/reports/export`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Query Parameters:** (same as /admin/donations)

**Success Response (200):**
- Content-Type: `text/csv`
- Filename: `donations_report_20260116.csv`

**CSV Format:**
```csv
ID,Donor Name,NGO Name,Location,City,Meal Type,Plates,Date,Status,Rating,Created At,Completed At
aa0e8400-...,Joe's Restaurant,Feeding Hands NGO,Downtown Branch,Chicago,lunch,50,2026-01-20,completed,5,2026-01-16T10:30:00Z,2026-01-20T14:00:00Z
...
```

---

### 11.10 View Audit Logs
Views audit logs for compliance and debugging.

**Endpoint:** `GET /admin/audit-logs`  
**Authentication:** Required  
**Allowed Roles:** `admin`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | uuid | No | Filter by user |
| `action` | string | No | Filter by action type |
| `entity_type` | string | No | Filter by entity type |
| `start_date` | datetime | No | Filter from datetime |
| `end_date` | datetime | No | Filter to datetime |
| `page` | int | No | Page number |
| `per_page` | int | No | Items per page |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "user_email": "admin@example.com",
        "action": "verify",
        "entity_type": "ngo_profile",
        "entity_id": "880e8400-e29b-41d4-a716-446655440000",
        "old_values": {"verification_status": "pending"},
        "new_values": {"verification_status": "approved"},
        "ip_address": "192.168.1.1",
        "created_at": "2026-01-16T11:30:00Z"
      }
      // ... more logs
    ],
    "total": 1000,
    "page": 1,
    "per_page": 50,
    "total_pages": 20
  },
  "message": "Success",
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

## Rate Limiting

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/auth/register` | 10 requests | 1 hour |
| `/auth/login` | 20 requests | 1 hour |
| `/donations/search` | 100 requests | 1 minute |
| `/donations/requests` (POST) | 50 requests | 1 hour |
| All other authenticated endpoints | 1000 requests | 1 hour |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704639000
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 3600
  },
  "timestamp": "2026-01-16T11:00:00Z"
}
```

---

## WebSocket Support (Future Phase)

For real-time notifications, consider implementing WebSocket connections:

**Endpoint:** `wss://api.platesforpeople.org/ws`

**Authentication:** JWT token in query param or handshake headers

**Message Format:**
```json
{
  "type": "notification",
  "data": {
    "id": "ff0e8400-e29b-41d4-a716-446655440000",
    "title": "New Donation Request",
    "message": "...",
    "created_at": "2026-01-16T11:00:00Z"
  }
}
```

---

## Postman Collection

A complete Postman collection with all endpoints, example requests, and environment variables is available at:

`https://github.com/yourusername/plates-for-people/blob/main/postman_collection.json`

---

## API Changelog

### v1.0.0 (2026-01-16)
- Initial API release
- All core endpoints implemented
- Authentication with JWT
- RBAC support
- Pagination on list endpoints
- Rate limiting
- Comprehensive error handling

---

## Support & Contact

**API Documentation:** https://api.platesforpeople.org/docs  
**GitHub Issues:** https://github.com/yourusername/plates-for-people/issues  
**Email Support:** support@platesforpeople.org
