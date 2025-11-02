-- Fix Storage Bucket Permissions for issue-images
-- Run this in Supabase SQL Editor to fix "Permission denied" error

-- Step 1: Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove any existing policies that might conflict
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') LOOP
        IF r.policyname LIKE '%issue-images%' OR r.policyname LIKE '%upload%' OR r.policyname LIKE '%image%' THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
        END IF;
    END LOOP;
END $$;

-- Step 3: Create policy for authenticated users to upload images
-- This allows logged-in users to upload images to their own folder
CREATE POLICY "Allow authenticated users to upload to issue-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Create policy for public to view images
-- This allows anyone to view the uploaded images
CREATE POLICY "Allow public to view issue-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'issue-images');

-- Step 5: Allow users to update their own images
CREATE POLICY "Allow users to update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 6: Allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the setup
SELECT 
  id, 
  name, 
  public,
  created_at
FROM storage.buckets 
WHERE id = 'issue-images';

-- Check policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%issue-images%';


