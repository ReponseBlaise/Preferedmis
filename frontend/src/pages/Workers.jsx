import React, { useState, useEffect } from 'react';
import { workerAPI, projectAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    project_id: '',
    full_name: '',
    phone: '',
    position: '',
    rate_per_day: '',
    payment_type: 'daily'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchWorkers();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll({ project_id: selectedProject });
      setWorkers(response.data);
    } catch (error) {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await workerAPI.update(editingWorker.id, formData);
        toast.success('Worker updated successfully');
      } else {
        await workerAPI.create({ ...formData, project_id: selectedProject });
        toast.success('Worker created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchWorkers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      project_id: worker.project_id,
      full_name: worker.full_name,
      phone: worker.phone,
      position: worker.position,
      rate_per_day: worker.rate_per_day,
      payment_type: worker.payment_type
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await workerAPI.delete(id);
        toast.success('Worker deleted successfully');
        fetchWorkers();
      } catch (error) {
        toast.error('Failed to delete worker');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      full_name: '',
      phone: '',
      position: '',
      rate_per_day: '',
      payment_type: 'daily'
    });
    setEditingWorker(null);
  };

  const filteredWorkers = workers.filter(worker =>
    worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{t('workers')}</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          {t('addWorker')}
        </button>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-6">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-field flex-1"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">{t('workerName')}</th>
                <th className="table-header-cell">{t('phone')}</th>
                <th className="table-header-cell">{t('position')}</th>
                <th className="table-header-cell">{t('ratePerDay')}</th>
                <th className="table-header-cell">{t('paymentType')}</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id}>
                  <td className="table-cell font-medium">{worker.full_name}</td>
                  <td className="table-cell">{worker.phone}</td>
                  <td className="table-cell">{worker.position}</td>
                  <td className="table-cell">{worker.rate_per_day} RWF</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs ${worker.payment_type === 'daily' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {t(worker.payment_type)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(worker)} className="text-blue-600 hover:text-blue-800">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(worker.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">{editingWorker ? 'Edit Worker' : t('addWorker')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={t('workerName')}
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="tel"
                placeholder={t('phone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder={t('position')}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="input-field"
              />
              <input
                type="number"
                placeholder={t('ratePerDay')}
                value={formData.rate_per_day}
                onChange={(e) => setFormData({ ...formData, rate_per_day: e.target.value })}
                className="input-field"
                required
              />
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="input-field"
              >
                <option value="daily">{t('daily')}</option>
                <option value="monthly">{t('monthly')}</option>
              </select>

              <div className="flex gap-4">
                <button type="submit" className="btn-primary flex-1">{t('save')}</button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-outline flex-1"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
