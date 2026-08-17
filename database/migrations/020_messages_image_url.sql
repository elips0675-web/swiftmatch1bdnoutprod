-- Migration 020: messages.image_url (image messages support)
ALTER TABLE messages
  ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER text;