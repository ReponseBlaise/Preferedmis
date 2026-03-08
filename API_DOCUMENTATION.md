# API Documentation

Base URL: `http://localhost:5000/api` (Development)
Production: `https://api.yourdomain.com/api`

## Authentication

All endpoints except `/auth/login` require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

---

## Authentication Endpoints

### POST /auth/register
Create a new user (Manager only)

**Authorization**: Manager role required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe",
  "phone": "+250788000000",
  "role": "employee"
}
```

**Response**: `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "employee"
  }
}
```

---

### POST /auth/login
Authenticate user and get JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response**: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "manager"
  }
}
```

---

### GET /auth/profile
Get current user profile

**Authorization**: Required

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+250788000000",
  "role": "manager"
}
```

---

## Worker Endpoints

### POST /workers
Create a new worker

**Authorization**: Employee or Manager

**Request Body**:
```json
{
  "project_id": "uuid",
  "full_name": "Worker Name",
  "phone": "+250788000001",
  "position": "Mason",
  "rate_per_day": 5000,
  "payment_type": "daily"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "full_name": "Worker Name",
  "phone": "+250788000001",
  "position": "Mason",
  "rate_per_day": 5000,
  "payment_type": "daily",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /workers
Get all workers

**Authorization**: Required

**Query Parameters**:
- `project_id` (optional): Filter by project
- `is_active` (optional): Filter by active status (true/false)

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "full_name": "Worker Name",
    "phone": "+250788000001",
    "position": "Mason",
    "rate_per_day": 5000,
    "payment_type": "daily",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /workers/:id
Get single worker

**Authorization**: Required

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "full_name": "Worker Name",
  "phone": "+250788000001",
  "position": "Mason",
  "rate_per_day": 5000,
  "payment_type": "daily",
  "is_active": true
}
```

---

### PUT /workers/:id
Update worker

**Authorization**: Employee or Manager

**Request Body** (all fields optional):
```json
{
  "full_name": "Updated Name",
  "phone": "+250788000002",
  "position": "Carpenter",
  "rate_per_day": 6000,
  "payment_type": "monthly",
  "is_active": false
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "full_name": "Updated Name",
  ...
}
```

---

### DELETE /workers/:id
Delete worker

**Authorization**: Manager only

**Response**: `200 OK`
```json
{
  "message": "Worker deleted successfully"
}
```

---

## Attendance Endpoints

### POST /attendance
Record attendance

**Authorization**: Employee or Manager

**Request Body**:
```json
{
  "worker_id": "uuid",
  "project_id": "uuid",
  "attendance_date": "2024-01-15",
  "days_worked": 1.0,
  "comment": "Full day worked"
}
```

**Note**: `days_worked` can be 0.25, 0.5, 0.75, or 1.0

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "worker_id": "uuid",
  "project_id": "uuid",
  "attendance_date": "2024-01-15",
  "days_worked": 1.0,
  "comment": "Full day worked",
  "recorded_by": "uuid",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /attendance
Get attendance records

**Authorization**: Required

**Query Parameters**:
- `project_id` (optional): Filter by project
- `worker_id` (optional): Filter by worker
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "worker_id": "uuid",
    "full_name": "Worker Name",
    "position": "Mason",
    "rate_per_day": 5000,
    "attendance_date": "2024-01-15",
    "days_worked": 1.0,
    "comment": "Full day worked",
    "recorded_by_name": "Employee Name"
  }
]
```

---

### GET /attendance/payroll
Generate payroll report

**Authorization**: Required

**Query Parameters** (required):
- `project_id`: Project ID
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Response**: `200 OK`
```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "workers": [
    {
      "worker_id": "uuid",
      "full_name": "Worker Name",
      "phone": "+250788000001",
      "position": "Mason",
      "rate_per_day": 5000,
      "payment_type": "daily",
      "total_days_worked": 22,
      "total_amount": 110000
    }
  ],
  "total_payroll": 110000
}
```

---

## Inventory Endpoints

### POST /inventory
Add inventory item

**Authorization**: Storeman or Manager

**Request Body**:
```json
{
  "project_id": "uuid",
  "category_id": "uuid",
  "name": "Cement",
  "description": "50kg bags",
  "quantity": 100,
  "unit": "bags",
  "unit_price": 15000,
  "purchase_date": "2024-01-15"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "category_id": "uuid",
  "name": "Cement",
  "description": "50kg bags",
  "quantity": 100,
  "unit": "bags",
  "unit_price": 15000,
  "total_price": 1500000,
  "purchase_date": "2024-01-15",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /inventory
Get inventory items

**Authorization**: Required

**Query Parameters**:
- `project_id` (optional): Filter by project
- `category_id` (optional): Filter by category
- `search` (optional): Search in name and description

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "category_id": "uuid",
    "category_name": "Construction Materials",
    "category_type": "material",
    "name": "Cement",
    "description": "50kg bags",
    "quantity": 100,
    "unit": "bags",
    "unit_price": 15000,
    "total_price": 1500000,
    "purchase_date": "2024-01-15"
  }
]
```

---

### PUT /inventory/:id
Update inventory item

