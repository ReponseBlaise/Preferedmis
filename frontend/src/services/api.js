import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://preferedmisbackend.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile')
};

export const workerAPI = {
  create: (data) => api.post('/workers', data),
  getAll: (params) => api.get('/workers', { params }),
  getOne: (id) => api.get(`/workers/${id}`),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`)
};

export const attendanceAPI = {
  record: (data) => api.post('/attendance', data),
  getAll: (params) => api.get('/attendance', { params }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getPayroll: (params) => api.get('/attendance/payroll', { params })
};

export const inventoryAPI = {
  create: (data) => api.post('/inventory', data),
  getAll: (params) => api.get('/inventory', { params }),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  getReport: (params) => api.get('/inventory/report', { params }),
  getTotalSpent: (params) => api.get('/inventory/total-spent', { params })
};

export const stockMovementAPI = {
  record: (data) => api.post('/stock-movements', data),
  getByItem: (itemId, params) => api.get(`/stock-movements/item/${itemId}`, { params }),
  getSummary: (itemId) => api.get(`/stock-movements/item/${itemId}/summary`),
  getByProject: (projectId, params) => api.get(`/stock-movements/project/${projectId}`, { params }),
  delete: (id) => api.delete(`/stock-movements/${id}`)
};

export const expenseAPI = {
  create: (data) => api.post('/expenses', data),
  getAll: (params) => api.get('/expenses', { params }),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  getMembers: (id) => api.get(`/projects/${id}/members`)
};

export const messageAPI = {
  send: (data) => api.post('/messages', data),
  getAll: (params) => api.get('/messages', { params }),
  getConversations: () => api.get('/messages/conversations'),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAllAsRead: () => api.put('/messages/mark-all-read'),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  edit: (id, data) => api.put(`/messages/${id}`, data),
  delete: (id) => api.delete(`/messages/${id}`),
  forward: (id, data) => api.post(`/messages/${id}/forward`, data),
  uploadAttachment: (id, formData) => api.post(`/messages/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addAttachment: (id, data) => api.post(`/messages/${id}/attachments/add`, data),
  getAttachments: (id) => api.get(`/messages/${id}/attachments`),
  deleteAttachment: (id, attachmentId) => api.delete(`/messages/${id}/attachments/${attachmentId}`)
};

export const dashboardAPI = {
  getData: (params) => api.get('/dashboard', { params })
};

export const reportAPI = {
  exportPayrollExcel: (params) => api.get('/reports/payroll/excel', { params, responseType: 'blob' }),
  exportPayrollPDF: (params) => api.get('/reports/payroll/pdf', { params, responseType: 'blob' }),
  exportInventoryExcel: (params) => api.get('/reports/inventory/excel', { params, responseType: 'blob' })
};

