-- 041: Anti-cat verification — user_verifications + verified flag

-- Add verified flag to user_profiles
SET @col_ver = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'photo_verified'
);
SET @ddl1 = IF(@col_ver = 0,
  'ALTER TABLE user_profiles ADD COLUMN photo_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER passport_mode',
  'SELECT 1');
PREPARE s1 FROM @ddl1; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Verification submissions
CREATE TABLE IF NOT EXISTS user_verifications (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  photo_url       VARCHAR(500) NOT NULL,
  status          ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  admin_note      VARCHAR(255) NULL,
  reviewed_by     INT UNSIGNED NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at     TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_uver_user (user_id),
  INDEX idx_uver_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
