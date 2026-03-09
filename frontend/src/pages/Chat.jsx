import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Send, Paperclip, X, File, Image as ImageIcon, FileText } from 'lucide-react';

const Chat = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/messages/users');
      setUsers(response.data.filter(u => u.id !== user.id) || []);
    } catch (error) {
      console.error('Failed to fetch users');
      toast.error('Failed to load users');
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    try {
      const [received, sent] = await Promise.all([
        api.messages.getAll({ type: 'received', sender_id: selectedUser.id }),
        api.messages.getAll({ type: 'sent', receiver_id: selectedUser.id })
      ]);
      
      const allMessages = [...(received || []), ...(sent || [])]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      setMessages(allMessages);
      
      // Mark unread messages as read
      const unread = received.filter(m => !m.is_read);
      for (const msg of unread) {
        await api.messages.markAsRead(msg.id);
      }
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && attachments.length === 0) return;
    if (!selectedUser) {
      toast.error('Please select a user to chat with');
      return;
    }

    setLoading(true);
    try {
      const messageData = {
        receiver_id: selectedUser.id,
        subject: 'Chat Message',
        message: messageText,
        priority: 'normal'
      };

      const response = await api.sendMessage(messageData);

      // Upload attachments
      if (attachments.length > 0 && response.id) {
        for (const att of attachments) {
          const formData = new FormData();
          formData.append('file', att.file);
          try {
            await api.messages.uploadAttachment(response.id, formData);
          } catch (err) {
            console.error('Failed to upload attachment');
          }
        }
      }

      setMessageText('');
      setAttachments([]);
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow overflow-hidden">
      {/* Users List */}
      <div className={`w-full md:w-80 border-r flex flex-col ${
        selectedUser ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{t('messages') || 'Messages'}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedUser?.id === u.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {u.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{u.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${
        selectedUser ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="md:hidden p-2 hover:bg-gray-200 rounded-lg"
              >
                ←
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedUser.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedUser.full_name}</p>
                <p className="text-sm text-gray-500 capitalize">{selectedUser.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none shadow'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.file_path}
                                download={att.file_name}
                                className={`flex items-center gap-2 p-2 rounded text-xs ${
                                  isOwn ? 'bg-blue-700' : 'bg-gray-100'
                                }`}
                              >
                                {getAttachmentIcon(att.file_type)}
                                <span className="truncate">{att.file_name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                        
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-sm">
                      {getAttachmentIcon(att.type)}
                      <span className="max-w-[150px] truncate">{att.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(att.size)})</span>
                      <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar"
                />
                
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder={t('typeMessage') || 'Type a message...'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="1"
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                
                <button
                  type="submit"
                  disabled={loading || (!messageText.trim() && attachments.length === 0)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={40} className="text-gray-400" />
              </div>
              <p className="text-lg font-medium">{t('selectUserToChat') || 'Select a user to start chatting'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
