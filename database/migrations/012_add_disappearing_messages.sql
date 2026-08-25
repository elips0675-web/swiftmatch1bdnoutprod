SET @db = (SELECT DATABASE());
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'ttl_seconds');
SET @sql = IF(@exists = 0,
  'ALTER TABLE messages ADD COLUMN ttl_seconds INT UNSIGNED DEFAULT NULL AFTER reply_to',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
