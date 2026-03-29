import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://preferedmisbackend.vercel.app/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

const extractData = (p) => p.then((r) => r.data);
const blob = (p) => p;

export default {
  login: (c) => extractData(api.post("/auth/login", c)),
  register: (u) => extractData(api.post("/auth/register", u)),
  getProfile: () => extractData(api.get("/auth/profile")),
  getUsers: () => extractData(api.get("/auth/users")),
  
  createWorker: (d) => extractData(api.post("/workers", d)),
  getWorkers: (p) => extractData(api.get("/workers", { params: p })),
  getWorker: (id) => extractData(api.get(`/workers/${id}`)),
  updateWorker: (id, d) => extractData(api.put(`/workers/${id}`, d)),
  deleteWorker: (id) => extractData(api.delete(`/workers/${id}`)),
  
  recordAttendance: (d) => extractData(api.post("/attendance", d)),
  recordBulkAttendance: (d) => extractData(api.post("/attendance/bulk", d)),
  getAttendance: (p) => extractData(api.get("/attendance", { params: p })),
  updateAttendance: (id, d) => extractData(api.put(`/attendance/${id}`, d)),
  deleteAttendance: (id) => extractData(api.delete(`/attendance/${id}`)),
  getPayrollReport: (p) => extractData(api.get("/attendance/payroll", { params: p })),
  
  createInventoryItem: (d) => extractData(api.post("/inventory", d)),
  getInventoryItems: (p) => extractData(api.get("/inventory", { params: p })),
  updateInventoryItem: (id, d) => extractData(api.put(`/inventory/${id}`, d)),
  deleteInventoryItem: (id) => extractData(api.delete(`/inventory/${id}`)),
  getInventoryReport: (p) => extractData(api.get("/inventory/report", { params: p })),
  getTotalSpent: (p) => extractData(api.get("/inventory/total-spent", { params: p })),
  
  recordStockMovement: (d) => extractData(api.post("/stock-movements", d)),
  getStockMovements: (id, p) => extractData(api.get(`/stock-movements/item/${id}`, { params: p })),
  getStockSummary: (id) => extractData(api.get(`/stock-movements/item/${id}/summary`)),
  getProjectStockMovements: (id, p) => extractData(api.get(`/stock-movements/project/${id}`, { params: p })),
  deleteStockMovement: (id) => extractData(api.delete(`/stock-movements/${id}`)),
  
  createExpense: (d) => extractData(api.post("/expenses", d)),
  getExpenses: (p) => extractData(api.get("/expenses", { params: p })),
  updateExpense: (id, d) => extractData(api.put(`/expenses/${id}`, d)),
  deleteExpense: (id) => extractData(api.delete(`/expenses/${id}`)),
  
  createProject: (d) => extractData(api.post("/projects", d)),
  getProjects: (p) => extractData(api.get("/projects", { params: p })),
  getProject: (id) => extractData(api.get(`/projects/${id}`)),
  updateProject: (id, d) => extractData(api.put(`/projects/${id}`, d)),
  deleteProject: (id) => extractData(api.delete(`/projects/${id}`)),
  addProjectMember: (id, d) => extractData(api.post(`/projects/${id}/members`, d)),
  getProjectMembers: (id) => extractData(api.get(`/projects/${id}/members`)),
  
  sendMessage: (d) => extractData(api.post("/messages", d)),
  getMessages: (p) => extractData(api.get("/messages", { params: p })),
  getConversations: () => extractData(api.get("/messages/conversations")),
  markMessageAsRead: (id) => extractData(api.put(`/messages/${id}/read`)),
  editMessage: (id, d) => extractData(api.put(`/messages/${id}`, d)),
  deleteMessage: (id) => extractData(api.delete(`/messages/${id}`)),
  forwardMessage: (id, d) => extractData(api.post(`/messages/${id}/forward`, d)),
  uploadAttachment: (id, f) => extractData(api.post(`/messages/${id}/attachments`, f, 
    { headers: { "Content-Type": "multipart/form-data" } })),
  getMessageAttachments: (id) => extractData(api.get(`/messages/${id}/attachments`)),
  deleteAttachment: (id, aid) => extractData(api.delete(`/messages/${id}/attachments/${aid}`)),
  
  getDashboard: (p) => extractData(api.get("/dashboard", { params: p })),
  
  exportPayrollExcel: (p) => blob(api.get("/reports/payroll/excel", { params: p, responseType: "blob" })),
  exportPayrollPDF: (p) => blob(api.get("/reports/payroll/pdf", { params: p, responseType: "blob" })),
  exportInventoryExcel: (p) => blob(api.get("/reports/inventory/excel", { params: p, responseType: "blob" })),
  exportInventoryPDF: (p) => blob(api.get("/reports/inventory/pdf", { params: p, responseType: "blob" })),
  
  testEmail: (e) => extractData(api.post("/notifications/test", { email: e })),
  sendSystemUpdate: (d) => extractData(api.post("/notifications/system-update", d)),
  sendProjectUpdate: (d) => extractData(api.post("/notifications/project-update", d)),
  sendTaskAssignment: (d) => extractData(api.post("/notifications/task-assignment", d)),
  sendCustomNotification: (d) => extractData(api.post("/notifications/custom", d)),
  getNotifications: (p) => extractData(api.get("/notifications", { params: p })),
  getUnreadNotifications: () => extractData(api.get("/notifications/unread-count")),
  markNotificationAsRead: (id) => extractData(api.put(`/notifications/${id}/read`)),
  markAllNotificationsAsRead: () => extractData(api.put("/notifications/read-all")),
  deleteNotification: (id) => extractData(api.delete(`/notifications/${id}`)),
  
  uploadDocument: (f) => extractData(api.post("/documents", f, 
    { headers: { "Content-Type": "multipart/form-data" } })),
  getDocuments: (p) => extractData(api.get("/documents", { params: p })),
  getSharedDocuments: () => extractData(api.get("/documents/shared")),
  getDocument: (id) => extractData(api.get(`/documents/${id}`)),
  downloadDocument: (id) => blob(api.get(`/documents/${id}/download`, { responseType: "blob" })),
  shareDocument: (id, d) => extractData(api.put(`/documents/${id}/share`, d)),
  unshareDocument: (id, d) => extractData(api.delete(`/documents/${id}/share`, { data: d })),
  deleteDocument: (id) => extractData(api.delete(`/documents/${id}`)),
  
  createUpdate: (d) => extractData(api.post("/updates", d)),
  getUpdates: (p) => extractData(api.get("/updates", { params: p })),
  getUpdate: (id) => extractData(api.get(`/updates/${id}`)),
  updateUpdate: (id, d) => extractData(api.put(`/updates/${id}`, d)),
  deleteUpdate: (id) => extractData(api.delete(`/updates/${id}`)),
  
  get: (u, c) => api.get(u, c),
  post: (u, d, c) => api.post(u, d, c),
  put: (u, d, c) => api.put(u, d, c),
  delete: (u, c) => api.delete(u, c),
};
