-- Migration 006: Add storage_path column to message_attachments (safety net)
-- storage_path was added in 004_message_attachments.sql, but this migration
-- ensures the column exists on any database that may have missed it.

ALTER TABLE message_attachments
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

DO $
BEGIN
    RAISE NOTICE 'Migration 006 completed: storage_path column ensured on message_attachments';
END $;
