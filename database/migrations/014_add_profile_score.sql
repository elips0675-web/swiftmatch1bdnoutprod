SET @db = (SELECT DATABASE());
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'profile_score');
SET @sql = IF(@exists = 0,
  'ALTER TABLE user_profiles
   ADD COLUMN profile_score DECIMAL(5,2) DEFAULT NULL COMMENT ''Profile completeness score 0-100'',
   ADD COLUMN profile_score_updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
