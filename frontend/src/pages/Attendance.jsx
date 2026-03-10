import React, { useState, useEffect } from 'react';
import { attendanceAPI, workerAPI, projectAPI, reportAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Check, X, FileSpreadsheet, FileText, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState({});
  const [showPayroll, setShowPayroll] = useState(false);
  const [payrollData, setPayrollData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  const { t } = useTranslation();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchWorkers();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll({ project_id: selectedProject, is_active: true });
      const dailyWorkers = (response.data || []).filter(w => w.payment_type === 'daily');
      setWorkers(dailyWorkers);
      
      // Initialize attendance with all workers present (1.0)
      const initialAttendance = {};
      dailyWorkers.forEach(w => {
        initialAttendance[w.id] = { present: true, days: 1.0, comment: '' };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error('Failed to load workers');
    }
  };

  const togglePresent = (workerId) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        present: !prev[workerId]?.present,
        days: !prev[workerId]?.present ? 1.0 : 0
      }
    }));
  };

  const setDays = (workerId, days) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        days: parseFloat(days),
        present: parseFloat(days) > 0
      }
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    workers.forEach(w => {
      updated[w.id] = { present: true, days: 1.0, comment: '' };
    });
    setAttendance(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    workers.forEach(w => {
      updated[w.id] = { present: false, days: 0, comment: '' };
    });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    try {
      const records = Object.entries(attendance)
        .filter(([_, data]) => data.present && data.days > 0)
        .map(([workerId, data]) => ({
          worker_id: workerId,
          project_id: selectedProject,
          attendance_date: selectedDate,
          days_worked: data.days,
          comment: data.comment || ''
        }));

      if (records.length === 0) {
        toast.error('No attendance to record');
        return;
      }

      await Promise.all(records.map(r => attendanceAPI.record(r)));
      toast.success(`Attendance recorded for ${records.length} worker(s)`);
    } catch (error) {
      toast.error('Failed to record attendance');
    }
  };

  const fetchPayrollReport = async () => {
    try {
      const response = await attendanceAPI.getPayroll({
        project_id: selectedProject,
        ...dateRange
      });
      setPayrollData(response.data);
      setShowPayroll(true);
    } catch (error) {
      toast.error('Failed to generate payroll report');
    }
  };

  const exportPayroll = async (format) => {
    try {
      const response = format === 'excel'
        ? await reportAPI.exportPayrollExcel({ project_id: selectedProject, ...dateRange })
        : await reportAPI.exportPayrollPDF({ project_id: selectedProject, ...dateRange });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${dateRange.start_date}_${dateRange.end_date}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const presentCount = Object.values(attendance).filter(a => a.present).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{t('attendance')}</h2>
        <button onClick={() => setShowPayroll(!showPayroll)} className="btn-secondary">
          {showPayroll ? 'Record Attendance' : t('payrollReport')}
        </button>
      </div>

      {!showPayroll ? (
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      selectedProject === project.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field max-w-xs"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Quick Tip:</strong> All workers are marked present by default. Uncheck absent workers or adjust partial days (0.25, 0.5, 0.75).
            </p>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={markAllPresent} className="btn-secondary flex items-center gap-2">
              <CheckSquare size={18} />
              Mark All Present
            </button>
            <button onClick={markAllAbsent} className="btn-outline flex items-center gap-2">
              <Square size={18} />
              Mark All Absent
            </button>
            <div className="ml-auto text-sm text-gray-600 flex items-center">
              Present: <span className="font-bold text-green-600 ml-1">{presentCount}/{workers.length}</span>
            </div>
          </div>

          <div className="space-y-2">
            {workers.map(worker => {
              const isPresent = attendance[worker.id]?.present;
              return (
                <div key={worker.id} className={`border rounded-lg p-3 flex items-center gap-3 transition-colors ${
                  isPresent ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <button
                    onClick={() => togglePresent(worker.id)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isPresent ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isPresent ? <Check size={24} /> : <X size={24} />}
                  </button>

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{worker.full_name}</h4>
                    <p className="text-sm text-gray-600">{worker.position} - {worker.rate_per_day} RWF/day</p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Days Worked</label>
                      <div className="flex gap-1">
                        {[0.25, 0.5, 0.75, 1.0].map(val => (
                          <button
                            key={val}
                            onClick={() => setDays(worker.id, val)}
                            disabled={!isPresent}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              attendance[worker.id]?.days === val
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-48 hidden md:block">
                      <label className="block text-xs text-gray-600 mb-1">Comment</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={attendance[worker.id]?.comment || ''}
                        onChange={(e) => setAttendance(prev => ({
                          ...prev,
                          [worker.id]: { ...prev[worker.id], comment: e.target.value }
                        }))}
                        className="input-field text-sm"
                        disabled={!isPresent}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {workers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No daily workers found for this project
            </div>
          )}

          {workers.length > 0 && (
            <button onClick={handleSubmit} className="btn-primary mt-6 w-full">
              Submit Attendance ({presentCount} present)
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="flex gap-4 mb-6">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="input-field"
            />
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="input-field"
            />
            <button onClick={fetchPayrollReport} className="btn-primary">
              Generate Report
            </button>
          </div>

          {payrollData && (
            <>
              <div className="flex gap-4 mb-6">
                <button onClick={() => exportPayroll('excel')} className="btn-secondary flex items-center gap-2">
                  <FileSpreadsheet size={18} />
                  Export Excel
                </button>
                <button onClick={() => exportPayroll('pdf')} className="btn-secondary flex items-center gap-2">
                  <FileText size={18} />
                  Export PDF
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Worker Name</th>
                      <th className="table-header-cell">Position</th>
                      <th className="table-header-cell">Rate/Day</th>
                      <th className="table-header-cell">Days Worked</th>
                      <th className="table-header-cell">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {payrollData.workers.map(worker => (
                      <tr key={worker.worker_id}>
                        <td className="table-cell font-medium">{worker.full_name}</td>
                        <td className="table-cell">{worker.position}</td>
                        <td className="table-cell">{worker.rate_per_day} RWF</td>
                        <td className="table-cell">{worker.total_days_worked}</td>
                        <td className="table-cell font-semibold">{worker.total_amount} RWF</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan="4" className="table-cell text-right">TOTAL PAYROLL:</td>
                      <td className="table-cell text-lg">{payrollData.total_payroll} RWF</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
