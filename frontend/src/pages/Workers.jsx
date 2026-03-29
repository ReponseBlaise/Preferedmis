import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();

  // Attendance history state
  const [expandedWorker, setExpandedWorker] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState({});

  // Auto-fill search from global search navigation
  useEffect(() => {
    const s = searchParams.get("search");
    if (s) setSearchTerm(s);
  }, [searchParams]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPaymentType, setFilterPaymentType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    project_id: "",
    full_name: "",
    phone: "",
    position: "",
    rate_per_day: "",
    monthly_salary: "",
    payment_type: "daily",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchWorkers();
    }
  }, [selectedProject, filterPaymentType, filterStatus, filterPosition]);

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

  const fetchWorkers = async () => {
    try {
      const data = await api.getWorkers({
        project_id: selectedProject,
        is_active:
          filterStatus === "active"
            ? true
            : filterStatus === "inactive"
              ? false
              : undefined,
      });
      let workersData = data || [];

      // Filter by payment type
      if (filterPaymentType !== "all") {
        workersData = workersData.filter(
          (w) => w.payment_type === filterPaymentType,
        );
      }

      // Filter by position
      if (filterPosition !== "all") {
        workersData = workersData.filter((w) => w.position === filterPosition);
      }

      setWorkers(workersData);
    } catch (error) {
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        // Only set project_id for new workers; for updates, keep the original
        ...(editingWorker ? {} : { project_id: selectedProject }),
        rate_per_day:
          formData.payment_type === "daily" ? formData.rate_per_day : null,
        monthly_salary:
          formData.payment_type === "monthly" ? formData.monthly_salary : null,
      };

      if (editingWorker) {
        await api.updateWorker(editingWorker.id, submitData);
        toast.success("Worker updated successfully");
      } else {
        await api.createWorker(submitData);
        toast.success("Worker created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchWorkers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      project_id: worker.project_id,
      full_name: worker.full_name,
      phone: worker.phone,
      position: worker.position,
      rate_per_day: worker.rate_per_day || "",
      monthly_salary: worker.monthly_salary || "",
      payment_type: worker.payment_type,
      start_date:
        worker.start_date?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      end_date: worker.end_date?.split("T")[0] || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this worker?")) {
      try {
        await api.deleteWorker(id);
        toast.success("Worker deleted successfully");
        fetchWorkers();
      } catch (error) {
        toast.error("Failed to delete worker");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: "",
      full_name: "",
      phone: "",
      position: "",
      rate_per_day: "",
      monthly_salary: "",
      payment_type: "daily",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
    });
    setEditingWorker(null);
  };

  const resetFilters = () => {
    setFilterPaymentType("all");
    setFilterStatus("all");
    setFilterPosition("all");
  };

  // Fetch last 7 days attendance for a worker
  const fetchWorkerAttendance = async (workerId, workerName) => {
    if (expandedWorker === workerId) {
      setExpandedWorker(null);
      return;
    }

    setExpandedWorker(workerId);
    setLoadingAttendance({ ...loadingAttendance, [workerId]: true });

    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const startDate = sevenDaysAgo.toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      const data = await api.getAttendance({
        worker_id: workerId,
        project_id: selectedProject,
        start_date: startDate,
        end_date: endDate,
      });

      setAttendanceHistory({
        ...attendanceHistory,
        [workerId]: data || [],
      });
    } catch (error) {
      console.error("Failed to load attendance:", error);
      toast.error("Failed to load attendance history");
      setAttendanceHistory({
        ...attendanceHistory,
        [workerId]: [],
      });
    } finally {
      setLoadingAttendance({ ...loadingAttendance, [workerId]: false });
    }
  };

  // Get unique positions for filter
  const uniquePositions = [
    ...new Set(workers.map((w) => w.position).filter(Boolean)),
  ];

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.phone?.includes(searchTerm) ||
      worker.position?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculate stats from filtered results
  const stats = {
    total: filteredWorkers.length,
    daily: filteredWorkers.filter((w) => w.payment_type === "daily").length,
    monthly: filteredWorkers.filter((w) => w.payment_type === "monthly").length,
    active: filteredWorkers.filter((w) => w.is_active === true).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">{t("workers")}</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">{t("addWorker")}</span>
          <span className="sm:hidden">{t("add")}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t("total")}</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Users size={32} className="text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t("daily")}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.daily}</p>
            </div>
            <Calendar size={32} className="text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t("monthly")}</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.monthly}
              </p>
            </div>
            <DollarSign size={32} className="text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t("active")}</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <Users size={32} className="text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-field flex-1"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t("search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={18} />
            {t("filter")}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("paymentType")}
                </label>
                <select
                  value={filterPaymentType}
                  onChange={(e) => setFilterPaymentType(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">{t("all")}</option>
                  <option value="daily">{t("daily")}</option>
                  <option value="monthly">{t("monthly")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("status")}
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">{t("all")}</option>
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("position")}
                </label>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">{t("all")}</option>
                  {uniquePositions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X size={14} />
                {t("resetFilters")}
              </button>
            </div>
          </div>
        )}

        {/* Workers Table - Responsive */}
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">{t("loading")}</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t("noWorkers")}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        {/* Expand button column */}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("workerName")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("contact")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("position")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("rate")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("paymentType")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkers.map((worker) => (
                      <React.Fragment key={worker.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => fetchWorkerAttendance(worker.id, worker.full_name)}
                              className="text-gray-500 hover:text-primary-600 transition"
                              title="View attendance history"
                            >
                              {expandedWorker === worker.id ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {worker.full_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {worker.phone || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                            {worker.position}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {worker.payment_type === "monthly"
                              ? `${worker.monthly_salary || 0} RWF/mo`
                              : `${worker.rate_per_day || 0} RWF/day`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              worker.payment_type === "daily"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {t(worker.payment_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              worker.payment_type === "monthly" &&
                              worker.end_date
                                ? "bg-red-100 text-red-800"
                                : worker.is_active !== false
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {worker.payment_type === "monthly" &&
                            worker.end_date
                              ? t("ended")
                              : worker.is_active !== false
                                ? t("active")
                                : t("inactive")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(worker)}
                              className="text-blue-600 hover:text-blue-800"
                              title={t("edit")}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(worker.id)}
                              className="text-red-600 hover:text-red-800"
                              title={t("delete")}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                        </tr>

                        {/* Attendance History Row */}
                        {expandedWorker === worker.id && (
                          <tr className="bg-blue-50 border-none">
                            <td colSpan="8" className="px-6 py-4">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-gray-800">
                                    📅 Last 7 Days Attendance
                                  </h4>
                                  {loadingAttendance[worker.id] && (
                                    <div className="text-sm text-gray-500">
                                      Loading...
                                    </div>
                                  )}
                                </div>

                                {loadingAttendance[worker.id] ? (
                                  <div className="text-center py-6">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                  </div>
                                ) : attendanceHistory[worker.id] &&
                                  attendanceHistory[worker.id].length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-white border-b">
                                          <th className="text-left px-4 py-2 font-medium text-gray-700">
                                            Date
                                          </th>
                                          <th className="text-left px-4 py-2 font-medium text-gray-700">
                                            Days Worked
                                          </th>
                                          <th className="text-left px-4 py-2 font-medium text-gray-700">
                                            Status
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {attendanceHistory[worker.id].map(
                                          (record, idx) => (
                                            <tr
                                              key={idx}
                                              className="border-b hover:bg-white"
                                            >
                                              <td className="px-4 py-2 text-gray-700">
                                                {new Date(
                                                  record.attendance_date,
                                                ).toLocaleDateString()}
                                              </td>
                                              <td className="px-4 py-2 text-gray-700">
                                                {record.days_worked || 0}
                                              </td>
                                              <td className="px-4 py-2">
                                                {record.days_worked > 0 ? (
                                                  <span className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle size={16} />
                                                    Present
                                                  </span>
                                                ) : (
                                                  <span className="flex items-center gap-1 text-red-600">
                                                    <XCircle size={16} />
                                                    Absent
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-gray-500">
                                    <p>No attendance records for the last 7 days</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-white rounded-lg shadow overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {worker.full_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {worker.position}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(worker)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(worker.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">{t("phone")}:</span>
                          <p className="text-gray-800">{worker.phone || "-"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">{t("rate")}:</span>
                          <p className="text-gray-800">
                            {worker.payment_type === "monthly"
                              ? `${worker.monthly_salary || 0} RWF/mo`
                              : `${worker.rate_per_day || 0} RWF/day`}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("paymentType")}:
                          </span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              worker.payment_type === "daily"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {t(worker.payment_type)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t("status")}:</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              worker.is_active !== false
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {worker.is_active !== false
                              ? t("active")
                              : t("inactive")}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Attendance Toggle */}
                      <button
                        onClick={() =>
                          fetchWorkerAttendance(worker.id, worker.full_name)
                        }
                        className="w-full mt-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {expandedWorker === worker.id ? (
                          <>
                            <ChevronUp size={16} />
                            Hide Attendance
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            View Attendance (Last 7 Days)
                          </>
                        )}
                      </button>
                    </div>

                    {/* Mobile Attendance History */}
                    {expandedWorker === worker.id && (
                      <div className="bg-blue-50 p-4 border-t border-blue-200 space-y-3">
                        <h4 className="font-semibold text-gray-800 text-sm">
                          📅 Attendance History
                        </h4>

                        {loadingAttendance[worker.id] ? (
                          <div className="text-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                          </div>
                        ) : attendanceHistory[worker.id] &&
                          attendanceHistory[worker.id].length > 0 ? (
                          <div className="space-y-2">
                            {attendanceHistory[worker.id].map((record, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-2 rounded text-xs flex justify-between items-center"
                              >
                                <span className="text-gray-700">
                                  {new Date(
                                    record.attendance_date,
                                  ).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">
                                    {record.days_worked || 0} days
                                  </span>
                                  {record.days_worked > 0 ? (
                                    <CheckCircle size={14} className="text-green-600" />
                                  ) : (
                                    <XCircle size={14} className="text-red-600" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-sm text-center py-4">
                            No attendance records
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingWorker ? t("editWorker") : t("addWorker")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={t("workerName")}
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="input-field"
                required
              />
              <input
                type="tel"
                placeholder={t("phone")}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="input-field"
              />
              <input
                type="text"
                placeholder={t("position")}
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="input-field"
              />

              {/* Payment Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("paymentType")}
                </label>
                <select
                  value={formData.payment_type}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_type: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="daily">{t("daily")}</option>
                  <option value="monthly">{t("monthly")}</option>
                </select>
              </div>

              {/* Conditional Rate/Salary Field */}
              {formData.payment_type === "daily" ? (
                <input
                  type="number"
                  placeholder={t("ratePerDay")}
                  value={formData.rate_per_day}
                  onChange={(e) =>
                    setFormData({ ...formData, rate_per_day: e.target.value })
                  }
                  className="input-field"
                  required
                />
              ) : (
                <>
                  <input
                    type="number"
                    placeholder={t("monthlySalary")}
                    value={formData.monthly_salary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthly_salary: e.target.value,
                      })
                    }
                    className="input-field"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("startDate")}
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("endDate")} ({t("optional")})
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="input-field"
                      placeholder={t("leaveEmptyIfStillEmployed")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t("leaveEmptyIfStillEmployed")}
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
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
                <button type="submit" className="btn-primary flex-1">
                  {t("save")}
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
