"""
Authentication routes
Handles user registration, login, token refresh
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.models import User, DonorProfile, NGOProfile, UserRole, NGOVerificationStatus
from app.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ChangePasswordRequest, DonorProfileCreate, NGOProfileCreate
)

router = APIRouter()


@router.post("/register/donor", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_donor(
    user_data: UserCreate,
    profile_data: DonorProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new donor account
    Creates user and donor profile in one transaction
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=UserRole.DONOR,
        is_active=True
    )
    db.add(user)
    await db.flush()  # Get user.id without committing
    
    # Create donor profile
    donor_profile = DonorProfile(
        user_id=user.id,
        **profile_data.dict()
    )
    db.add(donor_profile)
    await db.commit()
    await db.refresh(user)
    
    # Generate tokens
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/register/ngo", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_ngo(
    user_data: UserCreate,
    profile_data: NGOProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new NGO account
    Creates user and NGO profile (pending verification)
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if registration number already exists
    result = await db.execute(
        select(NGOProfile).where(NGOProfile.registration_number == profile_data.registration_number)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration number already exists"
        )
    
    # Create user (active for testing, will be inactive until verified in production)
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=UserRole.NGO,
        is_active=True  # Allow NGOs to login immediately for testing
    )
    db.add(user)
    await db.flush()
    
    # Create NGO profile
    ngo_profile = NGOProfile(
        user_id=user.id,
        **profile_data.dict()
    )
    db.add(ngo_profile)
    await db.commit()
    await db.refresh(user)
    await db.refresh(ngo_profile)
    
    # Notify admins about new NGO registration
    from app.services.notification_service import notify_admins_ngo_registration
    try:
        await notify_admins_ngo_registration(
            db=db,
            ngo_name=profile_data.organization_name,
            ngo_id=ngo_profile.id
        )
        await db.commit()
    except Exception as e:
        # Don't fail registration if notification fails
        print(f"Failed to create notification: {e}")
    
    # Generate tokens (user can't use them until verified, but return for consistency)
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login with email and password
    Returns access and refresh tokens
    """
    try:
        # Find user by email
        result = await db.execute(select(User).where(User.email == credentials.email))
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # For NGO users, check if they are verified/approved by admin
        if user.role == UserRole.NGO:
            # Check if account is active
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account not active. Please wait for admin verification."
                )
            
            # Query NGO verification status
            ngo_result = await db.execute(
                select(NGOProfile.verification_status).where(
                    NGOProfile.user_id == user.id
                )
            )
            verification_status = ngo_result.scalar_one_or_none()
            
            if verification_status is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="NGO profile not found"
                )
            
            # Check if NGO is verified/approved
            if verification_status == NGOVerificationStatus.REJECTED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account has been rejected so you can't login"
                )
            elif verification_status == NGOVerificationStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account is pending verification so you can't login"
                )
            elif verification_status != NGOVerificationStatus.VERIFIED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Your NGO account is {verification_status.value}. Please wait for admin approval."
                )
        
        # Generate tokens
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """
    Get new access token using refresh token
    """
    payload = decode_token(refresh_token)
    
    # Check token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    
    # Verify user still exists and is active
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new tokens
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return current_user


@router.put("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password
    """
    # Verify old password
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # Update password
    current_user.password_hash = hash_password(password_data.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout (client should discard tokens)
    """
    return {"message": "Logged out successfully"}
