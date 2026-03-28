import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import { Check, X, AlertCircle, Edit2, Save, CheckSquare, Square } from "lucide-react";
import toast from "react-hot-toast";
import { format, isAfter, startOfDay, parseISO } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendance, setAttendance] = useState({});
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);
  const [existingRecords, setExistingRecords] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchProjects();
  }, []);
  useEffect(() => {
    if (selectedProject) {
      fetchWorkers();
      checkExisting();
    }
  }, [selectedProject, selectedDate]);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    } catch {
      toast.error("Failed to load projects");
    }
  };

  const fetchWorkers = async () => {
    try {
      const data = await api.getWorkers({
        project_id: selectedProject,
        is_active: true,
      });
      const dailyWorkers = (data || []).filter(
        (w) => w.payment_type === "daily",
      );
      setWorkers(dailyWorkers);
      const init = {};
      dailyWorkers.forEach((w) => {
        init[w.id] = { present: true, days: 1.0, comment: "" };
      });
      setAttendance(init);
    } catch {
      toast.error("Failed to load workers");
    }
  };

  const checkExisting = async () => {
    try {
      const data = await api.getAttendance({
        project_id: selectedProject,
        start_date: selectedDate,
        end_date: selectedDate,
      });
      const records = data || [];
      const recordMap = {};
      records.forEach((r) => {
        recordMap[r.worker_id] = r;
      });
      setExistingRecords(recordMap);
      setAlreadyRecorded(records.length > 0);
      setEditMode(false);
    } catch {
      setAlreadyRecorded(false);
      setExistingRecords({});
    }
  };

  const isFutureDate = isAfter(
    startOfDay(parseISO(selectedDate)),
    startOfDay(new Date()),
  );

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (isAfter(startOfDay(parseISO(val)), startOfDay(new Date()))) {
      toast.error("Cannot record attendance for a future date");
      return;
    }
    setSelectedDate(val);
  };

  const togglePresent = (workerId) => {
    setAttendance((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        present: !prev[workerId]?.present,
        days: !prev[workerId]?.present ? 1.0 : 0,
      },
    }));
  };

  const setDays = (workerId, days) => {
    setAttendance((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        days: parseFloat(days),
        present: parseFloat(days) > 0,
      },
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    workers.forEach((w) => {
      updated[w.id] = {
        present: true,
        days: 1.0,
        comment: attendance[w.id]?.comment || "",
      };
    });
    setAttendance(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    workers.forEach((w) => {
      updated[w.id] = {
        present: false,
        days: 0,
        comment: attendance[w.id]?.comment || "",
      };
    });
    setAttendance(updated);
  };

  const startEdit = () => {
    // Pre-fill editData from existing records
    const init = {};
    workers.forEach((w) => {
      const rec = existingRecords[w.id];
      init[w.id] = {
        days: rec ? parseFloat(rec.days_worked) : 0,
        comment: rec ? rec.comment || "" : "",
        present: rec ? parseFloat(rec.days_worked) > 0 : false,
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
          updates.push(
            api.updateAttendance(existing.id, {
              days_worked: data.present ? data.days : 0,
              comment: data.comment,
            }),
          );
        }
        // Note: we don't add new workers here - only edit existing ones
      }
      await Promise.all(updates);
      toast.success("Attendance updated successfully");
      setEditMode(false);
      checkExisting();
    } catch {
      toast.error("Failed to save edits");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditData({});
  };

  const setEditDays = (workerId, days) => {
    setEditData((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        days: parseFloat(days),
        present: parseFloat(days) > 0,
      },
    }));
  };

  const toggleEditPresent = (workerId) => {
    setEditData((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        present: !prev[workerId]?.present,
        days: !prev[workerId]?.present ? 1.0 : 0,
      },
    }));
  };

  const handleSubmit = async () => {
    if (isFutureDate) {
      toast.error("Cannot record attendance for a future date");
      return;
    }
    if (alreadyRecorded) {
      toast.error("Attendance already recorded for this date and project");
      return;
    }

    const records = Object.entries(attendance).map(([workerId, data]) => ({
      worker_id: workerId,
      project_id: selectedProject,
      attendance_date: selectedDate,
      days_worked: data.present ? data.days : 0,
      comment: data.comment || "",
    }));

    const presentRecords = records.filter((r) => r.days_worked > 0);
    if (presentRecords.length === 0) {
      toast.error("No present workers to record");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(presentRecords.map((r) => api.recordAttendance(r)));
      toast.success(
        `Attendance saved - ${presentRecords.length} present, ${workers.length - presentRecords.length} absent`,
      );
      setAlreadyRecorded(true);
    } catch {
      toast.error("Failed to record attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(
    (a) => a.present,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">{t("attendance")}</h2>
      </div>

      <div className="card">
        {/* Project Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  selectedProject === project.id
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
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

        {/* Debug: Skipping conditional blocks for now */}

        {/* Bulk actions */}
        <div>Placeholder content</div>

        {/* Worker list - register style */}
        <div className="overflow-x-auto">
          <p>Workers table would go here</p>
        </div>

        {workers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No daily workers found for this project
          </div>
        )}

        {workers.length > 0 && !alreadyRecorded && !isFutureDate && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary mt-6 w-full disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Submit Attendance"}
          </button>
        )}
      </div>
      </div>
    </div>
  );
};

export default Attendance;
