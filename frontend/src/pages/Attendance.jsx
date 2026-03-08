import React, { useState, useEffect } from 'react';
import { attendanceAPI, workerAPI, projectAPI, reportAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Calendar, Download, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceRecords, setAttendanceRecords] = useState({});
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
      setWorkers(response.data);
    } catch (error) {
      toast.error('Failed to load workers');
    }
  };

  const handleAttendanceChange = (workerId, field, value) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value
      }
    }));
  };

  const handleSubmitAttendance = async () => {
    try {
      const promises = Object.entries(attendanceRecords).map(([workerId, data]) => {
        if (data.days_worked !== undefined) {
          return attendanceAPI.record({
            worker_id: workerId,
            project_id: selectedProject,
            attendance_date: selectedDate,
            days_worked: parseFloat(data.days_worked),
            comment: data.comment || ''
          });
        }
      });

      await Promise.all(promises.filter(Boolean));
      toast.success('Attendance recorded successfully');
      setAttendanceRecords({});
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
          <div className="flex gap-4 mb-6">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input-field flex-1"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="space-y-4">
            {workers.map(worker => (
              <div key={worker.id} className="border rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold">{worker.full_name}</h4>
                  <p className="text-sm text-gray-600">{worker.position} - {worker.rate_per_day} RWF/day</p>
                </div>

                <div className="flex gap-4 items-center">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('daysWorked')}</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="1"
                      placeholder="1.0"
                      value={attendanceRecords[worker.id]?.days_worked || ''}
                      onChange={(e) => handleAttendanceChange(worker.id, 'days_worked', e.target.value)}
                      className="input-field w-24"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">{t('comment')}</label>
                    <input
                      type="text"
                      placeholder="Optional comment"
                      value={attendanceRecords[worker.id]?.comment || ''}
                      onChange={(e) => handleAttendanceChange(worker.id, 'comment', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleSubmitAttendance} className="btn-primary mt-6 w-full">
            {t('submit')}
          </button>
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
