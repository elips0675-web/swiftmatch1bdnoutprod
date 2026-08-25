-- Hangouts 2.0: date vs company режимы, mutual like, group join, check-in, reviews

-- 1. Добавляем hangout_type к существующей таблице hangouts
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hangouts' AND COLUMN_NAME = 'hangout_type'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE hangouts ADD COLUMN hangout_type ENUM(''date'',''company'') NOT NULL DEFAULT ''date'' AFTER max_companions',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- poster_url
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hangouts' AND COLUMN_NAME = 'poster_url'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE hangouts ADD COLUMN poster_url VARCHAR(500) NULL AFTER partner_offer_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- event_url
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hangouts' AND COLUMN_NAME = 'event_url'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE hangouts ADD COLUMN event_url VARCHAR(500) NULL AFTER poster_url',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. hangout_likes (для type='date', mutual like)
CREATE TABLE IF NOT EXISTS hangout_likes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hangout_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  status     ENUM('like','skip') NOT NULL DEFAULT 'like',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hangout_id) REFERENCES hangouts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_hangout_like (hangout_id, user_id),
  INDEX idx_hangout_likes_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. hangout_participants (для type='company', open join)
CREATE TABLE IF NOT EXISTS hangout_participants (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hangout_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  role       ENUM('organizer','member') NOT NULL DEFAULT 'member',
  status     ENUM('joined','left','removed') NOT NULL DEFAULT 'joined',
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hangout_id) REFERENCES hangouts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_hangout_member (hangout_id, user_id),
  INDEX idx_hangout_participants_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. hangout_checkins (чек-ин в радиусе 500м)
CREATE TABLE IF NOT EXISTS hangout_checkins (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hangout_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  lat        DECIMAL(10,8) NOT NULL,
  lng        DECIMAL(11,8) NOT NULL,
  checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hangout_id) REFERENCES hangouts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_checkin (hangout_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. hangout_reviews (рейтинг после встречи)
CREATE TABLE IF NOT EXISTS hangout_reviews (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hangout_id   INT UNSIGNED NOT NULL,
  reviewer_id  INT UNSIGNED NOT NULL,
  reviewee_id  INT UNSIGNED NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  tag          ENUM('punctual','fun','reliable','no_show') NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hangout_id) REFERENCES hangouts(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review (hangout_id, reviewer_id, reviewee_id),
  CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
