"""
User Model with Role-based access
Supports: Admin, User, Lawyer, Firm, InternalTeam
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles in the system"""
    ADMIN = "admin"
    USER = "user"
    LAWYER = "lawyer"
    FIRM = "firm"
    INTERNAL_TEAM = "internal_team"


class User(Base):
    """
    Base User model - common fields for all user types
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    
    # Common fields
    full_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Role-specific profile (one-to-one relationships)
    lawyer_profile = relationship("LawyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    firm_profile = relationship("FirmProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"


class LawyerProfile(Base):
    """
    Extended profile for Lawyers
    """
    __tablename__ = "lawyer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Professional details
    bar_council_number = Column(String(100), nullable=True)
    practice_areas = Column(Text, nullable=True)  # Comma-separated or JSON
    experience_years = Column(Integer, nullable=True)
    court_jurisdiction = Column(String(255), nullable=True)
    
    # Office details
    office_address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    # Verification
    is_bar_verified = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User", back_populates="lawyer_profile")
    
    def __repr__(self):
        return f"<LawyerProfile {self.bar_council_number}>"


class FirmProfile(Base):
    """
    Extended profile for Firms (CA, Law, or other professional firms)
    """
    __tablename__ = "firm_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Firm details
    firm_name = Column(String(255), nullable=False)
    registration_number = Column(String(100), nullable=True)
    established_year = Column(Integer, nullable=True)
    
    # Contact
    website = Column(String(255), nullable=True)
    office_address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    # Size
    lawyer_count = Column(Integer, nullable=True)
    practice_areas = Column(Text, nullable=True)  # Comma-separated or JSON
    
    # Verification
    is_verified = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User", back_populates="firm_profile")
    
    def __repr__(self):
        return f"<FirmProfile {self.firm_name}>"
