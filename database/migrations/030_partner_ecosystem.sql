-- Migration 030: Партнёрская экосистема (Wave 1 из Mesta.txt)
-- Единый движок партнёров: partners (любой тип), partner_offers (акции/диплинки),
-- partner_conversions (сквозной трекинг CPA/RevShare кликов и конверсий).

CREATE TABLE IF NOT EXISTS partners (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  type            ENUM('api','deeplink','saas') NOT NULL DEFAULT 'deeplink',
  affiliate_token VARCHAR(255),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  api_base_url    VARCHAR(255),
  status          ENUM('active','paused') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_partners_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partner_offers (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partner_id   INT UNSIGNED NOT NULL,
  category     ENUM('cinema','restaurant','flowers','taxi','hotel','spa','photo','gift','event','experience') NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  image_url    VARCHAR(500),
  deeplink     VARCHAR(500) NOT NULL,
  price        DECIMAL(10,2),
  city         VARCHAR(100),
  lat          DECIMAL(10,8),
  lng          DECIMAL(11,8),
  valid_from   DATE,
  valid_to     DATE,
  placement    SET('hangout','chat','profile','passport','attachment_result') NOT NULL,
  status       ENUM('active','paused') NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_offers_category (category),
  INDEX idx_offers_status (status),
  INDEX idx_offers_geo (lat, lng),
  INDEX idx_offers_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partner_conversions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partner_id      INT UNSIGNED NOT NULL,
  offer_id        INT UNSIGNED,
  user_id         INT UNSIGNED NOT NULL,
  conversion_type ENUM('click','booking','purchase','lead') NOT NULL DEFAULT 'click',
  amount          DECIMAL(10,2),
  commission      DECIMAL(10,2),
  status          ENUM('pending','approved','paid') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (offer_id) REFERENCES partner_offers(id) ON DELETE SET NULL,
  INDEX idx_conversions_partner (partner_id),
  INDEX idx_conversions_user (user_id),
  INDEX idx_conversions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Идемпотентный сид Wave 1 (deeplink-партнёры): уникальный ключ name + WHERE NOT EXISTS
INSERT INTO partners (name, type, commission_rate, status)
SELECT * FROM (SELECT 'Yandex Go', 'deeplink', 8.00, 'active' UNION ALL
               SELECT 'KinoPoisk Afisha', 'deeplink', 10.00, 'active' UNION ALL
               SELECT 'Restoclub', 'deeplink', 12.00, 'active' UNION ALL
               SELECT 'Ostrovok', 'deeplink', 4.00, 'active') AS seed
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name = 'Yandex Go');

INSERT INTO partner_offers (partner_id, category, title, description, deeplink, city, placement, status)
SELECT p.id, v.category, v.title, v.description, v.deeplink, v.city, v.placement, 'active'
FROM (SELECT 'Yandex Go' AS pname, 'taxi' AS category,
             'Вызвать такси к месту встречи' AS title,
             'Deeplink в Яндекс Go с маршрутом до места' AS description,
             'yandextaxi://route?startlat={lat}&startlon={lng}&endlat={to_lat}&endlon={to_lng}' AS deeplink,
             NULL AS city, 'chat,hangout' AS placement
      UNION ALL SELECT 'KinoPoisk Afisha', 'cinema', 'Выбрать фильм в кино',
             'Афиша кинотеатров рядом: расписание и билеты',
             'https://www.afisha.ru/movie/?utm_source=swiftmatch&city={city}',
             NULL, 'chat,hangout'
      UNION ALL SELECT 'Restoclub', 'restaurant', 'Забронировать столик',
             'Рестораны для свидания с онлайн-бронью',
             'https://restoclub.ru/msk/search?text=svidanie&utm_source=swiftmatch',
             'Москва', 'chat,hangout'
      UNION ALL SELECT 'Restoclub', 'event', 'Идеи для встречи: мастер-классы и события',
             'Подборка событий Restoclub для совместного досуга',
             'https://restoclub.ru/msk/events/?utm_source=swiftmatch',
             'Москва', 'hangout'
      UNION ALL SELECT 'Ostrovok', 'hotel', 'Где остановиться в поездке',
             'Отели города по партнёрской цене Ostrovok',
             'https://ostrovok.ru/?utm_source=swiftmatch&city={city}',
             NULL, 'passport') AS v
JOIN partners p ON p.name = v.pname
WHERE NOT EXISTS (SELECT 1 FROM partner_offers o JOIN partners p2 ON o.partner_id = p2.id
                  WHERE p2.name = v.pname AND o.title = v.title);

-- Feature flag: partnerOffersEnabled (вкл/выкл без деплоя)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'feature_flags'
    AND COLUMN_NAME = 'partner_offers_enabled'
);
SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE feature_flags ADD COLUMN partner_offers_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER hangouts_enabled',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
