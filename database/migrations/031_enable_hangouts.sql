-- Migration 031: включение флага Hangouts («Куда пойдем») по умолчанию
-- Баннер на главной показывается всем, отключить можно в админке (/admin/features).

ALTER TABLE feature_flags MODIFY COLUMN hangouts_enabled BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE feature_flags SET hangouts_enabled = TRUE WHERE id = 1;
