-- Add spatial location column for geospatial search (MySQL 8.0+)
ALTER TABLE user_profiles
  ADD COLUMN location POINT SRID 4326 DEFAULT NULL
  AFTER lng;

-- Backfill from existing lat/lng
UPDATE user_profiles SET location = ST_SRID(POINT(COALESCE(lng, 0), COALESCE(lat, 0)), 4326)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

ALTER TABLE user_profiles
  ADD SPATIAL INDEX idx_location (location);
