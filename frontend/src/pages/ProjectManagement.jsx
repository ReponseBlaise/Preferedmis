import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { formatRWF } from "../utils/currency";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Target,
  Wallet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Box,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [activeTab, setActiveTab] = useState("progress");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Progress/Milestones state
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneSummary, setMilestoneSummary] = useState({
    total_milestones: 0,
    completed_milestones: 0,
    delayed_milestones: 0,
    avg_completion_percentage: 0,
  });

  // Scheduling state
  const [workers, setWorkers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Budget state
  const [budget, setBudget] = useState(null);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [spending, setSpending] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [sourceData, setSourceData] = useState({
    workers: [],
    inventoryItems: [],
    expenses: [],
  });

  // Inventory & Stock state
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);

  // Form states
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    due_date: "",
    completion_percentage: 0,
    status: "not_started",
  });

  const [scheduleForm, setScheduleForm] = useState({
    worker_id: "",
    project_id: "",
    schedule_date: "",
    hours_assigned: 8,
    notes: "",
  });

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

  const [inventoryForm, setInventoryForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    unit_price: "",
    category_id: "",
  });

  const [stockForm, setStockForm] = useState({
    inventory_item_id: "",
    movement_type: "in",
    quantity: "",
    notes: "",
  });

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, []);

  // Load data when project changes
  useEffect(() => {
    if (selectedProject) {
      if (activeTab === "progress") {
        fetchMilestones();
        fetchMilestoneSummary();
      } else if (activeTab === "scheduling") {
        fetchWorkers();
        fetchSchedules();
      } else if (activeTab === "budgeting") {
        fetchBudget();
        fetchBudgetSummary();
        fetchSpending();
        fetchBudgetAlerts();
        loadSourceData();
      } else if (activeTab === "inventory") {
        fetchInventoryItems();
        fetchStockMovements();
      }
    }
  }, [selectedProject, activeTab]);

  // Refetch schedules when date changes
  useEffect(() => {
    if (selectedProject && activeTab === "scheduling") {
      fetchSchedules();
    }
  }, [currentDate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // ============ MILESTONE FUNCTIONS ============
  const fetchMilestones = async () => {
    try {
      const data = await api.getMilestones({ project_id: selectedProject });
      setMilestones(data || []);
    } catch (error) {
      toast.error("Failed to load milestones");
    }
  };

  const fetchMilestoneSummary = async () => {
    try {
      const data = await api.getMilestoneSummary({
        project_id: selectedProject,
      });
      setMilestoneSummary(data || {});
    } catch (error) {
      console.error("Failed to load milestone summary");
    }
  };

  const handleSaveMilestone = async () => {
    if (!milestoneForm.title || !milestoneForm.due_date) {
      toast.error("Title and due date are required");
      return;
    }

    try {
      if (editingMilestone) {
        await api.updateMilestone(editingMilestone.id, {
          ...milestoneForm,
          project_id: selectedProject,
        });
        toast.success("Milestone updated successfully");
      } else {
        await api.createMilestone({
          ...milestoneForm,
          project_id: selectedProject,
        });
        toast.success("Milestone created successfully");
      }
      setShowMilestoneModal(false);
      setMilestoneForm({
        title: "",
        description: "",
        due_date: "",
        completion_percentage: 0,
        status: "not_started",
      });
      setEditingMilestone(null);
      fetchMilestones();
      fetchMilestoneSummary();
    } catch (error) {
      toast.error("Failed to save milestone");
    }
  };

  // ============ SCHEDULING FUNCTIONS ============
  const fetchWorkers = async () => {
    try {
      const data = await api.getWorkers({ project_id: selectedProject });
      setWorkers(data || []);
    } catch (error) {
      toast.error("Failed to load workers");
    }
  };

  const fetchSchedules = async () => {
    try {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const data = await api.getSchedules({
        project_id: selectedProject,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });
      setSchedules(data || []);
    } catch (error) {
      toast.error("Failed to load schedules");
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.worker_id || !scheduleForm.schedule_date) {
      toast.error("Worker and date are required");
      return;
    }

    try {
      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, {
          ...scheduleForm,
          project_id: selectedProject,
        });
        toast.success("Schedule updated successfully");
      } else {
        await api.createSchedule({
          ...scheduleForm,
          project_id: selectedProject,
        });
        toast.success("Schedule created successfully");
      }
      setShowScheduleModal(false);
      setScheduleForm({
        worker_id: "",
        project_id: "",
        schedule_date: "",
        hours_assigned: 8,
        notes: "",
      });
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to save schedule");
    }
  };

  // ============ BUDGET FUNCTIONS ============
  const loadSourceData = async () => {
    try {
      const [workersData, inventoryData, expensesData] = await Promise.all([
        api.getProjectWorkers({ project_id: selectedProject }),
        api.getProjectInventory({ project_id: selectedProject }),
        api.getProjectExpenses({ project_id: selectedProject }),
      ]);
      setSourceData({
        workers: workersData || [],
        inventoryItems: inventoryData || [],
        expenses: expensesData || [],
      });
    } catch (error) {
      console.error("Failed to load source data:", error);
    }
  };

  const fetchBudget = async () => {
    try {
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
      console.error("Failed to fetch budget:", error);
    }
  };

  const fetchBudgetSummary = async () => {
    try {
      const data = await api.getBudgetSummary({ project_id: selectedProject });
      if (data) {
        setBudgetSummary(data);
      }
    } catch (error) {
      console.error("Failed to fetch budget summary:", error);
    }
  };

  const fetchSpending = async () => {
    try {
      const data = await api.getSpending({ project_id: selectedProject });
      setSpending(data || []);
    } catch (error) {
      console.error("Failed to fetch spending:", error);
    }
  };

  const fetchBudgetAlerts = async () => {
    try {
      const data = await api.getBudgetAlerts({ project_id: selectedProject });
      setBudgetAlerts(data || []);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  // ============ INVENTORY FUNCTIONS ============
  const fetchInventoryItems = async () => {
    try {
      const data = await api.getInventoryItems({ project_id: selectedProject });
      setInventoryItems(data || []);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      toast.error("Failed to load inventory items");
    }
  };

  const fetchStockMovements = async () => {
    try {
      const data = await api.getProjectStockMovements(selectedProject);
      setStockMovements(data || []);
    } catch (error) {
      console.error("Failed to fetch stock movements:", error);
      toast.error("Failed to load stock movements");
    }
  };

  const handleSaveInventoryItem = async () => {
    if (!inventoryForm.name || !inventoryForm.quantity) {
      toast.error("Name and quantity are required");
      return;
    }

    try {
      if (editingInventory) {
        await api.updateInventoryItem(editingInventory.id, {
          ...inventoryForm,
          project_id: selectedProject,
        });
        toast.success("Item updated successfully");
      } else {
        await api.createInventoryItem({
          ...inventoryForm,
          project_id: selectedProject,
        });
        toast.success("Item created successfully");
      }
      setShowInventoryModal(false);
      setInventoryForm({
        name: "",
        quantity: "",
        unit: "",
        unit_price: "",
        category_id: "",
      });
      setEditingInventory(null);
      fetchInventoryItems();
    } catch (error) {
      toast.error("Failed to save inventory item");
    }
  };

  const handleRecordStockMovement = async () => {
    if (!stockForm.inventory_item_id || !stockForm.quantity) {
      toast.error("Item and quantity are required");
      return;
    }

    try {
      await api.recordProjectStockMovement({
        ...stockForm,
        project_id: selectedProject,
        quantity: parseFloat(stockForm.quantity),
      });
      toast.success("Stock movement recorded");
      setShowStockModal(false);
      setStockForm({
        inventory_item_id: "",
        movement_type: "in",
        quantity: "",
        notes: "",
      });
      fetchInventoryItems();
      fetchStockMovements();
    } catch (error) {
      toast.error("Failed to record stock movement");
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetForm.total_budget) {
      toast.error("Total budget is required");
      return;
    }

    try {
      if (budget) {
        await api.updateBudget(selectedProject, budgetForm);
        toast.success("Budget updated successfully");
      } else {
        await api.createBudget({
          ...budgetForm,
          project_id: selectedProject,
        });
        toast.success("Budget created successfully");
      }
      setShowBudgetModal(false);
      setEditingBudget(false);
      fetchBudget();
      fetchBudgetSummary();
    } catch (error) {
      toast.error("Failed to save budget");
    }
  };

  const handleRecordSpending = async () => {
    if (!spendingForm.amount) {
      toast.error("Amount is required");
      return;
    }

    try {
      await api.recordSpending({
        ...spendingForm,
        project_id: selectedProject,
      });
      toast.success("Spending recorded successfully");
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
      fetchBudgetSummary();
      fetchBudgetAlerts();
    } catch (error) {
      toast.error("Failed to record spending");
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getStatusColor = (status) => {
    const colors = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      delayed: "bg-red-100 text-red-800",
      on_hold: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-600" size={18} />;
      case "in_progress":
        return <Clock className="text-blue-600" size={18} />;
      case "delayed":
        return <AlertCircle className="text-red-600" size={18} />;
      default:
        return <Clock className="text-gray-600" size={18} />;
    }
  };

  const daysInMonth = (date) => {
    return new Array(42).fill(null).map((_, i) => {
      const d = new Date(
        date.getFullYear(),
        date.getMonth(),
        i - date.getDay() + 1,
      );
      return d;
    });
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(
      (s) => s.schedule_date === date.toISOString().split("T")[0],
    );
  };

  if (loading) {
    return <div className="p-4">Loading projects...</div>;
  }

  if (!selectedProject) {
    return <div className="p-4">No projects available</div>;
  }

  const currentProject = projects.find((p) => p.id === selectedProject);

  return (
    <div className="p-4 md:p-6">
      {/* Header with clear project selection */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Project Management
        </h1>

        {/* Project Selection - PROMINENT */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4 mb-6 border-2 border-blue-200 dark:border-blue-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            📋 Select Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg dark:bg-gray-800 dark:text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_name} {project.is_active ? "" : "(Inactive)"}
              </option>
            ))}
          </select>
          {currentProject && (
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              ✓ Currently viewing:{" "}
              <strong>{currentProject.project_name}</strong>
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-1">
          <button
            onClick={() => setActiveTab("progress")}
            className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === "progress"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <Target size={18} /> Progress & Milestones
          </button>
          <button
            onClick={() => setActiveTab("scheduling")}
            className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === "scheduling"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <Calendar size={18} /> Worker Scheduling
          </button>
          <button
            onClick={() => setActiveTab("budgeting")}
            className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === "budgeting"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <Wallet size={18} /> Budget Tracking
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === "inventory"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <Box size={18} /> Inventory & Stock
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* PROGRESS TAB */}
      {activeTab === "progress" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Milestones
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {milestoneSummary.total_milestones || 0}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg shadow">
              <div className="text-sm text-green-700 dark:text-green-300">
                Completed
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {milestoneSummary.completed_milestones || 0}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg shadow">
              <div className="text-sm text-red-700 dark:text-red-300">
                Delayed
              </div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {milestoneSummary.delayed_milestones || 0}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg shadow">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Avg. Progress
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(milestoneSummary.avg_completion_percentage || 0)}%
              </div>
            </div>
          </div>

          {/* Add Milestone Button */}
          <button
            onClick={() => {
              setEditingMilestone(null);
              setMilestoneForm({
                title: "",
                description: "",
                due_date: "",
                completion_percentage: 0,
                status: "not_started",
              });
              setShowMilestoneModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Add Milestone
          </button>

          {/* Milestones List */}
          <div className="grid grid-cols-1 gap-4">
            {milestones.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No milestones yet. Create one to get started!
                </p>
              </div>
            ) : (
              milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(milestone.status)}
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due:{" "}
                          {new Date(milestone.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        milestone.status,
                      )}`}
                    >
                      {milestone.status}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Progress
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {milestone.completion_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${milestone.completion_percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {milestone.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingMilestone(milestone);
                        setMilestoneForm({
                          title: milestone.title,
                          description: milestone.description,
                          due_date: milestone.due_date,
                          completion_percentage:
                            milestone.completion_percentage,
                          status: milestone.status,
                        });
                        setShowMilestoneModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this milestone?",
                          )
                        ) {
                          api
                            .deleteMilestone(milestone.id)
                            .then(() => {
                              toast.success("Milestone deleted");
                              fetchMilestones();
                              fetchMilestoneSummary();
                            })
                            .catch(() =>
                              toast.error("Failed to delete milestone"),
                            );
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Milestone Modal */}
          {showMilestoneModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingMilestone ? "Edit Milestone" : "Add Milestone"}
                  </h2>
                  <button
                    onClick={() => setShowMilestoneModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={milestoneForm.title}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Foundation Complete"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={milestoneForm.description}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      rows="3"
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        value={milestoneForm.due_date}
                        onChange={(e) =>
                          setMilestoneForm({
                            ...milestoneForm,
                            due_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={milestoneForm.status}
                        onChange={(e) =>
                          setMilestoneForm({
                            ...milestoneForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Completion: {milestoneForm.completion_percentage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={milestoneForm.completion_percentage}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          completion_percentage: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700 justify-end">
                  <button
                    onClick={() => setShowMilestoneModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMilestone}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Milestone
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCHEDULING TAB */}
      {activeTab === "scheduling" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                  )
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                  )
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={() => {
                setEditingSchedule(null);
                setScheduleForm({
                  worker_id: "",
                  project_id: selectedProject,
                  schedule_date: "",
                  hours_assigned: 8,
                  notes: "",
                });
                setShowScheduleModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} /> Add Schedule
            </button>
          </div>

          {/* Calendar/Schedule Grid */}
          {workers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No workers assigned to this project
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Worker
                    </th>
                    {[...new Array(7)].map((_, i) => {
                      const d = new Date(currentDate);
                      d.setDate(d.getDate() - d.getDay() + i);
                      return (
                        <th
                          key={i}
                          className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white text-sm"
                        >
                          <div>
                            {d.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {d.getDate()}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {worker.full_name}
                      </td>
                      {[...new Array(7)].map((_, i) => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() - d.getDay() + i);
                        const daySchedules = getSchedulesForDate(d);
                        const workerSchedule = daySchedules.find(
                          (s) => s.worker_id === worker.id,
                        );
                        return (
                          <td
                            key={i}
                            className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700"
                          >
                            {workerSchedule ? (
                              <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-sm font-semibold text-green-800 dark:text-green-200">
                                {workerSchedule.hours_assigned}h
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Schedule Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingSchedule ? "Edit Schedule" : "Add Schedule"}
                  </h2>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Worker *
                    </label>
                    <select
                      value={scheduleForm.worker_id}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          worker_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a worker</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.schedule_date}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          schedule_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hours: {scheduleForm.hours_assigned}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={scheduleForm.hours_assigned}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          hours_assigned: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={scheduleForm.notes}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      rows="3"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700 justify-end">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BUDGETING TAB */}
      {activeTab === "budgeting" && (
        <div className="space-y-6">
          {/* Budget Alerts */}
          {budgetAlerts.length > 0 && (
            <div className="space-y-2">
              {budgetAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    alert.alert_type === "critical"
                      ? "bg-red-50 dark:bg-red-900"
                      : alert.alert_type === "warning"
                        ? "bg-yellow-50 dark:bg-yellow-900"
                        : "bg-blue-50 dark:bg-blue-900"
                  }`}
                >
                  <AlertTriangle
                    size={20}
                    className={
                      alert.alert_type === "critical"
                        ? "text-red-600 dark:text-red-400"
                        : alert.alert_type === "warning"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-blue-600 dark:text-blue-400"
                    }
                  />
                  <div>
                    <p
                      className={
                        alert.alert_type === "critical"
                          ? "text-red-800 dark:text-red-200 font-semibold"
                          : alert.alert_type === "warning"
                            ? "text-yellow-800 dark:text-yellow-200 font-semibold"
                            : "text-blue-800 dark:text-blue-200 font-semibold"
                      }
                    >
                      {alert.alert_type === "critical"
                        ? "Critical:"
                        : alert.alert_type === "warning"
                          ? "Warning:"
                          : "Info:"}
                      {" " + alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Budget Summary */}
          {budget ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    TOTAL BUDGET
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatRWF(budget.total_budget)}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg shadow">
                  <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                    LABOR BUDGET
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatRWF(budget.labor_budget)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Spent: {formatRWF(budgetSummary?.labor_spent || 0)}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg shadow">
                  <div className="text-xs text-green-700 dark:text-green-300 mb-1">
                    MATERIALS
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatRWF(budget.materials_budget)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Spent: {formatRWF(budgetSummary?.materials_spent || 0)}
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900 p-4 rounded-lg shadow">
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-1">
                    EQUIPMENT
                  </div>
                  <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {formatRWF(budget.equipment_budget)}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Spent: {formatRWF(budgetSummary?.equipment_spent || 0)}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg shadow">
                  <div className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                    CONTINGENCY
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatRWF(budget.contingency_budget)}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Spent: {formatRWF(budgetSummary?.contingency_spent || 0)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingBudget(true);
                    setShowBudgetModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit size={20} /> Edit Budget
                </button>
                <button
                  onClick={() => {
                    setShowSpendingModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus size={20} /> Record Spending
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No budget created yet
              </p>
              <button
                onClick={() => {
                  setEditingBudget(false);
                  setBudgetForm({
                    total_budget: "",
                    labor_budget: "",
                    materials_budget: "",
                    equipment_budget: "",
                    contingency_budget: "",
                    notes: "",
                  });
                  setShowBudgetModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} /> Create Budget
              </button>
            </div>
          )}

          {/* Spending Records */}
          {spending.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Recent Spending
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {spending.slice(0, 10).map((record) => (
                      <tr
                        key={record.id}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {new Date(record.spending_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              record.category === "labor"
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                : record.category === "materials"
                                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  : record.category === "equipment"
                                    ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {record.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {record.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">
                          {formatRWF(record.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Budget Modal */}
          {showBudgetModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingBudget ? "Edit Budget" : "Create Budget"}
                  </h2>
                  <button
                    onClick={() => setShowBudgetModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Budget *
                    </label>
                    <input
                      type="number"
                      value={budgetForm.total_budget}
                      onChange={(e) =>
                        setBudgetForm({
                          ...budgetForm,
                          total_budget: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Labor Budget
                      </label>
                      <input
                        type="number"
                        value={budgetForm.labor_budget}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            labor_budget: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Materials Budget
                      </label>
                      <input
                        type="number"
                        value={budgetForm.materials_budget}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            materials_budget: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Equipment Budget
                      </label>
                      <input
                        type="number"
                        value={budgetForm.equipment_budget}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            equipment_budget: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contingency Budget
                      </label>
                      <input
                        type="number"
                        value={budgetForm.contingency_budget}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            contingency_budget: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={budgetForm.notes}
                      onChange={(e) =>
                        setBudgetForm({
                          ...budgetForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      rows="3"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700 justify-end">
                  <button
                    onClick={() => setShowBudgetModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBudget}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Budget
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Spending Modal */}
          {showSpendingModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Record Spending
                  </h2>
                  <button
                    onClick={() => setShowSpendingModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="labor">Labor</option>
                      <option value="materials">Materials</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {spendingForm.category === "labor" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">-- Select a worker --</option>
                        {sourceData.workers.map((worker) => (
                          <option key={worker.id} value={worker.id}>
                            {worker.full_name} ({worker.position})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(spendingForm.category === "materials" ||
                    spendingForm.category === "equipment") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Item *
                      </label>
                      <select
                        value={spendingForm.inventory_item_id}
                        onChange={(e) =>
                          setSpendingForm({
                            ...spendingForm,
                            inventory_item_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">-- Select an item --</option>
                        {sourceData.inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({formatRWF(item.unit_price)} per {item.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {spendingForm.category === "other" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">
                          -- Select expense or leave blank --
                        </option>
                        {sourceData.expenses.map((expense) => (
                          <option key={expense.id} value={expense.id}>
                            {expense.expense_type} - {formatRWF(expense.amount)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Foundation materials"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount *
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700 justify-end">
                  <button
                    onClick={() => setShowSpendingModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordSpending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Record Spending
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INVENTORY & STOCK TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingInventory(null);
                setInventoryForm({
                  name: "",
                  quantity: "",
                  unit: "",
                  unit_price: "",
                  category_id: "",
                });
                setShowInventoryModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} /> Add Item
            </button>
            <button
              onClick={() => setShowStockModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={20} /> Record Movement
            </button>
          </div>

          {/* Inventory Items Table */}
          {inventoryItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Box className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No inventory items yet. Add one to get started!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-gray-800 rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Total Value
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {formatRWF(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {formatRWF(item.total_price || item.quantity * item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setEditingInventory(item);
                            setInventoryForm({
                              name: item.name,
                              quantity: item.quantity,
                              unit: item.unit,
                              unit_price: item.unit_price,
                              category_id: item.category_id,
                            });
                            setShowInventoryModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this item?")) {
                              api
                                .deleteInventoryItem(item.id)
                                .then(() => {
                                  toast.success("Item deleted");
                                  fetchInventoryItems();
                                })
                                .catch(() =>
                                  toast.error("Failed to delete item")
                                );
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 ml-1"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent Stock Movements */}
          {stockMovements.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Recent Stock Movements
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white dark:bg-gray-800 rounded-lg">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.slice(0, 10).map((movement) => (
                      <tr
                        key={movement.id}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {new Date(movement.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {movement.inventory_item?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit ${
                              movement.movement_type === "in"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {movement.movement_type === "in" ? (
                              <ArrowDownLeft size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                            {movement.movement_type === "in"
                              ? "In"
                              : "Out"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">
                          {movement.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {movement.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Modal */}
          {showInventoryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingInventory ? "Edit Item" : "Add Item"}
                  </h2>
                  <button
                    onClick={() => setShowInventoryModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={inventoryForm.name}
                      onChange={(e) =>
                        setInventoryForm({
                          ...inventoryForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Cement Bags"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={inventoryForm.quantity}
                        onChange={(e) =>
                          setInventoryForm({
                            ...inventoryForm,
                            quantity: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={inventoryForm.unit}
                        onChange={(e) =>
                          setInventoryForm({
                            ...inventoryForm,
                            unit: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., bags"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit Price (RWF)
                    </label>
                    <input
                      type="number"
                      value={inventoryForm.unit_price}
                      onChange={(e) =>
                        setInventoryForm({
                          ...inventoryForm,
                          unit_price: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700 justify-end">
                  <button
                    onClick={() => setShowInventoryModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInventoryItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stock Movement Modal */}
          {showStockModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Record Stock Movement
                  </h2>
                  <button
                    onClick={() => setShowStockModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item *
                    </label>
                    <select
                      value={stockForm.inventory_item_id}
                      onChange={(e) =>
                        setStockForm({
                          ...stockForm,
                          inventory_item_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">-- Select an item --</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Current: {item.quantity} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type *
                      </label>
                      <select
                        value={stockForm.movement_type}
                        onChange={(e) =>
                          setStockForm({
                            ...stockForm,
                            movement_type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="in">Stock In</option>
                        <option value="out">Stock Out</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={stockForm.quantity}
                        onChange={(e) =>
                          setStockForm({
                            ...stockForm,
                            quantity: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={stockForm.notes}
                      onChange={(e) =>
                        setStockForm({
                          ...stockForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      rows="3"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700 justify-end">
                  <button
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordStockMovement}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Record Movement
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
