"""
Rating model
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Rating(Base):
    """Ratings given by donors to NGOs after completed donations"""
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Links
    donation_id = Column(Integer, ForeignKey("donation_requests.id", ondelete="CASCADE"), unique=True, nullable=False)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Rating (1-5 stars)
    rating = Column(Integer, nullable=False)
    
    # Optional feedback
    feedback = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    donation = relationship("DonationRequest", back_populates="rating")
    donor = relationship("DonorProfile", foreign_keys=[donor_id], back_populates="ratings_given")
    ngo = relationship("NGOProfile", foreign_keys=[ngo_id], back_populates="ratings_received")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='rating_range'),
    )
    
    def __repr__(self):
        return f"<Rating {self.rating}★ for Donation #{self.donation_id}>"
