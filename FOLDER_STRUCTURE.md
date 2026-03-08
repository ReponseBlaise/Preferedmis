# Complete Folder Structure

```
Preferedmis/
│
├── 📁 backend/                          # Node.js Backend API
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   ├── database.js              # PostgreSQL connection pool
│   │   │   └── supabase.js              # Supabase client config
│   │   │
│   │   ├── 📁 controllers/
│   │   │   ├── authController.js        # Login, register, profile
│   │   │   ├── workerController.js      # Worker CRUD operations
│   │   │   ├── attendanceController.js  # Attendance & payroll
│   │   │   ├── inventoryController.js   # Inventory management
│   │   │   ├── expenseController.js     # Expense tracking
│   │   │   ├── projectController.js     # Project management
│   │   │   ├── messageController.js     # Messaging system
│   │   │   ├── dashboardController.js   # Dashboard statistics
│   │   │   └── reportController.js      # Report generation
│   │   │
│   │   ├── 📁 middleware/
│   │   │   ├── auth.js                  # JWT authentication
│   │   │   └── audit.js                 # Audit logging
│   │   │
│   │   ├── 📁 routes/
│   │   │   └── index.js                 # All API routes
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── reportService.js         # Excel & PDF generation
│   │   │   └── emailService.js          # Email notifications
│   │   │
│   │   └── server.js                    # Express app entry point
│   │
│   ├── package.json                     # Backend dependencies
│   ├── .env.example                     # Environment template
│   ├── .env                             # Environment variables (create this)
│   └── .gitignore                       # Git ignore rules
│
├── 📁 frontend/                         # React Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 layout/
│   │   │   │   └── Layout.jsx           # Main layout with sidebar
│   │   │   └── 📁 common/
│   │   │       └── (reusable components)
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── Login.jsx                # Login page
│   │   │   ├── Dashboard.jsx            # Manager dashboard
│   │   │   ├── Workers.jsx              # Worker management
│   │   │   ├── Attendance.jsx           # Attendance & payroll
│   │   │   └── Inventory.jsx            # Inventory management
│   │   │
│   │   ├── 📁 services/
│   │   │   └── api.js                   # Axios API client
│   │   │
│   │   ├── 📁 contexts/
│   │   │   └── AuthContext.jsx          # Authentication context
│   │   │
│   │   ├── 📁 assets/
│   │   │   └── (images, icons, etc.)
│   │   │
│   │   ├── i18n.js                      # Multi-language config
│   │   ├── App.jsx                      # Main app component
│   │   ├── main.jsx                     # React entry point
│   │   └── index.css                    # Global styles + Tailwind
│   │
│   ├── index.html                       # HTML template
│   ├── package.json                     # Frontend dependencies
│   ├── vite.config.js                   # Vite configuration
│   ├── tailwind.config.js               # Tailwind CSS config
│   ├── postcss.config.js                # PostCSS config
│   ├── .env                             # Environment variables
│   └── .gitignore                       # Git ignore rules
│
├── 📁 database/
│   └── schema.sql                       # Complete database schema
│
├── 📄 README.md                         # Complete documentation
├── 📄 DEPLOYMENT_GUIDE.md               # cPanel deployment guide
├── 📄 QUICKSTART.md                     # 5-minute setup guide
├── 📄 INSTALLATION.md                   # Detailed installation steps
├── 📄 PROJECT_SUMMARY.md                # Implementation summary
└── 📄 FOLDER_STRUCTURE.md               # This file

```

## File Descriptions

### Backend Files

#### Configuration
- **database.js**: PostgreSQL connection pool with error handling
- **supabase.js**: Supabase client for authentication and storage

#### Controllers (Business Logic)
- **authController.js**: User authentication (login, register, profile)
- **workerController.js**: Worker CRUD (create, read, update, delete)
- **attendanceController.js**: Attendance recording and payroll calculation
- **inventoryController.js**: Inventory item management
- **expenseController.js**: Expense tracking and reporting
- **projectController.js**: Project and team management
- **messageController.js**: User messaging and file attachments
- **dashboardController.js**: Statistics and analytics
- **reportController.js**: Excel and PDF export

