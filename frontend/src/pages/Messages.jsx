import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Send, Inbox, Mail, MailOpen, Plus, Paperclip, X, Edit2, Trash2,
  Reply, Forward, Eye, AlertCircle, CheckCircle, Clock, FileText,
  Image as ImageIcon, File, ChevronLeft, MoreVertical, Bold, Italic
} from 'lucide-react';

const Messages = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const editInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyMessages, setReplyMessages] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState({});

  const [composeForm, setComposeForm] = useState({
    project_id: '',
    receiver_id: '',
    subject: '',
    message: '',
    priority: 'normal',
    attachments: []
  });

  useEffect(() => {
    fetchMessages();
    fetchUsers();
    fetchProjects();
    fetchUnreadCount();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [activeTab, filterPriority]);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.messages.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = { type: activeTab };
      if (filterPriority !== 'all') params.priority = filterPriority;
      
      const data = await api.messages.getAll(params);
      setMessages(data || []);
      
      // Load replies for each message
      const replies = {};
      for (const msg of data || []) {
        if (msg.id) {
          try {
            const repliesData = await api.messages.getAll({ parent_id: msg.id });
            replies[msg.id] = repliesData || [];
          } catch (e) {
            replies[msg.id] = [];
          }
        }
      }
      setReplyMessages(replies);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error(t('failedToLoadMessages') || 'Failed to load messages');
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
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!composeForm.receiver_id || !composeForm.subject || !composeForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Send message
      const { data: response } = await api.post('/messages', {
        ...composeForm,
        attachments: undefined, // Don't send attachments in this request
      });
      
      // Upload attachments if any
      if (composeForm.attachments.length > 0 && response.id) {
        for (const attachment of composeForm.attachments) {
          const formData = new FormData();
          formData.append('file', attachment);
          try {
            await api.post(`/messages/${response.id}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (err) {
            console.error('Failed to upload attachment:', err);
            toast.error(`Failed to upload ${attachment.name}`);
          }
        }
      }
      
      toast.success(t('messageSentSuccessfully') || 'Message sent successfully!');
      setShowCompose(false);
      resetComposeForm();
      fetchMessages();
      fetchUnreadCount();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(error.response?.data?.error || t('failedToSendMessage') || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId, replyText) => {
    if (!replyText || replyText.trim() === '') {
      toast.error('Reply message is required');
      return;
    }

    try {
      const originalMessage = messages.find(m => m.id === parentId);
      await api.sendMessage({
        receiver_id: originalMessage.sender_id === user.id ? originalMessage.receiver_id : originalMessage.sender_id,
        subject: originalMessage.subject,
        message: replyText,
        parent_id: parentId,
        project_id: originalMessage.project_id
      });
      
      toast.success(t('replySent') || 'Reply sent successfully!');
      setReplyMessages(prev => ({ ...prev, [parentId]: undefined }));
      fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.error || t('failedToSendReply') || 'Failed to send reply');
    }
  };

  const handleEdit = async (messageId) => {
    if (!editText || editText.trim() === '') {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      await api.messages.edit(messageId, { message: editText });
      toast.success(t('messageEdited') || 'Message edited successfully');
      setEditingMessage(null);
      fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.error || t('failedToEditMessage') || 'Failed to edit message');
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm(t('confirmDeleteMessage') || 'Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.messages.delete(messageId);
      toast.success(t('messageDeleted') || 'Message deleted successfully');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.error || t('failedToDeleteMessage') || 'Failed to delete message');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.messages.markAsRead(messageId);
      fetchMessages();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.messages.markAllAsRead();
      toast.success(t('allMarkedAsRead') || 'All messages marked as read');
      fetchMessages();
      fetchUnreadCount();
    } catch (error) {
      toast.error(t('failedToMarkAsRead') || 'Failed to mark messages as read');
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    if (!message.is_read && activeTab === 'received') {
      await handleMarkAsRead(message.id);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return null;
      }
      return file;
    }).filter(Boolean); // Filter out nulls for files that were too large

    setComposeForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index) => {
    setComposeForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const resetComposeForm = () => {
    setComposeForm({
      project_id: '',
      receiver_id: '',
      subject: '',
      message: '',
      priority: 'normal',
      attachments: []
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500 bg-gray-100',
      normal: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <AlertCircle size={16} />;
    if (priority === 'high') return <AlertCircle size={16} />;
    return null;
  };

  const filteredMessages = messages.filter(msg => {
    if (searchQuery && !msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !msg.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAttachmentIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon size={16} />;
    if (fileType.includes('pdf')) return <FileText size={16} />;
    return <File size={16} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('messages') || 'Messages'}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount > 0 ? (
              <span className="text-red-600 font-medium">
                📬 {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
              </span>
            ) : (
              '✓ All messages read'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <CheckCircle size={18} />
              {t('markAllRead') || 'Mark All Read'}
            </button>
          )}
          <button
            onClick={() => { resetComposeForm(); setShowCompose(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{t('compose') || 'Compose'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={t('searchMessages') || 'Search messages...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <SearchIcon className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <MoreVertical size={18} />
            {t('filters') || 'Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('priority') || 'Priority'}
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">{t('all') || 'All'}</option>
                  <option value="low">{t('low') || 'Low'}</option>
                  <option value="normal">{t('normal') || 'Normal'}</option>
                  <option value="high">{t('high') || 'High'}</option>
                  <option value="urgent">{t('urgent') || 'Urgent'}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-6 py-3 font-medium ${
              activeTab === 'received'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Inbox size={20} />
            {t('inbox') || 'Inbox'}
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
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Send size={20} />
            {t('sent') || 'Sent'}
          </button>
        </div>

        {/* Messages List */}
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Inbox size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('noMessages') || 'No messages found'}</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !message.is_read && activeTab === 'received' ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {!message.is_read && activeTab === 'received' ? (
                      <div className="relative">
                        <Mail size={20} className="text-blue-600" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                      </div>
                    ) : (
                      <MailOpen size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium ${!message.is_read && activeTab === 'received' ? 'text-gray-900' : 'text-gray-700'}`}>
                          {activeTab === 'received'
                            ? message.sender?.full_name || t('unknown')
                            : message.receiver?.full_name || t('unknown')}
                        </p>
                        {getPriorityIcon(message.priority)}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(message.priority)}`}>
                          {message.priority || 'normal'}
                        </span>
                        {message.edited_at && (
                          <span className="text-xs text-gray-500 italic">• edited</span>
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                          <Paperclip size={14} className="text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm mb-1 ${!message.is_read && activeTab === 'received' ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {message.subject}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {message.message}
                    </p>
                    {/* Show reply count */}
                    {replyMessages[message.id] && replyMessages[message.id].length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <Reply size={12} />
                        <span>{replyMessages[message.id].length} repl{replyMessages[message.id].length > 1 ? 'ies' : 'y'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{t('composeMessage') || 'Compose Message'}</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('to')} *
                  </label>
                  <select
                    required
                    value={composeForm.receiver_id}
                    onChange={(e) => setComposeForm({ ...composeForm, receiver_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('selectRecipient') || 'Select Recipient'}</option>
                    {users.filter(u => u.id !== user.id).map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('priority') || 'Priority'}
                  </label>
                  <select
                    value={composeForm.priority}
                    onChange={(e) => setComposeForm({ ...composeForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">{t('low') || 'Low'}</option>
                    <option value="normal">{t('normal') || 'Normal'}</option>
                    <option value="high">{t('high') || 'High'}</option>
                    <option value="urgent">{t('urgent') || 'Urgent'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('project') || 'Project'} ({t('optional') || 'Optional'})
                </label>
                <select
                  value={composeForm.project_id}
                  onChange={(e) => setComposeForm({ ...composeForm, project_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('selectProject') || 'Select Project'}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subject')} *
                </label>
                <input
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('subjectPlaceholder') || 'Enter message subject'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('message')} *
                </label>
                <textarea
                  required
                  value={composeForm.message}
                  onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('messagePlaceholder') || 'Type your message here...'}
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('attachments') || 'Attachments'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Paperclip size={18} />
                    {t('attachFile') || 'Attach File'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar"
                  />
                  <span className="text-sm text-gray-500">Max 10MB per file</span>
                </div>
                
                {composeForm.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {composeForm.attachments.map((att, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {getAttachmentIcon(att.type)}
                          <span className="text-sm">{att.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(att.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCompose(false); resetComposeForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {t('send') || 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{selectedMessage.subject}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority || 'normal'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  <p>
                    <span className="font-medium">{t('from') || 'From'}:</span>{' '}
                    {selectedMessage.sender?.full_name || t('unknown')}
                  </p>
                  <p>
                    <span className="font-medium">{t('to') || 'To'}:</span>{' '}
                    {selectedMessage.receiver?.full_name || t('unknown')}
                  </p>
                  <p>{new Date(selectedMessage.created_at).toLocaleString()}</p>
                  {selectedMessage.edited_at && (
                    <p className="text-gray-500 italic">• Edited: {new Date(selectedMessage.edited_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedMessage.sender_id === user.id && (
                  <>
                    <button
                      onClick={() => {
                        setEditingMessage(selectedMessage.id);
                        setEditText(selectedMessage.message);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600"
                      title={t('edit') || 'Edit'}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="p-2 text-gray-500 hover:text-red-600"
                      title={t('delete') || 'Delete'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div className="border-t pt-4 mb-4">
              {editingMessage === selectedMessage.id ? (
                <div>
                  <textarea
                    ref={editInputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(selectedMessage.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t('save') || 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingMessage(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {t('cancel') || 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              )}

              {/* Attachments */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-2">{t('attachments') || 'Attachments'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMessage.attachments.map((att, index) => (
                      <a
                        key={index}
                        href={att.file_path}
                        download={att.file_name}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        {getAttachmentIcon(att.file_type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{att.file_name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(att.file_size)}</p>
                        </div>
                        <DownloadIcon size={16} className="text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">{t('reply') || 'Reply'}</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('writeReply') || 'Write your reply...'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(selectedMessage.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    handleReply(selectedMessage.id, input.value);
                    input.value = '';
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Send size={18} />
                  {t('send') || 'Send'}
                </button>
              </div>
            </div>

            {/* Replies */}
            {replyMessages[selectedMessage.id] && replyMessages[selectedMessage.id].length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-700 mb-3">
                  {t('replies') || 'Replies'} ({replyMessages[selectedMessage.id].length})
                </h4>
                <div className="space-y-3">
                  {replyMessages[selectedMessage.id].map((reply) => (
                    <div key={reply.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {reply.sender?.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{reply.sender?.full_name || t('unknown')}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{reply.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setComposeForm({
                    ...composeForm,
                    receiver_id: selectedMessage.sender_id === user.id ? selectedMessage.receiver_id : selectedMessage.sender_id,
                    subject: `Fwd: ${selectedMessage.subject}`,
                    message: `---------- Forwarded Message ----------\n\n${selectedMessage.message}`
                  });
                  setShowCompose(true);
                  setSelectedMessage(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Forward size={18} />
                {t('forward') || 'Forward'}
              </button>
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
              >
                {t('close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icons
const SearchIcon = ({ size, className }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const DownloadIcon = ({ size, className }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export default Messages;
