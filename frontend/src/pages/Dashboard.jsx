import React, { useState, useEffect } from 'react';
import { dashboardAPI, projectAPI, workerAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Calendar, DollarSign, FolderKanban, MessageSquare, TrendingUp, UserCheck, UserX, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [workerStats, setWorkerStats] = useState({ total: 0, daily: 0, monthly: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { fetchDashboardData(); }, [selectedProject]);
  useEffect(() => { if (selectedProject) fetchWorkerStats(); }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data || []);
    } catch {}
  };

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getData(selectedProject ? { project_id: selectedProject } : {});
      setData(response.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerStats = async () => {
    try {
      const res = await workerAPI.getAll({ project_id: selectedProject });
      const workers = res.data || [];
      setWorkerStats({
        total: workers.length,
        daily: workers.filter(w => w.payment_type === 'daily').length,
        monthly: workers.filter(w => w.payment_type === 'monthly').length,
        active: workers.filter(w => w.is_active !== false).length,
        inactive: workers.filter(w => w.is_active === false).length,
      });
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  const stats = [
    { label: t('activeProjects'), value: data?.stats?.active_projects ?? 0, icon: FolderKanban, color: 'bg-blue-500', sub: 'Active' },
    { label: 'Total Workers', value: workerStats.total, icon: Users, color: 'bg-green-500', sub: `${workerStats.active} active` },
    { label: 'Daily Workers', value: workerStats.daily, icon: Calendar, color: 'bg-cyan-500', sub: 'Pay per day' },
    { label: 'Monthly Staff', value: workerStats.monthly, icon: UserCheck, color: 'bg-purple-500', sub: 'Fixed salary' },
    { label: t('todayAttendance'), value: data?.stats?.today_attendance ?? 0, icon: Clock, color: 'bg-orange-500', sub: 'Present today' },
    { label: t('totalSpent'), value: `${(data?.stats?.total_spent ?? 0).toLocaleString()} RWF`, icon: DollarSign, color: 'bg-red-500', sub: 'All time' },
    { label: t('monthlyPayroll'), value: `${(data?.stats?.current_month_payroll ?? 0).toLocaleString()} RWF`, icon: TrendingUp, color: 'bg-yellow-500', sub: 'This month' },
    { label: t('unreadMessages'), value: data?.stats?.unread_messages ?? 0, icon: MessageSquare, color: 'bg-indigo-500', sub: 'Unread' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">{t('dashboard')}</h2>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className={`${stat.color} p-3 rounded-lg text-white shrink-0`}>
              <stat.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800 truncate">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Workers breakdown bar */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Workers Breakdown</h3>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total', value: workerStats.total, cls: 'bg-gray-100 text-gray-700' },
              { label: 'Daily', value: workerStats.daily, cls: 'bg-cyan-100 text-cyan-700' },
              { label: 'Monthly', value: workerStats.monthly, cls: 'bg-purple-100 text-purple-700' },
              { label: 'Active', value: workerStats.active, cls: 'bg-green-100 text-green-700' },
              { label: 'Inactive', value: workerStats.inactive, cls: 'bg-red-100 text-red-600' },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${cls}`}>
                <span className="text-lg font-bold">{value}</span>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-base font-semibold mb-4 text-gray-700">Expenses by Type</h3>
          {data?.expenses_by_type?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.expenses_by_type}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="expense_type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v.toLocaleString()} RWF`} />
                <Bar dataKey="total" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No expense data</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-base font-semibold mb-4 text-gray-700">Attendance — Last 7 Days</h3>
          {data?.attendance_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.attendance_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="attendance_date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="workers_present" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No attendance data</div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold mb-4 text-gray-700">Recent Activities</h3>
        {data?.recent_activities?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {data.recent_activities.slice(0, 8).map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    activity.action === 'CREATE' ? 'bg-green-500' :
                    activity.action === 'UPDATE' ? 'bg-blue-500' :
                    activity.action === 'DELETE' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {activity.action} <span className="text-gray-500 font-normal">on {activity.table_name}</span>
                    </p>
                    <p className="text-xs text-gray-400">{activity.user_name}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-4">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">No recent activities</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
