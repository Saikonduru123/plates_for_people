"""
Donation request model
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base
from app.models.ngo import MealType


class DonationStatus(str, enum.Enum):
    """Donation request status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DonationRequest(Base):
    """Donation requests from donors to NGOs"""
    __tablename__ = "donation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Donor info
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # NGO info
    ngo_location_id = Column(Integer, ForeignKey("ngo_locations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Donation details
    food_type = Column(String(255), nullable=False)
    quantity_plates = Column(Integer, nullable=False)
    meal_type = Column(SQLEnum(MealType), nullable=False)
    
    # Timing
    donation_date = Column(Date, nullable=False, index=True)
    pickup_time_start = Column(String(10), nullable=False)  # HH:MM format
    pickup_time_end = Column(String(10), nullable=False)
    
    # Additional info
    description = Column(Text)
    special_instructions = Column(Text)
    
    # Status tracking
    status = Column(SQLEnum(DonationStatus), default=DonationStatus.PENDING, nullable=False, index=True)
    confirmed_at = Column(DateTime(timezone=True))
    rejected_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    completed_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    donor = relationship("DonorProfile", back_populates="donation_requests")
    ngo_location = relationship("NGOLocation", back_populates="donation_requests")
    rating = relationship("Rating", back_populates="donation", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DonationRequest #{self.id} {self.food_type} ({self.status})>"
