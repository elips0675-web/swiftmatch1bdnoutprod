-- Migration 032: сохранение списка городов в админке (/admin/content, вкладка «Города»)
-- До миграции список городов выводился из user_profiles и не редактировался.
-- После первого «Сохранить» в админке хранится явный список; пока он пуст — берётся из профилей.

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'content_config'
    AND COLUMN_NAME = 'cities'
);
SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE content_config ADD COLUMN cities JSON NULL AFTER banned_words',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
