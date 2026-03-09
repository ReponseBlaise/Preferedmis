import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Bell, Check, Trash2, Mail, MessageSquare, File, 
  AlertCircle, Info, CheckCircle, XCircle 
} from 'lucide-react';

const NotificationCenter = ({ onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getAll({ limit: 50 });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success(t('allMarkedAsRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('operationFailed'));
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
      toast.success(t('notificationDeleted'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('deleteFailed'));
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      document_share: <File size={20} className="text-blue-500" />,
      public_update: <Bell size={20} className="text-purple-500" />,
      message: <MessageSquare size={20} className="text-green-500" />,
      system: <Info size={20} className="text-gray-500" />,
      alert: <AlertCircle size={20} className="text-red-500" />
    };
    return icons[type] || <Bell size={20} className="text-gray-500" />;
  };

  const getNotificationStatus = (notification) => {
    if (notification.sms_sent && notification.email_sent) {
      return <CheckCircle size={14} className="text-green-500" title={t('delivered')} />;
    } else if (notification.email_sent) {
      return <Mail size={14} className="text-blue-500" title={t('emailSent')} />;
    } else if (notification.sms_sent) {
      return <MessageSquare size={14} className="text-green-500" title={t('smsSent')} />;
    }
    return null;
  };

  const handleClickNotification = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    onClose();
    
    if (notification.action_url) {
      setTimeout(() => {
        window.location.href = notification.action_url;
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-primary-600" />
            <h2 className="text-xl font-bold">{t('notifications')}</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Check size={16} />
                {t('markAllRead')}
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">{t('loading')}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('noNotifications')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleClickNotification(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold text-sm ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getNotificationStatus(notification)}
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            {t('notificationsAreDeliveredVia')} {unreadCount > 0 && (
              <span className="font-medium">
                {t('email')}
                {user?.phone && ` ${t('and')} SMS`}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
