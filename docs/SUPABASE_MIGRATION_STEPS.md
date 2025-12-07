# Supabase Migration Steps

## Using Supabase CLI

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to Your Project

```bash
cd /path/to/recipe-vault
supabase link --project-ref your-project-ref
```

### 4. Create Migration

```bash
# Create a new migration file
supabase migration new initial_schema

# This creates a file in supabase/migrations/
# Copy the contents of schema.sql to this migration file
```

### 5. Apply Migration

```bash
# Apply migrations to your local database
supabase db reset

# Or apply to remote database
supabase db push
```

### 6. Verify Migration

```bash
# Check migration status
supabase migration list

# View database schema
supabase db diff
```

## Using Supabase Dashboard

### 1. Access SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### 2. Run Schema

1. Copy the contents of `supabase/schema.sql`
2. Paste into the SQL Editor
3. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 3. Verify Tables

1. Navigate to **Table Editor**
2. Verify all tables are created:
   - users
   - recipes
   - ingredients
   - steps
   - attachments
   - tags
   - recipe_tags

### 4. Set Up Storage Bucket

1. Navigate to **Storage**
2. Click **New Bucket**
3. Name: `recipe-images`
4. Make it **Public** (or configure policies)
5. Set up storage policies:
   - Users can upload to `{user_id}/*`
   - Users can read from `{user_id}/*`
   - Users can delete from `{user_id}/*`

### 5. Verify RLS Policies

1. Navigate to **Authentication** → **Policies**
2. Verify Row Level Security is enabled on all tables
3. Check that policies are correctly applied

## Rollback Migration

If you need to rollback:

```bash
# Using Supabase CLI
supabase migration repair --status reverted <migration_version>

# Or manually drop tables in reverse order
DROP TABLE IF EXISTS public.recipe_tags;
DROP TABLE IF EXISTS public.tags;
DROP TABLE IF EXISTS public.attachments;
DROP TABLE IF EXISTS public.steps;
DROP TABLE IF EXISTS public.ingredients;
DROP TABLE IF EXISTS public.recipes;
DROP TABLE IF EXISTS public.users;
```

## Troubleshooting

### Migration Fails

1. Check for existing tables that conflict
2. Verify foreign key constraints
3. Check RLS policies aren't blocking operations
4. Review error messages in Supabase logs

### RLS Policies Not Working

1. Ensure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Verify policies are created correctly
3. Test with authenticated user context
4. Check Supabase auth is properly configured

### Storage Bucket Issues

1. Verify bucket exists and is accessible
2. Check storage policies are set correctly
3. Verify file paths match policy patterns
4. Test upload with authenticated user

