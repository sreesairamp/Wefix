# 🔧 Quick Fix: Storage Permission Denied Error

## The Error
"Permission denied. Please check storage bucket policies in Supabase."

## ⚡ Quick Solution (2 minutes)

### Method 1: Run SQL Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the SQL**
   - Open `FIX_STORAGE_PERMISSIONS.sql` file
   - Copy all the SQL code
   - Paste it into the SQL Editor

4. **Run the Script**
   - Click "Run" or press `Ctrl+Enter`
   - You should see success messages

5. **Test Again**
   - Go back to your Report page
   - Try uploading an image
   - It should work now! ✅

### Method 2: Manual Setup via UI

If SQL doesn't work, try manual setup:

#### Step 1: Create/Verify Bucket
1. Go to **Storage** → **Buckets**
2. If `issue-images` doesn't exist:
   - Click **"New bucket"**
   - Name: `issue-images`
   - **Enable "Public bucket"** ✅ (IMPORTANT!)
   - Click "Create bucket"

#### Step 2: Set Up Policies
1. Go to **Storage** → **Policies**
2. Click on `issue-images` bucket
3. Click **"New policy"** → **"Create policy from scratch"**

**Policy 1: Upload (INSERT)**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition: Paste this:
  ```sql
  (bucket_id = 'issue-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```
- Click "Review" → "Save policy"

**Policy 2: View (SELECT)**
- Policy name: `Allow public view`
- Allowed operation: `SELECT`
- Target roles: `public`
- Policy definition: Paste this:
  ```sql
  (bucket_id = 'issue-images')
  ```
- Click "Review" → "Save policy"

#### Step 3: Test
- Refresh your Report page
- Try uploading an image
- Should work now!

## 🔍 Verify It's Working

1. **Check Bucket Exists**
   - Storage → Buckets
   - You should see `issue-images` with a green checkmark

2. **Check Bucket is Public**
   - Click on `issue-images`
   - Under "Settings" → "Public bucket" should be ON ✅

3. **Check Policies**
   - Storage → Policies → `issue-images`
   - You should see at least 2 policies:
     - One for INSERT (upload)
     - One for SELECT (view)

## ❌ Still Not Working?

### Check These:

1. **Are you logged in?**
   - You must be logged in to upload images
   - Check if user is authenticated

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for detailed error messages
   - Share the exact error if still failing

3. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for storage-related errors

4. **Verify User ID**
   - The upload path uses `user.id`
   - Make sure you're logged in with a valid user

## 📝 What the Policies Do

- **INSERT Policy**: Allows authenticated users to upload images to their own folder (`user.id/filename`)
- **SELECT Policy**: Allows anyone (public) to view/download images
- **DELETE Policy**: Allows users to delete their own images

The folder structure is: `{user_id}/issue-{timestamp}.{ext}`

This ensures users can only upload/delete their own files, but everyone can view them.


