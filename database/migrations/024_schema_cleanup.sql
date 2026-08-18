-- Migration 024: schema cleanup + chat group index
-- (1) drop dead is_liked/is_bookmarked from posts — server never reads them
--     (post_likes/post_likes tables are legacy; likes computed via EXISTS on group_post_likes)
-- (2) index on chats.group_id for group chat queries

SET @drop_liked := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'is_liked'
);
SET @drop_bookmarked := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'is_bookmarked'
);
SET @add_chat_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chats' AND INDEX_NAME = 'idx_chats_group'
);

SET @sql = IF(@drop_liked = 1, 'ALTER TABLE posts DROP COLUMN is_liked', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(@drop_bookmarked = 1, 'ALTER TABLE posts DROP COLUMN is_bookmarked', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(@add_chat_idx = 0, 'CREATE INDEX idx_chats_group ON chats (group_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
