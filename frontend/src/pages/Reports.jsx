import React, { useState, useEffect } from "react";
import {
  reportAPI,
  projectAPI,
  attendanceAPI,
  inventoryAPI,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  Download,
  Calendar,
  Filter,
  BarChart3,
  Users,
  Package,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

const Reports = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    payroll: null,
    inventory: null,
    attendance: null,
  });
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedProject(response.data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const fetchReportData = async () => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    setLoading(true);
    try {
      const params = {
        project_id: selectedProject,
        start_date: startDate,
        end_date: endDate,
      };

      // Fetch all report data
      const [payrollRes, inventoryRes, attendanceRes] = await Promise.all([
        attendanceAPI.getPayroll(params).catch(() => ({ data: [] })),
        inventoryAPI.getReport(params).catch(() => ({ data: [] })),
        attendanceAPI.getAll(params).catch(() => ({ data: [] })),
      ]);

      setReportData({
        payroll: payrollRes.data,
        inventory: inventoryRes.data,
        attendance: attendanceRes.data,
      });
    } catch (error) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPayroll = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.exportPayrollExcel({
        project_id: selectedProject,
        start_date: startDate,
        end_date: endDate,
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payroll_report_${startDate}_to_${endDate}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Payroll report exported successfully");
    } catch (error) {
      toast.error("Failed to export payroll report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportInventory = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.exportInventoryExcel({
        project_id: selectedProject,
        start_date: startDate,
        end_date: endDate,
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `inventory_report_${startDate}_to_${endDate}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Inventory report exported successfully");
    } catch (error) {
      toast.error("Failed to export inventory report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} p-6`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            {t("reports")}
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Generate and export business reports
          </p>
        </div>

        {/* Filters */}
        <div
          className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 mb-8`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {t("selectProject")}
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className={`w-full px-4 py-2 rounded border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {t("startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-2 rounded border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {t("endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-4 py-2 rounded border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              />
            </div>

            <button
              onClick={fetchReportData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center justify-center gap-2 w-full disabled:opacity-50"
            >
              <Filter className="w-4 h-4" />
              {loading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Payroll Report */}
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 border-l-4 border-blue-600`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {t("payrollReport")}
                  </h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Export payroll data for the selected period
                  </p>
                </div>
              </div>
            </div>

            {reportData.payroll && (
              <div
                className={`mb-4 p-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <p className="text-sm">
                  Total Workers: {reportData.payroll.length || 0}
                </p>
                {reportData.payroll.length > 0 && (
                  <p className="text-sm">
                    Total Payroll:{" "}
                    {reportData.payroll
                      .reduce((sum, w) => sum + (w.total_amount || 0), 0)
                      .toLocaleString()}{" "}
                    RWF
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleExportPayroll}
              disabled={loading || !selectedProject}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {t("export")} Excel
            </button>
          </div>

          {/* Inventory Report */}
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 border-l-4 border-green-600`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold">{t("inventory")}</h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Export inventory data for the selected period
                  </p>
                </div>
              </div>
            </div>

            {reportData.inventory && (
              <div
                className={`mb-4 p-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <p className="text-sm">
                  Total Items: {reportData.inventory.length || 0}
                </p>
                {reportData.inventory.length > 0 && (
                  <p className="text-sm">
                    Total Value:{" "}
                    {reportData.inventory
                      .reduce((sum, item) => sum + (item.total_value || 0), 0)
                      .toLocaleString()}{" "}
                    RWF
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleExportInventory}
              disabled={loading || !selectedProject}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {t("export")} Excel
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {reportData.attendance && reportData.attendance.length > 0 && (
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}
          >
            <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <p
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Total Records
                </p>
                <p className="text-2xl font-bold">
                  {reportData.attendance.length}
                </p>
              </div>
              <div
                className={`p-4 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <p
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Unique Workers
                </p>
                <p className="text-2xl font-bold">
                  {new Set(reportData.attendance.map((a) => a.worker_id)).size}
                </p>
              </div>
              <div
                className={`p-4 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <p
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Period
                </p>
                <p className="text-sm font-semibold">
                  {startDate} to {endDate}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
