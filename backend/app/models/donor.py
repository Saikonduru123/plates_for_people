"""
Donor profile model
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class DonorProfile(Base):
    """Donor profile with organization details"""
    __tablename__ = "donor_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Organization info
    organization_name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    
    # Address
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False)
    
    # Location coordinates for map
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="donor_profile")
    donation_requests = relationship("DonationRequest", back_populates="donor", cascade="all, delete-orphan")
    ratings_given = relationship("Rating", foreign_keys="Rating.donor_id", back_populates="donor")
    
    def __repr__(self):
        return f"<DonorProfile {self.organization_name}>"
