import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
} from "lucide-react";

const SchedulingCalendar = () => {
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    worker_id: "",
    project_id: "",
    schedule_date: "",
    hours_assigned: 8,
    notes: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchWorkers();
      fetchSchedules();
    }
  }, [selectedProject, currentDate]);

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
        is_active: true,
      });
      setWorkers(data || []);
    } catch (error) {
      toast.error("Failed to load workers");
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const data = await api.getSchedules({
        project_id: selectedProject,
        start_date: monthStart.toISOString().split("T")[0],
        end_date: monthEnd.toISOString().split("T")[0],
      });
      setSchedules(data || []);
    } catch (error) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, formData);
        toast.success("Schedule updated");
      } else {
        await api.createSchedule(formData);
        toast.success("Schedule created");
      }
      resetForm();
      setShowModal(false);
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      worker_id: schedule.worker_id,
      project_id: schedule.project_id,
      schedule_date: schedule.schedule_date,
      hours_assigned: schedule.hours_assigned,
      notes: schedule.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await api.deleteSchedule(id);
      toast.success("Schedule deleted");
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  const resetForm = () => {
    setFormData({
      worker_id: "",
      project_id: selectedProject,
      schedule_date: "",
      hours_assigned: 8,
      notes: "",
    });
    setEditingSchedule(null);
  };

  // Calendar generation
  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getSchedulesForDate = (day) => {
    if (!day) return [];
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )
      .toISOString()
      .split("T")[0];
    return schedules.filter((s) => s.schedule_date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">📅 Worker Schedule</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Schedule Worker
        </button>
      </div>

      {/* Project Selector */}
      <div className="card">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="input-field w-full max-w-sm"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={previousMonth}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <ChevronLeft size={24} />
          </button>
          <h3 className="text-xl font-bold">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={nextMonth}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <th
                      key={day}
                      className="bg-gray-100 p-2 text-center font-semibold text-gray-700"
                    >
                      {day}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(days.length / 7) }).map(
                (_, week) => (
                  <tr key={week}>
                    {days.slice(week * 7, (week + 1) * 7).map((day, idx) => {
                      const daySchedules = getSchedulesForDate(day);
                      return (
                        <td
                          key={idx}
                          className="border border-gray-200 p-2 min-h-24 md:min-h-32 align-top hover:bg-blue-50 transition"
                        >
                          {day && (
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-800">
                                {day}
                              </div>
                              {daySchedules.map((schedule) => (
                                <div
                                  key={schedule.id}
                                  className="bg-primary-100 p-1 rounded text-xs"
                                >
                                  <div className="font-medium text-primary-800 truncate">
                                    {
                                      workers.find(
                                        (w) => w.id === schedule.worker_id
                                      )?.full_name
                                    }
                                  </div>
                                  <div className="text-primary-700 text-xs">
                                    {schedule.hours_assigned}h
                                  </div>
                                </div>
                              ))}
                              {daySchedules.length === 0 && (
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      schedule_date: new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth(),
                                        day
                                      )
                                        .toISOString()
                                        .split("T")[0],
                                    });
                                    setShowModal(true);
                                  }}
                                  className="text-xs text-gray-400 hover:text-primary-600 p-1"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Workers List */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Scheduled Workers</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No schedules for this month</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
              >
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {workers.find((w) => w.id === schedule.worker_id)
                      ?.full_name || "Unknown"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {new Date(schedule.schedule_date).toLocaleDateString()} •{" "}
                    {schedule.hours_assigned} hours
                  </p>
                  {schedule.notes && (
                    <p className="text-sm text-gray-600">{schedule.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingSchedule ? "Edit Schedule" : "Schedule Worker"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Worker *
                </label>
                <select
                  value={formData.worker_id}
                  onChange={(e) =>
                    setFormData({ ...formData, worker_id: e.target.value })
                  }
                  className="input-field"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.schedule_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schedule_date: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours: {formData.hours_assigned}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={formData.hours_assigned}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hours_assigned: parseFloat(e.target.value),
                    })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="input-field min-h-20"
                  placeholder="Any notes about this schedule..."
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendar;
