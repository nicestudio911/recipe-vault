#!/usr/bin/env python3
"""
Automated script to set up the Supabase database schema.
This script connects directly to Postgres and executes the schema SQL.
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

def get_schema_sql():
    """Read the schema.sql file"""
    project_root = Path(__file__).parent.parent.parent
    schema_file = project_root / "supabase" / "schema.sql"
    
    if not schema_file.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_file}")
    
    with open(schema_file, 'r') as f:
        return f.read()


def setup_with_psycopg2():
    """Set up database using psycopg2 direct connection"""
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("❌ psycopg2 not installed. Install it with: pip install psycopg2-binary")
        return False
    
    # Extract project reference from URL
    project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if '//' in SUPABASE_URL else ''
    
    # Get database password from environment or prompt
    db_password = os.getenv('SUPABASE_DB_PASSWORD')
    
    if not db_password:
        print("=" * 60)
        print("Database Password Required")
        print("=" * 60)
        print()
        print("To connect directly to Postgres, you need the database password.")
        print("You can find it in your Supabase Dashboard:")
        print(f"   https://supabase.com/dashboard/project/{project_ref}/settings/database")
        print()
        print("Look for 'Connection string' or 'Database password'")
        print()
        db_password = input("Enter your database password (or press Enter to skip): ").strip()
        
        if not db_password:
            print("Skipping direct connection. Use the SQL Editor method instead.")
            return False
    
    # Build connection string
    # Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
    conn_string = f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"
    
    print()
    print("🔌 Connecting to database...")
    
    try:
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        print()
        
        # Read and execute schema
        schema_sql = get_schema_sql()
        print("📝 Executing schema SQL...")
        print()
        
        # Execute the entire schema
        cursor.execute(schema_sql)
        
        print("✅ Schema executed successfully!")
        print()
        print("🎉 Database setup complete!")
        print()
        print("You can now:")
        print("  - Create recipes in your app")
        print("  - Verify tables in Supabase Dashboard → Table Editor")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection error: {e}")
        print()
        print("Make sure:")
        print("  - The database password is correct")
        print("  - Your IP is allowed in Supabase (Settings → Database → Connection Pooling)")
        return False
    except Exception as e:
        print(f"❌ Error executing schema: {e}")
        return False


def main():
    """Main function"""
    print("=" * 60)
    print("Automated Supabase Database Setup")
    print("=" * 60)
    print()
    print(f"📡 Supabase URL: {SUPABASE_URL}")
    print()
    
    if SUPABASE_SERVICE_KEY.endswith('placeholder'):
        print("❌ Error: SUPABASE_SERVICE_KEY appears to be a placeholder")
        print("   Please update backend/.env with your actual service role key")
        return 1
    
    print("✅ Service key is configured")
    print()
    
    # Try automated setup
    if setup_with_psycopg2():
        return 0
    
    # Fallback to manual instructions
    print()
    print("=" * 60)
    print("📋 Manual Setup Instructions")
    print("=" * 60)
    print()
    print("Since direct connection isn't available, use the SQL Editor:")
    print()
    project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if '//' in SUPABASE_URL else ''
    print(f"1. Open: https://supabase.com/dashboard/project/{project_ref}")
    print("2. Go to SQL Editor")
    print("3. Click 'New Query'")
    print("4. Copy contents of: supabase/schema.sql")
    print("5. Paste and click 'Run'")
    print()
    
    return 1


if __name__ == "__main__":
    sys.exit(main())

