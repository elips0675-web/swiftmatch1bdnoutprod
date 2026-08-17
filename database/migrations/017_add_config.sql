CREATE TABLE IF NOT EXISTS config (
  config_key VARCHAR(100) NOT NULL PRIMARY KEY,
  config_value JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO config (config_key, config_value) VALUES
  ('ads', JSON_OBJECT('google', TRUE, 'yandex', FALSE, 'googleId', 'ca-app-pub-3940256099942544/5224354917', 'yandexId', 'R-M-DEMO-rewarded'))
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);