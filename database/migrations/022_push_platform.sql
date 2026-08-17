-- Migration 022: push_subscriptions.platform (web/fcm channel routing)
ALTER TABLE push_subscriptions
  ADD COLUMN platform VARCHAR(16) NOT NULL DEFAULT 'web' AFTER p256dh;