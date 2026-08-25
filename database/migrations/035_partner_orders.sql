-- Этап 50: Stripe Checkout для цветов/ресторанов.
-- 1) partner_orders — заказы через Stripe (цветы, рестораны, подарки)
-- 2) stripe_session_id в partner_conversions для идемпотентности webhook

CREATE TABLE IF NOT EXISTS partner_orders (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partner_id         INT UNSIGNED NOT NULL,
  offer_id           INT UNSIGNED NULL,
  user_id            INT UNSIGNED NOT NULL,
  stripe_session_id  VARCHAR(255) NULL,
  amount             DECIMAL(10,2) NOT NULL,
  commission         DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency           VARCHAR(3) NOT NULL DEFAULT 'RUB',
  recipient_name     VARCHAR(200) NULL,
  recipient_address  TEXT NULL,
  gift_message       TEXT NULL,
  status             ENUM('pending','paid','fulfilled','cancelled','refunded') NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (offer_id) REFERENCES partner_offers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_orders_stripe_session (stripe_session_id),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_partner (partner_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_conversions'
    AND COLUMN_NAME = 'stripe_session_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE partner_conversions ADD COLUMN stripe_session_id VARCHAR(255) NULL AFTER external_order_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
