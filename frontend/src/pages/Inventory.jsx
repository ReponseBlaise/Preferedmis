import React, { useState, useEffect } from 'react';
import { inventoryAPI, projectAPI, reportAPI } from '../services/api';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    unit_price: '',
    purchase_date: '',
    category_id: ''
  });

  const [movementForm, setMovementForm] = useState({
    movement_type: 'in',
    quantity: '',
    unit_price: '',
    reference_number: '',
    notes: '',
    movement_date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { id: '1', name: 'Construction Materials' },
    { id: '2', name: 'Tools & Equipment' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchItems();
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

  const fetchItems = async () => {
    try {
      const response = await inventoryAPI.getAll({ project_id: selectedProject });
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load inventory');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, formData);
        toast.success('Item updated successfully');
      } else {
        await inventoryAPI.create({ ...formData, project_id: selectedProject });
        toast.success('Item added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.stockMovementAPI.record({
        ...movementForm,
        inventory_item_id: selectedItem.id,
        project_id: selectedProject
      });
      toast.success(`Stock ${movementForm.movement_type === 'in' ? 'received' : 'issued'} successfully`);
      setShowMovementModal(false);
      resetMovementForm();
      fetchItems();
    } catch (error) {
      toast.error('Failed to record movement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await inventoryAPI.delete(id);
        toast.success('Item deleted');
        fetchItems();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const exportInventory = async () => {
    try {
      const response = await reportAPI.exportInventoryExcel({ project_id: selectedProject });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: '',
      unit: '',
      unit_price: '',
      purchase_date: '',
      category_id: ''
    });
    setEditingItem(null);
  };

  const resetMovementForm = () => {
    setMovementForm({
      movement_type: 'in',
      quantity: '',
      unit_price: '',
      reference_number: '',
      notes: '',
      movement_date: new Date().toISOString().split('T')[0]
    });
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{t('inventory')}</h2>
        <div className="flex gap-2">
          <button onClick={exportInventory} className="btn-secondary flex items-center gap-2">
            <Download size={18} />
            {t('export')}
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            {t('addItem')}
          </button>
        </div>
      </div>

      <div className="card">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="input-field mb-6"
        >
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">{t('itemName')}</th>
                <th className="table-header-cell">{t('category')}</th>
                <th className="table-header-cell">Remaining Stock</th>
                <th className="table-header-cell">{t('unitPrice')}</th>
                <th className="table-header-cell">{t('totalPrice')}</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="table-cell font-medium">{item.name}</td>
                  <td className="table-cell">{item.category_name}</td>
                  <td className="table-cell">
                    <span className="font-semibold text-blue-600">{item.remaining_stock || 0} {item.unit}</span>
                  </td>
                  <td className="table-cell">{item.unit_price} RWF</td>
                  <td className="table-cell font-semibold">{item.total_price} RWF</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedItem(item); setMovementForm({ ...movementForm, movement_type: 'in' }); setShowMovementModal(true); }} 
                        className="text-green-600 hover:text-green-700"
                        title="Stock In"
                      >
                        <TrendingUp size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedItem(item); setMovementForm({ ...movementForm, movement_type: 'out' }); setShowMovementModal(true); }} 
                        className="text-red-600 hover:text-red-700"
                        title="Stock Out"
                      >
                        <TrendingDown size={18} />
                      </button>
                      <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="text-blue-600">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-600">
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit Item' : t('addItem')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={t('itemName')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
              />
              <input
                type="number"
                placeholder={t('quantity')}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder={t('unit')}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input-field"
              />
              <input
                type="number"
                placeholder={t('unitPrice')}
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="input-field"
              />

              <div className="flex gap-4">
                <button type="submit" className="btn-primary flex-1">{t('save')}</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-outline flex-1">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMovementModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {movementForm.movement_type === 'in' ? '📥 Stock In' : '📤 Stock Out'} - {selectedItem.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">Current Stock: <span className="font-bold text-blue-600">{selectedItem.remaining_stock || 0} {selectedItem.unit}</span></p>
            
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Movement Type</label>
                <select
                  value={movementForm.movement_type}
                  onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                  className="input-field"
                >
                  <option value="in">Stock In (Receive)</option>
                  <option value="out">Stock Out (Issue)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowMovementModal(false); resetMovementForm(); }} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Record {movementForm.movement_type === 'in' ? 'In' : 'Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
