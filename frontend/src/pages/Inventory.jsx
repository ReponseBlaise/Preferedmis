import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  History,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

const today = new Date().toISOString().split("T")[0];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const s = searchParams.get("search");
    if (s) setSearchTerm(s);
  }, [searchParams]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    unit: "",
    unit_price: "",
    purchase_date: "",
    category_id: "",
  });

  const [movementForm, setMovementForm] = useState({
    movement_type: "in",
    quantity: "",
    notes: "",
    movement_date: today,
  });

  useEffect(() => {
    fetchProjects();
  }, []);
  useEffect(() => {
    if (selectedProject) fetchItems();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    } catch {
      toast.error("Failed to load projects");
    }
  };

  const fetchItems = async () => {
    try {
      const data = await api.getInventoryItems({ project_id: selectedProject });
      setItems(data);
    } catch {
      toast.error("Failed to load inventory");
    }
  };

  const fetchHistory = async (item) => {
    setSelectedItem(item);
    setShowHistoryPanel(true);
    setLoadingMovements(true);
    try {
      const data = await api.getStockMovements(item.id);
      setMovements(data || []);
    } catch {
      toast.error("Failed to load history");
    }
    setLoadingMovements(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, formData);
        toast.success("Item updated");
      } else {
        await api.createInventoryItem({
          ...formData,
          project_id: selectedProject,
        });
        toast.success("Item added");
      }
      setShowModal(false);
      resetForm();
      fetchItems();
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    if (!movementForm.quantity || parseFloat(movementForm.quantity) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    // Prevent stock out exceeding remaining
    if (movementForm.movement_type === "out") {
      const remaining = selectedItem.remaining_stock ?? 0;
      if (parseFloat(movementForm.quantity) > remaining) {
        toast.error(
          `Cannot issue more than available stock (${remaining} ${selectedItem.unit || ""})`,
        );
        return;
      }
    }
    try {
      await api.recordStockMovement({
        ...movementForm,
        inventory_item_id: selectedItem.id,
        project_id: selectedProject,
      });
      toast.success(
        `Stock ${movementForm.movement_type === "in" ? "received" : "issued"} successfully`,
      );
      setShowMovementModal(false);
      resetMovementForm();
      fetchItems();
      // Refresh history if open for same item
      if (showHistoryPanel && selectedItem) fetchHistory(selectedItem);
    } catch {
      toast.error("Failed to record movement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.deleteInventoryItem(id);
      toast.success("Item deleted");
      fetchItems();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const exportInventory = async (format = "excel") => {
    try {
      let response, mimeType, fileName;

      if (format === "pdf") {
        response = await api.exportInventoryPDF({
          project_id: selectedProject,
        });
        mimeType = "application/pdf";
        fileName = `inventory_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      } else {
        response = await api.exportInventoryExcel({
          project_id: selectedProject,
        });
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileName = `inventory_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      }

      // Use response.data directly since the API already returns a blob
      const blob = new Blob([response.data || response], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported to ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    }
  };

  const openMovementModal = (item, type) => {
    setSelectedItem(item);
    setMovementForm({
      movement_type: type,
      quantity: "",
      notes: "",
      movement_date: today,
    });
    setShowMovementModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      quantity: "",
      unit: "",
      unit_price: "",
      purchase_date: "",
      category_id: "",
    });
    setEditingItem(null);
  };

  const resetMovementForm = () => {
    setMovementForm({
      movement_type: "in",
      quantity: "",
      notes: "",
      movement_date: today,
    });
  };

  const stockStatus = (item) => {
    const r = item.remaining_stock ?? 0;
    if (r <= 0)
      return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
    if (r <= item.quantity * 0.2)
      return { label: "Low Stock", cls: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", cls: "bg-green-100 text-green-700" };
  };

  const filteredItems = items.filter(
    (item) =>
      !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex gap-4 h-full">
      {/* Main content */}
      <div
        className={`flex-1 space-y-6 min-w-0 transition-all ${showHistoryPanel ? "lg:max-w-[calc(100%-380px)]" : ""}`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">{t("inventory")}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportInventory("excel")}
              className="btn-secondary flex items-center gap-2"
              title="Export as Excel"
            >
              <Download size={18} /> Excel
            </button>
            <button
              onClick={() => exportInventory("pdf")}
              className="btn-secondary flex items-center gap-2"
              title="Export as PDF"
            >
              <Download size={18} /> PDF
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} /> {t("addItem")}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex gap-3 mb-6 items-center">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input-field max-w-xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-3 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">{t("itemName")}</th>
                  <th className="table-header-cell">{t("category")}</th>
                  <th className="table-header-cell">Initial Qty</th>
                  <th className="table-header-cell">Total In</th>
                  <th className="table-header-cell">Total Out</th>
                  <th className="table-header-cell">Remaining</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">{t("unitPrice")}</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredItems.map((item) => {
                  const status = stockStatus(item);
                  return (
                    <tr key={item.id}>
                      <td className="table-cell font-medium">{item.name}</td>
                      <td className="table-cell text-gray-500">
                        {item.category_name}
                      </td>
                      <td className="table-cell">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="table-cell text-green-600 font-medium">
                        +{item.total_in ?? 0}
                      </td>
                      <td className="table-cell text-red-500 font-medium">
                        -{item.total_out ?? 0}
                      </td>
                      <td className="table-cell">
                        <span className="font-bold text-blue-700">
                          {item.remaining_stock ?? item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="table-cell">
                        {Number(item.unit_price).toLocaleString()} RWF
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => openMovementModal(item, "in")}
                            title="Stock In"
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <TrendingUp size={17} />
                          </button>
                          <button
                            onClick={() => openMovementModal(item, "out")}
                            title="Stock Out"
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <TrendingDown size={17} />
                          </button>
                          <button
                            onClick={() => fetchHistory(item)}
                            title="History"
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          >
                            <History size={17} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setFormData(item);
                              setShowModal(true);
                            }}
                            title="Edit"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={17} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                {searchTerm
                  ? `No items matching "${searchTerm}"`
                  : "No inventory items found for this project"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock History Side Panel */}
      {showHistoryPanel && selectedItem && (
        <div className="w-full lg:w-96 shrink-0">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {selectedItem.name}
                </h3>
                <p className="text-xs text-gray-500">Stock Movement History</p>
              </div>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Initial</p>
                <p className="font-bold text-gray-700">
                  {selectedItem.quantity}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-xs text-green-600">Total In</p>
                <p className="font-bold text-green-700">
                  +{selectedItem.total_in ?? 0}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-xs text-red-500">Total Out</p>
                <p className="font-bold text-red-600">
                  -{selectedItem.total_out ?? 0}
                </p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-center">
              <p className="text-xs text-blue-600 font-medium">
                Remaining Stock
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {selectedItem.remaining_stock ?? selectedItem.quantity}{" "}
                <span className="text-sm font-normal">{selectedItem.unit}</span>
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => openMovementModal(selectedItem, "in")}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <ArrowUpCircle size={16} /> Stock In
              </button>
              <button
                onClick={() => openMovementModal(selectedItem, "out")}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                <ArrowDownCircle size={16} /> Stock Out
              </button>
            </div>

            {/* Movement list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingMovements ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Loading history...
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No movements recorded yet
                </div>
              ) : (
                movements.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${m.movement_type === "in" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
                  >
                    <div
                      className={`mt-0.5 shrink-0 ${m.movement_type === "in" ? "text-green-600" : "text-red-500"}`}
                    >
                      {m.movement_type === "in" ? (
                        <ArrowUpCircle size={18} />
                      ) : (
                        <ArrowDownCircle size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-sm font-bold ${m.movement_type === "in" ? "text-green-700" : "text-red-600"}`}
                        >
                          {m.movement_type === "in" ? "+" : "-"}
                          {m.quantity} {selectedItem.unit}
                        </span>
                        <span className="text-xs text-gray-400">
                          {m.movement_date}
                        </span>
                      </div>
                      {m.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {m.notes}
                        </p>
                      )}
                      {m.reference_number && (
                        <p className="text-xs text-gray-400">
                          Ref: {m.reference_number}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Item" : t("addItem")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder={t("itemName")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-field"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="input-field"
                rows="2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder={t("quantity")}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="input-field"
                  required
                  min="0"
                />
                <input
                  type="text"
                  placeholder={t("unit") + " (e.g. kg, pcs)"}
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <input
                type="number"
                placeholder={t("unitPrice") + " (RWF)"}
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({ ...formData, unit_price: e.target.value })
                }
                className="input-field"
                required
                min="0"
              />
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_date: e.target.value })
                }
                className="input-field"
              />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {t("save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-outline flex-1"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showMovementModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-1">
              {movementForm.movement_type === "in"
                ? "📥 Stock In"
                : "📤 Stock Out"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">{selectedItem.name}</span> —
              Available:{" "}
              <span className="font-bold text-blue-600">
                {selectedItem.remaining_stock ?? selectedItem.quantity}{" "}
                {selectedItem.unit}
              </span>
            </p>

            <form onSubmit={handleMovementSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <div className="flex gap-2">
                  {["in", "out"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setMovementForm({
                          ...movementForm,
                          movement_type: type,
                        })
                      }
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                        movementForm.movement_type === type
                          ? type === "in"
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {type === "in" ? "↑ Stock In" : "↓ Stock Out"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movementForm.quantity}
                  onChange={(e) =>
                    setMovementForm({
                      ...movementForm,
                      quantity: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                  placeholder={`Max: ${selectedItem.remaining_stock ?? selectedItem.quantity}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  max={today}
                  value={movementForm.movement_date}
                  onChange={(e) =>
                    setMovementForm({
                      ...movementForm,
                      movement_date: e.target.value,
                    })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={movementForm.notes}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, notes: e.target.value })
                  }
                  className="input-field"
                  rows="2"
                  placeholder="e.g. Issued to site A, Received from supplier..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowMovementModal(false);
                    resetMovementForm();
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 rounded-lg text-white font-medium ${movementForm.movement_type === "in" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
                >
                  Confirm{" "}
                  {movementForm.movement_type === "in" ? "Receipt" : "Issue"}
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
