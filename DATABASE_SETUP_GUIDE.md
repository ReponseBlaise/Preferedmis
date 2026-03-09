# Database Setup Guide

## Overview

This guide explains how to set up the complete database schema for the Preferred Contractors Management System.

## Files Provided

### 1. `complete_schema.sql`
**Purpose**: Creates all tables if they don't exist
**Use this when**: Setting up a new database or ensuring all tables exist

### 2. `check_status.sql`
**Purpose**: Shows current database status
**Use this when**: You want to see what tables exist and their data counts

### 3. `migrations/001_document_sharing.sql`
**Purpose**: Document sharing system tables
**Use this when**: Adding document sharing to existing database

### 4. `migrations/002_monthly_employees.sql`
**Purpose**: Monthly employee columns
**Use this when**: Adding monthly salary support to existing workers table

---

## Quick Setup

### For New Database

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/complete_schema.sql`
3. Paste and run
4. Done! All tables created

### For Existing Database

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/migrations/001_document_sharing.sql`
3. Paste and run
4. Copy contents of `database/migrations/002_monthly_employees.sql`
5. Paste and run
6. Done! New features added

---

## Tables Created

### Core Tables (Always Present)

| Table | Purpose |
|-------|---------|
| `users` | System users (managers, employees, storemen) |
| `projects` | Construction projects |
| `project_members` | User assignments to projects |
| `workers` | Daily and monthly employees |
| `attendance` | Daily attendance records |
| `inventory_categories` | Item categories |
| `inventory_items` | Inventory tracking |
| `expenses` | Project expenses |
| `messages` | Internal messaging |

### Document Sharing Tables (New)

| Table | Purpose |
|-------|---------|
| `documents` | Uploaded files with metadata |
| `document_shares` | Document access permissions |
| `public_updates` | System-wide announcements |
| `document_activity` | Document operation audit log |

### Notification Tables (New)

| Table | Purpose |
|-------|---------|
| `notifications` | User notifications |
| `sms_logs` | SMS sending history |

### Audit Tables

| Table | Purpose |
|-------|---------|
| `audit_logs` | System-wide activity log |

---

## Key Features in Database

### 1. Monthly Employees Support

```sql
-- Workers table includes:
payment_type      VARCHAR(20)  -- 'daily' or 'monthly'
monthly_salary    DECIMAL(12,2) -- For monthly employees
start_date        DATE         -- Employment start
end_date          DATE         -- Employment end (NULL if active)
```

### 2. Document Sharing

```sql
-- Documents table includes:
visibility        VARCHAR(20)  -- 'private', 'shared', 'public'
category          VARCHAR(50)  -- Type of document
download_count    INTEGER      -- Track popularity
```

### 3. Notifications

```sql
-- Notifications table includes:
document_id       UUID         -- Related document
update_id         UUID         -- Related public update
action_url        VARCHAR(500) -- Deep link
email_sent        BOOLEAN      -- Email delivery status
sms_sent          BOOLEAN      -- SMS delivery status
```

---

## Verification

After running the schema, verify with:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: 18 tables
```

Or run `database/check_status.sql` for a detailed report.

---

## Indexes

The schema automatically creates indexes for:
- Foreign keys (faster joins)
- Common filters (status, dates, types)
- Search fields (names, emails)
- Performance optimization

Total: 30+ indexes for optimal performance

---

## Triggers

Automatic `updated_at` timestamp updates for:
- users
- projects
- workers
- attendance
- inventory_items
- expenses
- documents
- public_updates

---

## Default Data

The following inventory categories are automatically inserted:
1. Construction Materials (material)
2. Tools & Equipment (material)
3. Communications (expense)
4. Fees (expense)
5. Tickets (expense)
6. Transport (expense)
7. Other (expense)

---

## Row Level Security (RLS)

RLS is **commented out** by default. To enable:

1. Uncomment the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` lines
2. Add appropriate policies for your use case

Example policy:
```sql
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);
```

---

## Common Issues

### "Table already exists"
Use `complete_schema.sql` - it checks `IF NOT EXISTS` before creating.

### "Column already exists"
For monthly employee columns, use `migrations/002_monthly_employees.sql` which also checks existence.

### "Foreign key constraint violation"
Tables are created in correct order. If issues persist, check for circular dependencies.

### "Permission denied"
Ensure you're using the Supabase service role key or have proper permissions.

---

## Maintenance

### Check Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Data
Use Supabase's built-in backup feature or:
```bash
pg_dump -h db.your-project.supabase.co -U postgres your_database > backup.sql
```

### Clean Old Data
```sql
-- Delete old audit logs (older than 1 year)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete old SMS logs (older than 6 months)
DELETE FROM sms_logs WHERE sent_at < NOW() - INTERVAL '6 months';
```

---

## Support

For issues:
1. Check `check_status.sql` output
2. Review error messages
3. Verify Supabase connection
4. Ensure proper permissions

---

## Changelog

### v2.0 (Current)
- Added monthly employee support
- Added document sharing system
- Added notification system
- Added SMS logging
- Added document activity tracking
- All tables use `IF NOT EXISTS`

### v1.0 (Original)
- Basic tables only
- No document sharing
- No monthly employees
- No notifications
