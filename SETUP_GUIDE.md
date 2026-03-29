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

### Scenario 1: Local Development (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Expected output:
```
Server running on port 5000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Expected output:
```
➜  Local:   http://localhost:5173/
```

**Then:**
1. Open browser: `http://localhost:5173`
2. Should see Login page
3. Login with: 
   - Email: `admin@preferred.rw`
   - Password: `Admin@123`

**Browser Console (F12):**
You should see logs like:
```
[API] Using VITE_API_URL: http://localhost:5000/api
[API Request] POST /auth/login
[API Response] 200 /auth/login
```

**Backend Terminal:**
You should see logs like:
```
[LOGIN] Attempting login for email: admin@preferred.rw
[LOGIN] Login successful for user: admin@preferred.rw
```

---

### Scenario 2: Production Domain with Local Backend

If accessing via `https://mis.preferred.rw`:

1. Make sure **backend is running** on your machine (port 5000)
2. Visit: `https://mis.preferred.rw` in browser
3. Frontend will auto-detect and use appropriate backend
4. CORS is configured to accept requests from this domain

**Note:** If you're accessing from a different machine:
- The backend must be exposed to the network (not just localhost)
- Or use a reverse proxy / VPN setup

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

### "Login fails" or "Login failed" message

**Check these in order:**

1. **Is backend running?**
   ```bash
   cd backend && npm run dev
   ```

2. **Check browser console (F12):**
   - Look for `[API Error]` messages
   - Check if it's a CORS error
   - Verify the API URL being used

3. **Check backend logs:**
   - Look for `[LOGIN]` messages
   - See if user was found in database
   - Check password verification status

4. **Does admin user exist?**
   ```bash
   node create-admin.js
   ```

### CORS Error

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
