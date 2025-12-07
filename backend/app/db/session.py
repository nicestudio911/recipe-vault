from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client with service key
# The service key is used for all server-side operations including token validation
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)


def get_supabase() -> Client:
    """Get Supabase client instance (with service key for server-side operations)"""
    return supabase

