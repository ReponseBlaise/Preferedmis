#!/bin/bash

echo "=== Preferred Contractors - Setup Verification ==="
echo ""

# Check if backend is running
echo "1️⃣  Checking if backend is running on port 5000..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
  echo "✅ Backend is running on http://localhost:5000"
  curl -s http://localhost:5000/health | jq . 2>/dev/null || echo "   Response: Server is up"
else
  echo "❌ Backend is NOT running on port 5000"
  echo "   Start it with: cd backend && npm run dev"
fi

echo ""
echo "2️⃣  Checking if admin user exists..."
# Try to login with default admin credentials
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@preferred.rw","password":"Admin@123"}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "token"; then
  echo "✅ Admin user exists and credentials work"
  echo "   Email: admin@preferred.rw"
  echo "   Response: Login successful"
elif echo "$RESPONSE" | grep -q "Invalid credentials"; then
  echo "⚠️  Admin user exists but credentials don't match"
  echo "   Try creating a new admin with: node create-admin.js"
else
  echo "❌ Admin user doesn't exist"
  echo "   Create one with: node create-admin.js"
fi

echo ""
echo "3️⃣  Frontend Setup Instructions:"
echo "   For localhost:5173 development:"
echo "   - Make sure frontend/.env.local exists with:"
echo "     VITE_API_URL=http://localhost:5000/api"
echo ""
echo "   For https://mis.preferred.rw:"
echo "   - Backend now accepts requests from that domain"
echo "   - Backend CORS is configured to allow it"
echo ""

echo "4️⃣  Quick Start:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo "   Then visit: http://localhost:5173"
echo ""

echo "=== Setup Check Complete ==="
