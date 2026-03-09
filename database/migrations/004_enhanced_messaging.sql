-- Migration: Enhanced Messaging System
-- Adds support for replies, edits, file attachments, and better tracking

-- Step 1: Add new columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Step 2: Create index for replies
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Step 3: Create message attachments table (for multiple file uploads)
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- Step 4: Add comment
COMMENT ON COLUMN messages.parent_id IS 'References parent message for reply threads';
COMMENT ON COLUMN messages.edited_at IS 'Timestamp when message was last edited';
COMMENT ON COLUMN messages.attachments IS 'JSON array of attachment metadata';
COMMENT ON TABLE message_attachments IS 'Detailed tracking of message file attachments';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced messaging migration completed!';
    RAISE NOTICE 'Added columns: parent_id, edited_at, attachments, priority';
    RAISE NOTICE 'Created table: message_attachments';
    RAISE NOTICE 'Created indexes for performance';
END $$;
