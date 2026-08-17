-- Migration 023: users.verification_token / reset_token / reset_token_expires
-- (live DB users table was created without these columns -> register/forgot-password/resend-verification/verify-email all failed with ER_BAD_FIELD_ERROR)
ALTER TABLE users
  ADD COLUMN verification_token VARCHAR(64) NULL AFTER password_hash,
  ADD COLUMN reset_token VARCHAR(64) NULL AFTER verification_token,
  ADD COLUMN reset_token_expires TIMESTAMP NULL AFTER reset_token;

CREATE INDEX idx_users_reset_token ON users (reset_token);