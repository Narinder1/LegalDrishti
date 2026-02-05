"""
Authentication Schemas
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles matching the database enum"""
    ADMIN = "admin"
    USER = "user"
    LAWYER = "lawyer"
    FIRM = "firm"
    INTERNAL_TEAM = "internal_team"


# ===================
# Base Schemas
# ===================

class UserBase(BaseModel):
    """Base user fields"""
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None


# ===================
# Registration Schemas
# ===================

class UserRegister(BaseModel):
    """Registration for regular users"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class LawyerRegister(UserRegister):
    """Registration for lawyers - includes professional details"""
    role: UserRole = UserRole.LAWYER
    bar_council_number: Optional[str] = None
    practice_areas: Optional[str] = None
    experience_years: Optional[int] = None
    court_jurisdiction: Optional[str] = None
    office_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class FirmRegister(UserRegister):
    """Registration for firms (CA, Law, or other professional firms)"""
    role: UserRole = UserRole.FIRM
    firm_name: str = Field(..., min_length=2)
    registration_number: Optional[str] = None
    established_year: Optional[int] = None
    website: Optional[str] = None
    office_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    lawyer_count: Optional[int] = None
    practice_areas: Optional[str] = None


class InternalTeamRegister(UserRegister):
    """Registration for internal team members"""
    role: UserRole = UserRole.INTERNAL_TEAM
    department: Optional[str] = None
    employee_id: Optional[str] = None


# ===================
# Login Schema
# ===================

class LoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


# ===================
# User Response Schemas
# ===================

class LawyerProfileResponse(BaseModel):
    """Lawyer profile in response"""
    bar_council_number: Optional[str] = None
    practice_areas: Optional[str] = None
    experience_years: Optional[int] = None
    court_jurisdiction: Optional[str] = None
    office_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_bar_verified: bool = False
    
    class Config:
        from_attributes = True


class FirmProfileResponse(BaseModel):
    """Firm profile in response"""
    firm_name: Optional[str] = None
    registration_number: Optional[str] = None
    established_year: Optional[int] = None
    website: Optional[str] = None
    office_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    lawyer_count: Optional[int] = None
    practice_areas: Optional[str] = None
    is_verified: bool = False
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response (without password)"""
    id: int
    email: str
    role: UserRole
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    # Role-specific profiles
    lawyer_profile: Optional[LawyerProfileResponse] = None
    firm_profile: Optional[FirmProfileResponse] = None
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """List of users response"""
    users: list[UserResponse]
    total: int
    page: int
    per_page: int


# ===================
# Generic Response
# ===================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True
