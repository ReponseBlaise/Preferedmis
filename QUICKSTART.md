# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Setup Database

1. Login to Supabase: https://qufwbidbifawrefppixl.supabase.co
2. Go to SQL Editor
3. Copy content from `database/schema.sql`
4. Execute the script

### Step 3: Configure Environment

**Backend** - Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://qufwbidbifawrefppixl.supabase.co
SUPABASE_KEY=sb_publishable_woGCjRDslRAykx_lWmL89Q_aj17Z5il
SUPABASE_SERVICE_KEY=[Get from Supabase Settings > API]

DB_HOST=db.qufwbidbifawrefppixl.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[Your Supabase DB Password]

JWT_SECRET=your_random_secret_key_here
JWT_EXPIRE=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@preferred.rw

FRONTEND_URL=http://localhost:5173
```

**Frontend** - Already configured in `frontend/.env`

### Step 4: Create First User

1. Go to Supabase Dashboard > Authentication
2. Click "Add User"
3. Email: `admin@preferred.rw`
4. Password: `Admin@123` (or your choice)
5. Copy the User ID

6. Go to SQL Editor and run:
```sql
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '[Paste User ID here]',
  'admin@preferred.rw',
  'System Administrator',
  '+250788000000',
  'manager',
  true
);
```

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### Step 6: Login

1. Open browser: http://localhost:5173
2. Email: `admin@preferred.rw`
3. Password: `Admin@123` (or what you set)

## ✅ You're Ready!

### What to do next:

1. **Create a Project**
   - Go to Projects
   - Click "Add Project"
   - Fill in details

2. **Add Workers**
   - Go to Workers
   - Select your project
   - Click "Add Worker"
   - Enter worker details

3. **Record Attendance**
   - Go to Attendance
   - Select project and date
   - Mark attendance for workers
   - Add comments if needed

4. **Add Inventory**
   - Go to Inventory
   - Click "Add Item"
   - Enter item details

5. **Generate Reports**
   - Go to Attendance
   - Click "Payroll Report"
   - Select date range
   - Export to Excel or PDF

## 🎯 Test Accounts

Create additional test users:

**Employee Account:**
```sql
-- First create in Supabase Auth, then:
INSERT INTO users (id, email, full_name, role)
VALUES ('[User ID]', 'employee@preferred.rw', 'Test Employee', 'employee');
```

**Storeman Account:**
```sql
-- First create in Supabase Auth, then:
INSERT INTO users (id, email, full_name, role)
VALUES ('[User ID]', 'storeman@preferred.rw', 'Test Storeman', 'storeman');
```

## 🔧 Common Commands

**Backend:**
```bash
npm run dev      # Start development server
npm start        # Start production server
```

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📱 Access Points

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## 🆘 Need Help?

- Check README.md for full documentation
- See DEPLOYMENT_GUIDE.md for production deployment
- Review error logs in terminal
- Check browser console for frontend errors

## 🎉 Happy Coding!
