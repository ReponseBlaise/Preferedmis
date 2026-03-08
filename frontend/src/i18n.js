import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      "welcome": "Welcome",
      "login": "Login",
      "logout": "Logout",
      "email": "Email",
      "password": "Password",
      "submit": "Submit",
      "cancel": "Cancel",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "search": "Search",
      "filter": "Filter",
      "export": "Export",
      "loading": "Loading...",
      "noData": "No data available",
      
      // Navigation
      "dashboard": "Dashboard",
      "workers": "Workers",
      "attendance": "Attendance",
      "inventory": "Inventory",
      "expenses": "Expenses",
      "projects": "Projects",
      "messages": "Messages",
      "reports": "Reports",
      
      // Workers
      "addWorker": "Add Worker",
      "workerName": "Worker Name",
      "phone": "Phone",
      "position": "Position",
      "ratePerDay": "Rate per Day (RWF)",
      "paymentType": "Payment Type",
      "daily": "Daily",
      "monthly": "Monthly",
      
      // Attendance
      "recordAttendance": "Record Attendance",
      "attendanceDate": "Attendance Date",
      "daysWorked": "Days Worked",
      "comment": "Comment",
      "payrollReport": "Payroll Report",
      
      // Inventory
      "addItem": "Add Item",
      "itemName": "Item Name",
      "category": "Category",
      "quantity": "Quantity",
      "unit": "Unit",
      "unitPrice": "Unit Price",
      "totalPrice": "Total Price",
      "purchaseDate": "Purchase Date",
      
      // Dashboard
      "activeProjects": "Active Projects",
      "activeWorkers": "Active Workers",
      "todayAttendance": "Today's Attendance",
      "totalSpent": "Total Spent",
      "monthlyPayroll": "Monthly Payroll",
      "unreadMessages": "Unread Messages"
    }
  },
  rw: {
    translation: {
      // Common
      "welcome": "Murakaza neza",
      "login": "Injira",
      "logout": "Sohoka",
      "email": "Imeri",
      "password": "Ijambo ryibanga",
      "submit": "Ohereza",
      "cancel": "Hagarika",
      "save": "Bika",
      "delete": "Siba",
      "edit": "Hindura",
      "search": "Shakisha",
      "filter": "Shungura",
      "export": "Kohereza",
      "loading": "Birategerezwa...",
      "noData": "Nta makuru ahari",
      
      // Navigation
      "dashboard": "Ibikubiyemo",
      "workers": "Abakozi",
      "attendance": "Kwitabira",
      "inventory": "Ibikoresho",
      "expenses": "Amafaranga yakoreshejwe",
      "projects": "Imishinga",
      "messages": "Ubutumwa",
      "reports": "Raporo",
      
      // Workers
      "addWorker": "Ongeraho Umukozi",
      "workerName": "Izina ry'umukozi",
      "phone": "Telefoni",
      "position": "Umwanya",
      "ratePerDay": "Igiciro ku munsi (RWF)",
      "paymentType": "Ubwoko bw'ubwishyu",
      "daily": "Buri munsi",
      "monthly": "Buri kwezi",
      
      // Attendance
      "recordAttendance": "Andika Kwitabira",
      "attendanceDate": "Itariki y'ukwitabira",
      "daysWorked": "Iminsi yakoze",
      "comment": "Icyongereza",
      
      // Inventory
      "addItem": "Ongeraho Ikintu",
      "itemName": "Izina ry'ikintu",
      "category": "Icyiciro",
      "quantity": "Umubare",
      "unit": "Igipimo",
      "unitPrice": "Igiciro",
      "totalPrice": "Igiciro cyose",
      "purchaseDate": "Itariki yo kugura",
      
      // Dashboard
      "activeProjects": "Imishinga ikorerwa",
      "activeWorkers": "Abakozi bakora",
      "todayAttendance": "Kwitabira uyumunsi",
      "totalSpent": "Amafaranga yose yakoreshejwe",
      "monthlyPayroll": "Umushahara w'ukwezi",
      "unreadMessages": "Ubutumwa butarasomwa"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
