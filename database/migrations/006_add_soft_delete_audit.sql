-- Soft Deletes: add deleted_at to main tables
-- Audit Log: track all mutations

SET @s = (SELECT IFNULL(MAX(id), 0) + 1 FROM audit_log);

ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER last_login;
ALTER TABLE user_profiles ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
ALTER TABLE user_photos ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
ALTER TABLE likes ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
ALTER TABLE matches ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
ALTER TABLE chats ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
ALTER TABLE post_comments ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
ALTER TABLE notifications ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
ALTER TABLE reports ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;

CREATE TABLE IF NOT EXISTS audit_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id INT UNSIGNED NOT NULL,
  action ENUM('create', 'update', 'delete', 'restore') NOT NULL,
  old_values JSON DEFAULT NULL,
  new_values JSON DEFAULT NULL,
  user_id INT UNSIGNED DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_table (table_name),
  INDEX idx_audit_record (table_name, record_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
