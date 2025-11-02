-- Add leader_id column to groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set existing groups' leader_id to created_by
UPDATE groups 
SET leader_id = created_by 
WHERE leader_id IS NULL;

-- Add recipient_user_id to donations table (to track who receives the funds)
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON groups(leader_id);

-- Update RLS policies for fundraisers to check leader_id instead of created_by
-- First, drop existing policy
DROP POLICY IF EXISTS "Group creators can create fundraisers" ON fundraisers;

-- Create new policy checking leader_id
CREATE POLICY "Group leaders can create fundraisers"
ON fundraisers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = fundraisers.group_id 
    AND groups.leader_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Group creators can update fundraisers" ON fundraisers;

CREATE POLICY "Group leaders can update fundraisers"
ON fundraisers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = fundraisers.group_id 
    AND groups.leader_id = auth.uid()
  )
);

