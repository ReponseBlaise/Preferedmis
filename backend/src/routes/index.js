const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const workerController = require("../controllers/workerController");
const attendanceController = require("../controllers/attendanceController");
const inventoryController = require("../controllers/inventoryController");
const stockMovementController = require("../controllers/stockMovementController");
const expenseController = require("../controllers/expenseController");
const projectController = require("../controllers/projectController");
const messageController = require("../controllers/messageController");
const dashboardController = require("../controllers/dashboardController");
const reportController = require("../controllers/reportController");
const auditController = require("../controllers/auditController");
const notificationController = require("../controllers/notificationController");
const publicUpdateController = require("../controllers/publicUpdateController");
const documentController = require("../controllers/documentController");
const { auth, authorize } = require("../middleware/auth");
const auditLog = require("../middleware/audit");
const getUserProjects = require("../middleware/projectAccess");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Auth routes
router.post("/auth/register-admin", authController.register); // Public endpoint to create first admin
router.post(
  "/auth/register",
  auth,
  authorize("manager"),
  authController.register,
);
router.post("/auth/login", authController.login);
router.get("/auth/profile", auth, authController.getProfile);
router.get(
  "/auth/users",
  auth,
  authorize("manager"),
  authController.getAllUsers,
);
router.get(
  "/auth/users/:id/projects",
  auth,
  authorize("manager"),
  authController.getUserProjects,
);
router.put(
  "/auth/users/:id",
  auth,
  authorize("manager"),
  authController.updateUser,
);
router.put(
  "/auth/users/:id/password",
  auth,
  authorize("manager"),
  authController.resetPassword,
);
router.delete(
  "/auth/users/:id",
  auth,
  authorize("manager"),
  authController.deleteUser,
);

// Worker routes
router.post(
  "/workers",
  auth,
  getUserProjects,
  authorize("employee", "manager", "storeman"),
  auditLog("CREATE", "workers"),
  workerController.createWorker,
);
router.get("/workers", auth, getUserProjects, workerController.getWorkers);
router.get("/workers/:id", auth, getUserProjects, workerController.getWorker);
router.put(
  "/workers/:id",
  auth,
  getUserProjects,
  authorize("employee", "manager", "storeman"),
  auditLog("UPDATE", "workers"),
  workerController.updateWorker,
);
router.delete(
  "/workers/:id",
  auth,
  getUserProjects,
  authorize("manager"),
  auditLog("DELETE", "workers"),
  workerController.deleteWorker,
);

// Attendance routes
router.post(
  "/attendance",
  auth,
  getUserProjects,
  authorize("employee", "manager", "storeman"),
  auditLog("CREATE", "attendance"),
  attendanceController.recordAttendance,
);
router.post(
  "/attendance/bulk",
  auth,
  getUserProjects,
  authorize("employee", "manager", "storeman"),
  auditLog("CREATE", "attendance"),
  attendanceController.recordBulkAttendance,
);
router.get(
  "/attendance",
  auth,
  getUserProjects,
  attendanceController.getAttendance,
);
router.put(
  "/attendance/:id",
  auth,
  getUserProjects,
  authorize("employee", "manager", "storeman"),
  auditLog("UPDATE", "attendance"),
  attendanceController.updateAttendance,
);
router.delete(
  "/attendance/:id",
  auth,
  getUserProjects,
  authorize("manager"),
  auditLog("DELETE", "attendance"),
  attendanceController.deleteAttendance,
);
router.get(
  "/attendance/payroll",
  auth,
  getUserProjects,
  attendanceController.getPayrollReport,
);

// Inventory routes
router.post(
  "/inventory",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("CREATE", "inventory_items"),
  inventoryController.createItem,
);
router.get("/inventory", auth, getUserProjects, inventoryController.getItems);
router.put(
  "/inventory/:id",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("UPDATE", "inventory_items"),
  inventoryController.updateItem,
);
router.delete(
  "/inventory/:id",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("DELETE", "inventory_items"),
  inventoryController.deleteItem,
);
router.get(
  "/inventory/report",
  auth,
  getUserProjects,
  inventoryController.getInventoryReport,
);
router.get(
  "/inventory/total-spent",
  auth,
  getUserProjects,
  inventoryController.getTotalSpent,
);

// Stock Movement routes
router.post(
  "/stock-movements",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("CREATE", "stock_movements"),
  stockMovementController.recordMovement,
);
router.get(
  "/stock-movements/item/:inventory_item_id",
  auth,
  getUserProjects,
  stockMovementController.getMovements,
);
router.get(
  "/stock-movements/item/:inventory_item_id/summary",
  auth,
  getUserProjects,
  stockMovementController.getStockSummary,
);
router.get(
  "/stock-movements/project/:project_id",
  auth,
  getUserProjects,
  stockMovementController.getProjectMovements,
);
router.delete(
  "/stock-movements/:id",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("DELETE", "stock_movements"),
  stockMovementController.deleteMovement,
);

// Expense routes
router.post(
  "/expenses",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("CREATE", "expenses"),
  expenseController.createExpense,
);
router.get("/expenses", auth, getUserProjects, expenseController.getExpenses);
router.put(
  "/expenses/:id",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("UPDATE", "expenses"),
  expenseController.updateExpense,
);
router.delete(
  "/expenses/:id",
  auth,
  getUserProjects,
  authorize("storeman", "manager"),
  auditLog("DELETE", "expenses"),
  expenseController.deleteExpense,
);

