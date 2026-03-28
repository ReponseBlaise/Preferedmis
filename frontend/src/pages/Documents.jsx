import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Upload, Download, Share2, Trash2, Eye, Lock, Globe, Users as UsersIcon, FileText, Search, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('myDocuments');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'private',
    category: 'general'
  });

  const [uploadFile, setUploadFile] = useState(null);

  const categories = ['general', 'invoices', 'contracts', 'drawings', 'permits'];
  const visibilityOptions = ['private', 'shared', 'public'];

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, categoryFilter, visibilityFilter, activeTab]);

  const fetchDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data || []);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setAllUsers(data || []);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by tab
    if (activeTab === 'shared') {
      filtered = filtered.filter(d => d.visibility === 'shared' || d.visibility === 'public');
    } else {
      filtered = filtered.filter(d => d.created_by === user?.id);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(d => d.category === categoryFilter);
    }

    // Filter by visibility
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(d => d.visibility === visibilityFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !formData.title) {
      toast.error('Please select a file and enter a title');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', uploadFile);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('visibility', formData.visibility);
    formDataToSend.append('category', formData.category);

    try {
      await api.uploadDocument(formDataToSend);
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      await api.shareDocument(selectedDocument.id, { user_ids: selectedUsers });
      toast.success('Document shared successfully');
      setShowShareModal(false);
      setSelectedUsers([]);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to share document');
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await api.downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${documentId}`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.deleteDocument(documentId);
        toast.success('Document deleted successfully');
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      visibility: 'private',
      category: 'general'
    });
    setUploadFile(null);
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'shared':
        return <UsersIcon className="w-4 h-4" />;
      case 'public':
        return <Globe className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              {t('documents')}
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Manage your documents and collaborations
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('uploadDocument')}
          </button>
        </div>

        {/* Filters */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('search')}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchDocuments')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('category')}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full px-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="all">{t('allCategories')}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{t(cat)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('visibility')}
              </label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className={`w-full px-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="all">{t('allVisibility')}</option>
                {visibilityOptions.map(vis => (
                  <option key={vis} value={vis}>{t(vis)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('myDocuments')}
            className={`pb-2 font-semibold ${activeTab === 'myDocuments' ? 'border-b-2 border-blue-600 text-blue-600' : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('myDocuments')}
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`pb-2 font-semibold ${activeTab === 'shared' ? 'border-b-2 border-blue-600 text-blue-600' : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('sharedWithMe')}
          </button>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('loading')}</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('noDocuments')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {t(doc.category)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {getVisibilityIcon(doc.visibility)}
                        {t(doc.visibility)}
                      </span>
                    </div>
                  </div>
                </div>

                {doc.description && (
                  <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {doc.description}
                  </p>
                )}

                <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {t('by')} {doc.created_by === user?.id ? 'You' : (doc.user?.full_name || 'Unknown')}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc.id)}
                    title={t('download')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    {t('download')}
                  </button>

                  {doc.created_by === user?.id && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowShareModal(true);
                        }}
                        title={t('share')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                      >
                        <Share2 className="w-4 h-4" />
                        {t('share')}
                      </button>

                      <button
                        onClick={() => handleDelete(doc.id)}
                        title={t('delete')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('uploadDocument')}</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('title')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('documentTitleRequired')}
                  className={`w-full px-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('description')} ({t('optional')})
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('addAPersonalMessage')}
                  rows="3"
                  className={`w-full px-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('category')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{t(cat)}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('visibility')}
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className={`w-full px-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="private">{t('private')}</option>
                  <option value="shared">{t('shared')}</option>
                  <option value="public">{t('public')}</option>
                </select>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('file')} *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className={`w-full px-4 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">
                  {t('cancel')}
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  {t('upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('shareDocument')}</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleShare}>
              <div className="mb-4 max-h-60 overflow-y-auto">
                {allUsers.map(u => (
                  u.id !== user?.id && (
                    <label key={u.id} className={`flex items-center p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, u.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="ml-2">{u.full_name}</span>
                    </label>
                  )
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowShareModal(false)} className="flex-1 px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">
                  {t('cancel')}
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  {t('share')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
