import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, UserCheck, UserX, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'employee',
    project_ids: []
  });

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, formData);
        toast.success('User updated successfully');
      } else {
        await api.register(formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/users/${selectedUser.id}/password`, { password: newPassword });
      toast.success('Password reset successfully');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.put(`/auth/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (!window.confirm(`Are you sure you want to delete user "${userToDelete?.full_name}"?\n\nNote: If the user has associated data (messages, attendance records, etc.), they will be deactivated instead of deleted to preserve data integrity.`)) return;
    
    try {
      const response = await api.delete(`/auth/users/${id}`);
      
      if (response.data.deactivated) {
        toast.success(
          `User deactivated (has dependencies: ${response.data.dependencies.join(', ')})`,
          {
            duration: 5000,
            icon: '⚠️'
          }
        );
      } else {
        toast.success('User deleted successfully');
      }
      
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.details || 
        error.response?.data?.error || 
        'Failed to delete user'
      );
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    // Fetch user's assigned projects
    api.get(`/auth/users/${user.id}/projects`).then(response => {
      const projectIds = response.data.map(p => p.project_id);
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        phone: user.phone || '',
        role: user.role,
        project_ids: projectIds
      });
    }).catch(() => {
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        phone: user.phone || '',
        role: user.role,
        project_ids: []
      });
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'employee',
      project_ids: []
    });
    setEditingUser(null);
  };

  const toggleProject = (projectId) => {
    setFormData(prev => ({
      ...prev,
      project_ids: prev.project_ids.includes(projectId)
        ? prev.project_ids.filter(id => id !== projectId)
        : [...prev.project_ids, projectId]
    }));
  };

  const getRoleBadge = (role) => {
    const colors = {
      manager: 'bg-purple-100 text-purple-800',
      employee: 'bg-blue-100 text-blue-800',
      storeman: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => {
          const isDeleted = user.full_name?.startsWith('[DELETED]');
          return (
            <div key={user.id} className={`card ${isDeleted ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.phone || '-'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`badge ${getRoleBadge(user.role)}`}>{user.role}</span>
                  <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => handleEdit(user)} className="icon-button-primary" disabled={isDeleted}>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => openPasswordModal(user)} className="icon-button" disabled={isDeleted}>
                  <Key size={18} />
                </button>
                <button onClick={() => handleToggleStatus(user)} className="icon-button" disabled={isDeleted}>
                  {user.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                </button>
                <button onClick={() => handleDelete(user.id)} className="icon-button-danger" disabled={isDeleted}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const isDeleted = user.full_name?.startsWith('[DELETED]');
              return (
              <tr key={user.id} className={`hover:bg-gray-50 ${isDeleted ? 'bg-gray-100 opacity-70' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`font-medium ${isDeleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {isDeleted ? user.full_name.replace(/\[DELETED\] [a-f0-9-]+\s*/, '[DELETED] ') : user.full_name}
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.email}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className={`text-blue-600 hover:text-blue-800 ${isDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isDeleted ? "Cannot edit deleted user" : "Edit"}
                      disabled={isDeleted}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => openPasswordModal(user)}
                      className={`text-purple-600 hover:text-purple-800 ${isDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isDeleted ? "Cannot reset password for deleted user" : "Reset Password"}
                      disabled={isDeleted}
                    >
                      <Key size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`${
                        isDeleted 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : user.is_active 
                            ? 'text-orange-600 hover:text-orange-800' 
                            : 'text-green-600 hover:text-green-800'
                      }`}
                      title={isDeleted ? "Cannot change status of deleted user" : user.is_active ? 'Deactivate' : 'Activate'}
                      disabled={isDeleted}
                    >
                      {user.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className={`text-red-600 hover:text-red-800 ${isDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isDeleted ? "Already deactivated" : "Delete"}
                      disabled={isDeleted}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found. Add your first user!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    minLength="6"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="employee">Employee</option>
                  <option value="storeman">Storeman</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              {/* Project Assignment */}
              {formData.role !== 'manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Projects</label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {projects.length === 0 ? (
                      <p className="text-sm text-gray-500">No projects available</p>
                    ) : (
                      projects.map(project => (
                        <label key={project.id} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.project_ids.includes(project.id)}
                            onChange={() => toggleProject(project.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{project.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.project_ids.length} project(s) selected
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            <p className="text-gray-600 mb-4">
              Set a new password for <strong>{selectedUser?.full_name}</strong>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  minLength="6"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setNewPassword(''); setSelectedUser(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
