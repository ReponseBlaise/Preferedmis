-- Document Sharing System Migration
-- Adds support for document sharing, public updates, and enhanced notifications

-- Documents Table
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

-- Document Shares Table (tracks who has access to shared documents)
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

-- Public Updates Table (for system-wide announcements)
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

-- Enhanced Notifications Table (extends existing notifications)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS update_id UUID REFERENCES public_updates(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

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

-- Document Activity Log
CREATE TABLE IF NOT EXISTS document_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('upload', 'view', 'download', 'share', 'unshare', 'delete', 'update')),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_user ON document_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_public_updates_project ON public_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_public_updates_author ON public_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_public_updates_pinned ON public_updates(is_pinned);
CREATE INDEX IF NOT EXISTS idx_document_activity_document ON document_activity(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_user ON document_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON sms_logs(recipient_phone);

-- Trigger for document updated_at
CREATE TRIGGER IF NOT EXISTS update_documents_updated_at 
BEFORE UPDATE ON documents 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for public_updates updated_at
CREATE TRIGGER IF NOT EXISTS update_public_updates_updated_at 
BEFORE UPDATE ON public_updates 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE documents IS 'Stores uploaded documents with sharing capabilities';
COMMENT ON TABLE document_shares IS 'Tracks document sharing permissions between users';
COMMENT ON TABLE public_updates IS 'System-wide announcements and updates visible to all users';
COMMENT ON TABLE sms_logs IS 'Log of all SMS notifications sent';
COMMENT ON TABLE document_activity IS 'Audit trail for document operations';
