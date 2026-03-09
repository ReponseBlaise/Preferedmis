# Document Sharing & Notification System

## Overview

This system allows users to:
- **Upload and share documents** with other users
- **Create public updates** for system-wide announcements
- **Receive notifications** via email and SMS when documents are shared or updates are posted
- **Manage users** including deletion (admin/manager only)

---

## Features

### 1. Document Management

#### Upload Documents
- Navigate to **Documents** page
- Click **Upload Document**
- Select file, add title, description, category
- Choose visibility:
  - **Private**: Only you can access
  - **Shared**: Share with specific users
  - **Public**: Everyone can access

#### Share Documents
- Click the **Share** icon on any document
- Select users to share with
- Choose permission level:
  - **View Only**: Can only view in browser
  - **View & Download**: Can download the file
  - **Edit**: Can modify document (future feature)
- Add optional personal message
- Users receive **email + SMS notification**

#### Access Shared Documents
- Click **Shared with Me** tab
- View all documents shared by other users
- Download based on permission level

### 2. Public Updates

#### Create Updates
- Navigate to **Updates** page
- Click **Create Update**
- Fill in:
  - Title and content
  - Type: Announcement, Update, Alert, Milestone
  - Priority: Low, Normal, High, Urgent
  - Pin update (optional)
  - Expiration date (optional)

#### Priority Levels
- **Low**: Informational, no immediate action needed
- **Normal**: Standard updates
- **High**: Important updates, email notification sent
- **Urgent**: Critical updates, email + SMS notification sent

### 3. Notification Center

#### Access Notifications
- Click the **Bell icon** in the header
- View all notifications
- Notifications show:
  - Document shares
  - Public updates
  - System messages
  - Status (email sent, SMS sent, delivered)

#### Notification Actions
- Click notification to view details
- Mark as read individually
- Mark all as read
- Delete notifications

#### Delivery Methods
- **Email**: Sent for document shares and high-priority updates
- **SMS**: Sent for urgent updates (if phone number provided)
- **In-app**: All notifications appear in notification center

### 4. User Management (Manager Only)

#### Delete User
- Navigate to **Users** page
- Click **Delete** (trash icon) on any user
- Confirm deletion
- User is removed from system

#### Deactivate User
- Click the status toggle to activate/deactivate
- Deactivated users cannot login

---

## API Endpoints

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Upload document |
| GET | `/api/documents` | Get all documents (filtered by permissions) |
| GET | `/api/documents/shared` | Get documents shared with current user |
| GET | `/api/documents/:id` | Get single document |
| GET | `/api/documents/:id/download` | Download document |
| PUT | `/api/documents/:id/share` | Share document with users |
| DELETE | `/api/documents/:id/share` | Unshare document |
| DELETE | `/api/documents/:id` | Delete document |

### Public Updates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/updates` | Create public update |
| GET | `/api/updates` | Get all public updates |
| GET | `/api/updates/:id` | Get single update |
| PUT | `/api/updates/:id` | Update public update |
| DELETE | `/api/updates/:id` | Delete public update |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

---

## Database Schema

### Tables Created

```sql
documents           -- Store uploaded documents
document_shares     -- Track document sharing permissions
public_updates      -- System-wide announcements
sms_logs            -- Log of all SMS sent
document_activity   -- Audit trail for document operations
```

### Run Migration

Execute the migration file in your Supabase SQL Editor:

```bash
database/migrations/001_document_sharing.sql
```

---

## SMS Configuration

The system includes a placeholder SMS service. To enable real SMS:

### Option 1: Africa's Talking (Recommended for Rwanda)

1. Create account at https://africastalking.com
2. Get API credentials
3. Update `backend/.env`:
   ```env
   AT_USERNAME=your_username
   AT_API_KEY=your_api_key
   SMS_FROM=PreferredMIS
   ```
4. Uncomment Africa's Talking code in `backend/src/services/smsService.js`

### Option 2: Twilio

1. Create account at https://twilio.com
2. Get credentials
3. Update `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```
4. Uncomment Twilio code in `backend/src/services/smsService.js`

---

## File Storage

Documents are stored on the server's filesystem in the `uploads/` directory.

### Configuration

```env
UPLOAD_DIR=/path/to/uploads  # Optional, defaults to backend/uploads
```

### File Upload Limits

- Maximum file size: **50MB**
- Configurable in `backend/src/routes/index.js`

---

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/documents` | Documents | Document management |
| `/updates` | PublicUpdates | Public updates feed |
| Notification Bell | NotificationCenter | Notification center modal |

---

## User Permissions

| Feature | Manager | Employee | Storeman |
|---------|---------|----------|----------|
| Upload Documents | ✅ | ✅ | ✅ |
| Share Documents | ✅ | ✅ | ✅ |
| Delete Own Documents | ✅ | ✅ | ✅ |
| Create Public Updates | ✅ | ✅ | ✅ |
| Delete Users | ✅ | ❌ | ❌ |
| View All Documents | ✅ | ✅ | ✅ |

---

## Testing

### 1. Test Document Upload
```bash
curl -X POST http://localhost:5000/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "title=Test Document" \
  -F "visibility=public"
```

### 2. Test Public Update
```bash
curl -X POST http://localhost:5000/api/updates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "content": "Scheduled maintenance on Sunday",
    "priority": "high",
    "type": "announcement"
  }'
```

### 3. Test Notifications
```bash
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Login Issues
1. Ensure `SUPABASE_SERVICE_KEY` is correctly set in `backend/.env`
2. Verify Supabase project URL is accessible
3. Check backend server logs for errors

### File Upload Fails
1. Check `uploads/` directory exists and is writable
2. Verify file size is under 50MB limit
3. Check server disk space

### SMS Not Sending
1. SMS service is in simulation mode by default
2. Configure actual SMS provider (see SMS Configuration section)
3. Check SMS logs in database: `SELECT * FROM sms_logs ORDER BY sent_at DESC`

### Notifications Not Appearing
1. Check browser console for errors
2. Verify WebSocket/polling is working
3. Clear browser cache and reload

---

## Security Considerations

1. **File Upload Security**
   - File type validation recommended
   - Consider virus scanning for uploads
   - Implement file size limits

2. **Access Control**
   - Document permissions enforced server-side
   - Users can only access documents shared with them
   - Managers can delete any user

3. **Rate Limiting**
   - Consider adding rate limiting for file uploads
   - Limit SMS sending frequency

---

## Future Enhancements

- [ ] Document versioning
- [ ] Document comments and annotations
- [ ] Bulk document operations
- [ ] Advanced search with filters
- [ ] Document categories management
- [ ] Email templates customization
- [ ] SMS delivery receipts
- [ ] Push notifications
- [ ] Document preview in browser
- [ ] Integration with cloud storage (S3, Google Drive)
