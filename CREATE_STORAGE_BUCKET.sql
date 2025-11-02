-- Create Storage Bucket for Issue Images
-- Run this in Supabase SQL Editor

-- Step 1: Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Step 3: Create policy for authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Create policy for public to view images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'issue-images');

-- Step 5: Create policy for users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'issue-images';


