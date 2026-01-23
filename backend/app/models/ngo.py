"""
NGO profile and location models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Enum as SQLEnum, Text, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class NGOVerificationStatus(str, enum.Enum):
    """NGO verification status"""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class MealType(str, enum.Enum):
    """Meal type enumeration"""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    SNACKS = "snacks"
    DINNER = "dinner"


class NGOProfile(Base):
    """NGO profile with organization details"""
    __tablename__ = "ngo_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Organization info
    organization_name = Column(String(255), nullable=False, index=True)
    registration_number = Column(String(100), unique=True, nullable=False)
    contact_person = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    
    # Verification
    verification_status = Column(SQLEnum(NGOVerificationStatus), default=NGOVerificationStatus.PENDING, nullable=False, index=True)
    verification_document_url = Column(String(500))
    verified_at = Column(DateTime(timezone=True))
    verified_by = Column(Integer, ForeignKey("users.id"))
    rejection_reason = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="ngo_profile", foreign_keys=[user_id])
    verifier = relationship("User", foreign_keys=[verified_by])
    locations = relationship("NGOLocation", back_populates="ngo", cascade="all, delete-orphan")
    ratings_received = relationship("Rating", foreign_keys="Rating.ngo_id", back_populates="ngo")
    
    def __repr__(self):
        return f"<NGOProfile {self.organization_name} ({self.verification_status})>"


class NGOLocation(Base):
    """NGO physical locations/branches"""
    __tablename__ = "ngo_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Location info
    location_name = Column(String(255), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False)
    
    # Coordinates
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    
    # Contact information
    contact_person = Column(String(255))
    contact_phone = Column(String(20))
    operating_hours = Column(String(255))
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Default capacity for each meal type
    default_breakfast_capacity = Column(Integer, default=0, nullable=False)
    default_lunch_capacity = Column(Integer, default=0, nullable=False)
    default_snacks_capacity = Column(Integer, default=0, nullable=False)
    default_dinner_capacity = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    ngo = relationship("NGOProfile", back_populates="locations")
    capacities = relationship("NGOLocationCapacity", back_populates="location", cascade="all, delete-orphan")
    donation_requests = relationship("DonationRequest", back_populates="ngo_location", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NGOLocation {self.location_name}>"


class NGOLocationCapacity(Base):
    """Daily capacity tracking for NGO locations"""
    __tablename__ = "ngo_location_capacity"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("ngo_locations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Date and meal type
    date = Column(Date, nullable=False, index=True)
    meal_type = Column(SQLEnum(MealType), nullable=False)
    
    # Capacity
    capacity = Column(Integer, nullable=False)  # Max plates for this meal/date
    notes = Column(Text)  # Optional notes for this override
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    location = relationship("NGOLocation", back_populates="capacities")
    
    def __repr__(self):
        return f"<Capacity {self.date} {self.meal_type}: {self.capacity}>"
    
    # Unique constraint: one capacity entry per location/date/meal
    __table_args__ = (
        CheckConstraint('capacity >= 0', name='positive_capacity'),
        {},
    )
