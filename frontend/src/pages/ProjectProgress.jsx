import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Target,
  Zap,
} from "lucide-react";

const ProjectProgress = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    completion_percentage: 0,
    status: "not_started",
  });

  // Summary stats
  const [summary, setSummary] = useState({
    total_milestones: 0,
    completed_milestones: 0,
    delayed_milestones: 0,
    avg_completion_percentage: 0,
  });

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      delayed: "bg-red-100 text-red-800",
      on_hold: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-600" size={18} />;
      case "in_progress":
        return <Zap className="text-blue-600" size={18} />;
      case "delayed":
        return <AlertCircle className="text-red-600" size={18} />;
      default:
        return <Clock className="text-gray-600" size={18} />;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMilestones();
      fetchSummary();
    }
  }, [selectedProject]);

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

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const data = await api.getMilestones({ project_id: selectedProject });
      setMilestones(data || []);
    } catch (error) {
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await api.getMilestoneSummary({
        project_id: selectedProject,
      });
      setSummary(data || {});
    } catch (error) {
      console.error("Failed to load summary");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        project_id: selectedProject,
        ...formData,
      };

      if (editingMilestone) {
        await api.updateMilestone(editingMilestone.id, submitData);
        toast.success("Milestone updated");
      } else {
        await api.createMilestone(submitData);
        toast.success("Milestone created");
      }

      resetForm();
      setShowModal(false);
      fetchMilestones();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      due_date: milestone.due_date,
      completion_percentage: milestone.completion_percentage,
      status: milestone.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this milestone?")) return;
    try {
      await api.deleteMilestone(id);
      toast.success("Milestone deleted");
      fetchMilestones();
      fetchSummary();
    } catch (error) {
      toast.error("Failed to delete milestone");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: "",
      completion_percentage: 0,
      status: "not_started",
    });
    setEditingMilestone(null);
  };

  const projectProgress = summary.avg_completion_percentage || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">
          📈 Project Progress
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Add Milestone
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

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-2">Overall Progress</div>
          <div className="text-3xl font-bold text-primary-600">
            {projectProgress.toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${projectProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-2">Total Milestones</div>
          <div className="text-3xl font-bold text-gray-800">
            {summary.total_milestones || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-2">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {summary.completed_milestones || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-2">Delayed</div>
          <div className="text-3xl font-bold text-red-600">
            {summary.delayed_milestones || 0}
          </div>
        </div>
      </div>

      {/* Milestones List */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Milestones</h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading milestones...</p>
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Target size={48} className="mx-auto mb-4 opacity-50" />
            <p>No milestones yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(milestone.status)}
                      <h4 className="font-semibold text-gray-800">
                        {milestone.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}
                      >
                        {milestone.status.replace("_", " ")}
                      </span>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                      <span>
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">Progress</span>
                        <span className="text-xs font-bold text-primary-600">
                          {milestone.completion_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${milestone.completion_percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(milestone)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(milestone.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
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
              {editingMilestone ? "Edit Milestone" : "Add Milestone"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field min-h-24"
                  placeholder="Enter milestone description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress: {formData.completion_percentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.completion_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      completion_percentage: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
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

export default ProjectProgress;
