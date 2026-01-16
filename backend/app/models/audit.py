"""
Audit log model
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditLog(Base):
    """Audit trail for important actions"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who performed the action
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    user_email = Column(String(255))  # Store email in case user is deleted
    user_role = Column(String(50))
    
    # What action
    action = Column(String(100), nullable=False, index=True)  # e.g., "ngo_verified", "donation_created"
    entity_type = Column(String(50), nullable=False)  # e.g., "ngo", "donation"
    entity_id = Column(Integer, nullable=False)
    
    # Details
    description = Column(Text, nullable=False)
    changes = Column(JSON)  # Store before/after values as JSON
    
    # Context
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(500))
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity_type}#{self.entity_id}>"
