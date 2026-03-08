import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Inbox, Mail, MailOpen, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    receiver_id: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchMessages();
    fetchUsers();
    fetchProjects();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      const data = await api.getMessages({ type: activeTab });
      setMessages(data);
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await api.sendMessage(formData);
      toast.success('Message sent successfully');
      setShowCompose(false);
      resetForm();
      fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.markMessageAsRead(messageId);
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    if (!message.is_read && activeTab === 'received') {
      handleMarkAsRead(message.id);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      receiver_id: '',
      subject: '',
      message: ''
    });
  };

  const unreadCount = messages.filter(m => !m.is_read && activeTab === 'received').length;

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        <button
          onClick={() => { resetForm(); setShowCompose(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Compose
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-6 py-3 font-medium ${
              activeTab === 'received'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Inbox size={20} />
            Inbox
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-6 py-3 font-medium ${
              activeTab === 'sent'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Send size={20} />
            Sent
          </button>
        </div>

        {/* Messages List */}
        <div className="divide-y">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages found
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  !message.is_read && activeTab === 'received' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {!message.is_read && activeTab === 'received' ? (
                      <Mail size={20} className="text-primary-600" />
                    ) : (
                      <MailOpen size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-medium ${!message.is_read && activeTab === 'received' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {activeTab === 'received' 
                          ? message.sender?.full_name || 'Unknown'
                          : message.receiver?.full_name || 'Unknown'}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm mb-1 ${!message.is_read && activeTab === 'received' ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {message.subject}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {message.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Compose Message</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Project (Optional)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                <select
                  required
                  value={formData.receiver_id}
                  onChange={(e) => setFormData({ ...formData, receiver_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Recipient</option>
                  {users.filter(u => u.id !== user.id).map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCompose(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h2>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <p>
                  <span className="font-medium">From:</span>{' '}
                  {selectedMessage.sender?.full_name || 'Unknown'}
                </p>
                <p>{new Date(selectedMessage.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t pt-4 mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
            <button
              onClick={() => setSelectedMessage(null)}
              className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
