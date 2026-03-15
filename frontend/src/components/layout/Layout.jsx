import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Calendar, Package,
  FolderKanban, MessageSquare, LogOut, Menu, X, UserCog, Shield,
  Bell, Megaphone, TrendingUp, FileText
} from 'lucide-react';
import NotificationCenter from '../NotificationCenter';
import GlobalSearch from '../common/GlobalSearch';
import api from '../../services/api';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, isManager, isEmployee, isStoreman } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      setUnreadCount(response?.count || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), roles: ['manager', 'employee', 'storeman'] },
    { path: '/workers', icon: Users, label: t('workers'), roles: ['manager', 'employee', 'storeman'] },
    { path: '/attendance', icon: Calendar, label: t('attendance'), roles: ['manager', 'employee', 'storeman'] },
    { path: '/inventory', icon: Package, label: t('inventory'), roles: ['manager', 'storeman'] },
    { path: '/stock-movements', icon: TrendingUp, label: 'Stock Movements', roles: ['manager', 'storeman'] },
    { path: '/projects', icon: FolderKanban, label: t('projects'), roles: ['manager'] },
    { path: '/messages', icon: MessageSquare, label: t('messages'), roles: ['manager', 'employee', 'storeman'] },
    { path: '/users', icon: UserCog, label: 'Users', roles: ['manager'] },
    { path: '/updates', icon: Megaphone, label: t('updates'), roles: ['manager', 'employee', 'storeman'] },
    { path: '/audit', icon: Shield, label: 'Audit Logs', roles: ['manager'] }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  const isActive = (path) => location.pathname === path;

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:static inset-y-0 left-0 z-30 w-64 bg-primary-700 text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-primary-600">
          <h2 className="text-xl font-bold">Preferred</h2>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-2 hover:bg-primary-600 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebarOnMobile}
              className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                isActive(item.path) 
                  ? 'bg-primary-800 border-l-4 border-secondary-500' 
                  : 'hover:bg-primary-600'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info in Sidebar */}
        <div className="p-4 border-t border-primary-600">
          <div className="text-sm">
            <p className="font-semibold truncate">{user?.full_name}</p>
            <p className="text-primary-200 text-xs truncate">{user?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-primary-800 rounded text-xs">
              {user?.role}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 flex-1">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-2 hover:bg-gray-100 rounded transition-colors shrink-0"
              >
                <Menu size={24} />
              </button>
              <div className="hidden sm:block shrink-0">
                <h1 className="text-lg font-semibold text-gray-800">
                  {t('welcome')}, {user?.full_name?.split(' ')[0]}
                </h1>
                <p className="text-xs text-gray-600">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex-1 max-w-md">
                <GlobalSearch />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Notifications Bell */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Language Selector */}
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="en">EN</option>
                <option value="rw">RW</option>
              </select>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline text-sm">{t('logout')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <p className="hidden sm:block">© 2024 Preferred Contractors</p>
            <p>v1.0.0</p>
          </div>
        </footer>
      </div>

      {/* Notification Center Modal */}
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Layout;
