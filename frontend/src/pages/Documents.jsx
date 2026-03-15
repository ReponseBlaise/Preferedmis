import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api, { projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Upload, File, Share2, Trash2, Download, Eye, 
  Search, Filter, Plus, X, Lock, Globe, Users,
  ChevronDown, ChevronUp, FolderOpen, Calendar, User
} from 'lucide-react';

const Documents = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  const [documents, setDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState('my-documents');
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'general',
    visibility: 'private',
    project_id: ''
  });

  // Share form state
  const [shareForm, setShareForm] = useState({
    users: [],
    permission: 'view',
    message: ''
  });

  // Users for sharing
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'my-documents') {
      fetchDocuments();
    } else {
      fetchSharedDocuments();
    }
  }, [activeTab, filterCategory, filterVisibility, filterProject, sortBy, sortOrder]);

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterVisibility !== 'all') params.visibility = filterVisibility;
      if (filterProject !== 'all') params.project_id = filterProject;
      if (searchTerm) params.search = searchTerm;

      const response = await api.documents.getAll(params);
      let docs = response || [];

      // Filter by date range
      if (dateRange.start || dateRange.end) {
        docs = docs.filter(doc => {
          const docDate = new Date(doc.created_at);
          const start = dateRange.start ? new Date(dateRange.start) : null;
          const end = dateRange.end ? new Date(dateRange.end) : null;
          
          if (start && docDate < start) return false;
          if (end && docDate > end) return false;
          return true;
        });
      }

      // Sort documents
      docs.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });

      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error(t('failedToLoadDocuments'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedDocuments = async () => {
    try {
      const response = await api.documents.getShared();
      setSharedDocuments(response || []);
    } catch (error) {
      console.error('Error fetching shared documents:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setAvailableUsers(response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.title) {
      toast.error(t('documentTitleRequired'));
      return;
    }

    const fileInput = document.getElementById('documentFile');
    if (!fileInput.files[0]) {
      toast.error(t('selectFile'));
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('category', uploadForm.category);
    formData.append('visibility', uploadForm.visibility);
    if (uploadForm.project_id) formData.append('project_id', uploadForm.project_id);

    try {
      setUploading(true);
      await api.documents.upload(formData);
      toast.success(t('documentUploaded'));
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        category: 'general',
        visibility: 'private',
        project_id: ''
      });
      fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedDocument || shareForm.users.length === 0) {
      toast.error(t('selectUsersToShare'));
      return;
    }

    try {
      await api.documents.share(selectedDocument.id, {
        shared_with: shareForm.users,
        permission: shareForm.permission,
        message: shareForm.message
      });
      toast.success(t('documentShared'));
      setShowShareModal(false);
      setShareForm({ users: [], permission: 'view', message: '' });
      fetchDocuments();
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error.response?.data?.error || t('shareFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteDocument'))) return;

    try {
      await api.documents.delete(id);
      toast.success(t('documentDeleted'));
      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || t('deleteFailed'));
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const response = await api.documents.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('downloadStarted'));
    } catch (error) {
      toast.error(t('downloadFailed'));
    }
  };

  const openShareModal = (doc) => {
    setSelectedDocument(doc);
    setShowShareModal(true);
  };

  const toggleUserSelection = (userId) => {
    setShareForm(prev => ({
      ...prev,
      users: prev.users.includes(userId)
        ? prev.users.filter(id => id !== userId)
        : [...prev.users, userId]
    }));
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setFilterCategory('all');
    setFilterVisibility('all');
    setFilterProject('all');
    setDateRange({ start: '', end: '' });
    setSearchTerm('');
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryIcon = (category) => {
    const icons = {
      general: <File size={16} />,
      report: <File size={16} />,
      invoice: <File size={16} />,
      contract: <File size={16} />,
      drawing: <File size={16} />,
      permit: <File size={16} />
    };
    return icons[category] || icons.general;
  };

  const getVisibilityBadge = (visibility) => {
    const badges = {
      private: { icon: <Lock size={12} />, class: 'bg-gray-100 text-gray-700' },
      shared: { icon: <Users size={12} />, class: 'bg-blue-100 text-blue-700' },
      public: { icon: <Globe size={12} />, class: 'bg-green-100 text-green-700' }
    };
    return badges[visibility] || badges.private;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('documents')}</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Upload size={18} />
          <span className="hidden sm:inline">{t('uploadDocument')}</span>
          <span className="sm:hidden">{t('upload')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('my-documents')}
          className={`pb-2 px-4 whitespace-nowrap text-sm font-medium transition-colors ${
            activeTab === 'my-documents' 
              ? 'border-b-2 border-primary-600 text-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('myDocuments')}
        </button>
        <button
          onClick={() => setActiveTab('shared-with-me')}
          className={`pb-2 px-4 whitespace-nowrap text-sm font-medium transition-colors ${
            activeTab === 'shared-with-me' 
              ? 'border-b-2 border-primary-600 text-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('sharedWithMe')} ({sharedDocuments.length})
        </button>
      </div>

      {/* Search and Filter Toggle */}
      {activeTab === 'my-documents' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('searchDocuments')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={18} />
              {t('filter')}
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('category')}
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">{t('allCategories')}</option>
                    <option value="general">{t('general')}</option>
                    <option value="report">{t('reports')}</option>
                    <option value="invoice">{t('invoices')}</option>
                    <option value="contract">{t('contracts')}</option>
                    <option value="drawing">{t('drawings')}</option>
                    <option value="permit">{t('permits')}</option>
                  </select>
                </div>

                {/* Visibility Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('visibility')}
                  </label>
                  <select
                    value={filterVisibility}
                    onChange={(e) => setFilterVisibility(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">{t('allVisibility')}</option>
                    <option value="private">{t('private')}</option>
                    <option value="shared">{t('shared')}</option>
                    <option value="public">{t('public')}</option>
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('projects')}
                  </label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">{t('allProjects')}</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dateRange')}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="input-field w-full text-sm"
                      placeholder={t('startDate')}
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="input-field w-full text-sm"
                      placeholder={t('endDate')}
                    />
                  </div>
                </div>
              </div>

              {/* Reset Filters Button */}
              <div className="flex justify-end">
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} />
                  {t('resetFilters')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t('loading')}</p>
        </div>
      ) : activeTab === 'my-documents' ? (
        filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <File size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('noDocuments')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => {
              const visibilityBadge = getVisibilityBadge(doc.visibility);
              return (
                <div key={doc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(doc.category)}
                        <span className="text-xs uppercase tracking-wide">{doc.category}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 bg-white/20`}>
                        {visibilityBadge.icon}
                        {t(doc.visibility)}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 truncate" title={doc.title}>
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {doc.description || t('noDescription')}
                    </p>

                    {/* Meta Info */}
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} />
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.owner && (
                        <div className="flex items-center gap-2">
                          <User size={12} />
                          <span>{t('by')} {doc.owner.full_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FolderOpen size={12} />
                        <span>{doc.project?.name || t('noProject')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => handleDownload(doc.id, doc.file_name)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors flex items-center justify-center gap-1"
                        title={t('download')}
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">{t('download')}</span>
                      </button>
                      {doc.visibility !== 'public' && (
                        <button
                          onClick={() => openShareModal(doc)}
                          className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
                          title={t('share')}
                        >
                          <Share2 size={14} />
                          <span className="hidden sm:inline">{t('share')}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sharedDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Share2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('noDocumentsShared')}</p>
            </div>
          ) : (
            sharedDocuments.map(share => (
              <div key={share.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Share2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{share.document.title}</h3>
                    <p className="text-sm text-gray-500">
                      {t('sharedBy')} {share.sharedBy?.full_name} • {t('permission')}: {share.permission}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(share.shared_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(share.document.id, share.document.file_name)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('uploadDocument')}</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('file')} *
                </label>
                <input
                  id="documentFile"
                  type="file"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('title')} *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('category')}
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                  className="input-field"
                >
                  <option value="general">{t('general')}</option>
                  <option value="report">{t('reports')}</option>
                  <option value="invoice">{t('invoices')}</option>
                  <option value="contract">{t('contracts')}</option>
                  <option value="drawing">{t('drawings')}</option>
                  <option value="permit">{t('permits')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('visibility')}
                </label>
                <select
                  value={uploadForm.visibility}
                  onChange={(e) => setUploadForm({...uploadForm, visibility: e.target.value})}
                  className="input-field"
                >
                  <option value="private">{t('private')} - {t('onlyYouCanAccess')}</option>
                  <option value="shared">{t('shared')} - {t('shareWithSpecificUsers')}</option>
                  <option value="public">{t('public')} - {t('everyoneCanAccess')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {uploading ? t('uploading') : t('upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('shareDocument')}</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedDocument.title}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('selectUsers')}
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {availableUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareForm.users.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        className="rounded"
                      />
                      <span>{u.full_name} ({u.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('permission')}
                </label>
                <select
                  value={shareForm.permission}
                  onChange={(e) => setShareForm({...shareForm, permission: e.target.value})}
                  className="input-field"
                >
                  <option value="view">{t('viewOnly')}</option>
                  <option value="download">{t('viewAndDownload')}</option>
                  <option value="edit">{t('edit')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('message')} ({t('optional')})
                </label>
                <textarea
                  value={shareForm.message}
                  onChange={(e) => setShareForm({...shareForm, message: e.target.value})}
                  className="input-field"
                  rows={2}
                  placeholder={t('addAPersonalMessage')}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 btn-primary"
                >
                  {t('share')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
