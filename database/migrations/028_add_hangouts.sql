-- Migration 028: «Встречи» (Hangouts) — доска планов «Куда пойдем»
-- Пользователь создает объявление (кино/театр/кафе...), другие откликаются,
-- при accept автором отклика автоматически создается чат (как при match).

CREATE TABLE IF NOT EXISTS hangouts (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  category        VARCHAR(50) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  place_name      VARCHAR(255),
  place_address   VARCHAR(255),
  city            VARCHAR(100),
  lat             DECIMAL(10,8),
  lng             DECIMAL(11,8),
  event_date      DATETIME NOT NULL,
  max_companions  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status          ENUM('active','cancelled','completed','blocked') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_hangouts_geo (lat, lng),
  INDEX idx_hangouts_status_category (status, category),
  INDEX idx_hangouts_event_date (event_date),
  INDEX idx_hangouts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hangout_responses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hangout_id  INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  status      ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
  message     TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hangout_id) REFERENCES hangouts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_hangout_user (hangout_id, user_id),
  INDEX idx_responses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hangout_chats (
  hangout_id   INT UNSIGNED NOT NULL,
  response_id  INT UNSIGNED NOT NULL,
  chat_id      INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (hangout_id, response_id),
  FOREIGN KEY (hangout_id) REFERENCES hangouts(id) ON DELETE CASCADE,
  FOREIGN KEY (response_id) REFERENCES hangout_responses(id) ON DELETE CASCADE,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  INDEX idx_hangout_chats_chat (chat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature flag: hangoutsEnabled (вкл/выкл фичи без деплоя)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'feature_flags'
    AND COLUMN_NAME = 'hangouts_enabled'
);
SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE feature_flags ADD COLUMN hangouts_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER autosearch_enabled',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
