# Deployment Guide - Preferred Contractors Management System

## Prerequisites
- cPanel hosting account with Node.js support
- PostgreSQL database (Supabase already configured)
- Domain or subdomain configured

---

## PART 1: DATABASE SETUP

### Step 1: Setup Supabase Database

1. Go to your Supabase project: https://qufwbidbifawrefppixl.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the entire content from `database/schema.sql`
4. Execute the SQL script
5. Verify all tables are created successfully

### Step 2: Get Database Credentials

1. In Supabase Dashboard, go to Settings > Database
2. Note down:
   - Host: `db.qufwbidbifawrefppixl.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: [Your database password]

---

## PART 2: BACKEND DEPLOYMENT

### Step 1: Prepare Backend Files

1. Open terminal in the `backend` folder
2. Create `.env` file with production values:

```env
PORT=5000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://qufwbidbifawrefppixl.supabase.co
SUPABASE_KEY=sb_publishable_woGCjRDslRAykx_lWmL89Q_aj17Z5il
SUPABASE_SERVICE_KEY=[Get from Supabase Settings > API]

# Database
DB_HOST=db.qufwbidbifawrefppixl.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[Your database password]

# JWT
JWT_SECRET=[Generate a strong random string]
JWT_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[Your Gmail]
SMTP_PASSWORD=[Your Gmail App Password]
EMAIL_FROM=noreply@preferred.rw

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

3. Install dependencies:
```bash
npm install
```

4. Create a ZIP file of the entire backend folder

### Step 2: Upload Backend to cPanel

1. Login to your cPanel
2. Go to **File Manager**
3. Navigate to your home directory (usually `/home/username/`)
4. Create a new folder: `preferred-backend`
5. Upload and extract the backend ZIP file into this folder
6. Ensure all files including `node_modules` are present

### Step 3: Setup Node.js Application in cPanel

1. In cPanel, go to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: Select latest LTS (18.x or higher)
   - **Application mode**: Production
   - **Application root**: `preferred-backend`
   - **Application URL**: Choose subdomain (e.g., `api.yourdomain.com`)
   - **Application startup file**: `src/server.js`
   - **Environment variables**: Add all variables from `.env` file

4. Click **Create**
5. Copy the command shown and run it in Terminal to start the app
6. Click **Run NPM Install** to ensure dependencies are installed

### Step 4: Configure Backend Domain

1. In cPanel, go to **Domains** or **Subdomains**
2. Create subdomain: `api.yourdomain.com`
3. Point it to the Node.js application
4. Ensure SSL certificate is installed (use AutoSSL or Let's Encrypt)

### Step 5: Test Backend

1. Open browser and visit: `https://api.yourdomain.com/health`
2. You should see: `{"status":"OK","timestamp":"..."}`
3. If not working, check error logs in cPanel Node.js App section

---

## PART 3: FRONTEND DEPLOYMENT

### Step 1: Configure Frontend for Production

1. Open `frontend/.env` file
2. Update with production values:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SUPABASE_URL=https://qufwbidbifawrefppixl.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_woGCjRDslRAykx_lWmL89Q_aj17Z5il
```

### Step 2: Build Frontend

1. Open terminal in `frontend` folder
2. Install dependencies:
```bash
npm install
```

3. Build for production:
```bash
npm run build
```

4. This creates a `dist` folder with optimized files

### Step 3: Upload Frontend to cPanel

1. In cPanel File Manager, navigate to `public_html` (or your domain's root)
2. Create folder: `preferred-app` (or use root for main domain)
3. Upload all files from `frontend/dist` folder
4. Ensure `index.html` is in the root of this folder

### Step 4: Configure Frontend Domain

1. If using subdomain (e.g., `app.yourdomain.com`):
   - Create subdomain in cPanel
   - Point document root to `public_html/preferred-app`

2. If using main domain:
   - Point domain to `public_html/preferred-app`

3. Ensure SSL is enabled

### Step 5: Configure .htaccess for React Router

Create `.htaccess` file in frontend root with:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

---

## PART 4: CREATE INITIAL USERS

### Step 1: Create Manager Account

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Create user with email and password
4. Copy the User ID

### Step 2: Insert User into Database

1. Go to SQL Editor in Supabase
2. Run this query (replace values):

```sql
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '[User ID from Supabase Auth]',
  'manager@preferred.rw',
  'System Manager',
  '+250788000000',
  'manager',
  true
);
```

### Step 3: Create Additional Users

Repeat for employee and storeman accounts:

```sql
-- Employee
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '[User ID]',
  'employee@preferred.rw',
  'Employee Name',
  '+250788000001',
  'employee',
  true
);

-- Storeman
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '[User ID]',
  'storeman@preferred.rw',
  'Storeman Name',
  '+250788000002',
  'storeman',
  true
);
```

---

## PART 5: TESTING

### Test Checklist:

1. ✅ Backend health check: `https://api.yourdomain.com/health`
2. ✅ Frontend loads: `https://app.yourdomain.com`
3. ✅ Login with manager account
4. ✅ Create a project
5. ✅ Add workers
6. ✅ Record attendance
7. ✅ Add inventory items
8. ✅ Generate reports
9. ✅ Send messages
10. ✅ Check dashboard statistics

---

## PART 6: MAINTENANCE

### Updating Backend:

1. Make changes locally
2. Test thoroughly
3. Build and upload new files
4. Restart Node.js app in cPanel

### Updating Frontend:

1. Make changes locally
2. Run `npm run build`
3. Upload new `dist` files to cPanel
4. Clear browser cache

### Monitoring:

1. Check Node.js app logs in cPanel regularly
2. Monitor database usage in Supabase
3. Set up email alerts for errors
4. Backup database regularly

### Database Backups:

1. In Supabase, go to Settings > Database
2. Use pg_dump or Supabase backup features
3. Schedule regular backups

---

## TROUBLESHOOTING

### Backend not starting:
- Check Node.js version compatibility
- Verify all environment variables are set
- Check error logs in cPanel
- Ensure database connection is working

### Frontend not loading:
- Check .htaccess configuration
- Verify API_URL is correct
- Check browser console for errors
- Ensure CORS is configured in backend

### Database connection issues:
- Verify Supabase credentials
- Check IP whitelist in Supabase
- Test connection from cPanel terminal

### Email not sending:
- Verify SMTP credentials
- Use Gmail App Password (not regular password)
- Check firewall/port restrictions

---

## SECURITY RECOMMENDATIONS

1. Change all default passwords
2. Use strong JWT_SECRET
3. Enable SSL/HTTPS on all domains
4. Regularly update dependencies
5. Monitor audit logs
6. Implement rate limiting
7. Regular security audits
8. Keep Node.js version updated

---

## SUPPORT

For issues or questions:
- Check error logs first
- Review this documentation
- Contact hosting support for cPanel issues
- Check Supabase documentation for database issues

---

## FOLDER STRUCTURE SUMMARY

```
Preferedmis/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   │   └── App.jsx
│   ├── dist/ (after build)
│   └── package.json
└── database/
    └── schema.sql
```

---

## DEPLOYMENT COMPLETE! 🎉

Your Preferred Contractors Management System is now live and ready to use.
