import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import Inventory from './pages/Inventory';
import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Documents from './pages/Documents';
import PublicUpdates from './pages/PublicUpdates';
import './i18n';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<PrivateRoute roles={['manager', 'employee', 'storeman']}><Dashboard /></PrivateRoute>} />
            <Route path="workers" element={<PrivateRoute roles={['manager', 'employee', 'storeman']}><Workers /></PrivateRoute>} />
            <Route path="attendance" element={<PrivateRoute roles={['manager', 'employee', 'storeman']}><Attendance /></PrivateRoute>} />
            <Route path="inventory" element={<PrivateRoute roles={['manager', 'storeman']}><Inventory /></PrivateRoute>} />
            <Route path="projects" element={<PrivateRoute roles={['manager']}><Projects /></PrivateRoute>} />
            <Route path="messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute roles={['manager']}><Users /></PrivateRoute>} />
            <Route path="audit" element={<PrivateRoute roles={['manager']}><AuditLogs /></PrivateRoute>} />
            <Route path="documents" element={<PrivateRoute roles={['manager', 'employee', 'storeman']}><Documents /></PrivateRoute>} />
            <Route path="updates" element={<PrivateRoute roles={['manager', 'employee', 'storeman']}><PublicUpdates /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
