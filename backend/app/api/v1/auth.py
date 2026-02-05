"""
Authentication API Endpoints
Handles registration, login, token refresh, and user info
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.auth_service import auth_service, AuthService
from app.schemas.auth import (
    UserRegister, LawyerRegister, FirmRegister, InternalTeamRegister,
    LoginRequest, TokenResponse, RefreshTokenRequest,
    UserResponse, MessageResponse, UserRole
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security scheme for protected routes
security = HTTPBearer()


# ===================
# Helper: Get current user from token
# ===================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Extract and validate user from JWT token"""
    token = credentials.credentials
    payload = auth_service.decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = int(payload.get("sub"))
    user = await auth_service.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    return user


# ===================
# Registration Endpoints
# ===================

@router.post("/register", response_model=MessageResponse)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    Role determines which type of user is created.
    """
    # Check if user already exists
    existing = await auth_service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Prevent admin registration through API
    if data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin registration is not allowed"
        )
    
    # Create user based on role
    try:
        await auth_service.create_user(db, data)
        await db.commit()
        return MessageResponse(
            message=f"Registration successful! Welcome to LegalDrishti.",
            success=True
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/register/lawyer", response_model=MessageResponse)
async def register_lawyer(
    data: LawyerRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new lawyer with professional details"""
    existing = await auth_service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        await auth_service.create_lawyer(db, data)
        await db.commit()
        return MessageResponse(
            message="Lawyer registration successful! Your profile is pending verification.",
            success=True
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/register/firm", response_model=MessageResponse)
async def register_firm(
    data: FirmRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new law firm"""
    existing = await auth_service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        await auth_service.create_firm(db, data)
        await db.commit()
        return MessageResponse(
            message="Firm registration successful! Your firm is pending verification.",
            success=True
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/register/internal", response_model=MessageResponse)
async def register_internal_team(
    data: InternalTeamRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new internal team member"""
    existing = await auth_service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        await auth_service.create_internal_team(db, data)
        await db.commit()
        return MessageResponse(
            message="Internal team registration successful!",
            success=True
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


# ===================
# Login & Token Endpoints
# ===================

@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password, returns JWT tokens"""
    user = await auth_service.authenticate_user(db, data.email, data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled"
        )
    
    await db.commit()
    return auth_service.create_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token"""
    payload = auth_service.decode_token(data.refresh_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = int(payload.get("sub"))
    user = await auth_service.get_user_by_id(db, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled"
        )
    
    return auth_service.create_tokens(user)


# ===================
# User Info Endpoints
# ===================

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current user's information"""
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Logout user.
    Note: With JWT, actual token invalidation requires token blacklisting.
    Client should delete stored tokens.
    """
    return MessageResponse(
        message="Logged out successfully",
        success=True
    )
