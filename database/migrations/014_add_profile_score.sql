ALTER TABLE user_profiles
  ADD COLUMN profile_score DECIMAL(5,2) DEFAULT NULL COMMENT 'Profile completeness score 0-100',
  ADD COLUMN profile_score_updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;