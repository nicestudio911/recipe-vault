# Supabase Storage Setup

## Create the Storage Bucket

The app needs a storage bucket called `recipe-images` to store recipe images.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard:
   - https://supabase.com/dashboard/project/azzvrrzgtbehskhdunqy

2. Click **Storage** in the left sidebar

3. Click **New bucket**

4. Configure the bucket:
   - **Name**: `recipe-images`
   - **Public bucket**: ✅ Check this (so images can be accessed via URL)
   - **File size limit**: 10 MB (or your preference)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)

5. Click **Create bucket**

### Option 2: Using SQL

Run this SQL in the Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;
```

### Set Up Storage Policies

After creating the bucket, set up Row Level Security (RLS) policies:

1. Go to **Storage** → **Policies**
2. Select the `recipe-images` bucket
3. Click **New Policy**

#### Policy 1: Users can upload to their own folder

```sql
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Users can read from their own folder

```sql
CREATE POLICY "Users can read from their own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Users can delete from their own folder

```sql
CREATE POLICY "Users can delete from their own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Alternative: Public Read Access

If you want all images to be publicly readable (simpler but less secure):

```sql
-- Allow public read access
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- Users can upload to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Verify Setup

After creating the bucket and policies:

1. Go to **Storage** → **recipe-images**
2. You should see the bucket listed
3. Try uploading a test image to verify it works

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket name is exactly `recipe-images` (case-sensitive)
- Check that the bucket was created successfully in Storage

### Error: "Permission denied"
- Check that RLS policies are set up correctly
- Verify the user is authenticated
- Check that the folder structure matches `{user_id}/filename.jpg`

### Images not showing
- Check if the bucket is set to public
- Verify the public URL is correct
- Check browser console for CORS errors

