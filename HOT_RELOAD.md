# Auto-Reload & Debugging Setup

This project is configured for **automatic hot reload** - no need to restart after code changes!

## 🔥 Hot Reload Features

### Backend (Node.js + Express)
- **Nodemon** automatically restarts the server when you save files
- Watches all `.js` and `.json` files in `backend/src/`
- 1-second delay to batch multiple changes
- Type `rs` in terminal to manually restart

### Frontend (React + Vite)
- **Vite HMR (Hot Module Replacement)** updates instantly
- Changes appear in browser without full page reload
- Preserves component state during updates
- Error overlay shows issues immediately

## 🚀 Running with Auto-Reload

### Option 1: Terminal (Recommended)
```bash
# Backend (in one terminal)
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Option 2: VS Code Debugger
1. Press `F5` or go to **Run and Debug** panel
2. Select **"Debug Full Stack"** from dropdown
3. Click the green play button
4. Set breakpoints by clicking left of line numbers
5. Code changes auto-reload while debugging!

## 📝 Auto-Save Configuration

VS Code is configured to:
- ✅ Auto-save files after 1 second of inactivity
- ✅ Format code on save
- ✅ Fix linting issues on save
- ✅ Update imports automatically

## 🐛 Debugging

### Backend Debugging
- Set breakpoints in backend code
- Use **Debug Backend** configuration
- Inspect variables, call stack, and step through code
- Server auto-restarts on changes while debugging

### Frontend Debugging
- Use browser DevTools (F12)
- Or use **Debug Frontend** configuration
- React DevTools extension recommended
- Source maps enabled for debugging original code

## 💡 Tips

1. **No need to restart IDE** - unlike Spring Boot, changes apply instantly
2. **Save files** - auto-save is enabled, but you can also press `Ctrl+S`
3. **Check terminal** - watch for compilation errors
4. **Browser console** - check for frontend errors (F12)
5. **Type `rs`** in backend terminal to force restart if needed

## 🔧 Configuration Files

- `backend/nodemon.json` - Backend auto-reload settings
- `frontend/vite.config.js` - Frontend HMR settings
- `.vscode/settings.json` - Auto-save and editor settings
- `.vscode/launch.json` - Debug configurations

## ⚡ Performance

- Backend restarts in ~1-2 seconds
- Frontend updates in ~100-500ms
- Much faster than Spring Boot's restart cycle!

Enjoy coding without interruptions! 🎉
