# Preferred Contractors - Setup Complete ✅

## Configuration Summary

### ✅ What's Been Set Up

1. **Backend CORS Updated**
   - Now accepts requests from `https://mis.preferred.rw`
   - Still accepts localhost development requests
   - Added `http://127.0.0.1:5173` for alternative localhost access

2. **Frontend Smart API Detection**
   - Automatically uses correct backend based on where it's accessed from:
     - `localhost` → Uses `http://localhost:5000/api`
     - `https://mis.preferred.rw` → Uses appropriate backend
     - Other domains → Falls back to Vercel production

3. **Enhanced Error Logging**
   - Browser console now shows detailed API request/response logs
   - Backend logs show detailed login attempt logs
   - Easy debugging of CORS and connection issues

---

## How to Use - Two Scenarios

### Scenario 1: Local Development (Recommended) ✅

**Step 1: Create Admin User (First Time Only)**

```bash
node create-admin.js
```

Expected output:
```
✅ Admin user created successfully with email: admin@preferred.rw
```

**Step 2: Start Backend (Terminal 1)**

```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 5000
```

**Step 3: Start Frontend (Terminal 2)**

```bash
cd frontend
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:5173/
```

**Step 4: Login**

1. Open browser: `http://localhost:5173`
2. Login with:
   - Email: `admin@preferred.rw`
   - Password: `Admin@123`

**Expected Browser Console (F12):**
```
[API] Using VITE_API_URL from .env.local http://localhost:5000/api
[API Request] POST /auth/login
[API Response] 200 /auth/login
```

**Expected Backend Terminal:**
```
[LOGIN] Attempting login for email: admin@preferred.rw
[LOGIN] User found in database
[LOGIN] Password verified successfully
[LOGIN] Login successful for user: admin@preferred.rw
```

✅ You should be logged in and see the dashboard.

---

### Scenario 2: Production Domain Access (For Testing Only)

**IMPORTANT:** Your local backend (port 5000 on your computer) is **NOT accessible from the internet** at `https://mis.preferred.rw:5000`.

If you visit `https://mis.preferred.rw` while your local backend is running, the frontend will:
1. Detect HTTPS domain
2. Try to use Vercel production backend
3. Get CORS error (production domain isn't whitelisted on Vercel)

**Solutions:**

**Option A: Use localhost for development (RECOMMENDED)** ✅
```bash
# Always use http://localhost:5173 for local development
http://localhost:5173
```
This is the standard way to develop locally.

**Option B: Expose backend to the internet**
```bash
# Install ngrok: https://ngrok.com
ngrok http 5000
# You'll get: https://abc123.ngrok.io
```

Then set in `frontend/.env.local`:
```
VITE_API_URL=https://abc123.ngrok.io/api
```

**Option C: Use production backend**
- Deploy your backend to Vercel
- Update CORS whitelist on the Vercel backend to include `https://mis.preferred.rw`
- Or use the production frontend at `https://preferredmisui.vercel.app`

---

## First Time Admin Setup

If you haven't created an admin user yet:

```bash
node create-admin.js
```

Or use Postman/cURL:

```bash
curl -X POST http://localhost:5000/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@preferred.rw",
    "password": "Admin@123",
    "full_name": "Admin User",
    "phone": "+250788000000",
    "role": "manager"
  }'
```

---

## Troubleshooting

### "CORS Error: Access to XMLHttpRequest... blocked by CORS policy"

**This means:** Your frontend is on a different domain than the backend, and the backend doesn't allow it.

**Solutions:**

1. **Using localhost? (RECOMMENDED)** ✅
   - Use `http://localhost:5173` (NOT `https://`)
   - Backend at `http://localhost:5000` 
   - Same protocol + localhost = no CORS issues

2. **Using HTTPS domain like `https://mis.preferred.rw`?**
   - Your **local backend (port 5000) is NOT accessible** from the internet
   - The frontend falls back to Vercel production backend
   - Vercel production backend doesn't have your domain in CORS whitelist
   - **Solution:** Use localhost for development (Option A above)

3. **Getting CORS on Vercel production?**
   - Make sure backend CORS config has your domain listed
   - Check: `backend/src/server.js` → `allowedOrigins` array
   - Redeploy backend to Vercel after adding your domain

### "Login fails" or "Network Error"

**Check these in order:**

1. **Are you using `http://localhost:5173`?** (NOT `https://`)
   ```
   ✅ http://localhost:5173
   ❌ https://localhost:5173
   ❌ https://mis.preferred.rw
   ```

2. **Is backend running?**
   ```bash
   cd backend && npm run dev
   # Should see: Server running on port 5000
   ```

3. **Check browser console (F12):**
   - Look for `[API]` messages
   - Verify it says `Using VITE_API_URL: http://localhost:5000/api`
   - If it says "Using Vercel production backend" → you're not on localhost!

4. **Check backend logs:**
   - Look for `[LOGIN]` messages
   - See if user was found in database
   - Check for any error messages

5. **Does admin user exist?**
   ```bash
   node create-admin.js
   ```

### "Nothing is coming from backend"

1. **Is backend actually running?**
   ```bash
   # In backend directory
   npm run dev
   # Should see: Server running on port 5000
   ```

2. **Check the browser console for API URL:**
   - F12 → Console tab
   - Look for `[API] Using...` message
   - If it says Vercel, you're not on localhost
   - If it says `http://localhost:5000/api`, backend should work

3. **Try curl to test backend directly:**
   ```bash
   curl http://localhost:5000/health
   # Should return success
   ```

4. **Check firewall:**
   - Windows firewall may block port 5000
   - Add Node.js to firewall exceptions

**If you see:** "Access to XMLHttpRequest at ... blocked by CORS policy"

- Backend CORS is now configured correctly
- Make sure you're using the right domain (localhost:5173 or mis.preferred.rw)
- Clear browser cache and try again

### Backend Connection Failed

**If you get "Failed to load resource":**

1. Make sure backend is running on port 5000
2. Check there are no PORT conflicts:
   ```bash
   # Check what's using port 5000
   netstat -ano | findstr :5000  # Windows
   lsof -i :5000                 # Mac/Linux
   ```

---

## Files Modified

- `frontend/.env.local` - API URL configuration
- `frontend/src/services/api.js` - Smart API detection + logging
- `frontend/src/pages/Login.jsx` - Enhanced error display
- `frontend/src/contexts/AuthContext.jsx` - Enhanced login logging
- `backend/src/server.js` - Updated CORS origins
- `backend/src/controllers/authController.js` - Enhanced login logging

---

## Next Steps

1. ✅ Verify backend is running
2. ✅ Create admin user (if needed)
3. ✅ Start frontend
4. ✅ Login with admin credentials
5. ✅ Access dashboard

---

Good luck! 🚀
