-- Migration 023: users.verification_token / reset_token / reset_token_expires
-- (live DB users table was created without these columns -> register/forgot-password/resend-verification/verify-email all failed with ER_BAD_FIELD_ERROR)
-- Идемпотентно через information_schema + PREPARE (этап 35)

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN verification_token VARCHAR(64) NULL AFTER password_hash',
    'SELECT ''users.verification_token exists''')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_token'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) NULL AFTER verification_token',
    'SELECT ''users.reset_token exists''')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL AFTER reset_token',
    'SELECT ''users.reset_token_expires exists''')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token_expires'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_users_reset_token ON users (reset_token)',
    'SELECT ''idx_users_reset_token exists''')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_reset_token'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
