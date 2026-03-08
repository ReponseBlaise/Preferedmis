# Installation Instructions

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js 18+ installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] Supabase account created
- [ ] Database URL: https://qufwbidbifawrefppixl.supabase.co
- [ ] Git installed (optional)

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

Expected packages:
- express
- pg
- @supabase/supabase-js
- jsonwebtoken
- bcryptjs
- cors
- dotenv
- nodemailer
- exceljs
- pdfkit
- express-validator
- multer

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

Expected packages:
- react
- react-dom
- react-router-dom
- axios
- tailwindcss
- vite
- recharts
- react-i18next
- react-hot-toast
- lucide-react
- date-fns

### 3. Setup Database

1. Login to Supabase: https://supabase.com
2. Navigate to your project
3. Go to SQL Editor
4. Open `database/schema.sql`
5. Copy all content
6. Paste in SQL Editor
7. Click "Run"
8. Verify tables created (should see 11 tables)

### 4. Get Database Credentials

From Supabase Dashboard:

**Settings > Database:**
- Host: `db.qufwbidbifawrefppixl.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: [Copy from Supabase]

**Settings > API:**
- URL: `https://qufwbidbifawrefppixl.supabase.co`
- anon/public key: `sb_publishable_woGCjRDslRAykx_lWmL89Q_aj17Z5il`
- service_role key: [Copy from Supabase]

### 5. Configure Backend Environment

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://qufwbidbifawrefppixl.supabase.co
SUPABASE_KEY=sb_publishable_woGCjRDslRAykx_lWmL89Q_aj17Z5il
SUPABASE_SERVICE_KEY=[Paste service_role key here]

# Database
DB_HOST=db.qufwbidbifawrefppixl.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[Paste your database password here]

# JWT
JWT_SECRET=preferred_contractors_secret_key_2024
JWT_EXPIRE=7d

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@preferred.rw

# Frontend
FRONTEND_URL=http://localhost:5173
```

**Note for Gmail:**
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password in SMTP_PASSWORD

### 6. Configure Frontend Environment

File `frontend/.env` is already configured:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://qufwbidbifawrefppixl.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_woGCjRDslRAykx_lWmL89Q_aj17Z5il
```

### 7. Create First User

**In Supabase Dashboard:**

1. Go to Authentication > Users
2. Click "Add User"
3. Fill in:
   - Email: `admin@preferred.rw`
   - Password: `Admin@123` (or your choice)
   - Auto Confirm User: ✓ (check this)
4. Click "Create User"
5. **Copy the User ID** (UUID format)

**In SQL Editor:**

```sql
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '[PASTE USER ID HERE]',
  'admin@preferred.rw',
  'System Administrator',
  '+250788000000',
  'manager',
  true
);
```

Replace `[PASTE USER ID HERE]` with the actual UUID from step 5.

### 8. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
Environment: development
Database connected successfully
```

Test: Open http://localhost:5000/health
Should return: `{"status":"OK","timestamp":"..."}`

### 9. Start Frontend Server

Open a NEW terminal:

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 10. Login to Application

1. Open browser: http://localhost:5173
2. You should see the login page
3. Enter credentials:
   - Email: `admin@preferred.rw`
   - Password: `Admin@123` (or what you set)
4. Click "Login"
5. You should be redirected to the dashboard

## Verification Checklist

After installation, verify:

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Database tables created (11 tables)
- [ ] Can access login page
- [ ] Can login with admin account
- [ ] Dashboard loads with statistics
- [ ] Can navigate to different pages
- [ ] No console errors

## Troubleshooting

### Backend won't start

**Error: "Cannot find module"**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Error: "Database connection failed"**
- Check DB_PASSWORD in .env
- Verify Supabase project is active
- Check internet connection

**Error: "Port 5000 already in use"**
- Change PORT in .env to 5001
- Update VITE_API_URL in frontend/.env

### Frontend won't start

**Error: "Cannot find module"**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error: "Failed to fetch"**
- Ensure backend is running
- Check VITE_API_URL in .env
- Check browser console for CORS errors

### Login fails

**Error: "Invalid credentials"**
- Verify user exists in Supabase Auth
- Verify user exists in users table
- Check email and password
- Try resetting password in Supabase

**Error: "Network Error"**
- Check backend is running
- Check API URL is correct
- Check browser console

### Database errors

**Error: "relation does not exist"**
- Run schema.sql again
- Check all tables created
- Verify database name

## Create Additional Test Users

### Employee User

**Supabase Auth:**
- Email: `employee@preferred.rw`
- Password: `Employee@123`

**SQL:**
```sql
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '[USER ID FROM SUPABASE]',
  'employee@preferred.rw',
  'Test Employee',
  '+250788000001',
  'employee',
  true
);
```

### Storeman User

**Supabase Auth:**
- Email: `storeman@preferred.rw`
- Password: `Storeman@123`

**SQL:**
```sql
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '[USER ID FROM SUPABASE]',
  'storeman@preferred.rw',
  'Test Storeman',
  '+250788000002',
  'storeman',
  true
);
```

## Next Steps

After successful installation:

1. **Create a Project**
   - Login as manager
   - Go to Projects
   - Click "Add Project"
   - Fill in project details

2. **Add Workers**
   - Go to Workers
   - Select your project
   - Click "Add Worker"
   - Enter worker information

3. **Record Attendance**
   - Go to Attendance
   - Select project and date
   - Mark attendance for workers

4. **Add Inventory**
   - Go to Inventory
   - Click "Add Item"
   - Enter item details

5. **Generate Reports**
   - Go to Attendance
   - Click "Payroll Report"
   - Select date range
   - Export to Excel or PDF

## Getting Help

If you encounter issues:

1. Check this installation guide
2. Review QUICKSTART.md
3. Check README.md for detailed documentation
4. Review error messages in terminal
5. Check browser console (F12)
6. Verify all environment variables are set

## Success! 🎉

If you can login and see the dashboard, installation is complete!

You now have a fully functional Preferred Contractors Management System.

---

**Need deployment help?** See DEPLOYMENT_GUIDE.md for cPanel deployment instructions.
