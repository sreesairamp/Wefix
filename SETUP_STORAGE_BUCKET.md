# Setup Supabase Storage Bucket for Issue Images

## Issue
If you're getting "Failed to upload image" error, the storage bucket might not be set up correctly.

## Solution: Create Storage Bucket

### Step 1: Go to Supabase Storage
1. Open your Supabase project dashboard
2. Go to **Storage** in the left sidebar
3. Click **"New bucket"**

### Step 2: Create the Bucket
1. **Bucket name**: `issue-images` (must match exactly)
2. **Public bucket**: ✅ Enable (toggle ON)
   - This allows public access to uploaded images
3. **File size limit**: Set to 5MB or 10MB (optional)
4. **Allowed MIME types**: `image/*` (optional, for security)

### Step 3: Set Storage Policies (Row Level Security)

Go to **Storage** → **Policies** → Select `issue-images` bucket

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Users can upload their own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Allow Public Read Access
```sql
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'issue-images');
```

#### Policy 3: Allow Users to Delete Their Own Images
```sql
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 4: Alternative - Quick Setup via SQL Editor

Run this SQL in Supabase SQL Editor:

```sql
-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to view images
CREATE POLICY IF NOT EXISTS "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'issue-images');

-- Allow users to delete their own images
CREATE POLICY IF NOT EXISTS "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 5: Verify Setup

1. Go to Storage → `issue-images` bucket
2. Check that it's marked as **Public**
3. Check that policies are created
4. Try uploading an image from the Report page

## Troubleshooting

### Error: "Bucket not found"
- Solution: Create the bucket as described above

### Error: "new row violates row-level security"
- Solution: Create the RLS policies as shown above

### Error: "Permission denied"
- Solution: Make sure the bucket is public and policies allow authenticated uploads

### Images upload but don't display
- Check that the bucket is public
- Verify the public URL is accessible

## Testing

After setup:
1. Go to Report page
2. Fill in issue details
3. Select a location on map
4. Upload an image
5. Submit the issue
6. Check if image appears in the issue details

## Additional Buckets (Optional)

You might also want to create:
- `avatars` bucket (for profile pictures)
- Public access enabled
- Similar policies for authenticated uploads


