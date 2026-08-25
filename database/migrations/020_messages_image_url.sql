-- Migration 020: messages.image_url (image messages support)
-- Идемпотентно через information_schema + PREPARE (этап 35)
SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE messages ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER text',
    'SELECT ''messages.image_url exists''')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'image_url'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
