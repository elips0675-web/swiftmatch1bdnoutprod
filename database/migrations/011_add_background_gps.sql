ALTER TABLE user_profiles
  ADD COLUMN last_location_update TIMESTAMP NULL DEFAULT NULL AFTER lng;