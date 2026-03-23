import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Send, Paperclip, X, File, Image as ImageIcon, FileText, MoreHorizontal, Search as SearchIcon, Phone, Video, User, Check, CheckCheck, Clock, Eye, EyeOff } from 'lucide-react';

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
        api.messages.getAll({ type: 'received' }),
        api.messages.getAll({ type: 'sent' })
      ]);

      const receivedList = Array.isArray(received) ? received.filter(m =>
        m.sender_id === selectedUser.id || m.receiver_id === selectedUser.id
      ) : [];
      const sentList = Array.isArray(sent) ? sent.filter(m =>
        m.receiver_id === selectedUser.id
      ) : [];

      const allMessages = [...receivedList, ...sentList]
        .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setMessages(allMessages);

      // Mark unread messages as read
      const unread = receivedList.filter(m => !m.is_read && m.sender_id === selectedUser.id);
      for (const msg of unread) {
        api.messages.markAsRead(msg.id).catch(() => {});
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
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
    if (!selectedUser) { toast.error('Please select a user to chat with'); return; }

    setLoading(true);
    try {
      // Step 1: send message — use axios directly to get full response
      const { data: sentMsg } = await api.post('/messages', {
        receiver_id: selectedUser.id,
        subject: 'Chat Message',
        message: messageText || '📎 Attachment',
        priority: 'normal'
      });

      // Step 2: upload each attachment to the new message id
      if (attachments.length > 0 && sentMsg?.id) {
        for (const att of attachments) {
          const formData = new FormData();
          formData.append('file', att.file);
          try {
            await api.post(`/messages/${sentMsg.id}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (err) {
            toast.error(`Failed to upload ${att.name}`);
          }
        }
      }

      setMessageText('');
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="h-[calc(100vh-8rem)] flex bg-gray-100">
      {/* Users List */}
      <div className={`w-full md:w-96 border-r bg-white shadow-lg ${
        selectedUser ? 'hidden md:flex' : 'flex'
      } flex-col`}>
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{t('messages') || 'Messages'}</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <SearchIcon size={20} />
              </button>
              <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b bg-gray-50">
          <div className="relative">
            <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {users.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                selectedUser?.id === u.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {u.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{u.full_name}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">{u.role}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">Online</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Today</div>
                  <div>10:30 AM</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${
        selectedUser ? 'flex' : 'hidden md:flex'
      } bg-gradient-to-br from-gray-50 to-blue-50`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {selectedUser.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedUser.full_name}</p>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Online
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video size={20} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user.id;
                const messageTime = new Date(msg.created_at);
                const timeString = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] md:max-w-[60%] lg:max-w-[50%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {selectedUser.full_name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{selectedUser.full_name}</span>
                        </div>
                      )}
                      
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none shadow-lg'
                        }`}
                      >
                        {/* Message Content */}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ${
                                  isOwn ? 'bg-blue-700 border-blue-800' : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${
                                  isOwn ? 'bg-blue-800' : 'bg-white'
                                }`}>
                                  {getAttachmentIcon(att.file_type || '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{att.file_name}</p>
                                  <p className="text-xs opacity-75">{formatFileSize(att.file_size)}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                        
                        {/* Message Footer */}
                        <div className={`flex items-center justify-between mt-2 ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{timeString}</span>
                          <div className="flex items-center gap-1">
                            {isOwn && (
                              <>
                                <Eye size={14} />
                                <CheckCheck size={14} />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t shadow-lg">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                        <div className="p-1 bg-gray-100 rounded-lg">
                          {getAttachmentIcon(att.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(att.size)}</p>
                        </div>
                        <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSend} className="flex items-end gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 transform hover:scale-110"
                    title="Attach file"
                  >
                    <Paperclip size={22} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar"
                  />
                </div>
                
                <div className="flex-1 relative">
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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                    rows="1"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                      title="Emoji"
                    >
                      😀
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || (!messageText.trim() && attachments.length === 0)}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                >
                  <Send size={22} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Messages</h2>
              <p className="text-gray-600 mb-8">Select a conversation to start chatting</p>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="bg-white p-4 rounded-xl shadow-lg text-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600">Online</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600">Quick replies</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg text-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600">Secure</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
