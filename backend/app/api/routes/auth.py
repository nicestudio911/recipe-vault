from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import UserCreate, Token
from app.services.auth_service import AuthService
from app.core.dependencies import get_supabase_client
from supabase import Client

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(supabase: Client = Depends(get_supabase_client)) -> AuthService:
    return AuthService(supabase)


@router.post("/signup", response_model=Token)
async def sign_up(
    user_data: UserCreate,
    service: AuthService = Depends(get_auth_service)
):
    """Sign up a new user"""
    try:
        response = await service.sign_up(
            user_data.email,
            user_data.password,
            user_data.full_name
        )
        if not response.session:
            raise HTTPException(status_code=400, detail="Sign up failed")
        return Token(access_token=response.session.access_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signin", response_model=Token)
async def sign_in(
    user_data: UserCreate,
    service: AuthService = Depends(get_auth_service)
):
    """Sign in a user"""
    try:
        response = await service.sign_in(user_data.email, user_data.password)
        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return Token(access_token=response.session.access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