export const notificationAPI = {
  test: (email) => api.post('/notifications/test', { email }),
  sendSystemUpdate: (data) => api.post('/notifications/system-update', data),
  sendProjectUpdate: (data) => api.post('/notifications/project-update', data),
  sendTaskAssignment: (data) => api.post('/notifications/task-assignment', data),
  sendCustom: (data) => api.post('/notifications/custom', data),
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export const documentAPI = {
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/documents', { params }),
  getShared: () => api.get('/documents/shared'),
  getOne: (id) => api.get(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  share: (id, data) => api.put(`/documents/${id}/share`, data),
  unshare: (id, data) => api.delete(`/documents/${id}/share`, { data }),
  delete: (id) => api.delete(`/documents/${id}`)
};

export const updatesAPI = {
  create: (data) => api.post('/updates', data),
  getAll: (params) => api.get('/updates', { params }),
  getOne: (id) => api.get(`/updates/${id}`),
  update: (id, data) => api.put(`/updates/${id}`, data),
  delete: (id) => api.delete(`/updates/${id}`),
};

export default {
  // Auth
  login: (credentials) => authAPI.login(credentials).then(res => res.data),
  register: (userData) => authAPI.register(userData).then(res => res.data),
  getProfile: () => authAPI.getProfile().then(res => res.data),
  getUsers: () => api.get('/auth/users').then(res => res.data),

  // Workers
  createWorker: (data) => workerAPI.create(data).then(res => res.data),
  getWorkers: (params) => workerAPI.getAll(params).then(res => res.data),
  getWorker: (id) => workerAPI.getOne(id).then(res => res.data),
  updateWorker: (id, data) => workerAPI.update(id, data).then(res => res.data),
  deleteWorker: (id) => workerAPI.delete(id).then(res => res.data),

  // Attendance
  recordAttendance: (data) => attendanceAPI.record(data).then(res => res.data),
  getAttendance: (params) => attendanceAPI.getAll(params).then(res => res.data),
  getPayrollReport: (params) => attendanceAPI.getPayroll(params).then(res => res.data),

  // Inventory
  createInventoryItem: (data) => inventoryAPI.create(data).then(res => res.data),
  getInventoryItems: (params) => inventoryAPI.getAll(params).then(res => res.data),
  updateInventoryItem: (id, data) => inventoryAPI.update(id, data).then(res => res.data),
  deleteInventoryItem: (id) => inventoryAPI.delete(id).then(res => res.data),
  getInventoryReport: (params) => inventoryAPI.getReport(params).then(res => res.data),
  getTotalSpent: (params) => inventoryAPI.getTotalSpent(params).then(res => res.data),

  // Stock Movements
  recordStockMovement: (data) => stockMovementAPI.record(data).then(res => res.data),
  getStockMovements: (itemId, params) => stockMovementAPI.getByItem(itemId, params).then(res => res.data),
  getStockSummary: (itemId) => stockMovementAPI.getSummary(itemId).then(res => res.data),
  getProjectStockMovements: (projectId, params) => stockMovementAPI.getByProject(projectId, params).then(res => res.data),
  deleteStockMovement: (id) => stockMovementAPI.delete(id).then(res => res.data),

  // Expenses
  createExpense: (data) => expenseAPI.create(data).then(res => res.data),
  getExpenses: (params) => expenseAPI.getAll(params).then(res => res.data),
  updateExpense: (id, data) => expenseAPI.update(id, data).then(res => res.data),
  deleteExpense: (id) => expenseAPI.delete(id).then(res => res.data),

  // Projects
  createProject: (data) => projectAPI.create(data).then(res => res.data),
  getProjects: (params) => projectAPI.getAll(params).then(res => res.data),
  getProject: (id) => projectAPI.getOne(id).then(res => res.data),
  updateProject: (id, data) => projectAPI.update(id, data).then(res => res.data),
  deleteProject: (id) => projectAPI.delete(id).then(res => res.data),
  addProjectMember: (id, data) => projectAPI.addMember(id, data).then(res => res.data),
  getProjectMembers: (id) => projectAPI.getMembers(id).then(res => res.data),

  // Messages
  sendMessage: (data) => messageAPI.send(data).then(res => res.data),
  getMessages: (params) => messageAPI.getAll(params).then(res => res.data),
  markMessageAsRead: (id) => messageAPI.markAsRead(id).then(res => res.data),

  // Dashboard
  getDashboard: (params) => dashboardAPI.getData(params).then(res => res.data),

  // Reports
  exportPayrollExcel: (params) => reportAPI.exportPayrollExcel(params),
  exportPayrollPDF: (params) => reportAPI.exportPayrollPDF(params),
  exportInventoryExcel: (params) => reportAPI.exportInventoryExcel(params),

  // Notifications
  testEmail: (email) => notificationAPI.test(email),
  sendSystemUpdate: (data) => notificationAPI.sendSystemUpdate(data),
  sendProjectUpdate: (data) => notificationAPI.sendProjectUpdate(data),
  sendTaskAssignment: (data) => notificationAPI.sendTaskAssignment(data),
  sendCustomNotification: (data) => notificationAPI.sendCustom(data),
  notifications: {
    getAll: (params) => notificationAPI.getAll(params).then(res => res.data),
    getUnreadCount: () => notificationAPI.getUnreadCount().then(res => res.data),
    markAsRead: (id) => notificationAPI.markAsRead(id).then(res => res.data),
    markAllAsRead: () => notificationAPI.markAllAsRead().then(res => res.data),
    delete: (id) => notificationAPI.delete(id).then(res => res.data)
  },

  // Documents
  documents: {
    upload: (formData) => documentAPI.upload(formData).then(res => res.data),
    getAll: (params) => documentAPI.getAll(params).then(res => res.data),
    getShared: () => documentAPI.getShared().then(res => res.data),
    getOne: (id) => documentAPI.getOne(id).then(res => res.data),
    download: (id) => documentAPI.download(id),
    share: (id, data) => documentAPI.share(id, data).then(res => res.data),
    unshare: (id, data) => documentAPI.unshare(id, data).then(res => res.data),
    delete: (id) => documentAPI.delete(id).then(res => res.data)
  },

  // Public Updates
  updates: {
    create: (data) => updatesAPI.create(data).then(res => res.data),
    getAll: (params) => updatesAPI.getAll(params).then(res => res.data),
    getOne: (id) => updatesAPI.getOne(id).then(res => res.data),
    update: (id, data) => updatesAPI.update(id, data).then(res => res.data),
    delete: (id) => updatesAPI.delete(id).then(res => res.data)
  },

  // Messages
  messages: {
    send: (data) => messageAPI.send(data).then(res => res.data),
    getAll: (params) => messageAPI.getAll(params).then(res => res.data),
    getConversations: () => messageAPI.getConversations().then(res => res.data),
    getUnreadCount: () => messageAPI.getUnreadCount().then(res => res.data),
    markAllAsRead: () => messageAPI.markAllAsRead().then(res => res.data),
    markAsRead: (id) => messageAPI.markAsRead(id).then(res => res.data),
    edit: (id, data) => messageAPI.edit(id, data).then(res => res.data),
    delete: (id) => messageAPI.delete(id).then(res => res.data),
    forward: (id, data) => messageAPI.forward(id, data).then(res => res.data),
    uploadAttachment: (id, formData) => messageAPI.uploadAttachment(id, formData).then(res => res.data),
    addAttachment: (id, data) => messageAPI.addAttachment(id, data).then(res => res.data),
    getAttachments: (id) => messageAPI.getAttachments(id).then(res => res.data),
    deleteAttachment: (id, attachmentId) => messageAPI.deleteAttachment(id, attachmentId).then(res => res.data)
  },

  // Direct axios instance for custom requests
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config)
};
