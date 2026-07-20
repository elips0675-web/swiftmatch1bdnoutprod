CREATE TABLE IF NOT EXISTS consent_log (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  consent_type    VARCHAR(100) NOT NULL,
  granted         BOOLEAN NOT NULL,
  ip_address      VARCHAR(45),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_consent_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS data_erase_requests (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  token           VARCHAR(64) NOT NULL,
  status          ENUM('pending','confirmed','completed') NOT NULL DEFAULT 'pending',
  requested_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at    TIMESTAMP NULL,
  completed_at    TIMESTAMP NULL,
  UNIQUE INDEX idx_erase_token (token),
  INDEX idx_erase_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
