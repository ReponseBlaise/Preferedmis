const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const workerController = require('../controllers/workerController');
const attendanceController = require('../controllers/attendanceController');
const inventoryController = require('../controllers/inventoryController');
const expenseController = require('../controllers/expenseController');
const projectController = require('../controllers/projectController');
const messageController = require('../controllers/messageController');
const dashboardController = require('../controllers/dashboardController');
const reportController = require('../controllers/reportController');
const auditController = require('../controllers/auditController');
const { auth, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/audit');
const getUserProjects = require('../middleware/projectAccess');

// Auth routes
router.post('/auth/register', auth, authorize('manager'), authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', auth, authController.getProfile);
router.get('/auth/users', auth, authorize('manager'), authController.getAllUsers);
router.get('/auth/users/:id/projects', auth, authorize('manager'), authController.getUserProjects);
router.put('/auth/users/:id', auth, authorize('manager'), authController.updateUser);
router.put('/auth/users/:id/password', auth, authorize('manager'), authController.resetPassword);
router.delete('/auth/users/:id', auth, authorize('manager'), authController.deleteUser);

// Worker routes
router.post('/workers', auth, getUserProjects, authorize('employee', 'manager', 'storeman'), auditLog('CREATE', 'workers'), workerController.createWorker);
router.get('/workers', auth, getUserProjects, workerController.getWorkers);
router.get('/workers/:id', auth, getUserProjects, workerController.getWorker);
router.put('/workers/:id', auth, getUserProjects, authorize('employee', 'manager', 'storeman'), auditLog('UPDATE', 'workers'), workerController.updateWorker);
router.delete('/workers/:id', auth, getUserProjects, authorize('manager'), auditLog('DELETE', 'workers'), workerController.deleteWorker);

// Attendance routes
router.post('/attendance', auth, getUserProjects, authorize('employee', 'manager', 'storeman'), auditLog('CREATE', 'attendance'), attendanceController.recordAttendance);
router.get('/attendance', auth, getUserProjects, attendanceController.getAttendance);
router.get('/attendance/payroll', auth, getUserProjects, attendanceController.getPayrollReport);

// Inventory routes
router.post('/inventory', auth, getUserProjects, authorize('storeman', 'manager'), auditLog('CREATE', 'inventory_items'), inventoryController.createItem);
router.get('/inventory', auth, getUserProjects, inventoryController.getItems);
router.put('/inventory/:id', auth, getUserProjects, authorize('storeman', 'manager'), auditLog('UPDATE', 'inventory_items'), inventoryController.updateItem);
router.delete('/inventory/:id', auth, getUserProjects, authorize('storeman', 'manager'), auditLog('DELETE', 'inventory_items'), inventoryController.deleteItem);
router.get('/inventory/report', auth, getUserProjects, inventoryController.getInventoryReport);
router.get('/inventory/total-spent', auth, getUserProjects, inventoryController.getTotalSpent);

// Expense routes
router.post('/expenses', auth, getUserProjects, authorize('storeman', 'manager'), auditLog('CREATE', 'expenses'), expenseController.createExpense);
router.get('/expenses', auth, getUserProjects, expenseController.getExpenses);
router.put('/expenses/:id', auth, getUserProjects, authorize('storeman', 'manager'), auditLog('UPDATE', 'expenses'), expenseController.updateExpense);
router.delete('/expenses/:id', auth, getUserProjects, authorize('storeman', 'manager'), auditLog('DELETE', 'expenses'), expenseController.deleteExpense);

// Project routes
router.post('/projects', auth, getUserProjects, authorize('manager'), auditLog('CREATE', 'projects'), projectController.createProject);
router.get('/projects', auth, getUserProjects, projectController.getProjects);
router.get('/projects/:id', auth, getUserProjects, projectController.getProject);
router.put('/projects/:id', auth, getUserProjects, authorize('manager'), auditLog('UPDATE', 'projects'), projectController.updateProject);
router.delete('/projects/:id', auth, getUserProjects, authorize('manager'), auditLog('DELETE', 'projects'), projectController.deleteProject);
router.post('/projects/:id/members', auth, getUserProjects, authorize('manager'), projectController.addMember);
router.get('/projects/:id/members', auth, getUserProjects, projectController.getMembers);

// Message routes
router.post('/messages', auth, auditLog('CREATE', 'messages'), messageController.sendMessage);
router.get('/messages', auth, messageController.getMessages);
router.put('/messages/:id/read', auth, messageController.markAsRead);

// Dashboard routes
router.get('/dashboard', auth, getUserProjects, dashboardController.getDashboard);

// Report routes
router.get('/reports/payroll/excel', auth, reportController.exportPayrollExcel);
router.get('/reports/payroll/pdf', auth, reportController.exportPayrollPDF);
router.get('/reports/inventory/excel', auth, reportController.exportInventoryExcel);

// Audit routes
router.get('/audit/logs', auth, authorize('manager'), auditController.getAuditLogs);

module.exports = router;
