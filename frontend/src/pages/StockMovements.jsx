import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { stockMovementAPI, projectAPI, inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, TrendingUp, TrendingDown, Package, X } from 'lucide-react';

const StockMovements = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    inventory_item_id: '',
    project_id: '',
    movement_type: 'in',
    quantity: '',
    unit_price: '',
    reference_number: '',
    notes: '',
    movement_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedProject]);

  useEffect(() => {
    if (selectedItem) {
      fetchMovements();
      fetchSummary();
    }
  }, [selectedItem]);

  const fetchItems = async () => {
    try {
      const res = await inventoryAPI.getAll(selectedProject ? { project_id: selectedProject } : {});
      setItems(res.data || []);
    } catch (error) {
      toast.error('Failed to load inventory items');
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data || []);
      if (res.data && res.data.length > 0) setSelectedProject(res.data[0].id);
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  const fetchMovements = async () => {
    if (!selectedItem) return;
    try {
      const res = await stockMovementAPI.getByItem(selectedItem.id);
      setMovements(res.data || []);
    } catch (error) {
      console.error('Failed to fetch movements');
    }
  };

  const fetchSummary = async () => {
    if (!selectedItem) return;
    try {
      const res = await stockMovementAPI.getSummary(selectedItem.id);
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch summary');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await stockMovementAPI.record(form);
      toast.success(`Stock ${form.movement_type === 'in' ? 'received' : 'issued'} successfully`);
      setShowModal(false);
      resetForm();
      const res = await inventoryAPI.getAll(selectedProject ? { project_id: selectedProject } : {});
      setItems(res.data || []);
      if (selectedItem) {
        fetchMovements();
        fetchSummary();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record movement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      inventory_item_id: '',
      project_id: '',
      movement_type: 'in',
      quantity: '',
      unit_price: '',
      reference_number: '',
      notes: '',
      movement_date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('stockMovements') || 'Stock Movements'}</h1>
          <p className="text-gray-600 mt-1">Track stock in and out</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Record Movement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Inventory Items</h2>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{item.remaining_stock || 0}</p>
                    <p className="text-xs text-gray-500">{item.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Movements & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {selectedItem ? (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <TrendingUp size={20} />
                      <span className="text-sm font-medium">Stock In</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{summary.total_in || 0}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <TrendingDown size={20} />
                      <span className="text-sm font-medium">Stock Out</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{summary.total_out || 0}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Package size={20} />
                      <span className="text-sm font-medium">Remaining</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{summary.remaining_stock || 0}</p>
                  </div>
                </div>
              )}

              {/* Movements Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-gray-800">Movement History - {selectedItem.name}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {movements.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                            No movements recorded yet
                          </td>
                        </tr>
                      ) : (
                        movements.map(mov => (
                          <tr key={mov.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(mov.movement_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${mov.movement_type === 'in'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {mov.movement_type === 'in' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {mov.movement_type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                              {mov.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{mov.reference_number || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{mov.notes || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Select an item to view movements</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Movement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Record Stock Movement</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                  <select
                    required
                    value={form.inventory_item_id}
                    onChange={(e) => setForm({ ...form, inventory_item_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Stock: {item.remaining_stock || 0})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type *</label>
                  <select
                    required
                    value={form.movement_type}
                    onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="in">Stock In (Receive)</option>
                    <option value="out">Stock Out (Issue)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.movement_date}
                    onChange={(e) => setForm({ ...form, movement_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="PO#, Invoice#, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details..."
                />
              </div>

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
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMovements;