// Project routes
router.post(
  "/projects",
  auth,
  getUserProjects,
  authorize("manager"),
  auditLog("CREATE", "projects"),
  projectController.createProject,
);
router.get("/projects", auth, getUserProjects, projectController.getProjects);
router.get(
  "/projects/:id",
  auth,
  getUserProjects,
  projectController.getProject,
);
router.put(
  "/projects/:id",
  auth,
  getUserProjects,
  authorize("manager"),
  auditLog("UPDATE", "projects"),
  projectController.updateProject,
);
router.delete(
  "/projects/:id",
  auth,
  getUserProjects,
  authorize("manager"),
  auditLog("DELETE", "projects"),
  projectController.deleteProject,
);
router.post(
  "/projects/:id/members",
  auth,
  getUserProjects,
  authorize("manager"),
  projectController.addMember,
);
router.get(
  "/projects/:id/members",
  auth,
  getUserProjects,
  projectController.getMembers,
);

// Message routes
router.get("/messages/users", auth, messageController.getUsers);
router.post(
  "/messages",
  auth,
  auditLog("CREATE", "messages"),
  messageController.sendMessage,
);
router.get("/messages", auth, messageController.getMessages);
router.get("/messages/conversations", auth, messageController.getConversations);
router.get("/messages/unread-count", auth, messageController.getUnreadCount);
router.put("/messages/mark-all-read", auth, messageController.markAllAsRead);
router.put("/messages/:id/read", auth, messageController.markAsRead);
router.put(
  "/messages/:id",
  auth,
  auditLog("UPDATE", "messages"),
  messageController.editMessage,
);
router.delete(
  "/messages/:id",
  auth,
  auditLog("DELETE", "messages"),
  messageController.deleteMessage,
);
router.post("/messages/:id/forward", auth, messageController.forwardMessage);
router.post(
  "/messages/:id/attachments",
  auth,
  upload.single("file"),
  messageController.uploadAttachment,
);
router.get(
  "/messages/:id/attachments",
  auth,
  messageController.getMessageAttachments,
);
router.delete(
  "/messages/:id/attachments/:attachmentId",
  auth,
  messageController.deleteAttachment,
);

// Dashboard routes
router.get(
  "/dashboard",
  auth,
  getUserProjects,
  dashboardController.getDashboard,
);

// Report routes
router.get("/reports/payroll/excel", auth, reportController.exportPayrollExcel);
router.get("/reports/payroll/pdf", auth, reportController.exportPayrollPDF);
router.get(
  "/reports/inventory/excel",
  auth,
  reportController.exportInventoryExcel,
);
router.get("/reports/inventory/pdf", auth, reportController.exportInventoryPDF);

// Audit routes
router.get(
  "/audit/logs",
  auth,
  authorize("manager"),
  auditController.getAuditLogs,
);

// Notification routes
router.post(
  "/notifications/system-update",
  auth,
  authorize("manager"),
  notificationController.sendSystemUpdateToAll,
);
router.post(
  "/notifications/project-update",
  auth,
  getUserProjects,
  authorize("employee", "manager"),
  notificationController.sendProjectUpdate,
);
router.post(
  "/notifications/task-assignment",
  auth,
  authorize("employee", "manager"),
  notificationController.sendTaskAssignment,
);
router.post(
  "/notifications/custom",
  auth,
  authorize("manager"),
  notificationController.sendCustomNotification,
);
router.post("/notifications/test", notificationController.testEmailConfig);
router.get("/notifications", auth, notificationController.getUserNotifications);
router.get(
  "/notifications/unread-count",
  auth,
  notificationController.getUnreadCount,
);
router.put(
  "/notifications/read-all",
  auth,
  notificationController.markAllAsRead,
);
router.put(
  "/notifications/:id/read",
  auth,
  notificationController.markNotificationAsRead,
);
router.delete(
  "/notifications/:id",
  auth,
  notificationController.deleteNotification,
);

// Document routes
router.post(
  "/documents",
  auth,
  upload.single("file"),
  documentController.uploadDocument,
);
router.get("/documents", auth, documentController.getDocuments);
router.get("/documents/shared", auth, documentController.getSharedDocuments);
router.get("/documents/:id", auth, documentController.getDocument);
router.get(
  "/documents/:id/download",
  auth,
  documentController.downloadDocument,
);
router.put("/documents/:id/share", auth, documentController.shareDocument);
router.delete("/documents/:id/share", auth, documentController.unshareDocument);
router.delete("/documents/:id", auth, documentController.deleteDocument);

// Public updates routes
router.post("/updates", auth, publicUpdateController.createPublicUpdate);
router.get("/updates", auth, publicUpdateController.getPublicUpdates);
router.get("/updates/:id", auth, publicUpdateController.getPublicUpdate);
router.put("/updates/:id", auth, publicUpdateController.updatePublicUpdate);
router.delete("/updates/:id", auth, publicUpdateController.deletePublicUpdate);

// Debug endpoint for testing updates
router.get("/debug/updates", async (req, res) => {
  try {
    const { supabaseAdmin } = require("../config/supabase");
    const { data, error } = await supabaseAdmin
      .from("public_updates")
      .select("*")
      .limit(10);

    if (error) {
      return res.json({ error: error.message, code: error.code });
    }

    res.json({ count: (data || []).length, updates: data || [] });
  } catch (err) {
    res.json({ error: err.message });
  }
});

module.exports = router;
