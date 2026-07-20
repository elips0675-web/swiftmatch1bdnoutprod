ALTER TABLE user_profiles
  ADD COLUMN incognito        BOOLEAN NOT NULL DEFAULT FALSE AFTER boost_until,
  ADD COLUMN passport_mode    BOOLEAN NOT NULL DEFAULT FALSE AFTER incognito,
  ADD COLUMN passport_city    VARCHAR(100) NULL AFTER passport_mode,
  ADD COLUMN passport_lat     DECIMAL(10,7) NULL AFTER passport_city,
  ADD COLUMN passport_lng     DECIMAL(10,7) NULL AFTER passport_lat,
  ADD INDEX idx_incognito (incognito);
