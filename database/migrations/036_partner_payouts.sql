-- Этап 52: Выплаты партнёрам.
-- partner_payouts — запросы на выплату комиссии.

CREATE TABLE IF NOT EXISTS partner_payouts (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partner_id      INT UNSIGNED NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'RUB',
  method          ENUM('bank','card','crypto','manual') NOT NULL DEFAULT 'bank',
  details         TEXT NULL,
  status          ENUM('pending','processing','completed','rejected') NOT NULL DEFAULT 'pending',
  admin_note      TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at    TIMESTAMP NULL,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_payouts_partner (partner_id),
  INDEX idx_payouts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
