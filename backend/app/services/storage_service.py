import uuid
from typing import Optional
from uuid import UUID
from supabase import Client
from app.core.config import settings


class StorageService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.bucket = settings.storage_bucket

    async def upload_image(
        self, image_data: bytes, user_id: UUID, file_name: Optional[str] = None
    ) -> str:
        """Upload image to Supabase Storage"""
        if not file_name:
            file_name = f"{uuid.uuid4()}.jpg"
        
        file_path = f"{user_id}/{file_name}"
        
        response = self.supabase.storage.from_(self.bucket).upload(
            file_path,
            image_data,
            file_options={"content-type": "image/jpeg", "upsert": "false"}
        )
        
        if response:
            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket).get_public_url(file_path)
            return public_url
        
        raise ValueError("Failed to upload image")

    async def delete_image(self, file_path: str) -> None:
        """Delete image from Supabase Storage"""
        self.supabase.storage.from_(self.bucket).remove([file_path])

    async def get_public_url(self, file_path: str) -> str:
        """Get public URL for a file"""
        return self.supabase.storage.from_(self.bucket).get_public_url(file_path)
