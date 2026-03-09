# Database Migration Guide

## Files Overview

### For NEW Database (Fresh Install)
**File**: `database/schema.sql`
- Use this when setting up a brand new database
- Creates ALL tables from scratch
- No ALTER statements needed

### For EXISTING Database (Already in use)
**File**: `database/migrations/003_update_schema.sql`
- Use this when you already have the old schema
- Uses ALTER TABLE to add new columns
- Creates only missing tables
- Safe to run multiple times

---

## How to Update Existing Database

### Step 1: Run the Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `database/migrations/003_update_schema.sql`
3. Copy all contents
4. Paste into SQL Editor
5. Click **Run**

### Step 2: Verify

Run this to check what was created:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check workers table structure
\d workers

-- Check notifications table structure
\d notifications
```

---

## What Changed

### Workers Table (ALTERED)
```sql
-- Added columns:
monthly_salary DECIMAL(12, 2)
start_date DATE
end_date DATE
```

### Notifications Table (ALTERED)
```sql
-- Added columns:
document_id UUID (references documents)
update_id UUID (references public_updates)
action_url VARCHAR(500)
email_sent BOOLEAN
sms_sent BOOLEAN
```

### New Tables Created
- `documents` - Document storage
- `document_shares` - Document sharing permissions
- `public_updates` - System announcements
- `document_activity` - Document audit log
- `sms_logs` - SMS sending history

---

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove new columns from workers
ALTER TABLE workers 
DROP COLUMN IF EXISTS monthly_salary,
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date;

-- Remove new columns from notifications
ALTER TABLE notifications
DROP COLUMN IF EXISTS document_id,
DROP COLUMN IF EXISTS update_id,
DROP COLUMN IF EXISTS action_url,
DROP COLUMN IF EXISTS email_sent,
DROP COLUMN IF EXISTS sms_sent;

-- Drop new tables
DROP TABLE IF EXISTS sms_logs;
DROP TABLE IF EXISTS document_activity;
DROP TABLE IF EXISTS public_updates;
DROP TABLE IF EXISTS document_shares;
DROP TABLE IF EXISTS documents;
```

---

## Troubleshooting

### Error: "column already exists"
This is normal if you already ran some migrations. The script uses `IF NOT EXISTS` to handle this.

### Error: "foreign key constraint violation"
Make sure tables are created in the right order. The migration script handles this automatically.

### Error: "relation does not exist"
You might be missing base tables. Run `database/schema.sql` first for a fresh install.

---

## Summary

| Scenario | File to Use |
|----------|-------------|
| **New database** | `database/schema.sql` |
| **Existing database** | `database/migrations/003_update_schema.sql` |
| **Check what exists** | `database/check_status.sql` |
