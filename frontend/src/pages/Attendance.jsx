import React, { useState, useEffect } from 'react';
import { attendanceAPI, workerAPI, projectAPI, reportAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Check, X, FileSpreadsheet, FileText, CheckSquare, Square, AlertCircle, Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isAfter, startOfDay, parseISO } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendance, setAttendance] = useState({});
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);
  const [existingRecords, setExistingRecords] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [showPayroll, setShowPayroll] = useState(false);
  const [payrollData, setPayrollData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    end_date: today
  });
  const { t } = useTranslation();

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { if (selectedProject) { fetchWorkers(); checkExisting(); } }, [selectedProject, selectedDate]);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
      if (response.data.length > 0) setSelectedProject(response.data[0].id);
    } catch { toast.error('Failed to load projects'); }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll({ project_id: selectedProject, is_active: true });
      const dailyWorkers = (response.data || []).filter(w => w.payment_type === 'daily');
      setWorkers(dailyWorkers);
      const init = {};
      dailyWorkers.forEach(w => { init[w.id] = { present: true, days: 1.0, comment: '' }; });
      setAttendance(init);
    } catch { toast.error('Failed to load workers'); }
  };

  const checkExisting = async () => {
    try {
      const response = await attendanceAPI.getAll({ project_id: selectedProject, start_date: selectedDate, end_date: selectedDate });
      const records = response.data || [];
      const recordMap = {};
      records.forEach(r => { recordMap[r.worker_id] = r; });
      setExistingRecords(recordMap);
      setAlreadyRecorded(records.length > 0);
      setEditMode(false);
    } catch { setAlreadyRecorded(false); setExistingRecords({}); }
  };

  const isFutureDate = isAfter(startOfDay(parseISO(selectedDate)), startOfDay(new Date()));

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (isAfter(startOfDay(parseISO(val)), startOfDay(new Date()))) {
      toast.error('Cannot record attendance for a future date');
      return;
    }
    setSelectedDate(val);
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
      [workerId]: { ...prev[workerId], days: parseFloat(days), present: parseFloat(days) > 0 }
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    workers.forEach(w => { updated[w.id] = { present: true, days: 1.0, comment: attendance[w.id]?.comment || '' }; });
    setAttendance(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    workers.forEach(w => { updated[w.id] = { present: false, days: 0, comment: attendance[w.id]?.comment || '' }; });
    setAttendance(updated);
  };

  const startEdit = () => {
    // Pre-fill editData from existing records
    const init = {};
    workers.forEach(w => {
      const rec = existingRecords[w.id];
      init[w.id] = {
        days: rec ? parseFloat(rec.days_worked) : 0,
        comment: rec ? (rec.comment || '') : '',
        present: rec ? parseFloat(rec.days_worked) > 0 : false
      };
    });
    setEditData(init);
    setEditMode(true);
  };

  const handleSaveEdits = async () => {
    setSubmitting(true);
    try {
      const updates = [];
      for (const [workerId, data] of Object.entries(editData)) {
        const existing = existingRecords[workerId];
        if (existing) {
          // Update existing record
          updates.push(attendanceAPI.update(existing.id, {
            days_worked: data.present ? data.days : 0,
            comment: data.comment
          }));
        }
        // Note: we don't add new workers here — only edit existing ones
      }
      await Promise.all(updates);
      toast.success('Attendance updated successfully');
      setEditMode(false);
      checkExisting();
    } catch { toast.error('Failed to save edits'); }
    finally { setSubmitting(false); }
  };

  const cancelEdit = () => { setEditMode(false); setEditData({}); };

  const setEditDays = (workerId, days) => {
    setEditData(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], days: parseFloat(days), present: parseFloat(days) > 0 }
    }));
  };

  const toggleEditPresent = (workerId) => {
    setEditData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        present: !prev[workerId]?.present,
        days: !prev[workerId]?.present ? 1.0 : 0
      }
    }));
  };

  const handleSubmit = async () => {
    if (isFutureDate) { toast.error('Cannot record attendance for a future date'); return; }
    if (alreadyRecorded) { toast.error('Attendance already recorded for this date and project'); return; }

    const records = Object.entries(attendance).map(([workerId, data]) => ({
      worker_id: workerId,
      project_id: selectedProject,
      attendance_date: selectedDate,
      days_worked: data.present ? data.days : 0,
      comment: data.comment || ''
    }));

    const presentRecords = records.filter(r => r.days_worked > 0);
    if (presentRecords.length === 0) { toast.error('No present workers to record'); return; }

    setSubmitting(true);
    try {
      await Promise.all(presentRecords.map(r => attendanceAPI.record(r)));
      toast.success(`Attendance saved — ${presentRecords.length} present, ${workers.length - presentRecords.length} absent`);
      setAlreadyRecorded(true);
    } catch { toast.error('Failed to record attendance'); }
    finally { setSubmitting(false); }
  };

  const fetchPayrollReport = async () => {
    try {
      const response = await attendanceAPI.getPayroll({ project_id: selectedProject, ...dateRange });
      setPayrollData(response.data);
    } catch { toast.error('Failed to generate payroll report'); }
  };

  const exportPayroll = async (fmt) => {
    try {
      const response = fmt === 'excel'
        ? await reportAPI.exportPayrollExcel({ project_id: selectedProject, ...dateRange })
        : await reportAPI.exportPayrollPDF({ project_id: selectedProject, ...dateRange });
      const blob = new Blob([response.data], {
        type: fmt === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${dateRange.start_date}_${dateRange.end_date}.${fmt === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch { toast.error('Failed to export report'); }
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
          {/* Project Selection */}
          <div className="mb-6">
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

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={handleDateChange}
              className="input-field max-w-xs"
            />
            {isFutureDate && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> Future dates are not allowed
              </p>
            )}
          </div>

          {/* Already recorded warning */}
          {alreadyRecorded && !editMode && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  Attendance already recorded for this date.
                </p>
              </div>
              <button
                onClick={startEdit}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 shrink-0"
              >
                <Edit2 size={14} /> Edit
              </button>
            </div>
          )}

          {editMode && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-4 flex items-center justify-between">
              <p className="text-sm text-blue-800 font-medium">✏️ Edit mode — modify attendance then save</p>
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                <button onClick={handleSaveEdits} disabled={submitting} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  <Save size={14} /> {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Bulk actions */}
          {!alreadyRecorded && !isFutureDate && (
            <div className="flex gap-2 mb-4">
              <button onClick={markAllPresent} className="btn-secondary flex items-center gap-2">
                <CheckSquare size={18} /> Mark All Present
              </button>
              <button onClick={markAllAbsent} className="btn-outline flex items-center gap-2">
                <Square size={18} /> Mark All Absent
              </button>
              <div className="ml-auto text-sm text-gray-600 flex items-center">
                Present: <span className="font-bold text-green-600 ml-1">{presentCount}/{workers.length}</span>
              </div>
            </div>
          )}

          {/* Worker list — register style */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="text-left px-3 py-2 rounded-tl-lg">#</th>
                  <th className="text-left px-3 py-2">Worker</th>
                  <th className="text-left px-3 py-2">Position</th>
                  <th className="text-left px-3 py-2">Rate/Day</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-center px-3 py-2">Days</th>
                  <th className="text-left px-3 py-2 rounded-tr-lg">Comment</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker, idx) => {
                  const rec = existingRecords[worker.id];
                  const ed = editData[worker.id];
                  const isPresent = editMode
                    ? (ed?.present ?? false)
                    : alreadyRecorded
                      ? (rec ? parseFloat(rec.days_worked) > 0 : false)
                      : (attendance[worker.id]?.present ?? true);
                  const days = editMode
                    ? (ed?.days ?? 0)
                    : alreadyRecorded
                      ? parseFloat(rec?.days_worked ?? 0)
                      : (attendance[worker.id]?.days ?? 1.0);
                  const comment = editMode
                    ? (ed?.comment ?? '')
                    : alreadyRecorded
                      ? (rec?.comment ?? '')
                      : (attendance[worker.id]?.comment ?? '');
                  const locked = !editMode && (alreadyRecorded || isFutureDate);

                  return (
                    <tr key={worker.id} className={`border-b transition-colors ${isPresent ? 'bg-green-50' : 'bg-red-50'}`}>
                      <td className="px-3 py-2 text-gray-500 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{worker.full_name}</td>
                      <td className="px-3 py-2 text-gray-600">{worker.position}</td>
                      <td className="px-3 py-2 text-gray-600">{worker.rate_per_day} RWF</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            if (editMode) toggleEditPresent(worker.id);
                            else if (!locked) togglePresent(worker.id);
                          }}
                          disabled={locked}
                          className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-colors ${
                            isPresent ? 'bg-green-600 text-white' : 'bg-red-400 text-white'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {isPresent ? <Check size={18} /> : <X size={18} />}
                        </button>
                        <span className={`text-xs font-medium ${isPresent ? 'text-green-700' : 'text-red-600'}`}>
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 justify-center">
                          {[0.25, 0.5, 0.75, 1.0].map(val => (
                            <button
                              key={val}
                              onClick={() => {
                                if (editMode) setEditDays(worker.id, val);
                                else if (!locked) setDays(worker.id, val);
                              }}
                              disabled={!isPresent || locked}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                days === val ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="e.g. sick, half day..."
                          value={comment}
                          onChange={(e) => {
                            if (editMode) setEditData(prev => ({ ...prev, [worker.id]: { ...prev[worker.id], comment: e.target.value } }));
                            else if (!locked) setAttendance(prev => ({ ...prev, [worker.id]: { ...prev[worker.id], comment: e.target.value } }));
                          }}
                          disabled={locked}
                          className="input-field text-xs w-full disabled:opacity-60"
                        />
                      </td>
                    </tr>
                  );
                }))
              </tbody>
            </table>
          </div>

          {workers.length === 0 && (
            <div className="text-center py-12 text-gray-500">No daily workers found for this project</div>
          )}

          {workers.length > 0 && !alreadyRecorded && !isFutureDate && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary mt-6 w-full disabled:opacity-60"
            >
              {submitting ? 'Saving...' : `Submit Attendance — ${presentCount} present, ${workers.length - presentCount} absent`}
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="date"
              value={dateRange.start_date}
              max={today}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="input-field"
            />
            <input
              type="date"
              value={dateRange.end_date}
              max={today}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="input-field"
            />
            <button onClick={fetchPayrollReport} className="btn-primary">Generate Report</button>
          </div>

          {payrollData && (
            <>
              <div className="flex gap-4 mb-6">
                <button onClick={() => exportPayroll('excel')} className="btn-secondary flex items-center gap-2">
                  <FileSpreadsheet size={18} /> Export Excel
                </button>
                <button onClick={() => exportPayroll('pdf')} className="btn-secondary flex items-center gap-2">
                  <FileText size={18} /> Export PDF
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
