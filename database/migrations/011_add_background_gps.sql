SET @db = (SELECT DATABASE());
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'last_location_update');
SET @sql = IF(@exists = 0,
  'ALTER TABLE user_profiles ADD COLUMN last_location_update TIMESTAMP NULL DEFAULT NULL AFTER lng',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
