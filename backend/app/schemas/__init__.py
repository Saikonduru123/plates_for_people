"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models import UserRole, NGOVerificationStatus, DonationStatus, MealType


# ===== User Schemas =====
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


# ===== Donor Schemas =====
class DonorProfileBase(BaseModel):
    organization_name: str = Field(..., max_length=255)
    contact_person: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=20)
    address: str = Field(..., max_length=500)
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    postal_code: str = Field(..., max_length=20)
    country: str = Field(..., max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class DonorProfileCreate(DonorProfileBase):
    pass


class DonorProfileUpdate(BaseModel):
    organization_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class DonorProfileResponse(DonorProfileBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True


class DonorDashboardResponse(BaseModel):
    total_donations: int
    completed_donations: int
    pending_donations: int
    average_rating: Optional[float]
    recent_donations: List["DonationRequestResponse"]


# ===== NGO Schemas =====
class NGOProfileBase(BaseModel):
    organization_name: str = Field(..., max_length=255)
    registration_number: str = Field(..., max_length=100)
    contact_person: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=20)


class NGOProfileCreate(NGOProfileBase):
    verification_document_url: Optional[str] = Field(None, max_length=500)


class NGOProfileUpdate(BaseModel):
    organization_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None


class NGOProfileResponse(NGOProfileBase):
    id: int
    user_id: int
    verification_document_url: Optional[str] = None
    verification_status: NGOVerificationStatus
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class NGOVerifyRequest(BaseModel):
    status: NGOVerificationStatus
    rejection_reason: Optional[str] = None


class NGODashboardResponse(BaseModel):
    total_requests: int
    pending_requests: int
    completed_requests: int
    average_rating: Optional[float]
    total_plates_received: int
    recent_requests: List["DonationRequestResponse"]


# ===== NGO Location Schemas =====
class NGOLocationBase(BaseModel):
    location_name: str = Field(..., max_length=255)
    address_line1: str = Field(..., max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    country: str = Field(..., max_length=100)
    zip_code: str = Field(..., max_length=20)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    operating_hours: Optional[str] = Field(None, max_length=255)


class NGOLocationCreate(NGOLocationBase):
    pass


class NGOLocationUpdate(BaseModel):
    location_name: Optional[str] = Field(None, max_length=255)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    operating_hours: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class NGOLocationResponse(NGOLocationBase):
    id: int
    ngo_id: int
    is_active: bool
    
    class Config:
        from_attributes = True


# ===== Capacity Schemas =====
class CapacityBase(BaseModel):
    date: date
    meal_type: MealType
    total_capacity: int = Field(..., ge=0)


class CapacityCreate(CapacityBase):
    pass


class CapacityBulkCreate(BaseModel):
    capacities: List[CapacityCreate]


class CapacityResponse(CapacityBase):
    id: int
    location_id: int
    current_capacity: int
    
    class Config:
        from_attributes = True


# Aliases for NGO Location Capacity (matching model names)
NGOLocationCapacityBase = CapacityBase
NGOLocationCapacityCreate = CapacityCreate
NGOLocationCapacityUpdate = BaseModel  # Will add fields if needed
NGOLocationCapacityResponse = CapacityResponse


# ===== Donation Request Schemas =====
class DonationRequestBase(BaseModel):
    food_type: str = Field(..., max_length=255)
    quantity_plates: int = Field(..., ge=1)
    meal_type: MealType
    donation_date: date
    pickup_time_start: str = Field(..., max_length=10)  # HH:MM format
    pickup_time_end: str = Field(..., max_length=10)
    description: Optional[str] = None
    special_instructions: Optional[str] = None


class DonationRequestCreate(DonationRequestBase):
    ngo_location_id: int


class DonationRequestUpdate(BaseModel):
    special_instructions: Optional[str] = None
    rejection_reason: Optional[str] = None


class DonationRequestResponse(DonationRequestBase):
    id: int
    donor_id: int
    ngo_location_id: int
    status: DonationStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DonationSearchQuery(BaseModel):
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    radius_km: Optional[int] = Field(10, ge=1, le=100)
    meal_type: Optional[MealType] = None
    date: Optional[date] = None
    min_capacity: Optional[int] = Field(None, ge=1)


# ===== Rating Schemas =====
class RatingCreate(BaseModel):
    donation_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    feedback: Optional[str] = Field(None, max_length=1000, description="Optional feedback text")


class RatingResponse(BaseModel):
    id: int
    donation_id: int
    donor_id: int
    ngo_id: int
    rating: int
    feedback: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class NGORatingsSummary(BaseModel):
    ngo_id: int
    ngo_name: str
    total_ratings: int
    average_rating: float
    rating_distribution: dict  # {1: count, 2: count, ...}
    recent_ratings: List[RatingResponse]


# ===== Notification Schemas =====
class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    notifications: List[NotificationResponse]


# ===== Admin Schemas =====
class AdminDashboardResponse(BaseModel):
    total_users: int
    total_donors: int
    total_ngos: int
    pending_ngos: int
    total_donations: int
    completed_donations: int
    total_plates_donated: int


class UserUpdateAdmin(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== Search Response =====
class NGOSearchResult(BaseModel):
    ngo_id: int
    organization_name: str
    location_id: int
    location_name: str
    address: str
    city: str
    state: str
    latitude: Decimal
    longitude: Decimal
    distance_km: Optional[float]
    available_capacity: int
    average_rating: Optional[float]


# Update forward references
DonorDashboardResponse.model_rebuild()
NGODashboardResponse.model_rebuild()
