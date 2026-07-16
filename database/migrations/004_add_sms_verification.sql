-- Add phone column to users table
ALTER TABLE users
  ADD COLUMN phone VARCHAR(20) NULL AFTER email;

-- SMS verification codes table
CREATE TABLE IF NOT EXISTS sms_verification (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  phone       VARCHAR(20) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  verified    TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  UNIQUE KEY uk_sms_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
