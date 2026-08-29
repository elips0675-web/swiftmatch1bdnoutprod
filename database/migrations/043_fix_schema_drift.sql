-- 043: Fix schema drift between migrations and live DB (этап 77)
-- group_posts.deleted_at / group_post_comments.deleted_at объявлены в 016, config.created_at в 017,
-- но отсутствуют в живой БД. schema-validate.mjs (этап 77) теперь учитывает миграции и сигналит об этом.
-- Все колонки additive (nullable) - не ломают существующий код (соц.посты/группы).

SET @gp = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_posts' AND COLUMN_NAME = 'deleted_at'
);
SET @ddl1 = IF(@gp = 0,
  'ALTER TABLE group_posts ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at',
  'SELECT 1');
PREPARE s1 FROM @ddl1; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @gpc = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_post_comments' AND COLUMN_NAME = 'deleted_at'
);
SET @ddl2 = IF(@gpc = 0,
  'ALTER TABLE group_post_comments ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at',
  'SELECT 1');
PREPARE s2 FROM @ddl2; EXECUTE s2; DEALLOCATE PREPARE s2;

SET @cfg = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'config' AND COLUMN_NAME = 'created_at'
);
SET @ddl3 = IF(@cfg = 0,
  'ALTER TABLE config ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER config_value',
  'SELECT 1');
PREPARE s3 FROM @ddl3; EXECUTE s3; DEALLOCATE PREPARE s3;
