-- =============================================================
-- SwiftMatch — Full MySQL Schema
-- Covers: auth, profiles, matching, chats, groups, feeds,
--         notifications, admin, analytics, polls, icebreakers
-- =============================================================

-- -----------------------------------------------------------
-- 1. AUTH & USERS
-- -----------------------------------------------------------
CREATE TABLE users (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email               VARCHAR(255) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  role                ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified_at   TIMESTAMP NULL,
  verification_token  VARCHAR(64) NULL,
  reset_token         VARCHAR(64) NULL,
  reset_token_expires TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login          TIMESTAMP NULL,
  phone               VARCHAR(20) NULL AFTER email,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. USER PROFILES
-- -----------------------------------------------------------
CREATE TABLE user_profiles (
  id              INT UNSIGNED PRIMARY KEY,
  display_name    VARCHAR(100) NOT NULL,
  name            VARCHAR(100) DEFAULT NULL,
  age             TINYINT UNSIGNED NOT NULL CHECK (age >= 16 AND age <= 120),
  bio             TEXT,
  avatar_url      VARCHAR(500),
  gender          ENUM('male','female','other') DEFAULT NULL,
  looking_for     ENUM('male','female','both') DEFAULT NULL,
  dating_goal     VARCHAR(100),
  height          SMALLINT UNSIGNED CHECK (height >= 100 AND height <= 250),
  city            VARCHAR(100),
  country         VARCHAR(100),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  location        POINT SRID 4326 DEFAULT NULL,
  zodiac          VARCHAR(50),
  circadian       ENUM('lark','owl','flexible') DEFAULT NULL,
  attachment_style ENUM('secure','anxious','avoidant') DEFAULT NULL,
  education       VARCHAR(100),
  super_likes     INT UNSIGNED NOT NULL DEFAULT 0,
  boost_until     DATETIME NULL,
  online          BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profiles_city (city),
  INDEX idx_profiles_age (age),
  INDEX idx_profiles_online (online),
  INDEX idx_profiles_gender_looking (gender, looking_for),
  SPATIAL INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 3. USER PHOTOS (gallery)
-- -----------------------------------------------------------
CREATE TABLE user_photos (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             INT UNSIGNED NOT NULL,
  url                 VARCHAR(500) NOT NULL,
  sort_order          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_avatar           BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status   ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  moderation_reason   VARCHAR(500) DEFAULT NULL,
  moderated_by        INT UNSIGNED DEFAULT NULL,
  moderated_at        TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_photos_user (user_id),
  INDEX idx_photos_moderation (moderation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 4. USER STORIES (video stories)
-- -----------------------------------------------------------
CREATE TABLE user_stories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  url         VARCHAR(500) NOT NULL,
  is_uploading BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_stories_user (user_id),
  INDEX idx_stories_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 5. INTERESTS (lookup table)
-- -----------------------------------------------------------
CREATE TABLE interests (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_ru   VARCHAR(100) NOT NULL,
  name_en   VARCHAR(100) NOT NULL,
  category  VARCHAR(50) NOT NULL,
  icon      VARCHAR(50) DEFAULT NULL,
  UNIQUE KEY uk_interest_names (name_ru, name_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 6. USER INTERESTS (many-to-many)
-- -----------------------------------------------------------
CREATE TABLE user_interests (
  user_id     INT UNSIGNED NOT NULL,
  interest_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, interest_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 7. LIKES (swipe right / super like)
-- -----------------------------------------------------------
CREATE TABLE likes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_user_id    INT UNSIGNED NOT NULL,
  to_user_id      INT UNSIGNED NOT NULL,
  type            ENUM('like','super_like') NOT NULL DEFAULT 'like',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_likes_pair (from_user_id, to_user_id),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_likes_to (to_user_id),
  INDEX idx_likes_from (from_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 8. MATCHES (mutual likes)
-- -----------------------------------------------------------
CREATE TABLE matches (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user1_id      INT UNSIGNED NOT NULL,
  user2_id      INT UNSIGNED NOT NULL,
  matched       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_matches_pair (user1_id, user2_id),
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_matches_user1 (user1_id),
  INDEX idx_matches_user2 (user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 9. CHATS (conversation threads)
-- -----------------------------------------------------------
CREATE TABLE chats (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  is_group        BOOLEAN NOT NULL DEFAULT FALSE,
  group_id        INT UNSIGNED DEFAULT NULL COMMENT 'FK to chat_groups if is_group=1',
  last_message    TEXT,
  last_sender_id  INT UNSIGNED DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (last_sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_chats_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 10. CHAT PARTICIPANTS (many-to-many)
-- -----------------------------------------------------------
CREATE TABLE chat_participants (
  chat_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  joined_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP NULL,
  PRIMARY KEY (chat_id, user_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_participants_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 11. MESSAGES
-- -----------------------------------------------------------
CREATE TABLE messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chat_id     INT UNSIGNED NOT NULL,
  sender_id   INT UNSIGNED NOT NULL,
  text        TEXT NOT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  reply_to    INT UNSIGNED DEFAULT NULL,
  read_by     JSON DEFAULT NULL COMMENT 'Array of user_ids who read this message',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL,
  INDEX idx_messages_chat (chat_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_created (chat_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration for existing DBs:
-- ALTER TABLE messages ADD COLUMN read_by JSON DEFAULT NULL COMMENT 'Array of user_ids who read this message';

-- -----------------------------------------------------------
-- 12. MESSAGE REACTIONS
-- -----------------------------------------------------------
CREATE TABLE message_reactions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  message_id  INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  emoji       VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaction (message_id, user_id, emoji),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reactions_message (message_id),
  INDEX idx_reactions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 13. GROUP CATEGORIES
-- -----------------------------------------------------------
CREATE TABLE group_categories (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_ru   VARCHAR(100) NOT NULL,
  name_en   VARCHAR(100) NOT NULL,
  icon      VARCHAR(50) NOT NULL,
  img       VARCHAR(500) NOT NULL,
  hint      VARCHAR(255) DEFAULT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 13. CHAT GROUPS (subgroups within categories)
-- -----------------------------------------------------------
CREATE TABLE chat_groups (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id   INT UNSIGNED NOT NULL,
  name_ru       VARCHAR(100) NOT NULL,
  name_en       VARCHAR(100) NOT NULL,
  description   TEXT,
  img           VARCHAR(500) DEFAULT NULL,
  members_count INT UNSIGNED NOT NULL DEFAULT 0,
  online_count  INT UNSIGNED NOT NULL DEFAULT 0,
  href          VARCHAR(200) DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES group_categories(id) ON DELETE CASCADE,
  INDEX idx_groups_category (category_id),
  INDEX idx_groups_name (name_ru, name_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 14. GROUP MEMBERS (users who joined a group)
-- -----------------------------------------------------------
CREATE TABLE group_members (
  group_id    INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  joined_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_members_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 15. GROUP POSTS (posts in group/community feeds)
-- -----------------------------------------------------------
CREATE TABLE group_posts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id      INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  text          TEXT,
  images        JSON DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_posts_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE group_post_likes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id       INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_group_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_likes_post (post_id),
  INDEX idx_group_likes_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE group_post_comments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id       INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  text          TEXT,
  image_url     VARCHAR(500) DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_comments_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 16. FEED POSTS (category feeds, football feed, etc.)
-- -----------------------------------------------------------
CREATE TABLE posts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  feed_type     VARCHAR(50) NOT NULL DEFAULT 'general' COMMENT 'general, football, music, etc.',
  text          TEXT NOT NULL,
  likes_count   INT UNSIGNED NOT NULL DEFAULT 0,
  comments_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_liked      BOOLEAN NOT NULL DEFAULT FALSE,
  is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_feed (feed_type, created_at),
  INDEX idx_posts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 16. POST IMAGES
-- -----------------------------------------------------------
CREATE TABLE post_images (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id   INT UNSIGNED NOT NULL,
  url       VARCHAR(500) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post_images_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 17. POST COMMENTS
-- -----------------------------------------------------------
CREATE TABLE post_comments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  text        TEXT NOT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 18. POST LIKES
-- -----------------------------------------------------------
CREATE TABLE post_likes (
  post_id   INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 19. NOTIFICATIONS
-- -----------------------------------------------------------
CREATE TABLE notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  type        VARCHAR(50) NOT NULL COMMENT 'like, match, message, visit, etc.',
  payload     JSON NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read),
  INDEX idx_notifications_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 20. REPORTS
-- -----------------------------------------------------------
CREATE TABLE reports (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id   INT UNSIGNED NOT NULL,
  reported_id   INT UNSIGNED NOT NULL,
  reason        VARCHAR(200) NOT NULL,
  description   TEXT,
  status        ENUM('pending','reviewed','dismissed','action_taken') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_status (status),
  INDEX idx_reports_reported (reported_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 21. CONTEST ENTRIES
-- -----------------------------------------------------------
CREATE TABLE contest_entries (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  photo_url   VARCHAR(500) NOT NULL,
  votes       INT UNSIGNED NOT NULL DEFAULT 0,
  `rank`      SMALLINT UNSIGNED DEFAULT NULL,
  gender      ENUM('male','female') NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_contest_votes (votes DESC),
  INDEX idx_contest_gender (gender)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 22. ACTIVITY LOG (profile visits)
-- -----------------------------------------------------------
CREATE TABLE activity_log (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL COMMENT 'who performed the action',
  target_id     INT UNSIGNED DEFAULT NULL COMMENT 'target user if applicable',
  action_type   VARCHAR(50) NOT NULL COMMENT 'visit, like, match, etc.',
  metadata      JSON DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_activity_user (user_id, created_at),
  INDEX idx_activity_target (target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 23. INVITES (date invitations)
-- -----------------------------------------------------------
CREATE TABLE invites (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_user_id INT UNSIGNED NOT NULL,
  to_user_id  INT UNSIGNED NOT NULL,
  invite_type ENUM('coffee','cinema','walk','dinner','other') NOT NULL,
  message     TEXT,
  status      ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invites_to (to_user_id, status),
  INDEX idx_invites_from (from_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 24. SAVED SEARCH FILTERS
-- -----------------------------------------------------------
CREATE TABLE saved_filters (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(100) DEFAULT NULL,
  age_min     TINYINT UNSIGNED DEFAULT 18,
  age_max     TINYINT UNSIGNED DEFAULT 60,
  distance_km SMALLINT UNSIGNED DEFAULT 50,
  city        VARCHAR(100) DEFAULT NULL,
  gender_pref ENUM('male','female','both') DEFAULT NULL,
  dating_goal VARCHAR(100) DEFAULT NULL,
  interests   JSON DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_filters_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 25. FEATURE FLAGS (admin config)
-- -----------------------------------------------------------
CREATE TABLE feature_flags (
  id                    TINYINT UNSIGNED PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  video_calls_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  ai_icebreakers_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ai_compatibility_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  groups_page_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  contest_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  show_ads              BOOLEAN NOT NULL DEFAULT FALSE,
  autosearch_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 26. CONTENT CONFIG (admin editable lists)
-- -----------------------------------------------------------
CREATE TABLE content_config (
  id            TINYINT UNSIGNED PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  interests     JSON NOT NULL,
  dating_goals  JSON NOT NULL,
  education     JSON NOT NULL,
  banned_words  JSON NOT NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 27. ICEBREAKER THEMES
-- -----------------------------------------------------------
CREATE TABLE icebreaker_themes (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_id    VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. romantic, funny, hobbies',
  icon      VARCHAR(50) NOT NULL DEFAULT 'Sparkles',
  color_class VARCHAR(50) DEFAULT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 28. ICEBREAKER QUESTIONS (per theme, dual language)
-- -----------------------------------------------------------
CREATE TABLE icebreaker_questions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  theme_id    INT UNSIGNED NOT NULL,
  text_ru     VARCHAR(300) NOT NULL,
  text_en     VARCHAR(300) NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (theme_id) REFERENCES icebreaker_themes(id) ON DELETE CASCADE,
  INDEX idx_icebreaker_theme (theme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 29. ICEBREAKER ANSWERS (predefined answers per question)
-- -----------------------------------------------------------
CREATE TABLE icebreaker_answers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL,
  text_ru     VARCHAR(200) NOT NULL,
  text_en     VARCHAR(200) NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES icebreaker_questions(id) ON DELETE CASCADE,
  INDEX idx_icebreaker_answers_q (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 30. POLL QUESTIONS
-- -----------------------------------------------------------
CREATE TABLE poll_questions (
  id        VARCHAR(50) PRIMARY KEY COMMENT 'e.g. coffee_tea, morning_night',
  text_ru   VARCHAR(200) NOT NULL,
  text_en   VARCHAR(200) NOT NULL,
  options   TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT 'number of answer options'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 31. POLL ANSWERS (user votes)
-- -----------------------------------------------------------
CREATE TABLE poll_answers (
  user_id     INT UNSIGNED NOT NULL,
  question_id VARCHAR(50) NOT NULL,
  answer_index TINYINT UNSIGNED NOT NULL,
  answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES poll_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 32. USER SESSIONS (auth tokens)
-- -----------------------------------------------------------
CREATE TABLE user_sessions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(500) NOT NULL UNIQUE,
  ip_address  VARCHAR(45) DEFAULT NULL,
  user_agent  VARCHAR(500) DEFAULT NULL,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_token (token),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 33. ANALYTICS EVENTS (admin tracking)
-- -----------------------------------------------------------
CREATE TABLE analytics_events (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type  VARCHAR(100) NOT NULL COMMENT 'registration, match, premium_purchase, etc.',
  user_id     INT UNSIGNED DEFAULT NULL,
  metadata    JSON DEFAULT NULL,
  ip_address  VARCHAR(45) DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_analytics_type (event_type, created_at),
  INDEX idx_analytics_user (user_id),
  INDEX idx_analytics_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 34. SUBSCRIPTIONS / PREMIUM
-- -----------------------------------------------------------
CREATE TABLE subscriptions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  tier          ENUM('plus','gold','platinum') NOT NULL,
  duration_months TINYINT UNSIGNED NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  started_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subscriptions_user (user_id),
  INDEX idx_subscriptions_active (is_active, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 35. MODERATION LOG (admin actions)
-- -----------------------------------------------------------
CREATE TABLE moderation_log (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT UNSIGNED NOT NULL,
  target_user_id INT UNSIGNED NOT NULL,
  action        VARCHAR(100) NOT NULL COMMENT 'ban, warn, delete_content, etc.',
  reason        TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_modlog_admin (admin_id),
  INDEX idx_modlog_target (target_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 36. USER BLOCK LIST
-- -----------------------------------------------------------
CREATE TABLE user_blocks (
  blocker_id  INT UNSIGNED NOT NULL,
  blocked_id  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 37. USER TITLES / BADGES (earned)
-- -----------------------------------------------------------
CREATE TABLE user_titles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  title_key   VARCHAR(50) NOT NULL COMMENT 'rookie, romantic, party, king',
  earned_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_title (user_id, title_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_titles_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 38. COMPATIBILITY SCORES (attachment style matching)
-- -----------------------------------------------------------
CREATE TABLE compatibility_scores (
  style_a     ENUM('secure','anxious','avoidant') NOT NULL,
  style_b     ENUM('secure','anxious','avoidant') NOT NULL,
  score       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (style_a, style_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 39. CAMPAIGNS (admin push/email campaigns)
-- -----------------------------------------------------------
CREATE TABLE campaigns (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT UNSIGNED NOT NULL,
  title         VARCHAR(255) NOT NULL,
  body          TEXT NOT NULL,
  target        ENUM('all','premium','new') NOT NULL DEFAULT 'all',
  channel       ENUM('push','email') NOT NULL DEFAULT 'push',
  status        ENUM('draft','scheduled','sent') NOT NULL DEFAULT 'draft',
  delivered     INT UNSIGNED NOT NULL DEFAULT 0,
  opened        INT UNSIGNED NOT NULL DEFAULT 0,
  clicked       INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_campaigns_admin (admin_id),
  INDEX idx_campaigns_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 40. PUSH SUBSCRIPTIONS (Web push)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  endpoint      TEXT NOT NULL,
  p256dh        VARCHAR(255) NOT NULL,
  auth          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_push_user (user_id, endpoint(255)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 41. CONFIG (key-value for pricing, ads settings, etc.)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS config (
  config_key    VARCHAR(50) PRIMARY KEY,
  config_value  JSON NOT NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- SEED DATA
-- -----------------------------------------------------------

-- -----------------------------------------------------------
-- 42. REFRESH TOKENS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  token         VARCHAR(255) NOT NULL UNIQUE,
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 43. SMS VERIFICATION
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_verification (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  phone       VARCHAR(20) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  verified    TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  UNIQUE KEY uk_sms_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature flags (single row)
INSERT INTO feature_flags (id) VALUES (1) ON DUPLICATE KEY UPDATE id=id;

-- Content config (single row)
INSERT INTO content_config (id, interests, dating_goals, education, banned_words)
VALUES (1,
  '["sport","music","movies","books","travel","cooking","games","art","photography","tech","fashion","dance","animals","volunteering","politics","psychology","philosophy","yoga","meditation","gardening","cars","science","history","architecture"]',
  '["serious_relationship","dating","just_talk","new_friends","one_night","family_kids","travel","co_living","penpal","no_commitment"]',
  '["secondary","vocational","incomplete_higher","higher","bachelor","master","candidate","doctor"]',
  '["спам","мошенничество","фейк","скам","обман","реклама","казино","ставки","заработок","крипта","инвестиции","наркотики","закладки","продажа","куплю","порно","секс","Хуй","Пизда"]'
) ON DUPLICATE KEY UPDATE id=id;

-- Compatibility scores
INSERT INTO compatibility_scores (style_a, style_b, score) VALUES
  ('secure', 'secure', 2),
  ('secure', 'anxious', 2),
  ('secure', 'avoidant', 2),
  ('anxious', 'secure', 2),
  ('anxious', 'anxious', 1),
  ('anxious', 'avoidant', 0),
  ('avoidant', 'secure', 2),
  ('avoidant', 'anxious', 0),
  ('avoidant', 'avoidant', 1)
ON DUPLICATE KEY UPDATE score=VALUES(score);
