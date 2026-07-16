-- Referral system: unique code + referrer tracking

ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) DEFAULT NULL AFTER role;
ALTER TABLE users ADD COLUMN referred_by INT UNSIGNED DEFAULT NULL AFTER referral_code;
ALTER TABLE users ADD UNIQUE INDEX idx_referral_code (referral_code);
ALTER TABLE users ADD INDEX idx_referred_by (referred_by);
