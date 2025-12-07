from typing import Optional
from app.db.session import get_supabase
from supabase import Client


class AuthService:
    def __init__(self, supabase: Client = None):
        self.supabase = supabase or get_supabase()

    async def sign_up(self, email: str, password: str, full_name: Optional[str] = None) -> dict:
        """Sign up a new user"""
        response = self.supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name
                }
            }
        })
        return response

    async def sign_in(self, email: str, password: str) -> dict:
        """Sign in a user"""
        response = self.supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return response

    async def sign_out(self, access_token: str) -> None:
        """Sign out a user"""
        self.supabase.auth.sign_out()

    async def get_user(self, access_token: str) -> Optional[dict]:
        """Get user from access token"""
        response = self.supabase.auth.get_user(access_token)
        return response.user if response.user else None
