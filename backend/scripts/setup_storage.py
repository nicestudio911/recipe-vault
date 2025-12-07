#!/usr/bin/env python3
"""
Script to set up Supabase Storage bucket and policies.
This script creates the recipe-images bucket and sets up RLS policies.
"""

import os
import sys
from pathlib import Path

# Read environment variables directly from .env file
env_file = Path(__file__).parent.parent / '.env'
if env_file.exists():
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env")
    sys.exit(1)


def setup_storage():
    """Set up storage bucket using Supabase Python client"""
    try:
        from supabase import create_client
    except ImportError:
        print("❌ supabase package not installed. Install it with: pip install supabase")
        return False
    
    print("=" * 60)
    print("Setting up Supabase Storage")
    print("=" * 60)
    print()
    print(f"📡 Connecting to: {SUPABASE_URL}")
    print()
    
    # Create Supabase client with service key
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    bucket_name = 'recipe-images'
    
    try:
        # Check if bucket exists
        print(f"🔍 Checking if bucket '{bucket_name}' exists...")
        buckets = supabase.storage.list_buckets()
        
        bucket_exists = any(bucket.name == bucket_name for bucket in buckets)
        
        if bucket_exists:
            print(f"✅ Bucket '{bucket_name}' already exists!")
        else:
            print(f"📦 Creating bucket '{bucket_name}'...")
            # Create bucket
            response = supabase.storage.create_bucket(
                bucket_name,
                options={
                    "public": True,
                    "file_size_limit": 10 * 1024 * 1024,  # 10MB
                    "allowed_mime_types": ["image/*"]
                }
            )
            print(f"✅ Bucket '{bucket_name}' created successfully!")
        
        print()
        print("=" * 60)
        print("✅ Storage setup complete!")
        print("=" * 60)
        print()
        print("📋 Next steps:")
        print("   Set up storage policies in Supabase Dashboard:")
        print(f"   1. Go to: https://supabase.com/dashboard/project/{SUPABASE_URL.split('//')[1].split('.')[0]}/storage/policies")
        print("   2. Select the 'recipe-images' bucket")
        print("   3. Add policies (see docs/STORAGE_SETUP.md for SQL)")
        print()
        print("   Or run the policies SQL in SQL Editor (see docs/STORAGE_SETUP.md)")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function"""
    if SUPABASE_SERVICE_KEY.endswith('placeholder'):
        print("❌ Error: SUPABASE_SERVICE_KEY appears to be a placeholder")
        print("   Please update backend/.env with your actual service role key")
        return 1
    
    if setup_storage():
        return 0
    
    # Fallback instructions
    print()
    print("=" * 60)
    print("📋 Manual Setup Instructions")
    print("=" * 60)
    print()
    print("If the script didn't work, create the bucket manually:")
    print()
    project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if '//' in SUPABASE_URL else ''
    print(f"1. Open: https://supabase.com/dashboard/project/{project_ref}/storage")
    print("2. Click 'New bucket'")
    print("3. Name: recipe-images")
    print("4. Check 'Public bucket'")
    print("5. Click 'Create bucket'")
    print()
    print("See docs/STORAGE_SETUP.md for detailed instructions and policies.")
    print()
    
    return 1


if __name__ == "__main__":
    sys.exit(main())

