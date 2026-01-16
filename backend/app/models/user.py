"""
User model - Base authentication table
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    DONOR = "donor"
    NGO = "ngo"
    ADMIN = "admin"


class User(Base):
    """Base user table for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ngo_profile = relationship("NGOProfile", back_populates="user", foreign_keys="NGOProfile.user_id", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", foreign_keys="AuditLog.user_id", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
