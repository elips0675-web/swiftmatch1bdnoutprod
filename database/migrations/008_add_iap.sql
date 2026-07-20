-- Add IAP columns to subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN provider          ENUM('stripe','revenuecat') NULL AFTER user_id,
  ADD COLUMN provider_subscription_id VARCHAR(255) NULL AFTER provider,
  ADD COLUMN status            ENUM('active','canceled','expired','past_due') NOT NULL DEFAULT 'active' AFTER is_active,
  ADD COLUMN current_period_end TIMESTAMP NULL AFTER expires_at,
  ADD INDEX idx_subscriptions_provider (provider, provider_subscription_id);
