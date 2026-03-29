import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Filter,
  BarChart3,
  Users,
  Package,
  DollarSign,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

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
      const data = await api.getProjects();
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
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
        api.getPayrollReport(params).catch(() => []),
        api.getInventoryReport(params).catch(() => []),
        api.getAttendance(params).catch(() => []),
      ]);

      setReportData({
        payroll: payrollRes,
        inventory: inventoryRes,
        attendance: attendanceRes,
      });
    } catch (error) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const exportPayrollReport = async (fileFormat = "excel") => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    try {
      let response, mimeType, fileName;

      if (fileFormat === "pdf") {
        response = await api.exportPayrollPDF({
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
        });
        mimeType = "application/pdf";
        fileName = `payroll_report_${startDate}_${endDate}.pdf`;
      } else {
        response = await api.exportPayrollExcel({
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
        });
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileName = `payroll_report_${startDate}_${endDate}.xlsx`;
      }

      const blob = new Blob([response.data || response], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Payroll report exported to ${fileFormat.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export payroll report");
    }
  };

  const exportInventoryReport = async (fileFormat = "excel") => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    try {
      let response, mimeType, fileName;

      if (fileFormat === "pdf") {
        response = await api.exportInventoryPDF({
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
        });
        mimeType = "application/pdf";
        fileName = `inventory_report_${startDate}_${endDate}.pdf`;
      } else {
        response = await api.exportInventoryExcel({
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
        });
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileName = `inventory_report_${startDate}_${endDate}.xlsx`;
      }

      const blob = new Blob([response.data || response], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Inventory report exported to ${fileFormat.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export inventory report");
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

        {/* Summary Stats */}
        {reportData.attendance && reportData.attendance.length > 0 && (
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 mb-8`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Attendance Summary</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportPayrollReport("excel")}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  title="Export payroll as Excel"
                >
                  <Download size={16} /> Payroll Excel
                </button>
                <button
                  onClick={() => exportPayrollReport("pdf")}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  title="Export payroll as PDF"
                >
                  <Download size={16} /> Payroll PDF
                </button>
              </div>
            </div>
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

        {/* Inventory Summary */}
        {reportData.inventory && reportData.inventory.length > 0 && (
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 mb-8`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Inventory Summary</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportInventoryReport("excel")}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  title="Export inventory as Excel"
                >
                  <Download size={16} /> Inventory Excel
                </button>
                <button
                  onClick={() => exportInventoryReport("pdf")}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  title="Export inventory as PDF"
                >
                  <Download size={16} /> Inventory PDF
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <p
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Total Items
                </p>
                <p className="text-2xl font-bold">
                  {reportData.inventory.length}
                </p>
              </div>
              <div
                className={`p-4 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <p
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Total Value (RWF)
                </p>
                <p className="text-2xl font-bold">
                  {(reportData.inventory || [])
                    .reduce(
                      (sum, item) => sum + parseFloat(item.total_price || 0),
                      0,
                    )
                    .toLocaleString()}
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
