-- Migration: Update schema for new features
-- This script ALTERs existing tables and creates new tables in correct order
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE NEW TABLES FIRST (no dependencies)
-- ============================================

-- Documents Table (must be created before notifications can reference it)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'report', 'invoice', 'contract', 'drawing', 'permit', 'other')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public Updates Table (must be created before notifications can reference it)
CREATE TABLE IF NOT EXISTS public_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'announcement' CHECK (type IN ('announcement', 'update', 'alert', 'milestone')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_pinned BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Shares Table
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'download', 'edit')),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, shared_with)
);

-- Document Activity Log Table
CREATE TABLE IF NOT EXISTS document_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('upload', 'view', 'download', 'share', 'unshare', 'delete', 'update')),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    provider VARCHAR(50),
    provider_message_id VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 2: ALTER EXISTING TABLES
-- ============================================

-- Add monthly employee columns to workers table
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Make rate_per_day nullable (not all workers need it)
ALTER TABLE workers 
ALTER COLUMN rate_per_day DROP NOT NULL;

-- Add new columns to notifications table (now safe because documents and public_updates exist)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS document_id UUID,
ADD COLUMN IF NOT EXISTS update_id UUID,
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false;

-- Add foreign key constraints separately (after columns are added)
DO $$
BEGIN
    -- Add foreign key to documents if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_document_id_fkey'
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_document_id_fkey 
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to public_updates if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_update_id_fkey'
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_update_id_fkey 
        FOREIGN KEY (update_id) REFERENCES public_updates(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

-- Indexes for monthly employees
CREATE INDEX IF NOT EXISTS idx_workers_payment_type ON workers(payment_type);
CREATE INDEX IF NOT EXISTS idx_workers_monthly_active ON workers(payment_type, is_active) WHERE payment_type = 'monthly' AND is_active = true;

-- Indexes for document sharing system
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_user ON document_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_public_updates_project ON public_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_public_updates_author ON public_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_public_updates_pinned ON public_updates(is_pinned);
CREATE INDEX IF NOT EXISTS idx_public_updates_type ON public_updates(type);
CREATE INDEX IF NOT EXISTS idx_document_activity_document ON document_activity(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_user ON document_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_type ON document_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON sms_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_attendance_project ON attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);

-- ============================================
-- STEP 4: CREATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_public_updates_updated_at ON public_updates;
CREATE TRIGGER update_public_updates_updated_at BEFORE UPDATE ON public_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: ADD COMMENTS
-- ============================================

COMMENT ON COLUMN workers.monthly_salary IS 'Fixed monthly salary for monthly employees';
COMMENT ON COLUMN workers.start_date IS 'Employment start date';
COMMENT ON COLUMN workers.end_date IS 'Employment end date (NULL if still employed)';
COMMENT ON TABLE documents IS 'Uploaded documents with sharing capabilities';
COMMENT ON TABLE document_shares IS 'Tracks document sharing permissions between users';
COMMENT ON TABLE public_updates IS 'System-wide announcements and updates visible to all users';
COMMENT ON TABLE sms_logs IS 'Log of all SMS notifications sent';
COMMENT ON TABLE document_activity IS 'Audit trail for document operations';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created tables: documents, document_shares, public_updates, document_activity, sms_logs';
    RAISE NOTICE 'Altered tables: workers, notifications';
    RAISE NOTICE 'Created indexes for performance';
    RAISE NOTICE 'Created triggers for updated_at timestamps';
END $$;
