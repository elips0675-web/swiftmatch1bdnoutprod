-- 040: Wave 4 — B2B partner marketplace
-- 1) Add user_id + description + logo_url + contact fields to partners
-- 2) Create partner_subscriptions table

-- Extend partners table
SET @col_uid = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partners' AND COLUMN_NAME = 'user_id'
);
SET @ddl1 = IF(@col_uid = 0,
  'ALTER TABLE partners ADD COLUMN user_id INT UNSIGNED NULL AFTER id, ADD COLUMN description TEXT NULL AFTER api_base_url, ADD COLUMN logo_url VARCHAR(500) NULL AFTER description, ADD COLUMN contact_email VARCHAR(255) NULL AFTER logo_url, ADD COLUMN contact_phone VARCHAR(30) NULL AFTER contact_email, ADD INDEX idx_partners_user (user_id)',
  'SELECT 1');
PREPARE s1 FROM @ddl1; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Partner subscriptions
CREATE TABLE IF NOT EXISTS partner_subscriptions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partner_id      INT UNSIGNED NOT NULL,
  tier            ENUM('basic','pro') NOT NULL DEFAULT 'basic',
  status          ENUM('active','cancelled','expired') NOT NULL DEFAULT 'active',
  stripe_session_id VARCHAR(255) NULL,
  starts_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_psub_partner (partner_id),
  INDEX idx_psub_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature flag for B2B marketplace
SET @col_b2b = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feature_flags' AND COLUMN_NAME = 'b2b_marketplace_enabled'
);
SET @ddl2 = IF(@col_b2b = 0,
  'ALTER TABLE feature_flags ADD COLUMN b2b_marketplace_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER partner_offers_enabled',
  'SELECT 1');
PREPARE s2 FROM @ddl2; EXECUTE s2; DEALLOCATE PREPARE s2;
