-- Чистка пользовательского текста, сохранённого до sanitize-on-write (XSS-пробы в "О себе").
-- Зеркалит server/src/sanitize.js: удаляет HTML-теги и вызовы alert/prompt/confirm.

UPDATE user_profiles
SET bio = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(
  REGEXP_REPLACE(bio, '</?[a-zA-Z][^>]*>', ' '),
  '\\b(alert|prompt|confirm)[[:space:]]*\\([^)]*\\)', ' '
), '[[:space:]]{2,}', ' '))
WHERE bio REGEXP '</?[a-zA-Z][^>]*>'
   OR bio REGEXP '\\b(alert|prompt|confirm)[[:space:]]*\\(';

UPDATE user_profiles
SET display_name = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(
  REGEXP_REPLACE(display_name, '</?[a-zA-Z][^>]*>', ' '),
  '\\b(alert|prompt|confirm)[[:space:]]*\\([^)]*\\)', ' '
), '[[:space:]]{2,}', ' '))
WHERE display_name REGEXP '</?[a-zA-Z][^>]*>'
   OR display_name REGEXP '\\b(alert|prompt|confirm)[[:space:]]*\\(';

UPDATE user_profiles
SET name = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(
  REGEXP_REPLACE(name, '</?[a-zA-Z][^>]*>', ' '),
  '\\b(alert|prompt|confirm)[[:space:]]*\\([^)]*\\)', ' '
), '[[:space:]]{2,}', ' '))
WHERE name REGEXP '</?[a-zA-Z][^>]*>'
   OR name REGEXP '\\b(alert|prompt|confirm)[[:space:]]*\\(';

UPDATE user_profiles
SET city = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(
  REGEXP_REPLACE(city, '</?[a-zA-Z][^>]*>', ' '),
  '\\b(alert|prompt|confirm)[[:space:]]*\\([^)]*\\)', ' '
), '[[:space:]]{2,}', ' '))
WHERE city REGEXP '</?[a-zA-Z][^>]*>'
   OR city REGEXP '\\b(alert|prompt|confirm)[[:space:]]*\\(';

UPDATE user_profiles
SET country = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(
  REGEXP_REPLACE(country, '</?[a-zA-Z][^>]*>', ' '),
  '\\b(alert|prompt|confirm)[[:space:]]*\\([^)]*\\)', ' '
), '[[:space:]]{2,}', ' '))
WHERE country REGEXP '</?[a-zA-Z][^>]*>'
   OR country REGEXP '\\b(alert|prompt|confirm)[[:space:]]*\\(';
