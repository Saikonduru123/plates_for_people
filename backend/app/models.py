"""
Database models for Plates for People platform
Following the ERD design from documentation
"""
from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, Boolean, 
    ForeignKey, Text, Numeric, Date, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from app.database import Base


# Enums
class UserRole(str, enum.Enum):
    DONOR = "donor"
    NGO = "ngo"
    ADMIN = "admin"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class DonationStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MealType(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"


# Models
class User(Base):
    """Base user table for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ngo_profile = relationship("NGOProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class DonorProfile(Base):
    """Donor profile with organization details"""
    __tablename__ = "donor_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organization_name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="donor_profile")
    donation_requests = relationship("DonationRequest", back_populates="donor", cascade="all, delete-orphan")
    ratings_given = relationship("Rating", foreign_keys="Rating.donor_id", back_populates="donor", cascade="all, delete-orphan")


class NGOProfile(Base):
    """NGO profile with verification details"""
    __tablename__ = "ngo_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organization_name = Column(String(255), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=False)
    registration_certificate_url = Column(String(500))
    contact_person = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    description = Column(Text)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    verified_at = Column(DateTime(timezone=True))
    verified_by = Column(Integer, ForeignKey("users.id"))
    rejection_reason = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="ngo_profile")
    locations = relationship("NGOLocation", back_populates="ngo", cascade="all, delete-orphan")
    ratings_received = relationship("Rating", foreign_keys="Rating.ngo_id", back_populates="ngo", cascade="all, delete-orphan")


class NGOLocation(Base):
    """Physical locations/branches of NGO"""
    __tablename__ = "ngo_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=False)
    location_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    ngo = relationship("NGOProfile", back_populates="locations")
    capacities = relationship("NGOLocationCapacity", back_populates="location", cascade="all, delete-orphan")
    donation_requests = relationship("DonationRequest", back_populates="ngo_location", cascade="all, delete-orphan")


class NGOLocationCapacity(Base):
    """Daily capacity tracking for each NGO location"""
    __tablename__ = "ngo_location_capacity"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("ngo_locations.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    meal_type = Column(Enum(MealType), nullable=False)
    total_capacity = Column(Integer, nullable=False)
    available_capacity = Column(Integer, nullable=False)
    
    __table_args__ = (
        CheckConstraint('available_capacity >= 0', name='check_available_capacity_positive'),
        CheckConstraint('available_capacity <= total_capacity', name='check_available_capacity_lte_total'),
    )
    
    # Relationships
    location = relationship("NGOLocation", back_populates="capacities")


class DonationRequest(Base):
    """Main transaction table for donations"""
    __tablename__ = "donation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False)
    ngo_location_id = Column(Integer, ForeignKey("ngo_locations.id", ondelete="CASCADE"), nullable=False)
    meal_type = Column(Enum(MealType), nullable=False)
    quantity = Column(Integer, nullable=False)
    food_description = Column(Text, nullable=False)
    pickup_date = Column(Date, nullable=False)
    pickup_time = Column(String(50), nullable=False)
    status = Column(Enum(DonationStatus), default=DonationStatus.PENDING, nullable=False)
    donor_notes = Column(Text)
    ngo_notes = Column(Text)
    rejection_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    confirmed_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    donor = relationship("DonorProfile", back_populates="donation_requests")
    ngo_location = relationship("NGOLocation", back_populates="donation_requests")
    rating = relationship("Rating", back_populates="donation", uselist=False, cascade="all, delete-orphan")


class Rating(Base):
    """Post-donation feedback system"""
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donation_requests.id", ondelete="CASCADE"), unique=True, nullable=False)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )
    
    # Relationships
    donation = relationship("DonationRequest", back_populates="rating")
    donor = relationship("DonorProfile", foreign_keys=[donor_id], back_populates="ratings_given")
    ngo = relationship("NGOProfile", foreign_keys=[ngo_id], back_populates="ratings_received")


class Notification(Base):
    """In-app notification system"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    """Compliance and activity tracking"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
