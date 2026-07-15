ALTER TABLE subscriptions
  ADD INDEX idx_user_id (user_id),
  ADD INDEX idx_active_expires (is_active, expires_at);
