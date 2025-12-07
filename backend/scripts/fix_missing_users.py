#!/usr/bin/env python3
"""
Script to fix missing user records in public.users table.
This creates user records for any auth.users that don't have a corresponding public.users entry.
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


def fix_missing_users():
    """Create user records for auth users that don't have public.users entries"""
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
        print("To fix missing users, you need the database password.")
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
        
        # SQL to create missing user records
        fix_sql = """
        -- Create user records for any auth.users that don't have a public.users entry
        INSERT INTO public.users (id, email, full_name, created_at, updated_at)
        SELECT 
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', NULL) as full_name,
            au.created_at,
            au.updated_at
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL;
        """
        
        print("📝 Creating missing user records...")
        cursor.execute(fix_sql)
        
        # Check how many were created
        cursor.execute("SELECT COUNT(*) FROM public.users")
        user_count = cursor.fetchone()[0]
        
        print(f"✅ Done! Total users in public.users: {user_count}")
        print()
        print("🎉 Missing users have been created!")
        print()
        print("You can now create recipes without foreign key errors.")
        
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
    print("Fix Missing User Records")
    print("=" * 60)
    print()
    print("This script creates user records in public.users for any")
    print("auth.users that don't have a corresponding entry.")
    print()
    
    if fix_missing_users():
        return 0
    
    # Fallback to SQL instructions
    print()
    print("=" * 60)
    print("📋 Manual Fix: Run this SQL in Supabase SQL Editor")
    print("=" * 60)
    print()
    print("Copy and paste this SQL into the Supabase SQL Editor:")
    print()
    print("-" * 60)
    print("""
-- Create user records for any auth.users that don't have a public.users entry
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', NULL) as full_name,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
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

