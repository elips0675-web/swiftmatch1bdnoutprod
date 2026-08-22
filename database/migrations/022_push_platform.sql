-- Migration 022: push_subscriptions.platform (web/fcm channel routing)
-- Идемпотентно через information_schema + PREPARE (этап 35)
SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE push_subscriptions ADD COLUMN platform VARCHAR(16) NOT NULL DEFAULT ''web'' AFTER p256dh',
    'SELECT ''push_subscriptions.platform exists''')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'push_subscriptions' AND COLUMN_NAME = 'platform'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
