# Supabase Database Setup

This guide will help you set up the database tables in your Supabase project.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `azzvrrzgtbehskhdunqy`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Run the Schema SQL

1. Copy the entire contents of `supabase/schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

This will create:
- All required tables (users, recipes, ingredients, steps, tags, etc.)
- Indexes for better performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates
- A function to create user profiles on signup

## Step 3: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `users`
   - `recipes`
   - `ingredients`
   - `steps`
   - `tags`
   - `recipe_tags`
   - `attachments`

## Step 4: Set Up Storage Bucket (Optional but Recommended)

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `recipe-images`
4. Make it **Public** (or configure policies as needed)
5. Click **Create bucket**

## Step 5: Configure Storage Policies (Optional)

If you want to restrict access to storage:

1. Go to **Storage** → **Policies**
2. Select the `recipe-images` bucket
3. Add policies:
   - **SELECT**: Users can read files from their own folder
   - **INSERT**: Users can upload files to their own folder
   - **DELETE**: Users can delete files from their own folder

Example policy for SELECT:
```sql
CREATE POLICY "Users can read their own images"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Troubleshooting

### Error: "relation already exists"
- Some tables might already exist. The schema uses `CREATE TABLE IF NOT EXISTS`, so this should be safe, but you can drop existing tables if needed.

### Error: "permission denied"
- Make sure you're running the SQL as a database admin or with proper permissions.

### PostgREST Schema Cache Error
- After creating tables, PostgREST should automatically refresh its schema cache
- If you still see cache errors, wait a few seconds and try again
- You can also manually refresh by going to **Settings** → **API** → **Reload Schema**

## Next Steps

After setting up the database:
1. Make sure your backend `.env` has the correct `SUPABASE_SERVICE_KEY`
2. Restart your backend server
3. Try creating a recipe again

