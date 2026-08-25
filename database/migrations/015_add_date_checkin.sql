-- Migration 015: Date Check-in (Safety) — emergency contacts + check-in timer

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  relation VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_emergency_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS date_checkins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  schedule_id INT UNSIGNED DEFAULT NULL,
  contact_id INT UNSIGNED DEFAULT NULL,
  status ENUM('active','checked_in','missed','cancelled','expired') NOT NULL DEFAULT 'active',
  checkin_at DATETIME NOT NULL,
  checked_in_at DATETIME DEFAULT NULL,
  location_sharing BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT DEFAULT NULL,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES date_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES emergency_contacts(id) ON DELETE SET NULL,
  INDEX idx_checkin_user (user_id),
  INDEX idx_checkin_status (status),
  INDEX idx_checkin_date (checkin_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;