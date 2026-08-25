-- Migration 034: Wave 2 — hmac_secret для postback + сиды ресторанов/цветов

-- 1) hmac_secret: SHA-256 подпись тела postback (X-Partner-Signature)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'partners'
    AND COLUMN_NAME = 'hmac_secret'
);
SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE partners ADD COLUMN hmac_secret VARCHAR(64) NULL AFTER affiliate_token',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Идемпотентный сид цветочных партнёров
INSERT INTO partners (name, type, commission_rate, hmac_secret, status)
SELECT * FROM (SELECT 'Flowwow', 'api', 15.00, 'fw_hmac_a3f8c2e1b7d4', 'active' UNION ALL
               SELECT 'Bouquet.ru', 'deeplink', 12.00, 'bq_hmac_d9e2f1a8c3b5', 'active' UNION ALL
               SELECT 'Yandex Lavka', 'deeplink', 10.00, 'yl_hmac_c7b1e4d9f2a8', 'active') AS seed
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name = 'Flowwow');

-- 3) HMAC-секреты для уже существующих партнёров (если ещё нет)
UPDATE partners SET hmac_secret = 'yg_hmac_e5a2d8f1c3b7' WHERE name = 'Yandex Go' AND hmac_secret IS NULL;
UPDATE partners SET hmac_secret = 'kp_hmac_b4c9a1e7f3d2' WHERE name = 'KinoPoisk Afisha' AND hmac_secret IS NULL;
UPDATE partners SET hmac_secret = 'rc_hmac_f2a8d5c1e9b3' WHERE name = 'Restoclub' AND hmac_secret IS NULL;
UPDATE partners SET hmac_secret = 'os_hmac_a1b2c3d4e5f6' WHERE name = 'Ostrovok' AND hmac_secret IS NULL;

-- 4) Сиды офферов: цветы (category=flowers, placement=chat)
INSERT INTO partner_offers (partner_id, category, title, description, deeplink, price, city, placement, status)
SELECT p.id, v.category, v.title, v.description, v.deeplink, v.price, v.city, v.placement, 'active'
FROM (SELECT 'Flowwow' AS pname, 'flowers' AS category,
             'Букет роз — классика для свидания' AS title,
             'Свежие розы с доставкой на адрес получателя' AS description,
             'https://flowwow.com/roses?ref=swiftmatch&city={city}' AS deeplink,
             2490 AS price, NULL AS city, 'chat' AS placement
      UNION ALL SELECT 'Flowwow', 'flowers',
             'Авторский букет на выбор',
             'Букет от флориста — для особенного свидания',
             'https://flowwow.com/author?ref=swiftmatch&city={city}',
             3490, NULL, 'chat'
      UNION ALL SELECT 'Bouquet.ru', 'flowers',
             'Букет тюльпанов — весеннее настроение',
             'Яркие тюльпаны с доставкой за 2 часа',
             'https://bouquet.ru/tulips?ref=swiftmatch&city={city}',
             1890, NULL, 'chat'
      UNION ALL SELECT 'Bouquet.ru', 'flowers',
             'Композиция из пионов',
             'Пионы — элегантный подарок для свидания',
             'https://bouquet.ru/peonies?ref=swiftmatch&city={city}',
             3990, NULL, 'chat'
      UNION ALL SELECT 'Yandex Lavka', 'flowers',
             'Букет из полевых цветов',
             'Лёгкий букет — доставка за 30 минут',
             'https://lavka.yandex.ru/flowers?ref=swiftmatch&city={city}',
             1290, NULL, 'chat') AS v
JOIN partners p ON p.name = v.pname
WHERE NOT EXISTS (SELECT 1 FROM partner_offers o JOIN partners p2 ON o.partner_id = p2.id
                  WHERE p2.name = v.pname AND o.title = v.title);

-- 5) Дополнительные restaurant-офферы (расширение Restoclub)
INSERT INTO partner_offers (partner_id, category, title, description, deeplink, city, placement, status)
SELECT p.id, v.category, v.title, v.description, v.deeplink, v.city, v.placement, 'active'
FROM (SELECT 'Restoclub' AS pname, 'restaurant' AS category,
             'Ужин на двоих — подборка романтических ресторанов' AS title,
             'Рестораны с романтической атмосферой для свидания' AS description,
             'https://restoclub.ru/msk/romantic?utm_source=swiftmatch&city={city}' AS deeplink,
             'Москва' AS city, 'chat' AS placement) AS v
JOIN partners p ON p.name = v.pname
WHERE NOT EXISTS (SELECT 1 FROM partner_offers o JOIN partners p2 ON o.partner_id = p2.id
                  WHERE p2.name = v.pname AND o.title = v.title);
