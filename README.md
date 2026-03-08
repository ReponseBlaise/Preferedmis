# Preferred Contractors Management System

A comprehensive web application for managing employees, materials, attendance, and projects with real-time data and reporting capabilities.

## 🚀 Features

### 1. Employee Management
- Register workers (daily and monthly)
- Record personal information (name, phone, position, rate)
- Track active/inactive status
- Full CRUD operations

### 2. Attendance Management
- Daily attendance recording
- Partial day support (0.25, 0.5, 0.75, 1.0)
- Comments for each attendance record
- Payroll report generation
- Export to Excel and PDF

### 3. Inventory Management
- Add/Edit/Delete inventory items
- Track quantities and prices
- Categorize materials and expenses
- Miscellaneous expenses (communications, fees, tickets, transport)
- Generate stock reports
- Calculate total spending

### 4. Project Management
- Create and manage multiple projects
- Assign team members to projects
- Track project status
- Separate data per project

### 5. User Roles & Permissions
- **Manager**: Full system access, dashboard, reports, audit logs
- **Employee**: Worker management, attendance recording
- **Storeman**: Inventory and expense management

### 6. Messaging System
- Send messages between users
- Attach documents
- Project-based messaging
- Read/unread status

### 7. Dashboard (Manager Only)
- Active projects count
- Active workers count
- Today's attendance
- Total spending
- Monthly payroll
- Unread messages
- Expense charts
- Attendance trends
- Recent activities

### 8. Reporting & Export
- Payroll reports (Excel & PDF)
- Inventory reports (Excel)
- Date range filtering
- Detailed breakdowns

### 9. Audit & Security
- Complete audit trail
- Track all user actions
- IP address logging
- Secure authentication (JWT)

### 10. Multi-language Support
- English
- Kinyarwanda

### 11. Email Notifications
- Welcome emails
- Payroll notifications
- Message alerts

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT + Supabase Auth
- **Email**: Nodemailer
- **Reports**: ExcelJS, PDFKit

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State Management**: Context API
- **HTTP Client**: Axios
- **Charts**: Recharts
- **i18n**: react-i18next
- **Notifications**: react-hot-toast
- **Icons**: Lucide React

### Database
- **PostgreSQL** via Supabase
- UUID primary keys
- Indexed for performance
- Triggers for timestamps
- Audit logging

## 📁 Project Structure

```
Preferedmis/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── supabase.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── workerController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── inventoryController.js
│   │   │   ├── expenseController.js
│   │   │   ├── projectController.js
│   │   │   ├── messageController.js
│   │   │   ├── dashboardController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── audit.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── reportService.js
│   │   │   └── emailService.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Layout.jsx
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Workers.jsx
│   │   │   ├── Attendance.jsx
│   │   │   └── Inventory.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── i18n.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
├── database/
│   └── schema.sql
├── DEPLOYMENT_GUIDE.md
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Supabase account)
- Git

### Local Development Setup

#### 1. Clone Repository
```bash
cd Preferedmis
```

#### 2. Setup Database
1. Go to Supabase Dashboard
2. Run the SQL script from `database/schema.sql`

#### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Backend runs on: http://localhost:5000

#### 4. Setup Frontend
```bash
cd frontend
npm install
# Edit .env if needed
npm run dev
```

Frontend runs on: http://localhost:5173

#### 5. Create Initial User
1. Go to Supabase Auth and create a user
2. Insert user record in database:
```sql
INSERT INTO users (id, email, full_name, role)
VALUES ('[supabase-user-id]', 'admin@preferred.rw', 'Admin', 'manager');
```

#### 6. Login
- Email: admin@preferred.rw
- Password: [password you set in Supabase]

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Manager only)
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile

### Workers
- `POST /api/workers` - Create worker
- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get single worker
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

### Attendance
- `POST /api/attendance` - Record attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/payroll` - Get payroll report

### Inventory
- `POST /api/inventory` - Add item
- `GET /api/inventory` - Get all items
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `GET /api/inventory/report` - Get inventory report
- `GET /api/inventory/total-spent` - Get total spending

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get all expenses
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `GET /api/projects/:id/members` - Get members

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages` - Get messages
- `PUT /api/messages/:id/read` - Mark as read

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Reports
- `GET /api/reports/payroll/excel` - Export payroll (Excel)
- `GET /api/reports/payroll/pdf` - Export payroll (PDF)
- `GET /api/reports/inventory/excel` - Export inventory (Excel)

## 🎨 Color Scheme

Based on preferred.rw website:
- **Primary**: #1e40af (Blue)
- **Secondary**: #f59e0b (Amber/Orange)
- **Accent**: #10b981 (Green)

## 🔒 Security Features

- JWT authentication
- Password hashing (via Supabase)
- Role-based access control
- SQL injection prevention
- XSS protection
- CORS configuration
- Audit logging
- Secure environment variables

## 📊 Database Schema

### Main Tables
- `users` - System users
- `projects` - Projects
- `project_members` - Project team members
- `workers` - Daily/monthly workers
- `attendance` - Attendance records
- `inventory_items` - Inventory items
- `inventory_categories` - Item categories
- `expenses` - Miscellaneous expenses
- `messages` - User messages
- `notifications` - System notifications
- `audit_logs` - Audit trail

## 🌍 Internationalization

Supported languages:
- English (en)
- Kinyarwanda (rw)

Switch language in the UI header or login page.

## 📱 Responsive Design

- Mobile-friendly interface
- Tablet optimized
- Desktop full features
- Touch-friendly controls

## 🔧 Configuration

### Backend Environment Variables
```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
DB_HOST=your_db_host
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
SMTP_USER=your_email
SMTP_PASSWORD=your_email_password
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_key
```

## 📦 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions to cPanel.

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Node.js version (18+)
- Verify database credentials
- Check port availability

**Frontend build fails:**
- Clear node_modules and reinstall
- Check Node.js version
- Verify all dependencies

**Database connection error:**
- Check Supabase credentials
- Verify IP whitelist
- Test connection string

**Login fails:**
- Verify user exists in both Supabase Auth and users table
- Check JWT_SECRET is set
- Verify credentials

## 📈 Future Enhancements

- Mobile app (React Native)
- Advanced analytics
- Document management
- Time tracking
- Budget forecasting
- SMS notifications
- Biometric attendance
- Geolocation tracking

## 👥 User Roles

### Manager
- Full system access
- View dashboard
- Manage all resources
- Generate reports
- View audit logs
- Manage users

### Employee
- Manage workers
- Record attendance
- View assigned projects
- Send messages

### Storeman
- Manage inventory
- Record expenses
- View stock reports
- Send messages

## 📄 License

Proprietary - Preferred Contractors

## 🤝 Support

For support, contact: support@preferred.rw

---

**Built with ❤️ for Preferred Contractors**
