-- Add group_id column to issues table (to link issues to groups)
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Create fundraisers table
CREATE TABLE IF NOT EXISTS fundraisers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  donor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMPTZ,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fundraisers
CREATE POLICY "Anyone can view fundraisers"
ON fundraisers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Group creators can create fundraisers"
ON fundraisers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = fundraisers.group_id 
    AND groups.created_by = auth.uid()
  )
);

CREATE POLICY "Group creators can update fundraisers"
ON fundraisers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = fundraisers.group_id 
    AND groups.created_by = auth.uid()
  )
);

-- RLS Policies for donations
CREATE POLICY "Anyone can view donations"
ON donations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create donations"
ON donations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = donor_user_id OR donor_user_id IS NULL);

CREATE POLICY "Users can view their own donations"
ON donations FOR SELECT
TO authenticated
USING (auth.uid() = donor_user_id OR true);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM donations 
    WHERE donations.id = invoices.donation_id 
    AND donations.donor_user_id = auth.uid()
  )
);

CREATE POLICY "Invoices are created automatically"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fundraisers_group_id ON fundraisers(group_id);
CREATE INDEX IF NOT EXISTS idx_fundraisers_issue_id ON fundraisers(issue_id);
CREATE INDEX IF NOT EXISTS idx_donations_fundraiser_id ON donations(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_user_id ON donations(donor_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_donation_id ON invoices(donation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fundraiser_id ON invoices(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_issues_group_id ON issues(group_id);

