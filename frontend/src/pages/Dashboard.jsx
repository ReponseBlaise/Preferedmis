import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Calendar, DollarSign, FolderKanban, MessageSquare, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedProject]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getData({ project_id: selectedProject });
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">{t('loading')}</div>;

  const stats = [
    { label: t('activeProjects'), value: data?.stats?.active_projects || 0, icon: FolderKanban, color: 'bg-blue-500' },
    { label: t('activeWorkers'), value: data?.stats?.active_workers || 0, icon: Users, color: 'bg-green-500' },
    { label: t('todayAttendance'), value: data?.stats?.today_attendance || 0, icon: Calendar, color: 'bg-purple-500' },
    { label: t('totalSpent'), value: `${(data?.stats?.total_spent || 0).toLocaleString()} RWF`, icon: DollarSign, color: 'bg-red-500' },
    { label: t('monthlyPayroll'), value: `${(data?.stats?.current_month_payroll || 0).toLocaleString()} RWF`, icon: TrendingUp, color: 'bg-yellow-500' },
    { label: t('unreadMessages'), value: data?.stats?.unread_messages || 0, icon: MessageSquare, color: 'bg-indigo-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{t('dashboard')}</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card flex items-center gap-4">
            <div className={`${stat.color} p-4 rounded-lg text-white`}>
              <stat.icon size={32} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Type */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Expenses by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.expenses_by_type || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="expense_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#1e40af" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Trend */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Attendance Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.attendance_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attendance_date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="workers_present" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {data?.recent_activities?.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.user_name} - {activity.table_name}</p>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
