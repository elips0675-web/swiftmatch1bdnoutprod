-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: swiftmatch
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL COMMENT 'who performed the action',
  `target_id` int unsigned DEFAULT NULL COMMENT 'target user if applicable',
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'visit, like, match, etc.',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_user` (`user_id`,`created_at`),
  KEY `idx_activity_target` (`target_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_events`
--

DROP TABLE IF EXISTS `analytics_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'registration, match, premium_purchase, etc.',
  `user_id` int unsigned DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_analytics_type` (`event_type`,`created_at`),
  KEY `idx_analytics_user` (`user_id`),
  KEY `idx_analytics_date` (`created_at`),
  CONSTRAINT `analytics_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_events`
--

LOCK TABLES `analytics_events` WRITE;
/*!40000 ALTER TABLE `analytics_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `target` enum('all','premium','new') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `channel` enum('push','email') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'push',
  `status` enum('draft','scheduled','sent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `delivered` int unsigned NOT NULL DEFAULT '0',
  `opened` int unsigned NOT NULL DEFAULT '0',
  `clicked` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaigns_admin` (`admin_id`),
  KEY `idx_campaigns_status` (`status`),
  CONSTRAINT `campaigns_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
INSERT INTO `campaigns` VALUES (1,1,'Test campaign','Test body','all','push','sent',0,0,0,'2026-07-15 09:27:21');
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_groups`
--

DROP TABLE IF EXISTS `chat_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_groups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int unsigned NOT NULL,
  `name_ru` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `img` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `members_count` int unsigned NOT NULL DEFAULT '0',
  `online_count` int unsigned NOT NULL DEFAULT '0',
  `href` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_groups_category` (`category_id`),
  KEY `idx_groups_name` (`name_ru`,`name_en`),
  CONSTRAINT `chat_groups_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `group_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_groups`
--

LOCK TABLES `chat_groups` WRITE;
/*!40000 ALTER TABLE `chat_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_participants`
--

DROP TABLE IF EXISTS `chat_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_participants` (
  `chat_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`chat_id`,`user_id`),
  KEY `idx_chat_participants_user` (`user_id`),
  CONSTRAINT `chat_participants_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_participants`
--

LOCK TABLES `chat_participants` WRITE;
/*!40000 ALTER TABLE `chat_participants` DISABLE KEYS */;
INSERT INTO `chat_participants` VALUES (1,2,'2026-06-11 05:32:51','2026-06-26 06:07:18'),(1,3,'2026-06-11 05:32:51',NULL),(2,2,'2026-06-11 05:32:51','2026-07-14 15:48:55'),(2,3,'2026-06-25 09:35:27',NULL),(26,2,'2026-06-26 06:10:19','2026-07-15 09:31:37'),(26,22,'2026-06-26 06:10:19',NULL),(27,2,'2026-06-26 06:10:47','2026-07-15 09:34:01'),(27,20,'2026-06-26 06:10:47',NULL),(28,2,'2026-06-26 06:21:04','2026-07-15 05:37:28'),(28,19,'2026-06-26 06:21:04',NULL);
/*!40000 ALTER TABLE `chat_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chats`
--

DROP TABLE IF EXISTS `chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chats` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `is_group` tinyint(1) NOT NULL DEFAULT '0',
  `group_id` int unsigned DEFAULT NULL COMMENT 'FK to chat_groups if is_group=1',
  `last_message` text COLLATE utf8mb4_unicode_ci,
  `last_sender_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `last_sender_id` (`last_sender_id`),
  KEY `idx_chats_updated` (`updated_at`),
  CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`last_sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chats`
--

LOCK TABLES `chats` WRITE;
/*!40000 ALTER TABLE `chats` DISABLE KEYS */;
INSERT INTO `chats` VALUES (1,0,NULL,'Тоже хорошо! Гуляла сегодня в парке',2,'2026-06-11 05:32:51','2026-06-25 09:35:57'),(2,0,NULL,NULL,NULL,'2026-06-11 05:32:51','2026-06-25 12:42:55'),(13,0,NULL,NULL,NULL,'2026-06-25 12:51:57','2026-06-25 12:51:57'),(14,0,NULL,NULL,NULL,'2026-06-25 12:52:02','2026-06-25 12:52:02'),(15,0,NULL,NULL,NULL,'2026-06-26 05:57:29','2026-06-26 05:57:29'),(16,0,NULL,NULL,NULL,'2026-06-26 06:00:33','2026-06-26 06:00:33'),(17,0,NULL,NULL,NULL,'2026-06-26 06:00:44','2026-06-26 06:00:44'),(18,0,NULL,NULL,NULL,'2026-06-26 06:01:46','2026-06-26 06:01:46'),(19,0,NULL,NULL,NULL,'2026-06-26 06:02:10','2026-06-26 06:02:10'),(20,0,NULL,NULL,NULL,'2026-06-26 06:07:17','2026-06-26 06:07:17'),(21,0,NULL,NULL,NULL,'2026-06-26 06:08:11','2026-06-26 06:08:11'),(22,0,NULL,NULL,NULL,'2026-06-26 06:08:30','2026-06-26 06:08:30'),(23,0,NULL,NULL,NULL,'2026-06-26 06:09:12','2026-06-26 06:09:12'),(24,0,NULL,NULL,NULL,'2026-06-26 06:09:16','2026-06-26 06:09:16'),(25,0,NULL,NULL,NULL,'2026-06-26 06:09:24','2026-06-26 06:09:24'),(26,0,NULL,NULL,NULL,'2026-06-26 06:10:19','2026-06-26 06:10:19'),(27,0,NULL,NULL,NULL,'2026-06-26 06:10:47','2026-06-26 06:10:47'),(28,0,NULL,NULL,NULL,'2026-06-26 06:21:04','2026-06-26 06:21:04');
/*!40000 ALTER TABLE `chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compatibility_scores`
--

DROP TABLE IF EXISTS `compatibility_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compatibility_scores` (
  `style_a` enum('secure','anxious','avoidant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `style_b` enum('secure','anxious','avoidant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`style_a`,`style_b`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compatibility_scores`
--

LOCK TABLES `compatibility_scores` WRITE;
/*!40000 ALTER TABLE `compatibility_scores` DISABLE KEYS */;
INSERT INTO `compatibility_scores` VALUES ('secure','secure',2),('secure','anxious',2),('secure','avoidant',2),('anxious','secure',2),('anxious','anxious',1),('anxious','avoidant',0),('avoidant','secure',2),('avoidant','anxious',0),('avoidant','avoidant',1);
/*!40000 ALTER TABLE `compatibility_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `config_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` json NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_config`
--

DROP TABLE IF EXISTS `content_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content_config` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `interests` json NOT NULL,
  `dating_goals` json NOT NULL,
  `education` json NOT NULL,
  `banned_words` json NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `content_config_chk_1` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_config`
--

LOCK TABLES `content_config` WRITE;
/*!40000 ALTER TABLE `content_config` DISABLE KEYS */;
INSERT INTO `content_config` VALUES (1,'[\"cars\", \"architecture\", \"volunteering\", \"games\", \"art\", \"history\", \"yoga\", \"books\", \"cooking\", \"meditation\", \"fashion\", \"music\", \"science\", \"pets\", \"psychology\", \"travel\", \"gardening\", \"sport\", \"dance\", \"tech\", \"philosophy\", \"movies\", \"photography\"]','[\"serious_relationship\", \"dating\", \"just_talk\", \"new_friends\", \"one_night\", \"family_kids\", \"travel\", \"co_living\", \"penpal\", \"no_commitment\"]','[\"secondary\", \"vocational\", \"incomplete_higher\", \"higher\", \"bachelor\", \"master\", \"candidate\", \"doctor\"]','[\"спам\", \"мошенничество\", \"фейк\", \"скам\", \"развод\", \"обман\", \"реклама\", \"казино\", \"ставки\", \"заработок\", \"крипта\", \"инвестиции\", \"наркотики\", \"закладки\", \"продажа\", \"куплю\", \"порно\", \"секс\"]','2026-06-25 12:22:36');
/*!40000 ALTER TABLE `content_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contest_entries`
--

DROP TABLE IF EXISTS `contest_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `votes` int unsigned NOT NULL DEFAULT '0',
  `rank` smallint unsigned DEFAULT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_contest_votes` (`votes` DESC),
  KEY `idx_contest_gender` (`gender`),
  CONSTRAINT `contest_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contest_entries`
--

LOCK TABLES `contest_entries` WRITE;
/*!40000 ALTER TABLE `contest_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `contest_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feature_flags`
--

DROP TABLE IF EXISTS `feature_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feature_flags` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `video_calls_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `ai_icebreakers_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `ai_compatibility_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `groups_page_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `contest_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `show_ads` tinyint(1) NOT NULL DEFAULT '0',
  `autosearch_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `feature_flags_chk_1` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feature_flags`
--

LOCK TABLES `feature_flags` WRITE;
/*!40000 ALTER TABLE `feature_flags` DISABLE KEYS */;
INSERT INTO `feature_flags` VALUES (1,1,0,0,0,0,0,0,'2026-07-16 09:12:14');
/*!40000 ALTER TABLE `feature_flags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_categories`
--

DROP TABLE IF EXISTS `group_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name_ru` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_categories`
--

LOCK TABLES `group_categories` WRITE;
/*!40000 ALTER TABLE `group_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_members` (
  `group_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`,`user_id`),
  KEY `idx_group_members_user` (`user_id`),
  CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `chat_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_members`
--

LOCK TABLES `group_members` WRITE;
/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_post_comments`
--

DROP TABLE IF EXISTS `group_post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_post_comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_group_comments_post` (`post_id`),
  CONSTRAINT `group_post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `group_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_post_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_post_comments`
--

LOCK TABLES `group_post_comments` WRITE;
/*!40000 ALTER TABLE `group_post_comments` DISABLE KEYS */;
INSERT INTO `group_post_comments` VALUES (1,2,2,'ывававыа',NULL,'2026-06-25 12:08:48');
/*!40000 ALTER TABLE `group_post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_post_likes`
--

DROP TABLE IF EXISTS `group_post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_post_likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_group_like` (`post_id`,`user_id`),
  KEY `idx_group_likes_post` (`post_id`),
  KEY `idx_group_likes_user` (`user_id`),
  CONSTRAINT `group_post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `group_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_post_likes`
--

LOCK TABLES `group_post_likes` WRITE;
/*!40000 ALTER TABLE `group_post_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_posts`
--

DROP TABLE IF EXISTS `group_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_posts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci,
  `images` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_group_posts_group` (`group_id`),
  CONSTRAINT `group_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_posts`
--

LOCK TABLES `group_posts` WRITE;
/*!40000 ALTER TABLE `group_posts` DISABLE KEYS */;
INSERT INTO `group_posts` VALUES (2,101,2,'Кто куда едет этим летом? Думаю посетить Бали!','[]','2026-06-25 09:36:03','2026-06-25 09:36:03'),(3,101,3,'Я в Японию собираюсь, виза уже готова','[]','2026-06-25 09:36:03','2026-06-25 09:36:03'),(4,102,2,'Кто занимается бегом? Какие кроссовки посоветуете?','[]','2026-06-25 09:36:03','2026-06-25 09:36:03'),(5,103,2,'ммммм','[]','2026-06-25 12:21:14','2026-06-25 12:21:14'),(6,101,2,'Тестовый пост из API!','[]','2026-06-25 12:52:15','2026-06-25 12:52:15');
/*!40000 ALTER TABLE `group_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `icebreaker_answers`
--

DROP TABLE IF EXISTS `icebreaker_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `icebreaker_answers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int unsigned NOT NULL,
  `text_ru` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_icebreaker_answers_q` (`question_id`),
  CONSTRAINT `icebreaker_answers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `icebreaker_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `icebreaker_answers`
--

LOCK TABLES `icebreaker_answers` WRITE;
/*!40000 ALTER TABLE `icebreaker_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `icebreaker_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `icebreaker_questions`
--

DROP TABLE IF EXISTS `icebreaker_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `icebreaker_questions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `theme_id` int unsigned NOT NULL,
  `text_ru` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text_en` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_icebreaker_theme` (`theme_id`),
  CONSTRAINT `icebreaker_questions_ibfk_1` FOREIGN KEY (`theme_id`) REFERENCES `icebreaker_themes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `icebreaker_questions`
--

LOCK TABLES `icebreaker_questions` WRITE;
/*!40000 ALTER TABLE `icebreaker_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `icebreaker_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `icebreaker_themes`
--

DROP TABLE IF EXISTS `icebreaker_themes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `icebreaker_themes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `key_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g. romantic, funny, hobbies',
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sparkles',
  `color_class` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_id` (`key_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `icebreaker_themes`
--

LOCK TABLES `icebreaker_themes` WRITE;
/*!40000 ALTER TABLE `icebreaker_themes` DISABLE KEYS */;
/*!40000 ALTER TABLE `icebreaker_themes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interests`
--

DROP TABLE IF EXISTS `interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name_ru` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_interest_names` (`name_ru`,`name_en`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interests`
--

LOCK TABLES `interests` WRITE;
/*!40000 ALTER TABLE `interests` DISABLE KEYS */;
INSERT INTO `interests` VALUES (1,'Спорт','Sport','sport','Dumbbell'),(2,'Музыка','Music','music','Music'),(3,'Кино','Movies','movies','Film'),(4,'Книги','Books','books','BookOpen'),(5,'Путешествия','Travel','travel','Globe'),(6,'Кулинария','Cooking','cooking','ChefHat'),(7,'Игры','Games','games','Gamepad2'),(8,'Искусство','Art','art','Palette'),(9,'Фотография','Photography','photography','Camera'),(10,'Технологии','Tech','tech','Cpu'),(11,'Мода','Fashion','fashion','Shirt'),(12,'Танцы','Dance','dance','Music'),(13,'Животные','Animals','animals','Dog'),(14,'Волонтерство','Volunteering','volunteering','Heart'),(15,'Политика','Politics','politics','Briefcase'),(16,'Психология','Psychology','psychology','Brain'),(17,'Философия','Philosophy','philosophy','BookOpen'),(18,'Йога','Yoga','yoga','HeartPulse'),(19,'Медитация','Meditation','meditation','Sparkles'),(20,'Садоводство','Gardening','gardening','Flower'),(21,'Автомобили','Cars','cars','Car'),(22,'Наука','Science','science','FlaskConical'),(23,'История','History','history','Scroll'),(24,'Архитектура','Architecture','architecture','Building'),(25,'Питомцы','Pets','pets','Dog');
/*!40000 ALTER TABLE `interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invites`
--

DROP TABLE IF EXISTS `invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invites` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `from_user_id` int unsigned NOT NULL,
  `to_user_id` int unsigned NOT NULL,
  `invite_type` enum('coffee','cinema','walk','dinner','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','accepted','declined','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invites_to` (`to_user_id`,`status`),
  KEY `idx_invites_from` (`from_user_id`),
  CONSTRAINT `invites_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invites_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invites`
--

LOCK TABLES `invites` WRITE;
/*!40000 ALTER TABLE `invites` DISABLE KEYS */;
/*!40000 ALTER TABLE `invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `from_user_id` int unsigned NOT NULL,
  `to_user_id` int unsigned NOT NULL,
  `type` enum('like','super_like') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'like',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_likes_pair` (`from_user_id`,`to_user_id`),
  KEY `idx_likes_to` (`to_user_id`),
  KEY `idx_likes_from` (`from_user_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (1,2,3,'like','2026-06-11 05:31:38'),(2,2,6,'like','2026-06-11 05:31:40'),(3,2,7,'like','2026-06-11 05:31:42'),(4,2,8,'like','2026-06-11 05:31:43'),(5,4,5,'like','2026-07-16 09:04:24'),(6,5,4,'like','2026-07-16 09:04:24');
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matches` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user1_id` int unsigned NOT NULL,
  `user2_id` int unsigned NOT NULL,
  `matched` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_matches_pair` (`user1_id`,`user2_id`),
  KEY `idx_matches_user1` (`user1_id`),
  KEY `idx_matches_user2` (`user2_id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
INSERT INTO `matches` VALUES (1,4,5,1,'2026-07-16 09:04:24');
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_reactions`
--

DROP TABLE IF EXISTS `message_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_reactions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `message_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `emoji` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reaction` (`message_id`,`user_id`,`emoji`),
  KEY `idx_reactions_message` (`message_id`),
  KEY `idx_reactions_user` (`user_id`),
  CONSTRAINT `message_reactions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_reactions`
--

LOCK TABLES `message_reactions` WRITE;
/*!40000 ALTER TABLE `message_reactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_reactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `chat_id` int unsigned NOT NULL,
  `sender_id` int unsigned NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reply_to` int unsigned DEFAULT NULL,
  `read_by` json DEFAULT NULL COMMENT 'Array of user_ids who read this message',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reply_to` (`reply_to`),
  KEY `idx_messages_chat` (`chat_id`),
  KEY `idx_messages_sender` (`sender_id`),
  KEY `idx_messages_created` (`chat_id`,`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`reply_to`) REFERENCES `messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,2,'Привет! Как дела?',NULL,NULL,NULL,'2026-06-25 09:35:28'),(2,1,3,'Привет! Всё отлично, как ты?',NULL,NULL,NULL,'2026-06-25 09:35:28'),(3,1,2,'Тоже хорошо! Гуляла сегодня в парке',NULL,NULL,NULL,'2026-06-25 09:35:28'),(4,1,2,'Привет! Как дела?',NULL,NULL,NULL,'2026-06-25 09:35:57'),(5,1,3,'Привет! Всё отлично, как ты?',NULL,NULL,NULL,'2026-06-25 09:35:57'),(6,1,2,'Тоже хорошо! Гуляла сегодня в парке',NULL,NULL,NULL,'2026-06-25 09:35:57');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `moderation_log`
--

DROP TABLE IF EXISTS `moderation_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `moderation_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int unsigned NOT NULL,
  `target_user_id` int unsigned NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ban, warn, delete_content, etc.',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_modlog_admin` (`admin_id`),
  KEY `idx_modlog_target` (`target_user_id`),
  CONSTRAINT `moderation_log_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `moderation_log_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moderation_log`
--

LOCK TABLES `moderation_log` WRITE;
/*!40000 ALTER TABLE `moderation_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `moderation_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'like, match, message, visit, etc.',
  `payload` json NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  KEY `idx_notifications_created` (`user_id`,`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:04:24'),(2,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:04:24'),(3,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:04:37'),(4,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:04:37'),(5,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:07:26'),(6,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:07:26'),(7,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:07:36'),(8,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:07:36'),(9,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:09:34'),(10,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:09:34'),(11,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:09:49'),(12,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:09:49'),(13,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:10:30'),(14,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:10:30'),(15,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:10:42'),(16,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:10:42'),(17,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:12:02'),(18,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:12:02'),(19,5,'like','{\"type\": \"like\", \"from_user_id\": 4}',0,'2026-07-16 09:12:14'),(20,4,'like','{\"type\": \"like\", \"from_user_id\": 5}',0,'2026-07-16 09:12:14');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poll_answers`
--

DROP TABLE IF EXISTS `poll_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poll_answers` (
  `user_id` int unsigned NOT NULL,
  `question_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer_index` tinyint unsigned NOT NULL,
  `answered_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`question_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `poll_answers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `poll_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `poll_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poll_answers`
--

LOCK TABLES `poll_answers` WRITE;
/*!40000 ALTER TABLE `poll_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `poll_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poll_questions`
--

DROP TABLE IF EXISTS `poll_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poll_questions` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g. coffee_tea, morning_night',
  `text_ru` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` tinyint unsigned NOT NULL DEFAULT '2' COMMENT 'number of answer options',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poll_questions`
--

LOCK TABLES `poll_questions` WRITE;
/*!40000 ALTER TABLE `poll_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `poll_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_comments_post` (`post_id`),
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_images`
--

DROP TABLE IF EXISTS `post_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int unsigned NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_post_images_post` (`post_id`),
  CONSTRAINT `post_images_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_images`
--

LOCK TABLES `post_images` WRITE;
/*!40000 ALTER TABLE `post_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `post_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `feed_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general' COMMENT 'general, football, music, etc.',
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `likes_count` int unsigned NOT NULL DEFAULT '0',
  `comments_count` int unsigned NOT NULL DEFAULT '0',
  `is_liked` tinyint(1) NOT NULL DEFAULT '0',
  `is_bookmarked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_posts_feed` (`feed_type`,`created_at`),
  KEY `idx_posts_user` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `push_subscriptions`
--

DROP TABLE IF EXISTS `push_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscriptions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `endpoint` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `p256dh` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_push_user` (`user_id`,`endpoint`(255)),
  CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `push_subscriptions`
--

LOCK TABLES `push_subscriptions` WRITE;
/*!40000 ALTER TABLE `push_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `push_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_refresh_user` (`user_id`),
  KEY `idx_refresh_token` (`token`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,2,'7ba7ca115d53bd3939d08812092db45723293dd07e1bde35f7d2c636f19a6108fb2b8bd458d64de6','2026-08-14 07:41:57','2026-07-15 07:41:57'),(2,2,'211480e58bee6e6225b8f2dd2e92072c756bd536e3f7961cf069d1a7eda355c0ae57d75b3708979d','2026-08-14 08:08:16','2026-07-15 08:08:16'),(3,2,'18e056d1888cd7353f3235e30f8dc5ca06c4c67e9452cfdd36fde372c2885e8a03e2524da70176ac','2026-08-14 08:08:16','2026-07-15 08:08:16'),(4,2,'13f64e905db499e13df299d8f24636df00829b8175b4fa3c8b4e4ab5f515eb24da075b588d6b6293','2026-08-14 08:08:16','2026-07-15 08:08:16'),(5,2,'e113300a99ab261dfb19967483a8b1777c802f85477be733eb9f430381fafb2c3850f12657f47974','2026-08-14 08:08:17','2026-07-15 08:08:17'),(6,2,'a49f9826b04d1e0ac4773e3cc378bb705474fc621b8efc7a0d2c6dd1ad17d7a7124c0f30ca7bafcd','2026-08-14 08:09:25','2026-07-15 08:09:25'),(7,27,'d88027c930100b5e472224b5897e60cdab680dcb9197c346472f88ee724753d9810e745c37355830','2026-08-14 08:19:21','2026-07-15 08:19:21'),(8,28,'85cbd54d19dc6b38f00f9f4fd05cd084322a341636f08e61be53ca3bacb2450c4f843e255fb172dc','2026-08-14 08:22:21','2026-07-15 08:22:21'),(9,2,'bcb8a254fc91e5e01ea2e34cc85ba6d97ee4c641ae3357ab9716160020075738f868ccecd5d22031','2026-08-14 09:23:06','2026-07-15 09:23:06'),(10,2,'5e3343e003f108578ace21260c85d2cb5128593df095311fe861013af3d735e1c01efbde5c43efa1','2026-08-14 09:23:18','2026-07-15 09:23:18'),(11,1,'5d7b124880bed855683d50fc3e0071ffd286f5c51b9f5553d1eb38e885767c085faeaaa8545ffda8','2026-08-14 09:27:21','2026-07-15 09:27:21'),(12,1,'d947da434206bd856f12fa10ce37f8e745976b209792d03ec5aef5a170f6da6cdd117545d0c84c90','2026-08-14 09:29:00','2026-07-15 09:29:00'),(13,1,'dc3b378bd2706ff38320aa772d7745c7e124374f23b2bbebb52a76f97de185e7c5b314050e131f4d','2026-08-14 09:32:36','2026-07-15 09:32:36'),(14,2,'6690fe1e2ce84d39d38707e38f59d240a656ee57abef5e27cd040f50461d1c0b8f9c040fa09834fd','2026-08-15 08:53:56','2026-07-16 08:53:56'),(15,1,'d1220be1d68ed2b4aa71542e9546f8242d0926d31ab48f0eb4da066b14547d01a7b229836fea5db5','2026-08-15 08:54:02','2026-07-16 08:54:02'),(16,4,'061efdb97210826df06f7f41e9c233efdb2f19858b6101b8dbe1a604788ae103bc26860d6ab8a8a5','2026-08-15 08:54:02','2026-07-16 08:54:02'),(17,5,'9419ea0fb3323fd275d4b103776b9a23021901416ae6ad85a823027faa07cf74d13da1deb488b121','2026-08-15 08:54:03','2026-07-16 08:54:03'),(18,4,'bff8047053e2e62065b9922f9c510488f4739f934780f7dd110f408b50f6812e84cf9cf9eb292a19','2026-08-15 08:54:06','2026-07-16 08:54:06'),(19,5,'861803df7b520c165d4919d836ff72618813acfc0915f1d6a40c953ef969b13e3a997d62862b06a5','2026-08-15 08:54:06','2026-07-16 08:54:06'),(20,29,'fc5f177516edc5028f057263dc880455c6acb358bee82b2f39d1f88de1a42d71afbb6d57ce6f75f8','2026-08-15 08:54:09','2026-07-16 08:54:09'),(21,29,'cfbbe6c1df9f11100f3152086d2fd4e438bb774c42b278284813c96ae94dc4e4d86fb9dbd6bc86fe','2026-08-15 08:54:12','2026-07-16 08:54:12'),(22,2,'6173a6a9e9df0f38c0a9a62090fd19a04d7eb5dd5d9fbcec452081b9185edd64bd6ed201ee026dbb','2026-08-15 09:04:17','2026-07-16 09:04:17'),(23,1,'a11de717e6268f57b54cc26aa8e28a0713fa82b05dc425f54ef68bcd42d488f872280de29379c275','2026-08-15 09:04:20','2026-07-16 09:04:20'),(24,4,'60658efc428a5a63b43fc276a5b64add490c6a5d609a8c8f0883f23556d6094e94708b43577da6a6','2026-08-15 09:04:20','2026-07-16 09:04:20'),(25,5,'d1d6223cd1b27911fa716b1f8e0c5379ea7fa522328326b6aab66d68dd950d4458d6c8ac5d93cd67','2026-08-15 09:04:21','2026-07-16 09:04:21'),(26,4,'aa7d414046022498f15ab98fcd507325516c40de7dbaaf4c4d752cc79f1a19715c7f8c67d0183ab3','2026-08-15 09:04:24','2026-07-16 09:04:24'),(27,5,'7f7b2252e200f3aec07a61633285e209123aa2f1a51c3398b00caaa214e99d8ef2db0b76398662f0','2026-08-15 09:04:24','2026-07-16 09:04:24'),(28,30,'f78fe65b43cec7cffe513f439be085fe38d072b508eb334a7d5079b9eb20d8d249af790c0cccf85f','2026-08-15 09:04:30','2026-07-16 09:04:30'),(29,30,'a8e6c45e2a6c6ee31805d0feb562a1be0a09c3396243c4816460479b2069f9161c073b8c598a570e','2026-08-15 09:04:32','2026-07-16 09:04:32'),(30,4,'2d7ef1eb314dab3de2d18f712dc4397640e52713126840c6bb094fa2fb0487573c9e77b8c58783c2','2026-08-15 09:04:37','2026-07-16 09:04:37'),(31,5,'353f54358b03ee8a2f506a82e240fac0ece8797de2abf62a813e8e1ba390af5552a30ea640e32e2f','2026-08-15 09:04:37','2026-07-16 09:04:37'),(32,1,'c3792dea61721f9d9ff44fe449e1c473b8cab39f082c9d2a8c28898ba7592787dd11cbfcb8671eb1','2026-08-15 09:04:39','2026-07-16 09:04:39'),(33,1,'a410dd4490ac5b8643b240dced6872b3ea8268aec380a5d9e6ae40ad9510db57edba9a96125ad904','2026-08-15 09:04:40','2026-07-16 09:04:40'),(34,1,'3a07bd62dcfa4924d1736b450e3753612851380896381f6ceceeb9a729b6a3a75fcc6de49703d1a4','2026-08-15 09:04:40','2026-07-16 09:04:40'),(35,2,'3b143cd44c40d9d1de06ce8f485146356cfb1e5c01f2983a7f3cdbd05c17f66ba65b093ea7157c6b','2026-08-15 09:06:50','2026-07-16 09:06:50'),(36,1,'71832c6128e79ef5254ee33d7888eedbc9cec6895b0a23599be1ff2cfd23c9e511a81c1176af7767','2026-08-15 09:06:51','2026-07-16 09:06:51'),(37,4,'4b0df9d10e1fd56c9066ea4b8f05efbecc1c3f08422cec445cf4c80565681a369caeda4ee938f691','2026-08-15 09:06:52','2026-07-16 09:06:52'),(38,5,'a6aac61445243eedf5a39fdef811a6d8d648dd30399f3eeac4529d94d397f2e72b6e8f474464d090','2026-08-15 09:06:52','2026-07-16 09:06:52'),(39,2,'d2fb45da375544bac15cae499d4d9653cd6172af2149f33f25c0933ad6135bbf6235c71c4156697e','2026-08-15 09:07:00','2026-07-16 09:07:00'),(40,1,'af969df37d94511eba1f94bc96583bf45e236619497a7350c1c43ef3c751986cc011779b680b000f','2026-08-15 09:07:00','2026-07-16 09:07:00'),(41,4,'d31933462267f314a72389b80f6648112391a055c243ae0daf80708de9b385266c3c3e5393e8f90c','2026-08-15 09:07:01','2026-07-16 09:07:01'),(42,5,'9ec6ab393ae08e67c8522ebed38f36b3b4f9967c11bf3ec09e3d1dc0be5b25d8a3f4b9ae0d677fde','2026-08-15 09:07:01','2026-07-16 09:07:01'),(43,2,'a131a7d07c95b5894b27c5bf1de0b86b8a02f48f19582ac11c035bbe2f72f3eb288b0f0d5344324d','2026-08-15 09:07:09','2026-07-16 09:07:09'),(44,1,'8cbae51740990f435b0a61603f31ef698280a65b54e4234f6c6e2ab585f2e114bb3914035de7b8b1','2026-08-15 09:07:09','2026-07-16 09:07:09'),(45,4,'7857efe1c9a60863dceaa2e0d5a66fe0cfa4e43a68e2bd353aa8bb5a8e28814d17de40fe4c05bb3f','2026-08-15 09:07:10','2026-07-16 09:07:10'),(46,5,'4ad090755d86dc74d9575c796c911f885f8f62857bb5391c4d483f03c76cb9d9323c5e7bdf7e1e39','2026-08-15 09:07:10','2026-07-16 09:07:10'),(47,2,'012cb0f78aae6f321be4ade46549aba1b0b546b2379231f3959e341284a2465eb6a4d6527aa3b874','2026-08-15 09:07:22','2026-07-16 09:07:22'),(48,1,'864634b31794da951a79b99e1b969ed2c9328e6d0b3b3003cf53fb295a7b3e48e1c66d9d7b23f6a2','2026-08-15 09:07:22','2026-07-16 09:07:22'),(49,4,'97e4a7aa80a44ac065d258d89134734d8394e84449d085f86c3ad5e4526d3671661400f828144550','2026-08-15 09:07:23','2026-07-16 09:07:23'),(50,5,'b899d5a7528371414babe41dccd8053241fa6164b9359db2ff7c7dfcbab483bb7e914c98d125e802','2026-08-15 09:07:23','2026-07-16 09:07:23'),(51,4,'3d4568882a011a2aeed2d77563a41f820d3f47eb903e4bec38095bb9c3fd9385243a274e3f440b50','2026-08-15 09:07:26','2026-07-16 09:07:26'),(52,5,'5005e196b223377a64936c27a48b14bda0f2ff837925c074e982adf6a98a064601c32344343d1392','2026-08-15 09:07:26','2026-07-16 09:07:26'),(53,31,'e8585a3d4e7ebe99c1536e2a88499349a66c410172029b40789444d9dcbe105876884110734a6d3a','2026-08-15 09:07:30','2026-07-16 09:07:30'),(54,31,'1f15def10cfba0d6d8c2ecc2945fc0f82893fa15d86b6576f711b6ec2fc0aba48e5b2578dcea88e2','2026-08-15 09:07:33','2026-07-16 09:07:33'),(55,4,'ae6471c850d0c432df8a2ce225db4002a2e9631f5c58467f0b764457fc31810f5a82b69efaa2afe5','2026-08-15 09:07:36','2026-07-16 09:07:36'),(56,5,'079f94cc0fa4c94253ad8562435d0cfdc693975c918dfd4515ea74c0f6532caa215957d60091216c','2026-08-15 09:07:36','2026-07-16 09:07:36'),(57,2,'d48462500b8fc0fe339fa9a7e6dde242288197eadbddfe98f725ce442b1b153820787223f2ae5cf6','2026-08-15 09:09:29','2026-07-16 09:09:29'),(58,1,'69fdcffd0b54b63ba134b7f7a8d1dfa90bc329428e1de415028b63302d21e3182d7252a706580ea5','2026-08-15 09:09:30','2026-07-16 09:09:30'),(59,4,'52e745c550c6a99c5a8d3eddcbe2ec6c282232b034d9a9f637a61a35240d4cb57cc8eea7236e7a6b','2026-08-15 09:09:30','2026-07-16 09:09:30'),(60,5,'df08c5660f4d27c4687ca6d8d7364b1013d173af147a3a5b9441fc00dbdbdbf1ac66502dd47945b8','2026-08-15 09:09:31','2026-07-16 09:09:31'),(61,4,'9a32210cfe6d792f12e5dfede54677223103da5041c94d333f3686c0eb21390d1ded0fca342b4f29','2026-08-15 09:09:34','2026-07-16 09:09:34'),(62,5,'2e4a179139525ff19dfbe1fd7e38ad18fddd9c6fadcdeaf82a86c6de147bbfe35af8bf6409cba481','2026-08-15 09:09:34','2026-07-16 09:09:34'),(63,32,'04ffbb09a1f753b1ae1c82ef54f7bdce8519d8e5497db144f11fa7390e4d14b65094d306fa0c6321','2026-08-15 09:09:40','2026-07-16 09:09:40'),(64,2,'94abf14ee82e7587b40767594ecee9ede45a908cb4592cfd418f383da7b2dfa58b0736ec947cb93a','2026-08-15 09:09:44','2026-07-16 09:09:44'),(65,32,'015f72b74ffc5198012fee3f9f45c965b3cd44a70cc598795dec06756e0a0b24526a585f60f8a5bd','2026-08-15 09:09:44','2026-07-16 09:09:44'),(66,4,'ae8d232235c990e49cb17a027ce31862d62783c3daf9bf9246a4005048cc6d5f4ed328b4fd635e16','2026-08-15 09:09:48','2026-07-16 09:09:48'),(67,5,'59e28c94fda24adc8000480a260d56852c38563ec1117bccf43dd4ee1acafba93a66931a73740120','2026-08-15 09:09:48','2026-07-16 09:09:48'),(68,1,'11db205367b5ed8ff4470c723b4b8124d6d4f42d473ecb7e7e48f18fc768032580ac1203e9bd972c','2026-08-15 09:09:49','2026-07-16 09:09:49'),(69,1,'485da5379d71176e77471a1f352c5a25ec349123d799ecc366adfce60dc6ac1602e78fb293490ec9','2026-08-15 09:09:49','2026-07-16 09:09:49'),(70,1,'b2f7d6a864da3da2b9af15d4647413733c8fc9a5cfb4a8ef7d1ca1a0c29b601427da9b266bdd9b79','2026-08-15 09:09:50','2026-07-16 09:09:50'),(71,1,'523420223c8cc50ff52e5b60c9a5a43979d2bf25bf76d16ab9ed1d68e25bb27015b67ea93314a4c8','2026-08-15 09:09:53','2026-07-16 09:09:53'),(72,2,'3090c12b587fa08d17950d83de5789f587a4aab473b1b9f1bed7757c66a401242572856a22d5fcf6','2026-08-15 09:10:25','2026-07-16 09:10:25'),(73,1,'f8754ae7a1177f6a2acd98d90599b7fd04a230722379016de76a1a7901a18932259dde98d85dec25','2026-08-15 09:10:26','2026-07-16 09:10:26'),(74,4,'0d9c6fd45821e25d6e6c11d6d1f18a05f47918bdfe4157c7b531ff6603b4a4661c036f7c060b4d92','2026-08-15 09:10:26','2026-07-16 09:10:26'),(75,5,'c5bdf0d927e8218d1fec06a2c61215038213991e6dfe8bdc3b62d9d5fcd1d6797583e5392a7d6a31','2026-08-15 09:10:27','2026-07-16 09:10:27'),(76,4,'3ffc430f623dd99287a499768ba09a16ef2b34cb26452fa233c7ae4ff88b66b03ed7cf7f7e30f878','2026-08-15 09:10:29','2026-07-16 09:10:29'),(77,5,'d3e6243f2d3633daa99c23cbcf8bffd412382053ed63bfb584bb4e75bba7c02040089fff66eec334','2026-08-15 09:10:30','2026-07-16 09:10:30'),(78,33,'847f7a30062d89a1240513044a90f36ccce632d3e474edd8613b9aefecf7e1e1cab4e8228e12443c','2026-08-15 09:10:37','2026-07-16 09:10:37'),(79,33,'fc45694bba27b99713d911227e787e08d012801939382d84e59b464ad73d6b3192bfb894edadde3d','2026-08-15 09:10:39','2026-07-16 09:10:39'),(80,2,'de4bd65764271e5c9eb136b12d9295f4c3a2525d30b35c6bd669dcd9becb6a521f48920d0c8290e5','2026-08-15 09:10:39','2026-07-16 09:10:39'),(81,4,'c884c68d912f00b2a2607c73e406cea2a8930a621a2f28b8cad717398bcb23c5393811233c977b4b','2026-08-15 09:10:42','2026-07-16 09:10:42'),(82,5,'7bd450cefc09c89c0c35bb59e14eca48a1bcfc6ac7cd3a5b6a890570bdcf93885c358e0e500f9c7a','2026-08-15 09:10:42','2026-07-16 09:10:42'),(83,2,'714eb0c6c78f969ad8a8c947ac778c71f18e0e2d3bf668d05b34901c71d6c021d566f0bdf68407b0','2026-08-15 09:11:57','2026-07-16 09:11:57'),(84,1,'5dc5d7c649b229b01145a84d8916be9a057979ba60abc9e2fcdc69c2ef17d4b140bfeb89cd369ddd','2026-08-15 09:11:58','2026-07-16 09:11:58'),(85,4,'7429b283ea69f0e51c9c92fe442d78c2f414c5b17b431adea61ad9428b07ae910af9a5c5045dd117','2026-08-15 09:11:59','2026-07-16 09:11:59'),(86,5,'e3b15a4554c6aceb7c2d70fbf93314fa11bb9390d40d6adb39ca9df6d611cdd4dde549be3941d6d0','2026-08-15 09:11:59','2026-07-16 09:11:59'),(87,4,'8c4f63904903a5e0bc0f6f78344d27f80bd2c7f341750d257ff390ecb835d6d69784f7c1f0fea903','2026-08-15 09:12:02','2026-07-16 09:12:02'),(88,5,'1d1f1508c9d4de64b7c4c1ac1fc416ba488407325af46de072a311d2ee87673dce150f990b747a73','2026-08-15 09:12:02','2026-07-16 09:12:02'),(89,34,'ddf4b05696f3b7b857fc6bc0412e6b87b9b7938a67faafea1f20fc9466067b885fe420f9cd8b8b0e','2026-08-15 09:12:07','2026-07-16 09:12:07'),(90,34,'56f3b35c525aa4bb19dcdde1c68ec21a4155b1426f3e36440a46c5af082605e8cc85c01306c0a403','2026-08-15 09:12:09','2026-07-16 09:12:09'),(91,2,'84e1ae904c677660e8fff37e4aea14b6753741410063073edc803b2f1492d7d822c93b6275ecbe38','2026-08-15 09:12:10','2026-07-16 09:12:10'),(92,4,'f8e8df83962b57167790f0363365d124957e120d2e69bef76cf0a59ae5e19e00203acf11533df66e','2026-08-15 09:12:13','2026-07-16 09:12:13'),(93,5,'47ec2679a9bfbf95445037ccd990b171752a321782289eb6333611de52cde4b04fe04ba7868fe977','2026-08-15 09:12:14','2026-07-16 09:12:14');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `reporter_id` int unsigned NOT NULL,
  `reported_id` int unsigned NOT NULL,
  `reason` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','reviewed','dismissed','action_taken') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reporter_id` (`reporter_id`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_reported` (`reported_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_filters`
--

DROP TABLE IF EXISTS `saved_filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_filters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age_min` tinyint unsigned DEFAULT '18',
  `age_max` tinyint unsigned DEFAULT '60',
  `distance_km` smallint unsigned DEFAULT '50',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender_pref` enum('male','female','both') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dating_goal` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interests` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_filters_user` (`user_id`),
  CONSTRAINT `saved_filters_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_filters`
--

LOCK TABLES `saved_filters` WRITE;
/*!40000 ALTER TABLE `saved_filters` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_filters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `tier` enum('plus','gold','platinum') COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_months` tinyint unsigned NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user` (`user_id`),
  KEY `idx_subscriptions_active` (`is_active`,`expires_at`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES (1,2,'plus',1,299.00,'2026-07-15 07:42:35','2026-08-15 07:42:35',1);
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_blocks`
--

DROP TABLE IF EXISTS `user_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_blocks` (
  `blocker_id` int unsigned NOT NULL,
  `blocked_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`blocker_id`,`blocked_id`),
  KEY `blocked_id` (`blocked_id`),
  CONSTRAINT `user_blocks_ibfk_1` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_blocks_ibfk_2` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_blocks`
--

LOCK TABLES `user_blocks` WRITE;
/*!40000 ALTER TABLE `user_blocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_interests`
--

DROP TABLE IF EXISTS `user_interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_interests` (
  `user_id` int unsigned NOT NULL,
  `interest_id` int unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`interest_id`),
  KEY `interest_id` (`interest_id`),
  CONSTRAINT `user_interests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_interests_ibfk_2` FOREIGN KEY (`interest_id`) REFERENCES `interests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_interests`
--

LOCK TABLES `user_interests` WRITE;
/*!40000 ALTER TABLE `user_interests` DISABLE KEYS */;
INSERT INTO `user_interests` VALUES (2,1),(3,1),(7,1),(9,1),(12,1),(13,1),(15,1),(16,1),(2,2),(3,2),(5,2),(6,2),(7,2),(11,2),(13,2),(14,2),(16,2),(2,3),(4,4),(2,5),(3,5),(7,5),(8,5),(9,5),(12,5),(14,5),(15,5),(3,6),(4,6),(5,6),(11,6),(12,6),(14,6),(16,6),(3,7),(4,8),(6,8),(10,8),(5,9),(6,9),(9,9),(10,9),(11,9),(13,9),(15,9),(2,10),(10,11),(8,18),(8,19),(2,21),(2,25);
/*!40000 ALTER TABLE `user_interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_photos`
--

DROP TABLE IF EXISTS `user_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_photos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  `is_avatar` tinyint(1) NOT NULL DEFAULT '0',
  `moderation_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `moderation_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moderated_by` int unsigned DEFAULT NULL,
  `moderated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `moderated_by` (`moderated_by`),
  KEY `idx_photos_user` (`user_id`),
  KEY `idx_photos_moderation` (`moderation_status`),
  CONSTRAINT `user_photos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_photos_ibfk_2` FOREIGN KEY (`moderated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_photos`
--

LOCK TABLES `user_photos` WRITE;
/*!40000 ALTER TABLE `user_photos` DISABLE KEYS */;
INSERT INTO `user_photos` VALUES (7,2,'/demo/people/anna.png',1,1,'pending',NULL,NULL,NULL,'2026-06-25 12:31:33'),(8,2,'/demo/people/elena.png',2,0,'pending',NULL,NULL,NULL,'2026-06-25 12:31:33'),(9,2,'/demo/people/sophia.png',3,0,'pending',NULL,NULL,NULL,'2026-06-25 12:31:33'),(10,3,'/demo/people/maxim.png',1,1,'pending',NULL,NULL,NULL,'2026-06-25 12:31:33'),(11,3,'/demo/people/artem.png',2,0,'pending',NULL,NULL,NULL,'2026-06-25 12:31:33'),(12,3,'/demo/people/ivan.png',3,0,'pending',NULL,NULL,NULL,'2026-06-25 12:31:33');
/*!40000 ALTER TABLE `user_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `id` int unsigned NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` tinyint unsigned NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `looking_for` enum('male','female','both') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dating_goal` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `height` smallint unsigned DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `zodiac` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `circadian` enum('lark','owl','flexible') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_style` enum('secure','anxious','avoidant') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `super_likes` int unsigned NOT NULL DEFAULT '0',
  `boost_until` datetime DEFAULT NULL,
  `online` tinyint(1) NOT NULL DEFAULT '0',
  `last_seen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_profiles_city` (`city`),
  KEY `idx_profiles_age` (`age`),
  KEY `idx_profiles_online` (`online`),
  KEY `idx_profiles_gender_looking` (`gender`,`looking_for`),
  CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_profiles_chk_1` CHECK (((`age` >= 16) and (`age` <= 120))),
  CONSTRAINT `user_profiles_chk_2` CHECK (((`height` >= 100) and (`height` <= 250)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,'Admin','Admin',30,'Admin','/demo/people/me.png','male','both','dating',180,'Москва',NULL,NULL,NULL,'Овен',NULL,NULL,NULL,10,NULL,1,'2026-06-11 05:20:35','2026-06-11 05:20:35','2026-06-11 05:20:35'),(2,'Анна','Анна',24,'<script>alert(\"xss\")</script>','/demo/people/anna.png','female','male','goal.just_talk',172,'Москва',NULL,NULL,NULL,'common.zodiac.leo','lark',NULL,NULL,5,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-07-16 08:54:16'),(3,'Александр','Александр',26,'Всегда в движении','/demo/people/maxim.png','male','female','serious_relationship',185,'Москва',NULL,NULL,NULL,'Овен','owl',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(4,'Елена','Елена',26,'Люблю музеи','/demo/people/elena.png','female','male','dating',168,'Москва',NULL,NULL,NULL,'Рыбы','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(5,'Михаил','Михаил',28,'Играю на гитаре','/demo/people/ivan.png','male','female','dating',182,'Москва',NULL,NULL,NULL,'Скорпион','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(6,'София','София',22,'Мечтаю объехать мир','/demo/people/sophia.png','female','male','just_talk',165,'Москва',NULL,NULL,NULL,'Дева','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(7,'Артем','Артем',25,'Кодю днем, бегаю вечером','/demo/people/artem.png','male','female','new_friends',178,'Москва',NULL,NULL,NULL,'Близнецы','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(8,'Мария','Мария',29,'Люблю готовить','/demo/people/anna.png','female','male','serious_relationship',170,'Москва',NULL,NULL,NULL,'Скорпион','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(9,'Иван','Иван',27,'Пейзажный фотограф','/demo/people/ivan.png','male','female','serious_relationship',188,'Москва',NULL,NULL,NULL,'Стрелец','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(10,'Ксения','Ксения',23,'Люблю дизайн','/demo/people/sophia.png','female','male','serious_relationship',174,'Москва',NULL,NULL,NULL,'Козерог','owl',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(11,'Никита','Никита',30,'Ценю искренность','/demo/people/maxim.png','male','female','just_talk',180,'Москва',NULL,NULL,NULL,'Водолей','lark',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(12,'Дмитрий','Дмитрий',32,'Люблю активный отдых','/demo/people/maxim.png','male','female','serious_relationship',184,'Москва',NULL,NULL,NULL,'Телец','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(13,'Максим','Максим',29,'Меломан и эстет','/demo/people/maxim.png','male','female','dating',179,'Москва',NULL,NULL,NULL,'Козерог','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(14,'Андрей','Андрей',31,'Архитектор','/demo/people/ivan.png','male','female','new_friends',181,'Москва',NULL,NULL,NULL,'Весы','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(15,'Игорь','Игорь',24,'Жизнь - приключение','/demo/people/artem.png','male','female','serious_relationship',176,'Москва',NULL,NULL,NULL,'Рак','owl',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(16,'Виктор','Виктор',35,'Ценю уют и джаз','/demo/people/ivan.png','male','female','dating',183,'Москва',NULL,NULL,NULL,'Дева','lark',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(19,'Егор',NULL,25,'Фотограф-путешественник. Ищу музу для совместных приключений.','/demo/people/maxim.png','male','female','goal.serious_relationship',183,'Москва',NULL,NULL,NULL,'common.zodiac.sagittarius',NULL,NULL,NULL,0,NULL,0,'2026-06-26 06:09:28','2026-06-26 06:09:28','2026-06-26 06:09:28'),(20,'Тимур',NULL,26,'Фитнес-тренер и меломан. Утро начинаю с пробежки.','/demo/people/artem.png','male','female','goal.serious_relationship',186,'Москва',NULL,NULL,NULL,'common.zodiac.leo',NULL,NULL,NULL,0,NULL,0,'2026-06-26 06:09:28','2026-06-26 06:09:28','2026-06-26 06:09:28'),(21,'Даниил',NULL,27,'Бариста и путешественник. Варю лучший кофе в городе.','/demo/people/ivan.png','male','female','goal.serious_relationship',180,'Москва',NULL,NULL,NULL,'common.zodiac.taurus',NULL,NULL,NULL,0,NULL,0,'2026-06-26 06:09:28','2026-06-26 06:09:28','2026-06-26 06:09:28'),(22,'Матвей',NULL,24,'Музыкант и спортсмен. Играю в группе, бегаю марафоны.','/demo/people/artem.png','male','female','goal.serious_relationship',177,'Москва',NULL,NULL,NULL,'common.zodiac.gemini',NULL,NULL,NULL,0,NULL,0,'2026-06-26 06:09:28','2026-06-26 06:09:28','2026-06-26 06:09:28'),(23,'Роман',NULL,28,'Программист в душе и романтик в сердце.','/demo/people/ivan.png','male','female','goal.serious_relationship',184,'Москва',NULL,NULL,NULL,'common.zodiac.libra',NULL,NULL,NULL,0,NULL,0,'2026-06-26 06:09:28','2026-06-26 06:09:28','2026-06-26 06:09:28'),(27,'test-act-1784103561357','test-act-1784103561357',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-15 08:19:21','2026-07-15 08:19:21','2026-07-15 08:19:21'),(28,'actest1784103741043','actest1784103741043',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-15 08:22:21','2026-07-15 08:22:21','2026-07-15 08:22:21'),(29,'E2E Test User','E2E Test User',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-16 08:54:09','2026-07-16 08:54:09','2026-07-16 08:54:09'),(30,'E2E Test User','E2E Test User',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-16 09:04:30','2026-07-16 09:04:30','2026-07-16 09:04:30'),(31,'E2E Test User','E2E Test User',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-16 09:07:30','2026-07-16 09:07:30','2026-07-16 09:07:30'),(32,'E2E Test User','E2E Test User',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-16 09:09:40','2026-07-16 09:09:40','2026-07-16 09:09:40'),(33,'E2E Test User','E2E Test User',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-16 09:10:37','2026-07-16 09:10:37','2026-07-16 09:10:37'),(34,'E2E Test User','E2E Test User',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,'2026-07-16 09:12:07','2026-07-16 09:12:07','2026-07-16 09:12:07');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_token` (`token`),
  KEY `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_stories`
--

DROP TABLE IF EXISTS `user_stories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_uploading` tinyint(1) NOT NULL DEFAULT '0',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stories_user` (`user_id`),
  KEY `idx_stories_expires` (`expires_at`),
  CONSTRAINT `user_stories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_stories`
--

LOCK TABLES `user_stories` WRITE;
/*!40000 ALTER TABLE `user_stories` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_stories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_titles`
--

DROP TABLE IF EXISTS `user_titles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_titles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `title_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'rookie, romantic, party, king',
  `earned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_title` (`user_id`,`title_key`),
  KEY `idx_titles_user` (`user_id`),
  CONSTRAINT `user_titles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_titles`
--

LOCK TABLES `user_titles` WRITE;
/*!40000 ALTER TABLE `user_titles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_titles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `verification_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_reset_token` (`reset_token`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@mail.ru','$2a$10$LydscAp87/JfjNajKoiqGu9b3nQKpthzmiIexDBN64jk8ysPboDpG','admin',1,NULL,NULL,NULL,NULL,'2026-06-25 09:34:43','2026-06-25 09:34:43',NULL),(2,'demo@mail.ru','$2a$10$LydscAp87/JfjNajKoiqGu9b3nQKpthzmiIexDBN64jk8ysPboDpG','user',1,NULL,NULL,NULL,NULL,'2026-06-25 09:34:43','2026-06-25 09:34:43',NULL),(3,'demo3@mail.ru','$2a$10$LydscAp87/JfjNajKoiqGu9b3nQKpthzmiIexDBN64jk8ysPboDpG','user',1,NULL,NULL,NULL,NULL,'2026-06-25 09:34:43','2026-06-25 09:34:43',NULL),(4,'user4@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(5,'user5@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(6,'user6@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(7,'user7@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(8,'user8@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(9,'user9@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(10,'user10@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(11,'user11@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(12,'user12@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(13,'user13@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(14,'user14@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(15,'user15@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(16,'user16@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(19,'user19@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(20,'user20@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(21,'user21@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(22,'user22@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(23,'user23@demo.ru','$2a$10$Wmkll8K73xUeGER3eu4J2.dB7fEpd683eKem9NFoLf7kFOMw7jNbu','user',1,NULL,NULL,NULL,NULL,'2026-06-26 06:09:28','2026-06-26 06:09:28',NULL),(24,'audit@test.ru','$2a$10$sSuQccZ8ptuDKrAorZcesOnv1s8X9z3JRaWKXgAOaMKSkW95rFS3a','user',1,NULL,'eefb0ae4a1f7233a5f47d2aa1c973e9c75b7001ee2ef4370677133c2c806d542',NULL,NULL,'2026-07-15 07:41:57','2026-07-15 07:41:57',NULL),(25,'audit2@test.ru','$2a$10$uegm2lgbp0DRLRyr5R5JKO5YE80wtDB.h6nH440XMNLvlvw9Y3W.S','user',1,NULL,'e9ed95d50a9c10c083137e0448297698f54f16f216168fe91277429ed52bdacb',NULL,NULL,'2026-07-15 07:42:35','2026-07-15 07:42:35',NULL),(26,'test-activity-1784103161761@test.ru','$2a$10$SIeczFds6/qsEQvCvg3jPe8QpEVdpPwNc57pfr2OCb9hCqJM2lajS','user',1,NULL,'eeeaec3176d522017e43cca6a3505fd576ddfc5a0890aa0f2c5f863e1017285d',NULL,NULL,'2026-07-15 08:12:41','2026-07-15 08:12:41',NULL),(27,'test-act-1784103561357@t.ru','$2a$10$OiIQ6av39z4w.JcLoW/WRe6TGEYsUzfHj7dlGEypC3EoSwU7lle7u','user',1,NULL,'2b5b3ce8d6f995681a87906b6aab938e037e6df620f90f6c30e2080af3b7c736',NULL,NULL,'2026-07-15 08:19:21','2026-07-15 08:19:21',NULL),(28,'actest1784103741043@t.ru','$2a$10$/vGC.PhZxaUgvRCGw.H6Furx1500DBfRFmiJ9rDy6RiUusm8B7RWq','user',1,NULL,'48ad5b71d7b5d03459c9b25dd9a55c0b0dc5d25b789b4f4fa59a8684da5700e0',NULL,NULL,'2026-07-15 08:22:21','2026-07-15 08:22:21',NULL),(29,'e2e_test_1784192044871@mail.ru','$2a$10$RfbFcqW513vxeZJ5D9nIz.Ehxg.QmN1MV/yrngslWtcZb4gRHtGFq','user',1,NULL,'b2fb5e37eb4d35e74396a5b339b63e7ac9cf7f4e013409e93eb9339a87faa2a9',NULL,NULL,'2026-07-16 08:54:09','2026-07-16 08:54:09',NULL),(30,'e2e_test_1784192663060@mail.ru','$2a$10$.voTYwTZB8ad66L7oHhiRe.dWlRmHwFTMVGip92JicAiXZCUSaeTW','user',1,NULL,'9ecf2e2cdc07d2d68b1d80acfb81bda2316dac936859f052fc472325afbe6e3f',NULL,NULL,'2026-07-16 09:04:30','2026-07-16 09:04:30',NULL),(31,'e2e_test_1784192845554@mail.ru','$2a$10$47.c3doiuXDiCQlsJfmqJOSI/GbkRAb.g3xG8zO2a3MRRh7r7aYia','user',1,NULL,'57938f0eb99569d55a8825990e98eab5d6c40b36fb34d9cc780d4b70b00dcb14',NULL,NULL,'2026-07-16 09:07:30','2026-07-16 09:07:30',NULL),(32,'e2e_test_1784192972975@mail.ru','$2a$10$z2LB8Uw3YrgkituBopaT0ulrB0un97it44r2WrHalyGeCVwJPPtEi','user',1,NULL,'9cb0b5911e3002049866c3eb768420a23578c28ee0f3970216b33838493ae0f3',NULL,NULL,'2026-07-16 09:09:40','2026-07-16 09:09:40',NULL),(33,'e2e_test_1784193028881@mail.ru','$2a$10$ZnY6dLdvYR6SdjjdRYoiReCKckZsE446iLX0Au34beSSjVGLEdMeG','user',1,NULL,'4d56524c8901c9bffbb08e5356525d7fd915e06bffe3ce636e99fd30b5d3124a',NULL,NULL,'2026-07-16 09:10:37','2026-07-16 09:10:37',NULL),(34,'e2e_test_1784193121213@mail.ru','$2a$10$KISbKsx9ztolszrhhcOcn.5waP8clXnNdPmQUo9yCFi5D0eZmMRTm','user',1,NULL,'887c2296bfdf60247b93070d40695e21da3f30ccdd229cf5f9ffbbb16da0b325',NULL,NULL,'2026-07-16 09:12:07','2026-07-16 09:12:07',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'swiftmatch'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-16 12:25:40
