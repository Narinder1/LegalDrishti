"""
Authentication Service
Handles password hashing, JWT tokens, and user authentication
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.user import User, UserRole, LawyerProfile, FirmProfile
from app.schemas.auth import (
    UserRegister, LawyerRegister, FirmRegister, InternalTeamRegister,
    TokenResponse, UserResponse
)


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations"""
    
    # ===================
    # Password Hashing
    # ===================
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    # ===================
    # JWT Token Management
    # ===================
    
    @staticmethod
    def create_access_token(user_id: int, role: str) -> str:
        """Create a JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "role": role,
            "type": "access",
            "exp": expire,
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        """Create a JWT refresh token"""
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "exp": expire,
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def create_tokens(user: User) -> TokenResponse:
        """Create both access and refresh tokens"""
        access_token = AuthService.create_access_token(user.id, user.role.value)
        refresh_token = AuthService.create_refresh_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode and validate a JWT token"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            return None
    
    # ===================
    # User Operations
    # ===================
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(
            select(User)
            .options(selectinload(User.lawyer_profile), selectinload(User.firm_profile))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Get user by ID"""
        result = await db.execute(
            select(User)
            .options(selectinload(User.lawyer_profile), selectinload(User.firm_profile))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_user(db: AsyncSession, data: UserRegister) -> User:
        """Create a new regular user"""
        user = User(
            email=data.email,
            password_hash=AuthService.hash_password(data.password),
            role=UserRole(data.role.value),
            full_name=data.full_name,
            phone=data.phone,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def create_lawyer(db: AsyncSession, data: LawyerRegister) -> User:
        """Create a new lawyer with profile"""
        user = User(
            email=data.email,
            password_hash=AuthService.hash_password(data.password),
            role=UserRole.LAWYER,
            full_name=data.full_name,
            phone=data.phone,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        await db.flush()
        
        # Create lawyer profile
        lawyer_profile = LawyerProfile(
            user_id=user.id,
            bar_council_number=data.bar_council_number,
            practice_areas=data.practice_areas,
            experience_years=data.experience_years,
            court_jurisdiction=data.court_jurisdiction,
            office_address=data.office_address,
            city=data.city,
            state=data.state,
            pincode=data.pincode
        )
        db.add(lawyer_profile)
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def create_firm(db: AsyncSession, data: FirmRegister) -> User:
        """Create a new firm with profile"""
        user = User(
            email=data.email,
            password_hash=AuthService.hash_password(data.password),
            role=UserRole.FIRM,
            full_name=data.full_name,
            phone=data.phone,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        await db.flush()
        
        # Create firm profile
        firm_profile = FirmProfile(
            user_id=user.id,
            firm_name=data.firm_name,
            registration_number=data.registration_number,
            established_year=data.established_year,
            website=data.website,
            office_address=data.office_address,
            city=data.city,
            state=data.state,
            pincode=data.pincode,
            lawyer_count=data.lawyer_count,
            practice_areas=data.practice_areas
        )
        db.add(firm_profile)
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def create_internal_team(db: AsyncSession, data: InternalTeamRegister) -> User:
        """Create a new internal team member"""
        user = User(
            email=data.email,
            password_hash=AuthService.hash_password(data.password),
            role=UserRole.INTERNAL_TEAM,
            full_name=data.full_name,
            phone=data.phone,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not AuthService.verify_password(password, user.password_hash):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        await db.flush()
        
        return user
    
    @staticmethod
    async def seed_admin(db: AsyncSession):
        """Create admin user if doesn't exist"""
        admin = await AuthService.get_user_by_email(db, "admin@admin.com")
        if not admin:
            admin = User(
                email="admin@admin.com",
                password_hash=AuthService.hash_password("admin@admin"),
                role=UserRole.ADMIN,
                full_name="System Administrator",
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            await db.commit()
            print("✅ Admin user created: admin@admin.com")
        else:
            print("ℹ️ Admin user already exists")


# Global service instance
auth_service = AuthService()
