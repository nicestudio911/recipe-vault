#!/usr/bin/env python3
"""
Script to set up Supabase Storage policies for recipe-images bucket.
This script creates RLS policies so users can only access their own images.
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


def setup_policies():
    """Set up storage policies using direct SQL execution"""
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("❌ psycopg2 not installed. Install it with: pip install psycopg2-binary")
        return False
    
    # Extract project reference from URL
    project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if '//' in SUPABASE_URL else ''
    
    # Get database password
    db_password = os.getenv('SUPABASE_DB_PASSWORD')
    
    if not db_password:
        print("=" * 60)
        print("Database Password Required")
        print("=" * 60)
        print()
        print("To set up policies, you need the database password.")
        print(f"   https://supabase.com/dashboard/project/{project_ref}/settings/database")
        print()
        db_password = input("Enter your database password (or press Enter to skip): ").strip()
        
        if not db_password:
            print("Skipping. Use the SQL method instead.")
            return False
    
    # Build connection string
    conn_string = f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"
    
    print()
    print("🔌 Connecting to database...")
    
    try:
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        print()
        
        # SQL to create storage policies
        policies_sql = """
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
        DROP POLICY IF EXISTS "Users can read from their own folder" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete from their own folder" ON storage.objects;
        DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
        
        -- Allow users to upload to their own folder
        CREATE POLICY "Users can upload to their own folder"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'recipe-images' 
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
        
        -- Allow users to read from their own folder
        CREATE POLICY "Users can read from their own folder"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'recipe-images' 
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
        
        -- Allow users to delete from their own folder
        CREATE POLICY "Users can delete from their own folder"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'recipe-images' 
          AND (storage.foldername(name))[1] = auth.uid()::text
        );
        
        -- Allow public read access (optional - for public images)
        CREATE POLICY "Public can read images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'recipe-images');
        """
        
        print("📝 Creating storage policies...")
        cursor.execute(policies_sql)
        
        print("✅ Storage policies created successfully!")
        print()
        print("🎉 Storage setup complete!")
        print()
        print("Users can now:")
        print("  - Upload images to their own folder: {user_id}/filename.jpg")
        print("  - Read images from their own folder")
        print("  - Delete images from their own folder")
        print("  - Public can read all images (if bucket is public)")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function"""
    print("=" * 60)
    print("Setting up Storage Policies")
    print("=" * 60)
    print()
    
    if setup_policies():
        return 0
    
    # Fallback to SQL instructions
    print()
    print("=" * 60)
    print("📋 Manual Setup: Run this SQL in Supabase SQL Editor")
    print("=" * 60)
    print()
    print("Copy and paste this SQL into the Supabase SQL Editor:")
    print()
    print("-" * 60)
    print("""
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read from their own folder
CREATE POLICY "Users can read from their own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete from their own folder
CREATE POLICY "Users can delete from their own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (optional - for public images)
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');
    """.strip())
    print("-" * 60)
    print()
    project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if '//' in SUPABASE_URL else ''
    print(f"1. Open: https://supabase.com/dashboard/project/{project_ref}")
    print("2. Go to SQL Editor")
    print("3. Paste the SQL above")
    print("4. Click 'Run'")
    print()
    
    return 1


if __name__ == "__main__":
    sys.exit(main())

