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
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `analytics_events`
--

LOCK TABLES `analytics_events` WRITE;
/*!40000 ALTER TABLE `analytics_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `chat_groups`
--

LOCK TABLES `chat_groups` WRITE;
/*!40000 ALTER TABLE `chat_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `chat_participants`
--

LOCK TABLES `chat_participants` WRITE;
/*!40000 ALTER TABLE `chat_participants` DISABLE KEYS */;
REPLACE INTO `chat_participants` VALUES (1,2,'2026-06-11 05:32:51',NULL),(1,3,'2026-06-11 05:32:51',NULL),(2,2,'2026-06-11 05:32:51',NULL),(2,6,'2026-06-11 05:32:51',NULL),(3,2,'2026-06-11 05:32:51',NULL),(3,7,'2026-06-11 05:32:51',NULL),(4,2,'2026-06-11 05:32:51',NULL),(4,12,'2026-06-11 05:32:51',NULL),(5,2,'2026-06-11 05:32:51',NULL),(5,9,'2026-06-11 05:32:51',NULL);
/*!40000 ALTER TABLE `chat_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `chats`
--

LOCK TABLES `chats` WRITE;
/*!40000 ALTER TABLE `chats` DISABLE KEYS */;
REPLACE INTO `chats` VALUES (1,0,NULL,'╨Ъ╨╛╨╜╨╡╤З╨╜╨╛! ╨б ╤Г╨┤╨╛╨▓╨╛╨╗╤М╤Б╤В╨▓╨╕╨╡╨╝',2,'2026-06-11 05:32:51','2026-06-11 05:22:51'),(2,0,NULL,'╨Я╨╗╨░╨╜╨╕╤А╤Г╤О ╨┐╨╛╨╡╨╖╨┤╨║╤Г ╨▓ ╨│╨╛╤А╤Л, ╨╛╤З╨╡╨╜╤М ╨╢╨┤╤Г!',2,'2026-06-11 05:32:51','2026-06-11 04:47:51'),(3,0,NULL,'╨Ф╨╛╨│╨╛╨▓╨╛╤А╨╕╨╗╨╕╤Б╤М! ╨Ф╨╛ ╨▓╤Б╤В╤А╨╡╤З╨╕',2,'2026-06-11 05:32:51','2026-06-10 12:32:51'),(4,0,NULL,'╨Ю, ╨╛╤В╨╗╨╕╤З╨╜╨░╤П ╨╕╨┤╨╡╤П! ╨Т╨╛ ╤Б╨║╨╛╨╗╤М╨║╨╛?',2,'2026-06-11 05:32:51','2026-06-11 03:32:51'),(5,0,NULL,'╨в╨╛╨╢╨╡ ╨╗╤О╨▒╨╗╤О ╤Д╨╛╤В╨╛╨│╤А╨░╤Д╨╕╤А╨╛╨▓╨░╤В╤М. ╨Ь╨╛╨╢╨╡╤В ╨║╨░╨║-╨╜╨╕╨▒╤Г╨┤╤М ╨▓╨╝╨╡╤Б╤В╨╡?',9,'2026-06-11 05:32:51','2026-06-10 05:32:51');
/*!40000 ALTER TABLE `chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `compatibility_scores`
--

LOCK TABLES `compatibility_scores` WRITE;
/*!40000 ALTER TABLE `compatibility_scores` DISABLE KEYS */;
REPLACE INTO `compatibility_scores` VALUES ('secure','secure',2),('secure','anxious',2),('secure','avoidant',2),('anxious','secure',2),('anxious','anxious',1),('anxious','avoidant',0),('avoidant','secure',2),('avoidant','anxious',0),('avoidant','avoidant',1);
/*!40000 ALTER TABLE `compatibility_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `content_config`
--

LOCK TABLES `content_config` WRITE;
/*!40000 ALTER TABLE `content_config` DISABLE KEYS */;
REPLACE INTO `content_config` VALUES (1,'[\"sport\", \"music\", \"movies\", \"books\", \"travel\", \"cooking\", \"games\", \"art\", \"photography\", \"tech\", \"fashion\", \"dance\", \"animals\", \"volunteering\", \"politics\", \"psychology\", \"philosophy\", \"yoga\", \"meditation\", \"gardening\", \"cars\", \"science\", \"history\", \"architecture\", \"pets\"]','[\"serious_relationship\", \"dating\", \"just_talk\", \"new_friends\", \"one_night\", \"family_kids\", \"travel\", \"co_living\", \"penpal\", \"no_commitment\"]','[\"secondary\", \"vocational\", \"incomplete_higher\", \"higher\", \"bachelor\", \"master\", \"candidate\", \"doctor\"]','["спам","мошенничество","фейк","скам","развод","обман","реклама","казино","ставки","заработок","крипта","инвестиции","наркотики","закладки","продажа","куплю","порно","секс"]','2026-06-11 06:08:51');
/*!40000 ALTER TABLE `content_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `contest_entries`
--

LOCK TABLES `contest_entries` WRITE;
/*!40000 ALTER TABLE `contest_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `contest_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `feature_flags`
--

LOCK TABLES `feature_flags` WRITE;
/*!40000 ALTER TABLE `feature_flags` DISABLE KEYS */;
REPLACE INTO `feature_flags` VALUES (1,1,1,1,1,1,0,1,'2026-06-10 15:39:19');
/*!40000 ALTER TABLE `feature_flags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `group_categories`
--

LOCK TABLES `group_categories` WRITE;
/*!40000 ALTER TABLE `group_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `group_members`
--

LOCK TABLES `group_members` WRITE;
/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `icebreaker_answers`
--

LOCK TABLES `icebreaker_answers` WRITE;
/*!40000 ALTER TABLE `icebreaker_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `icebreaker_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `icebreaker_questions`
--

LOCK TABLES `icebreaker_questions` WRITE;
/*!40000 ALTER TABLE `icebreaker_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `icebreaker_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `icebreaker_themes`
--

LOCK TABLES `icebreaker_themes` WRITE;
/*!40000 ALTER TABLE `icebreaker_themes` DISABLE KEYS */;
/*!40000 ALTER TABLE `icebreaker_themes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `interests`
--

LOCK TABLES `interests` WRITE;
/*!40000 ALTER TABLE `interests` DISABLE KEYS */;
REPLACE INTO `interests` VALUES (1,'Спорт','Sport','sport','Dumbbell'),(2,'Музыка','Music','music','Music'),(3,'Кино','Movies','movies','Film'),(4,'Книги','Books','books','BookOpen'),(5,'Путешествия','Travel','travel','Globe'),(6,'Кулинария','Cooking','cooking','ChefHat'),(7,'Игры','Games','games','Gamepad2'),(8,'Искусство','Art','art','Palette'),(9,'Фотография','Photography','photography','Camera'),(10,'Технологии','Tech','tech','Cpu'),(11,'Мода','Fashion','fashion','Shirt'),(12,'Танцы','Dance','dance','Music'),(13,'Животные','Animals','animals','Dog'),(14,'Волонтерство','Volunteering','volunteering','Heart'),(15,'Политика','Politics','politics','Briefcase'),(16,'Психология','Psychology','psychology','Brain'),(17,'Философия','Philosophy','philosophy','BookOpen'),(18,'Йога','Yoga','yoga','HeartPulse'),(19,'Медитация','Meditation','meditation','Sparkles'),(20,'Садоводство','Gardening','gardening','Flower'),(21,'Автомобили','Cars','cars','Car'),(22,'Наука','Science','science','FlaskConical'),(23,'История','History','history','Scroll'),(24,'Архитектура','Architecture','architecture','Building'),(25,'Питомцы','Pets','pets','Dog');
/*!40000 ALTER TABLE `interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `invites`
--

LOCK TABLES `invites` WRITE;
/*!40000 ALTER TABLE `invites` DISABLE KEYS */;
/*!40000 ALTER TABLE `invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
REPLACE INTO `likes` VALUES (1,2,3,'like','2026-06-11 05:31:38'),(2,2,6,'like','2026-06-11 05:31:40'),(3,2,7,'like','2026-06-11 05:31:42'),(4,2,8,'like','2026-06-11 05:31:43');
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
REPLACE INTO `messages` VALUES (1,1,3,'Привет! Как дела?',NULL,'2026-06-11 05:44:31'),(2,1,2,'Отлично! А у тебя?',NULL,'2026-06-11 05:44:31'),(3,1,3,'Тоже хорошо) Давай встретимся?',NULL,'2026-06-11 05:44:31'),(4,1,2,'Конечно! С удовольствием',NULL,'2026-06-11 05:44:31'),(5,2,6,'Привет! Как твои дела?',NULL,'2026-06-11 05:44:31'),(6,2,2,'Привет! Всё отлично, готовлюсь к путешествию',NULL,'2026-06-11 05:44:31'),(7,2,6,'Ого! Куда едешь?',NULL,'2026-06-11 05:44:31'),(8,2,2,'Планирую поездку в горы, очень жду!',NULL,'2026-06-11 05:44:31'),(9,3,7,'Привет! Ты сегодня свободна?',NULL,'2026-06-11 05:44:31'),(10,3,2,'Привет! Вечером да, а что?',NULL,'2026-06-11 05:44:31'),(11,3,7,'Может сходим куда-нибудь?',NULL,'2026-06-11 05:44:31'),(12,3,2,'Давай! Куда предлагаешь?',NULL,'2026-06-11 05:44:31'),(13,3,7,'Есть новая кофейня недалеко от парка',NULL,'2026-06-11 05:44:31'),(14,3,2,'Отлично, я за! Во сколько?',NULL,'2026-06-11 05:44:31'),(15,3,7,'Давай в 18:00?',NULL,'2026-06-11 05:44:31'),(16,3,2,'Договорились! До встречи',NULL,'2026-06-11 05:44:31'),(17,4,12,'Доброе утро! Как настроение?',NULL,'2026-06-11 05:44:31'),(18,4,2,'Доброе! Отличное, спасибо! А у тебя?',NULL,'2026-06-11 05:44:31'),(19,4,12,'Тоже прекрасно! Не хочешь сходить на пробежку?',NULL,'2026-06-11 05:44:31'),(20,4,2,'О, отличная идея! Во сколько?',NULL,'2026-06-11 05:44:31'),(21,5,9,'Привет! Видел твои фотографии, очень красиво!',NULL,'2026-06-11 05:44:31'),(22,5,2,'Спасибо! Это я в прошлом месяце ездила',NULL,'2026-06-11 05:44:31'),(23,5,9,'Тоже люблю фотографировать. Может как-нибудь вместе?',NULL,'2026-06-11 05:44:31');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `moderation_log`
--

LOCK TABLES `moderation_log` WRITE;
/*!40000 ALTER TABLE `moderation_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `moderation_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `poll_answers`
--

LOCK TABLES `poll_answers` WRITE;
/*!40000 ALTER TABLE `poll_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `poll_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `poll_questions`
--

LOCK TABLES `poll_questions` WRITE;
/*!40000 ALTER TABLE `poll_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `poll_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `post_images`
--

LOCK TABLES `post_images` WRITE;
/*!40000 ALTER TABLE `post_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `saved_filters`
--

LOCK TABLES `saved_filters` WRITE;
/*!40000 ALTER TABLE `saved_filters` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_filters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_blocks`
--

LOCK TABLES `user_blocks` WRITE;
/*!40000 ALTER TABLE `user_blocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_interests`
--

LOCK TABLES `user_interests` WRITE;
/*!40000 ALTER TABLE `user_interests` DISABLE KEYS */;
REPLACE INTO `user_interests` VALUES (2,1),(3,1),(7,1),(9,1),(12,1),(13,1),(15,1),(16,1),(2,2),(5,2),(6,2),(7,2),(11,2),(13,2),(14,2),(16,2),(4,4),(2,5),(3,5),(7,5),(8,5),(9,5),(12,5),(14,5),(15,5),(3,6),(4,6),(5,6),(11,6),(12,6),(14,6),(16,6),(4,8),(6,8),(10,8),(5,9),(6,9),(9,9),(10,9),(11,9),(13,9),(15,9),(10,11),(8,18),(8,19);
/*!40000 ALTER TABLE `user_interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_photos`
--

LOCK TABLES `user_photos` WRITE;
/*!40000 ALTER TABLE `user_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
REPLACE INTO `user_profiles` (id,display_name,name,age,bio,avatar_url,gender,looking_for,dating_goal,height,city,country,lat,lng,location,zodiac,circadian,attachment_style,education,super_likes,boost_until,online,created_at,updated_at,last_seen) VALUES (1,'Admin','Admin',30,'Admin','/demo/people/me.png','male','both','dating',180,'Москва',NULL,55.7558,37.6173,ST_SRID(POINT(37.6173,55.7558),4326),'Овен',NULL,NULL,NULL,10,NULL,1,'2026-06-11 05:20:35','2026-06-11 05:20:35','2026-06-11 05:20:35'),(2,'Анна','Анна',24,'Тестовый bio','/demo/people/anna.png','female','male','Серьезные отношения',172,'Москва',NULL,55.7612,37.6105,ST_SRID(POINT(37.6105,55.7612),4326),'Лев','lark',NULL,NULL,5,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:40:23'),(3,'Александр','Александр',26,'Всегда в движении','/demo/people/maxim.png','male','female','serious_relationship',185,'Москва',NULL,55.7500,37.6300,ST_SRID(POINT(37.6300,55.7500),4326),'Овен','owl',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(4,'Елена','Елена',26,'Люблю музеи','/demo/people/elena.png','female','male','dating',168,'Москва',NULL,55.7700,37.5900,ST_SRID(POINT(37.5900,55.7700),4326),'Рыбы','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(5,'Михаил','Михаил',28,'Играю на гитаре','/demo/people/ivan.png','male','female','dating',182,'Москва',NULL,55.7400,37.6500,ST_SRID(POINT(37.6500,55.7400),4326),'Скорпион','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(6,'София','София',22,'Мечтаю объехать мир','/demo/people/sophia.png','female','male','just_talk',165,'Москва',NULL,55.7800,37.5700,ST_SRID(POINT(37.5700,55.7800),4326),'Дева','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(7,'Артем','Артем',25,'Кодю днем, бегаю вечером','/demo/people/artem.png','male','female','new_friends',178,'Москва',NULL,55.7450,37.6200,ST_SRID(POINT(37.6200,55.7450),4326),'Близнецы','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(8,'Мария','Мария',29,'Люблю готовить','/demo/people/anna.png','female','male','serious_relationship',170,'Москва',NULL,55.7650,37.6050,ST_SRID(POINT(37.6050,55.7650),4326),'Скорпион','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(9,'Иван','Иван',27,'Пейзажный фотограф','/demo/people/ivan.png','male','female','serious_relationship',188,'Москва',NULL,55.76,37.64,ST_SRID(POINT(37.64,55.76),4326),'Стрелец','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(10,'Ксения','Ксения',23,'Люблю дизайн','/demo/people/sophia.png','female','male','serious_relationship',174,'Москва',NULL,55.785,37.58,ST_SRID(POINT(37.58,55.785),4326),'Козерог','owl',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(11,'Никита','Никита',30,'Ценю искренность','/demo/people/maxim.png','male','female','just_talk',180,'Москва',NULL,55.73,37.67,ST_SRID(POINT(37.67,55.73),4326),'Водолей','lark',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(12,'Дмитрий','Дмитрий',32,'Люблю активный отдых','/demo/people/maxim.png','male','female','serious_relationship',184,'Москва',NULL,55.72,37.68,ST_SRID(POINT(37.68,55.72),4326),'Телец','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(13,'Максим','Максим',29,'Меломан и эстет','/demo/people/maxim.png','male','female','dating',179,'Москва',NULL,55.79,37.55,ST_SRID(POINT(37.55,55.79),4326),'Козерог','owl',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(14,'Андрей','Андрей',31,'Архитектор','/demo/people/ivan.png','male','female','new_friends',181,'Москва',NULL,55.748,37.61,ST_SRID(POINT(37.61,55.748),4326),'Весы','lark',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(15,'Игорь','Игорь',24,'Жизнь - приключение','/demo/people/artem.png','male','female','serious_relationship',176,'Москва',NULL,55.755,37.625,ST_SRID(POINT(37.625,55.755),4326),'Рак','owl',NULL,NULL,0,NULL,1,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36'),(16,'Виктор','Виктор',35,'Ценю уют и джаз','/demo/people/ivan.png','male','female','dating',183,'Москва',NULL,55.735,37.66,ST_SRID(POINT(37.66,55.735),4326),'Дева','lark',NULL,NULL,0,NULL,0,'2026-06-11 05:20:36','2026-06-11 05:20:36','2026-06-11 05:20:36');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_stories`
--

LOCK TABLES `user_stories` WRITE;
/*!40000 ALTER TABLE `user_stories` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_stories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_titles`
--

LOCK TABLES `user_titles` WRITE;
/*!40000 ALTER TABLE `user_titles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_titles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
REPLACE INTO `users` VALUES (1,'admin@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','admin',1,'2026-06-10 15:39:23','2026-06-10 15:39:23',NULL),(2,'demo@mail.ru','$2a$10$Ku/p5NHogHoqzitPz2JJcO0GrtB90y1mKi.Hrl5RA7R0/JScKKHW2','user',1,'2026-06-11 05:19:46','2026-06-11 05:23:54',NULL),(3,'demo3@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(4,'demo4@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(5,'demo5@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(6,'demo6@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(7,'demo7@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(8,'demo8@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(9,'demo9@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(10,'demo10@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(11,'demo11@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:35','2026-06-11 05:20:35',NULL),(12,'demo12@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:36','2026-06-11 05:20:36',NULL),(13,'demo13@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:36','2026-06-11 05:20:36',NULL),(14,'demo14@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:36','2026-06-11 05:20:36',NULL),(15,'demo15@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:36','2026-06-11 05:20:36',NULL),(16,'demo16@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:36','2026-06-11 05:20:36',NULL),(17,'demo17@mail.ru','$2a$10$EI4wJ/NJesPhUIRPKB6lYuClpFQ/.f0SCSrKebiPjqd73Jz39X8Ki','user',1,'2026-06-11 05:20:36','2026-06-11 05:20:36',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 11:02:06
