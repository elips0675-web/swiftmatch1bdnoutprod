-- Migration 042: session fingerprinting — привязка refresh-токена к IP + User-Agent
-- (аудит дипсик: refresh-токен не привязан к устройству/IP, угон сессии упрощён)
-- Fingerprint = SHA256(IP + '|' + User-Agent), truncated 32 chars
ALTER TABLE refresh_tokens
  ADD COLUMN fingerprint VARCHAR(64) NULL AFTER revoked;
