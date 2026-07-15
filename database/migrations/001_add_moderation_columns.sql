ALTER TABLE user_photos
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS evidence JSON;
