-- Migration 019: A/B experiments + product analytics tracking
CREATE TABLE IF NOT EXISTS experiments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  experiment_key VARCHAR(64) NOT NULL,
  description VARCHAR(300) DEFAULT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experiment_key (experiment_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experiment_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  experiment_key VARCHAR(64) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  variant VARCHAR(16) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assignment (experiment_key, user_id),
  KEY idx_assignment_key (experiment_key),
  CONSTRAINT fk_assignment_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO experiments (name, experiment_key, description, enabled) VALUES
  ('CTA на карточке', 'card_cta', 'Variant B — доп. кнопка «Открыть профиль» на карточке свайпа', 1);