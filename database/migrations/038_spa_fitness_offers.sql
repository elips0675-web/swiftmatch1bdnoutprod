-- 038: Wave 3 Part 2 — Spa & Fitness partner offers
-- Idempotent seed: partners LoveSpa + FitBro, 4 offers (spa × 2, fitness × 2)

INSERT INTO partners (name, type, commission_rate, status)
SELECT * FROM (SELECT 'LoveSpa', 'deeplink', 12.00, 'active' UNION ALL
               SELECT 'FitBro', 'deeplink', 10.00, 'active') AS seed
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name = 'LoveSpa');

INSERT INTO partner_offers (partner_id, category, title, description, deeplink, price, city, placement, status)
SELECT p.id, v.category, v.title, v.description, v.deeplink, v.price, v.city, v.placement, 'active'
FROM (SELECT 'LoveSpa' AS pname, 'spa' AS category,
             'Массаж для двоих' AS title,
             'Расслабляющий массаж в уютной атмосфере для пар' AS description,
             'https://lovespa.ru/booking?utm_source=swiftmatch&city={city}' AS deeplink,
             4500.00 AS price, NULL AS city, 'chat,profile' AS placement
      UNION ALL SELECT 'LoveSpa', 'spa', 'СПА-процедуры и релакс',
             'Полный спектр СПА-услуг: обёртывания, пилинги, ароматерапия',
             'https://lovespa.ru/spa?utm_source=swiftmatch&city={city}' AS deeplink,
             3200.00, NULL, 'chat,hangout'
      UNION ALL SELECT 'FitBro', 'experience', 'Абонемент в фитнес-клуб',
             'Пробный абонемент на неделю в фитнес-клубе рядом с вами',
             'https://fitbro.ru/pass?utm_source=swiftmatch&city={city}' AS deeplink,
             1500.00, NULL, 'chat,profile'
      UNION ALL SELECT 'FitBro', 'experience', 'Групповые занятия: йога, пилатес, функциональная',
             'Запись на групповое занятие: йога, пилатес, функциональная тренировка',
             'https://fitbro.ru/group?utm_source=swiftmatch&city={city}' AS deeplink,
             800.00, NULL, 'chat,hangout') AS v
JOIN partners p ON p.name = v.pname
WHERE NOT EXISTS (SELECT 1 FROM partner_offers o JOIN partners p2 ON o.partner_id = p2.id
                  WHERE p2.name = v.pname AND o.title = v.title);
