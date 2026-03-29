import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  Calendar,
  DollarSign,
  FolderKanban,
  MessageSquare,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user, isManager, isEmployee, isStoreman } = useAuth();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [workerStats, setWorkerStats] = useState({
    total: 0,
    daily: 0,
    monthly: 0,
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (isManager) {
      fetchProjects();
    }
  }, [isManager]);
  useEffect(() => {
    fetchDashboardData();
  }, [selectedProject]);
  useEffect(() => {
    if (isManager && selectedProject) {
      fetchWorkerStats();
    }
  }, [isManager, selectedProject]);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data || []);
    } catch {}
  };

  const fetchDashboardData = async () => {
    try {
      const data = await api.getDashboard(
        selectedProject ? { project_id: selectedProject } : {},
      );
      setData(data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerStats = async () => {
    try {
      const workers = await api.getWorkers({ project_id: selectedProject });
      const data = workers || [];
      setWorkerStats({
        total: workers.length,
        daily: workers.filter((w) => w.payment_type === "daily").length,
        monthly: workers.filter((w) => w.payment_type === "monthly").length,
        active: workers.filter((w) => w.is_active === true).length,
        inactive: workers.filter((w) => w.is_active === false).length,
      });
    } catch {}
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );

  // Build stats array based on user role
  let stats = [];

  if (isManager) {
    // Managers see all stats
    stats = [
      {
        label: t("activeProjects"),
        value: data?.stats?.active_projects ?? 0,
        icon: FolderKanban,
        color: "bg-blue-500",
        sub: "Active",
      },
      {
        label: "Total Workers",
        value: workerStats.total,
        icon: Users,
        color: "bg-green-500",
        sub: `${workerStats.active} active`,
      },
      {
        label: "Daily Workers",
        value: workerStats.daily,
        icon: Calendar,
        color: "bg-cyan-500",
        sub: "Pay per day",
      },
      {
        label: "Monthly Staff",
        value: workerStats.monthly,
        icon: UserCheck,
        color: "bg-purple-500",
        sub: "Fixed salary",
      },
      {
        label: t("todayAttendance"),
        value: data?.stats?.today_attendance ?? 0,
        icon: Clock,
        color: "bg-orange-500",
        sub: "Present today",
      },
      {
        label: t("totalSpent"),
        value: `${(data?.stats?.total_spent ?? 0).toLocaleString()} RWF`,
        icon: DollarSign,
        color: "bg-red-500",
        sub: "All time",
      },
      {
        label: t("monthlyPayroll"),
        value: `${(data?.stats?.current_month_payroll ?? 0).toLocaleString()} RWF`,
        icon: TrendingUp,
        color: "bg-yellow-500",
        sub: "This month",
      },
      {
        label: t("unreadMessages"),
        value: data?.stats?.unread_messages ?? 0,
        icon: MessageSquare,
        color: "bg-indigo-500",
        sub: "Unread",
      },
    ];
  } else if (isEmployee) {
    // Employees see limited stats
    stats = [
      {
        label: t("todayAttendance"),
        value: data?.stats?.today_attendance ?? 0,
        icon: Clock,
        color: "bg-orange-500",
        sub: "Present today",
      },
      {
        label: t("unreadMessages"),
        value: data?.stats?.unread_messages ?? 0,
        icon: MessageSquare,
        color: "bg-indigo-500",
        sub: "Unread",
      },
    ];
  } else if (isStoreman) {
    // Storemen see project and inventory-related stats
    stats = [
      {
        label: t("activeProjects"),
        value: data?.stats?.active_projects ?? 0,
        icon: FolderKanban,
        color: "bg-blue-500",
        sub: "Active",
      },
      {
        label: t("totalSpent"),
        value: `${(data?.stats?.total_spent ?? 0).toLocaleString()} RWF`,
        icon: DollarSign,
        color: "bg-red-500",
        sub: "All time",
      },
      {
        label: t("unreadMessages"),
        value: data?.stats?.unread_messages ?? 0,
        icon: MessageSquare,
        color: "bg-indigo-500",
        sub: "Unread",
      },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {t("dashboard")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isManager ? (
              selectedProject
                ? projects.find((p) => p.id === selectedProject)?.name ||
                  "Selected Project"
                : "Overview of all projects"
            ) : (
              "Your dashboard"
            )}
          </p>
        </div>
        {isManager && (
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div
                className={`${stat.color} p-3 rounded-lg text-white shrink-0 shadow-sm`}
              >
                <stat.icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workers breakdown bar - Only for managers */}
      {isManager && selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Workers Breakdown
          </h3>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                label: "Total",
                value: workerStats.total,
                cls: "bg-gray-100 text-gray-700",
              },
              {
                label: "Daily",
                value: workerStats.daily,
                cls: "bg-cyan-100 text-cyan-700",
              },
              {
                label: "Monthly",
                value: workerStats.monthly,
                cls: "bg-purple-100 text-purple-700",
              },
              {
                label: "Active",
                value: workerStats.active,
                cls: "bg-green-100 text-green-700",
              },
              {
                label: "Inactive",
                value: workerStats.inactive,
                cls: "bg-red-100 text-red-600",
              },
            ].map(({ label, value, cls }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${cls}`}
              >
                <span className="text-lg font-bold">{value}</span>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts - Only for managers */}
      {isManager && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-700">
              Expenses by Type
            </h3>
            <div className="text-xs text-gray-500">
              Total:{" "}
              {(
                data?.expenses_by_type?.reduce(
                  (sum, item) => sum + (item.total || 0),
                  0,
                ) || 0
              ).toLocaleString()}{" "}
              RWF
            </div>
          </div>
          {data?.expenses_by_type?.length > 0 ? (
            <div className="h-64 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.expenses_by_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="expense_type"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${value.toLocaleString()} RWF`,
                      "Amount",
                    ]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#colorBar)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 lg:h-72 text-gray-400 text-sm">
              <div className="text-center">
                <div className="mb-2">📊</div>
                No expense data available
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-700">
              Attendance — Last 7 Days
            </h3>
            <div className="text-xs text-gray-500">
              Avg:{" "}
              {data?.attendance_trend?.length > 0
                ? Math.round(
                    data.attendance_trend.reduce(
                      (sum, item) => sum + (item.workers_present || 0),
                      0,
                    ) / data.attendance_trend.length,
                  )
                : 0}{" "}
              workers/day
            </div>
          </div>
          {data?.attendance_trend?.length > 0 ? (
            <div className="h-64 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.attendance_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="attendance_date"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    labelFormatter={(date) =>
                      `Date: ${new Date(date).toLocaleDateString()}`
                    }
                    formatter={(value) => [`${value} workers`, "Present"]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="workers_present"
                    stroke="url(#colorLine)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                  />
                  <defs>
                    <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 lg:h-72 text-gray-400 text-sm">
              <div className="text-center">
                <div className="mb-2">📈</div>
                No attendance data available
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Recent Activities - Only for managers */}
      {isManager && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-700">
            Recent Activities
          </h3>
          <div className="text-xs text-gray-500">
            Last {data?.recent_activities?.length || 0} actions
          </div>
        </div>
        {data?.recent_activities?.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recent_activities.slice(0, 8).map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.action === "CREATE"
                        ? "bg-green-100 text-green-600"
                        : activity.action === "UPDATE"
                          ? "bg-blue-100 text-blue-600"
                          : activity.action === "DELETE"
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {activity.action === "CREATE"
                      ? "➕"
                      : activity.action === "UPDATE"
                        ? "✏️"
                        : activity.action === "DELETE"
                          ? "🗑️"
                          : "📋"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.action === "CREATE"
                          ? "bg-green-100 text-green-700"
                          : activity.action === "UPDATE"
                            ? "bg-blue-100 text-blue-700"
                            : activity.action === "DELETE"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {activity.action}
                    </span>
                    <span className="text-xs text-gray-500">
                      on {activity.table_name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {activity.user_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            <div className="mb-2">📋</div>
            No recent activities
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default Dashboard;
