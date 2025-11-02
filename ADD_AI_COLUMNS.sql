-- Add AI prediction columns to issues table
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS ai_category TEXT,
ADD COLUMN IF NOT EXISTS ai_priority TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
ADD COLUMN IF NOT EXISTS ai_spam_detected BOOLEAN DEFAULT FALSE;

-- Create index on AI category for filtering
CREATE INDEX IF NOT EXISTS idx_issues_ai_category ON issues(ai_category);

-- Create index on AI priority for sorting
CREATE INDEX IF NOT EXISTS idx_issues_ai_priority ON issues(ai_priority);

-- Comments for documentation
COMMENT ON COLUMN issues.ai_category IS 'AI-predicted issue category (Water Clogging, Road Damage, etc.)';
COMMENT ON COLUMN issues.ai_priority IS 'AI-predicted priority level (High, Medium, Low)';
COMMENT ON COLUMN issues.ai_confidence IS 'AI confidence score (0.00 to 1.00)';
COMMENT ON COLUMN issues.ai_sentiment IS 'AI-detected sentiment (positive, negative, neutral)';
COMMENT ON COLUMN issues.ai_spam_detected IS 'Whether AI detected this issue as potential spam';

