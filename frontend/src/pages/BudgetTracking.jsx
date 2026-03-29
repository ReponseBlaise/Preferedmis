import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  X,
  Wallet,
} from "lucide-react";

const BudgetTracking = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [spending, setSpending] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Source data for spending references
  const [workers, setWorkers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [budgetForm, setBudgetForm] = useState({
    total_budget: "",
    labor_budget: "",
    materials_budget: "",
    equipment_budget: "",
    contingency_budget: "",
    notes: "",
  });

  const [spendingForm, setSpendingForm] = useState({
    category: "materials",
    description: "",
    amount: "",
    spending_date: new Date().toISOString().split("T")[0],
    worker_id: "",
    inventory_item_id: "",
    expense_id: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBudget();
      fetchSummary();
      fetchSpending();
      fetchAlerts();
      // Load source data for spending references
      loadSourceData();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const loadSourceData = async () => {
    try {
      const [workersData, inventoryData, expensesData] = await Promise.all([
        api.getProjectWorkers({ project_id: selectedProject }),
        api.getProjectInventory({ project_id: selectedProject }),
        api.getProjectExpenses({ project_id: selectedProject }),
      ]);
      setWorkers(workersData || []);
      setInventoryItems(inventoryData || []);
      setExpenses(expensesData || []);
    } catch (error) {
      console.error("Failed to load source data:", error);
    }
  };

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const data = await api.getBudget({ project_id: selectedProject });
      if (data) {
        setBudget(data);
        setBudgetForm({
          total_budget: data.total_budget,
          labor_budget: data.labor_budget,
          materials_budget: data.materials_budget,
          equipment_budget: data.equipment_budget,
          contingency_budget: data.contingency_budget,
          notes: data.notes,
        });
      }
    } catch (error) {
      console.error("Failed to load budget");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await api.getBudgetSummary({
        project_id: selectedProject,
      });
      setSummary(data);
    } catch (error) {
      console.error("Failed to load summary");
    }
  };

  const fetchSpending = async () => {
    try {
      const data = await api.getSpending({
        project_id: selectedProject,
      });
      setSpending(data || []);
    } catch (error) {
      toast.error("Failed to load spending records");
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await api.getBudgetAlerts({
        project_id: selectedProject,
      });
      setAlerts(data?.alerts || []);
    } catch (error) {
      console.error("Failed to load alerts");
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      await api.createBudget({
        project_id: selectedProject,
        ...budgetForm,
      });
      toast.success("Budget created");
      setShowModal(false);
      fetchBudget();
      fetchSummary();
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create budget");
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      await api.updateBudget(selectedProject, budgetForm);
      toast.success("Budget updated");
      setEditingBudget(false);
      fetchBudget();
      fetchSummary();
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update budget");
    }
  };

  const handleRecordSpending = async (e) => {
    e.preventDefault();
    try {
      const spendingData = {
        project_id: selectedProject,
        category: spendingForm.category,
        description: spendingForm.description,
        amount: parseFloat(spendingForm.amount),
        spending_date: spendingForm.spending_date,
      };

      // Add appropriate reference based on category
      if (spendingForm.category === "labor" && spendingForm.worker_id) {
        spendingData.worker_id = spendingForm.worker_id;
      } else if (
        (spendingForm.category === "materials" ||
          spendingForm.category === "equipment") &&
        spendingForm.inventory_item_id
      ) {
        spendingData.inventory_item_id = spendingForm.inventory_item_id;
      } else if (
        spendingForm.category === "other" &&
        spendingForm.expense_id
      ) {
        spendingData.expense_id = spendingForm.expense_id;
      }

      await api.recordSpending(spendingData);
      toast.success("Spending recorded");
      setShowSpendingModal(false);
      setSpendingForm({
        category: "materials",
        description: "",
        amount: "",
        spending_date: new Date().toISOString().split("T")[0],
        worker_id: "",
        inventory_item_id: "",
        expense_id: "",
      });
      fetchSpending();
      fetchSummary();
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record spending");
    }
  };

  const handleDeleteSpending = async (id) => {
    if (!window.confirm("Delete this spending record?")) return;
    try {
      await api.deleteSpending(id);
      toast.success("Spending record deleted");
      fetchSpending();
      fetchSummary();
      fetchAlerts();
    } catch (error) {
      toast.error("Failed to delete spending record");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      labor: "bg-blue-100 text-blue-800",
      materials: "bg-green-100 text-green-800",
      equipment: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100";
  };

  const getSourceDisplayName = (record) => {
    if (record.worker_name) return record.worker_name;
    if (record.inventory_name) return record.inventory_name;
    if (record.expense_type) return record.expense_type;
    return record.description || "No reference";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">💰 Budget Tracking</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          {!budget ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 justify-center flex-1 sm:flex-none"
            >
              <Plus size={20} />
              Create Budget
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingBudget(true);
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 justify-center flex-1 sm:flex-none"
            >
              <Edit size={20} />
              Edit Budget
            </button>
          )}
          <button
            onClick={() => setShowSpendingModal(true)}
            className="btn-primary flex items-center gap-2 justify-center flex-1 sm:flex-none"
          >
            <Plus size={20} />
            Record Spending
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="card">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="input-field w-full max-w-sm"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg flex items-start gap-3 ${
                alert.severity === "critical"
                  ? "bg-red-100 border border-red-300"
                  : "bg-yellow-100 border border-yellow-300"
              }`}
            >
              <AlertTriangle
                className={`flex-shrink-0 ${
                  alert.severity === "critical"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
                size={20}
              />
              <div>
                <p
                  className={`font-semibold ${
                    alert.severity === "critical"
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}
                >
                  {alert.message}
                </p>
                {alert.category && (
                  <p className="text-sm text-gray-600 mt-1">
                    Category: {alert.category}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-600">
            <div className="text-sm text-gray-600 mb-2">Total Budget</div>
            <div className="text-2xl font-bold text-gray-800">
              {summary.total_budget?.toLocaleString()} RWF
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-600">
            <div className="text-sm text-gray-600 mb-2">Total Spent</div>
            <div className="text-2xl font-bold text-orange-600">
              {summary.total_spent?.toLocaleString()} RWF
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {summary.budget_utilization_percent?.toFixed(1)}% used
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
            <div className="text-sm text-gray-600 mb-2">Remaining</div>
            <div className="text-2xl font-bold text-green-600">
              {summary.remaining_budget?.toLocaleString()} RWF
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-2">Budget Status</div>
            <div className="text-2xl font-bold text-gray-800">
              {summary.budget_utilization_percent > 100 ? "⚠️ Over" : "✅ Good"}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  summary.budget_utilization_percent > 100
                    ? "bg-red-600"
                    : "bg-green-600"
                }`}
                style={{
                  width: `${Math.min(summary.budget_utilization_percent, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Budget by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Labor</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">
                    {summary.labor_budget?.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">
                    {summary.labor_spent?.toLocaleString()} RWF
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (summary.labor_spent / summary.labor_budget) * 100,
                        100,
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Materials</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">
                    {summary.materials_budget?.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">
                    {summary.materials_spent?.toLocaleString()} RWF
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (summary.materials_spent / summary.materials_budget) *
                          100,
                        100,
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Equipment</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">
                    {summary.equipment_budget?.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">
                    {summary.equipment_spent?.toLocaleString()} RWF
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (summary.equipment_spent / summary.equipment_budget) *
                          100,
                        100,
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Other</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">
                    {summary.other_spent?.toLocaleString()} RWF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending History */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Spending Records</h3>
        {spending.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Wallet size={48} className="mx-auto mb-4 opacity-50" />
            <p>No spending records yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {spending.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        record.category,
                      )}`}
                    >
                      {record.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {getSourceDisplayName(record)}
                  </p>
                  {record.description && (
                    <p className="text-sm text-gray-700">
                      {record.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(record.spending_date).toLocaleDateString()} •
                    Recorded by {record.recorded_by_name || "System"}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-bold text-gray-800">
                    {record.amount?.toLocaleString()} RWF
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSpending(record.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingBudget ? "Edit Budget" : "Create Budget"}
            </h3>

            <form
              onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget *
                </label>
                <input
                  type="number"
                  value={budgetForm.total_budget}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      total_budget: parseFloat(e.target.value),
                    })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Budget
                </label>
                <input
                  type="number"
                  value={budgetForm.labor_budget}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      labor_budget: parseFloat(e.target.value),
                    })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materials Budget
                </label>
                <input
                  type="number"
                  value={budgetForm.materials_budget}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      materials_budget: parseFloat(e.target.value),
                    })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Budget
                </label>
                <input
                  type="number"
                  value={budgetForm.equipment_budget}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      equipment_budget: parseFloat(e.target.value),
                    })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contingency Budget
                </label>
                <input
                  type="number"
                  value={budgetForm.contingency_budget}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      contingency_budget: parseFloat(e.target.value),
                    })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBudget(false);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spending Modal */}
      {showSpendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Record Spending</h3>

            <form onSubmit={handleRecordSpending} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={spendingForm.category}
                  onChange={(e) => {
                    setSpendingForm({
                      ...spendingForm,
                      category: e.target.value,
                      worker_id: "",
                      inventory_item_id: "",
                      expense_id: "",
                    });
                  }}
                  className="input-field"
                >
                  <option value="labor">Labor</option>
                  <option value="materials">Materials</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Workers dropdown for labor */}
              {spendingForm.category === "labor" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Worker *
                  </label>
                  <select
                    value={spendingForm.worker_id}
                    onChange={(e) =>
                      setSpendingForm({
                        ...spendingForm,
                        worker_id: e.target.value,
                      })
                    }
                    className="input-field"
                    required
                  >
                    <option value="">-- Choose a worker --</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.full_name} ({worker.position})
                      </option>
                    ))}
                  </select>
                  {workers.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No active workers in this project
                    </p>
                  )}
                </div>
              )}

              {/* Inventory dropdown for materials/equipment */}
              {(spendingForm.category === "materials" ||
                spendingForm.category === "equipment") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {spendingForm.category} Item *
                  </label>
                  <select
                    value={spendingForm.inventory_item_id}
                    onChange={(e) =>
                      setSpendingForm({
                        ...spendingForm,
                        inventory_item_id: e.target.value,
                      })
                    }
                    className="input-field"
                    required
                  >
                    <option value="">-- Choose an item --</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                  {inventoryItems.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No inventory items available in this project
                    </p>
                  )}
                </div>
              )}

              {/* Expenses dropdown for other */}
              {spendingForm.category === "other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Expense (Optional)
                  </label>
                  <select
                    value={spendingForm.expense_id}
                    onChange={(e) =>
                      setSpendingForm({
                        ...spendingForm,
                        expense_id: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    <option value="">-- Choose an expense (or leave blank) --</option>
                    {expenses.map((expense) => (
                      <option key={expense.id} value={expense.id}>
                        {expense.expense_type} - {expense.amount?.toLocaleString()} RWF
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={spendingForm.description}
                  onChange={(e) =>
                    setSpendingForm({
                      ...spendingForm,
                      description: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="Note about this spending"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (RWF) *
                </label>
                <input
                  type="number"
                  value={spendingForm.amount}
                  onChange={(e) =>
                    setSpendingForm({
                      ...spendingForm,
                      amount: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={spendingForm.spending_date}
                  onChange={(e) =>
                    setSpendingForm({
                      ...spendingForm,
                      spending_date: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSpendingModal(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTracking;
