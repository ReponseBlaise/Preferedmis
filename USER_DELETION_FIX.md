# User Deletion Fix - Soft Delete Implementation

## Problem

When trying to delete a user who has associated data (messages, attendance records, etc.), the system threw a foreign key constraint error:

```
update or delete on table "users" violates foreign key constraint "messages_receiver_id_fkey"
```

This occurred because the user is referenced in other tables like:
- `messages` (as sender or receiver)
- `attendance` (as the person who recorded attendance)
- `project_members`
- `inventory_items`
- `expenses`
- `documents`
- And more...

## Solution: Soft Delete

Instead of hard deleting users (which causes foreign key violations), the system now **deactivates** users who have data dependencies.

### How It Works

1. **Check for Dependencies**: Before deletion, the system checks if the user has records in related tables.

2. **If Dependencies Exist**:
   - User is **deactivated** (`is_active = false`)
   - User's name is prefixed with `[DELETED]`
   - User's phone is cleared
   - User cannot login anymore
   - Related data is preserved for data integrity

3. **If No Dependencies**:
   - User is hard deleted (removed completely)

### Backend Changes

**File**: `backend/src/controllers/authController.js`

The `deleteUser` function now:
- Checks 10+ tables for user references
- Performs soft delete if dependencies exist
- Returns detailed response about what prevented hard deletion

**Response Example**:
```json
{
  "message": "User deactivated instead of deleted (user has data dependencies)",
  "deactivated": true,
  "dependencies": ["messages", "attendance"],
  "note": "User data is preserved to maintain integrity of related records"
}
```

### Frontend Changes

**File**: `frontend/src/pages/Users.jsx`

- Updated delete confirmation message to explain soft delete behavior
- Shows which tables have dependencies when user is deactivated
- Deactivated users are displayed differently:
  - Grayed out row
  - Name shown as `[DELETED] xxx`
  - Strikethrough text
  - Action buttons disabled

## User Experience

### Deleting a User with No Dependencies
1. Click Delete button
2. Confirm deletion
3. User is completely removed
4. Success: "User deleted successfully"

### Deleting a User with Dependencies
1. Click Delete button
2. See warning about data preservation
3. Confirm deletion
4. User is deactivated (not removed)
5. Success: "User deactivated (has dependencies: messages, attendance)"
6. User appears grayed out in the list
7. User cannot login or access the system

## Benefits

1. **Data Integrity**: Related records (messages, attendance) remain valid
2. **Audit Trail**: Can still see who recorded attendance, sent messages, etc.
3. **No Errors**: Users don't see confusing database error messages
4. **Reversible**: Admin can reactivate user if needed (by editing)

## Database Schema

No schema changes required! Uses existing `is_active` column.

## Future Enhancements

- [ ] Option to transfer ownership of records to another user before deletion
- [ ] Bulk user deactivation
- [ ] Automatic cleanup of old deactivated users after X years
- [ ] Export user data before deletion for compliance

## Related Tables

The following tables are checked for user references:

| Table | Column | Purpose |
|-------|--------|---------|
| `messages` | `sender_id`, `receiver_id` | Chat messages |
| `project_members` | `user_id` | Project assignments |
| `attendance` | `recorded_by` | Who recorded attendance |
| `inventory_items` | `created_by` | Who added item |
| `expenses` | `created_by` | Who recorded expense |
| `documents` | `owner_id` | Document owner |
| `document_shares` | `shared_by`, `shared_with` | Document sharing |
| `public_updates` | `author_id` | Who posted update |
