-- Migration 025: refresh rotation + reuse detection
-- (этап 34 по аудиту kimi: украденный refresh-токен жил до истечения без инвалидации;
-- теперь каждый токен принадлежит family_id, ротация помечает старый revoked=1,
-- повторное использование ротированного токена отзывает всю семью)
ALTER TABLE refresh_tokens
  ADD COLUMN family_id CHAR(36) NOT NULL AFTER user_id,
  ADD COLUMN revoked TINYINT(1) NOT NULL DEFAULT 0 AFTER token;

CREATE INDEX idx_refresh_family ON refresh_tokens (family_id);

-- существующие токены: каждая строка получает свой UUID (MySQL вызывает UUID() на строку)
UPDATE refresh_tokens SET family_id = UUID();
