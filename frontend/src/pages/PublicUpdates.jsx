import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Megaphone, AlertTriangle, Info, Bell, Calendar, 
  User, Pin, Clock, Plus, X, Trash2, Filter, ChevronDown, ChevronUp
} from 'lucide-react';

const PublicUpdates = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'normal',
    project_id: '',
    is_pinned: false,
    expires_at: ''
  });

  useEffect(() => {
    fetchUpdates();
  }, [filterType, filterPriority]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterPriority !== 'all') params.priority = filterPriority;

      const response = await api.getUpdates(params);
      setUpdates(response || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error(t('failedToLoadUpdates'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!createForm.title || !createForm.content) {
      toast.error(t('titleAndContentRequired'));
      return;
    }

    try {
      await api.createUpdate(createForm);
      toast.success(t('updateCreated'));
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'normal',
        project_id: '',
        is_pinned: false,
        expires_at: ''
      });
      fetchUpdates();
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data?.error || t('createFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteUpdate'))) return;

    try {
      await api.deleteUpdate(id);
      toast.success(t('updateDeleted'));
      fetchUpdates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || t('deleteFailed'));
    }
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterPriority('all');
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: <Info size={16} className="text-gray-500" />,
      normal: <Bell size={16} className="text-blue-500" />,
      high: <AlertTriangle size={16} className="text-orange-500" />,
      urgent: <AlertTriangle size={16} className="text-red-500" />
    };
    return icons[priority] || icons.normal;
  };

  const getTypeIcon = (type) => {
    const icons = {
      announcement: <Megaphone size={20} />,
      update: <Info size={20} />,
      alert: <AlertTriangle size={20} />,
      milestone: <Calendar size={20} />
    };
    return icons[type] || icons.announcement;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return badges[priority] || badges.normal;
  };

  const getTypeBadge = (type) => {
    const badges = {
      announcement: 'bg-purple-100 text-purple-700',
      update: 'bg-blue-100 text-blue-700',
      alert: 'bg-red-100 text-red-700',
      milestone: 'bg-green-100 text-green-700'
    };
    return badges[type] || badges.announcement;
  };

  const filteredUpdates = updates.filter(update => {
    if (filterPriority !== 'all' && update.priority !== filterPriority) return false;
    return true;
  });

  // Count by priority
  const stats = {
    total: updates.length,
    urgent: updates.filter(u => u.priority === 'urgent').length,
    high: updates.filter(u => u.priority === 'high').length,
    pinned: updates.filter(u => u.is_pinned).length
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t('publicUpdates')}</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('createUpdate')}</span>
          <span className="sm:hidden">{t('create')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('total')}</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Megaphone size={32} className="text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('urgent')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <AlertTriangle size={32} className="text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('high')}</p>
              <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
            </div>
            <AlertTriangle size={32} className="text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('pinned')}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pinned}</p>
            </div>
            <Pin size={32} className="text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            <Filter size={18} />
            {t('filter')}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {/* Quick Filter Pills */}
          <div className="flex-1 flex flex-wrap gap-2">
            {['all', 'announcement', 'update', 'alert', 'milestone'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('type')}
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">{t('all')}</option>
                  <option value="announcement">{t('announcement')}</option>
                  <option value="update">{t('update')}</option>
                  <option value="alert">{t('alert')}</option>
                  <option value="milestone">{t('milestone')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('priority')}
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">{t('all')}</option>
                  <option value="low">{t('low')}</option>
                  <option value="normal">{t('normal')}</option>
                  <option value="high">{t('high')}</option>
                  <option value="urgent">{t('urgent')}</option>
                </select>
              </div>
            </div>

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
      </div>

      {/* Updates List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t('loading')}</p>
        </div>
      ) : filteredUpdates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Megaphone size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('noUpdates')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUpdates.map(update => (
            <div
              key={update.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                update.priority === 'urgent' ? 'border-l-red-500' :
                update.priority === 'high' ? 'border-l-orange-500' :
                'border-l-blue-500'
              } ${update.is_pinned ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start gap-4">
                  {/* Icon and Content */}
                  <div className="flex items-start gap-3 md:gap-4 flex-1">
                    <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${
                      update.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      update.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getTypeIcon(update.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Title and Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 truncate">
                          {update.title}
                        </h3>
                        {update.is_pinned && (
                          <Pin size={16} className="text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(update.priority)}`}>
                          {t(update.priority)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeBadge(update.type)}`}>
                          {t(update.type)}
                        </span>
                        {update.author && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User size={12} />
                            {update.author.full_name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(update.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-base">
                        {update.content}
                      </p>

                      {/* Expiry */}
                      {update.expires_at && (
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                          <Clock size={12} />
                          {t('expires')}: {new Date(update.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  {(user.role === 'manager' || update.author_id === user.id) && (
                    <button
                      onClick={() => handleDelete(update.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      title={t('delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Update Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('createUpdate')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('title')} *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="input-field"
                  required
                  placeholder={t('updateTitlePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('content')} *
                </label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                  className="input-field"
                  rows={5}
                  required
                  placeholder={t('updateContentPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('type')}
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({...createForm, type: e.target.value})}
                    className="input-field"
                  >
                    <option value="announcement">{t('announcement')}</option>
                    <option value="update">{t('update')}</option>
                    <option value="alert">{t('alert')}</option>
                    <option value="milestone">{t('milestone')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('priority')}
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({...createForm, priority: e.target.value})}
                    className="input-field"
                  >
                    <option value="low">{t('low')}</option>
                    <option value="normal">{t('normal')}</option>
                    <option value="high">{t('high')}</option>
                    <option value="urgent">{t('urgent')}</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={createForm.is_pinned}
                  onChange={(e) => setCreateForm({...createForm, is_pinned: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_pinned" className="text-sm text-gray-700">
                  {t('pinUpdate')}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('expiresAt')} ({t('optional')})
                </label>
                <input
                  type="datetime-local"
                  value={createForm.expires_at}
                  onChange={(e) => setCreateForm({...createForm, expires_at: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicUpdates;