#### Middleware
- **auth.js**: JWT token verification and role-based authorization
- **audit.js**: Automatic audit logging for all operations

#### Services
- **reportService.js**: Generate Excel and PDF reports
- **emailService.js**: Send email notifications

#### Routes
- **index.js**: All API endpoints with authentication and authorization

### Frontend Files

#### Components
- **Layout.jsx**: Main layout with sidebar navigation and header

#### Pages
- **Login.jsx**: User login with language selection
- **Dashboard.jsx**: Manager dashboard with charts and statistics
- **Workers.jsx**: Worker management with CRUD operations
- **Attendance.jsx**: Attendance recording and payroll reports
- **Inventory.jsx**: Inventory management with export

#### Services
- **api.js**: Axios client with interceptors for authentication

#### Contexts
- **AuthContext.jsx**: Global authentication state management

#### Configuration
- **i18n.js**: English and Kinyarwanda translations
- **App.jsx**: Main app with routing
- **main.jsx**: React DOM rendering
- **index.css**: Tailwind CSS and custom styles

### Database
- **schema.sql**: Complete database schema with 11 tables, indexes, and triggers

### Documentation
- **README.md**: Complete project documentation
- **DEPLOYMENT_GUIDE.md**: Step-by-step cPanel deployment
- **QUICKSTART.md**: Quick 5-minute setup
- **INSTALLATION.md**: Detailed installation instructions
- **PROJECT_SUMMARY.md**: Implementation overview

## Key Technologies by Folder

### Backend (`/backend`)
- Node.js + Express.js
- PostgreSQL (via pg)
- Supabase Auth
- JWT authentication
- ExcelJS (Excel generation)
- PDFKit (PDF generation)
- Nodemailer (Email)

### Frontend (`/frontend`)
- React 18
- Vite (build tool)
- TailwindCSS (styling)
- React Router (routing)
- Axios (HTTP client)
- Recharts (charts)
- react-i18next (translations)
- react-hot-toast (notifications)
- Lucide React (icons)

### Database (`/database`)
- PostgreSQL
- Supabase hosted
- 11 tables
- UUID primary keys
- Indexes for performance
- Triggers for timestamps

## Development Workflow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Access App**: http://localhost:5173
4. **API Endpoint**: http://localhost:5000/api

## Production Build

1. **Backend**: Copy to server, set environment variables, start with `npm start`
2. **Frontend**: Run `npm run build`, upload `dist/` folder to web server

## File Counts

- **Backend**: 15 main files
- **Frontend**: 10 main files
- **Database**: 1 schema file
- **Documentation**: 6 files
- **Total**: ~32 core files

## Lines of Code (Approximate)

- **Backend**: ~2,500 lines
- **Frontend**: ~2,000 lines
- **Database**: ~200 lines
- **Documentation**: ~2,000 lines
- **Total**: ~6,700 lines

## Dependencies

### Backend (15 packages)
- express, pg, @supabase/supabase-js
- jsonwebtoken, bcryptjs, cors
- dotenv, nodemailer, multer
- exceljs, pdfkit, express-validator

### Frontend (12 packages)
- react, react-dom, react-router-dom
- axios, tailwindcss, vite
- recharts, react-i18next, i18next
- react-hot-toast, lucide-react, date-fns

## Environment Files

### Backend `.env`
```
PORT, NODE_ENV
SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET, JWT_EXPIRE
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM
FRONTEND_URL
```

### Frontend `.env`
```
VITE_API_URL
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
```

## Git Structure

```
.gitignore files in:
- /backend/.gitignore (node_modules, .env, logs)
- /frontend/.gitignore (node_modules, dist, .env)
```

## Build Outputs

### Backend
- No build step (runs directly with Node.js)
- Production: Use `npm start`

### Frontend
- Build command: `npm run build`
- Output: `/frontend/dist/`
- Contains: Optimized HTML, CSS, JS

## Deployment Folders

### cPanel Backend
```
/home/username/preferred-backend/
├── src/
├── node_modules/
├── package.json
└── .env
```

### cPanel Frontend
```
/home/username/public_html/preferred-app/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── .htaccess
```

---

**This structure provides a clean, maintainable, and scalable architecture for the Preferred Contractors Management System.**
