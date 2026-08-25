-- Migration 031: партнёрский трекинг до ума (этап 48)
-- 1) external_order_id — идемпотентность S2S postback (уникальный ключ допускает NULL)
-- 2) partner_offer_id в hangouts — связь «встреча создана из оффера афиши»

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_conversions'
    AND COLUMN_NAME = 'external_order_id'
);
SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE partner_conversions ADD COLUMN external_order_id VARCHAR(100) NULL AFTER conversion_type',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- S2S postback может приходить без привязки к юзеру
SET @nullable = (
  SELECT IS_NULLABLE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_conversions'
    AND COLUMN_NAME = 'user_id'
);
SET @ddl = IF(
  @nullable = 'NO',
  'ALTER TABLE partner_conversions MODIFY user_id INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partner_conversions'
    AND INDEX_NAME = 'uq_conversions_external'
);
SET @ddl = IF(
  @idx_exists = 0,
  'ALTER TABLE partner_conversions ADD UNIQUE KEY uq_conversions_external (external_order_id)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'hangouts'
    AND COLUMN_NAME = 'partner_offer_id'
);
SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE hangouts ADD COLUMN partner_offer_id INT UNSIGNED NULL AFTER max_companions',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'hangouts'
    AND CONSTRAINT_NAME = 'fk_hangouts_partner_offer'
);
SET @ddl = IF(
  @fk_exists = 0,
  'ALTER TABLE hangouts ADD CONSTRAINT fk_hangouts_partner_offer FOREIGN KEY (partner_offer_id) REFERENCES partner_offers(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
