-- Migration 004: Message attachments via Supabase Storage + messages enhancements
-- Run this in Supabase SQL Editor

-- Add missing columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

-- Message attachments table (uses Supabase Storage, not disk)
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    storage_path TEXT,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);

-- Supabase Storage bucket (run separately in Supabase dashboard Storage section,
-- or via this SQL if using storage schema):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true)
-- ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Migration 004 completed: message_attachments table created, messages columns added';
END $$;