**Authorization**: Storeman or Manager

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "quantity": 150,
  "unit_price": 16000
}
```

**Response**: `200 OK`

---

### DELETE /inventory/:id
Delete inventory item

**Authorization**: Storeman or Manager

**Response**: `200 OK`
```json
{
  "message": "Item deleted successfully"
}
```

---

### GET /inventory/report
Get inventory report

**Authorization**: Required

**Query Parameters**:
- `project_id` (required): Project ID
- `start_date` (optional): Start date
- `end_date` (optional): End date

**Response**: `200 OK`
```json
{
  "categories": [
    {
      "category": "Construction Materials",
      "item_count": 15,
      "total_value": 5000000
    }
  ],
  "total_spent": 5000000
}
```

---

### GET /inventory/total-spent
Get total spending

**Authorization**: Required

**Query Parameters**:
- `project_id` (required): Project ID

**Response**: `200 OK`
```json
{
  "total_spent": 7500000
}
```

---

## Expense Endpoints

### POST /expenses
Create expense

**Authorization**: Storeman or Manager

**Request Body**:
```json
{
  "project_id": "uuid",
  "expense_type": "Transport",
  "description": "Fuel for truck",
  "amount": 50000,
  "expense_date": "2024-01-15"
}
```

**Response**: `201 Created`

---

### GET /expenses
Get expenses

**Authorization**: Required

**Query Parameters**:
- `project_id` (optional): Filter by project
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `expense_type` (optional): Filter by type

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "expense_type": "Transport",
    "description": "Fuel for truck",
    "amount": 50000,
    "expense_date": "2024-01-15",
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### PUT /expenses/:id
Update expense

**Authorization**: Storeman or Manager

**Response**: `200 OK`

---

### DELETE /expenses/:id
Delete expense

**Authorization**: Storeman or Manager

**Response**: `200 OK`

---

## Project Endpoints

### POST /projects
Create project

**Authorization**: Manager only

**Request Body**:
```json
{
  "name": "Building Construction",
  "description": "5-story building",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

**Response**: `201 Created`

---

### GET /projects
Get all projects

**Authorization**: Required

**Query Parameters**:
- `status` (optional): Filter by status (active, completed, on_hold)

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Building Construction",
    "description": "5-story building",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "status": "active",
    "created_by": "uuid",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /projects/:id
Get single project

**Authorization**: Required

**Response**: `200 OK`

---

### PUT /projects/:id
Update project

**Authorization**: Manager only

**Response**: `200 OK`

---

### DELETE /projects/:id
Delete project

**Authorization**: Manager only

**Response**: `200 OK`

---

### POST /projects/:id/members
Add team member to project

**Authorization**: Manager only

**Request Body**:
```json
{
  "user_id": "uuid"
}
```

**Response**: `201 Created`

---

### GET /projects/:id/members
Get project team members

**Authorization**: Required

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "full_name": "Team Member",
    "email": "member@example.com",
    "role": "employee",
    "joined_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## Message Endpoints

### POST /messages
Send message

**Authorization**: Required

**Request Body**:
```json
{
  "project_id": "uuid",
  "receiver_id": "uuid",
  "subject": "Message Subject",
  "message": "Message content",
  "attachment_url": "https://..."
}
```

**Response**: `201 Created`

---

### GET /messages
Get messages

**Authorization**: Required

**Query Parameters**:
- `project_id` (optional): Filter by project
- `type` (optional): 'sent' or 'received'

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "sender_id": "uuid",
    "sender_name": "Sender Name",
    "receiver_id": "uuid",
    "receiver_name": "Receiver Name",
    "subject": "Message Subject",
    "message": "Message content",
    "attachment_url": null,
    "is_read": false,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### PUT /messages/:id/read
Mark message as read

**Authorization**: Required (must be receiver)

**Response**: `200 OK`

---

## Dashboard Endpoint

### GET /dashboard
Get dashboard statistics

**Authorization**: Manager only

**Query Parameters**:
- `project_id` (required): Project ID

**Response**: `200 OK`
```json
{
  "stats": {
    "active_projects": 5,
    "active_workers": 25,
    "today_attendance": 20,
    "total_spent": 10000000,
    "current_month_payroll": 2500000,
    "unread_messages": 3
  },
  "recent_activities": [...],
  "expenses_by_type": [...],
  "attendance_trend": [...]
}
```

---

## Report Endpoints

### GET /reports/payroll/excel
Export payroll to Excel

**Authorization**: Required

**Query Parameters** (required):
- `project_id`: Project ID
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Response**: Excel file download

---

### GET /reports/payroll/pdf
Export payroll to PDF

**Authorization**: Required

**Query Parameters**: Same as Excel

**Response**: PDF file download

---

### GET /reports/inventory/excel
Export inventory to Excel

**Authorization**: Required

**Query Parameters**:
- `project_id` (required): Project ID
- `start_date` (optional): Start date
- `end_date` (optional): End date

**Response**: Excel file download

---

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production.

## CORS

Configured to accept requests from `FRONTEND_URL` environment variable.

---

**API Version**: 1.0.0
**Last Updated**: 2024
