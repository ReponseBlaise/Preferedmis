const { supabaseAdmin } = require("../config/supabase");

// Create milestone
exports.createMilestone = async (req, res) => {
  try {
    const {
      project_id,
      title,
      description,
      due_date,
      completion_percentage,
      status,
    } = req.body;

    if (!project_id || !title || !due_date) {
      return res
        .status(400)
        .json({ error: "Project ID, title, and due date are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("project_milestones")
      .insert({
        project_id,
        title,
        description,
        due_date,
        completion_percentage: completion_percentage || 0,
        status: status || "not_started",
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({ error: "Failed to create milestone" });
  }
};

// Get milestones for project
exports.getMilestones = async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("project_milestones")
      .select("*")
      .eq("project_id", project_id)
      .order("due_date", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Get milestones error:", error);
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
};

// Update milestone
exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, completion_percentage, status } =
      req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (due_date !== undefined) updates.due_date = due_date;
    if (completion_percentage !== undefined)
      updates.completion_percentage = completion_percentage;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from("project_milestones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({ error: "Failed to update milestone" });
  }
};

// Delete milestone
exports.deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("project_milestones")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({ error: "Failed to delete milestone" });
  }
};

// Get milestone summary for project
exports.getMilestoneSummary = async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("project_milestone_summary")
      .select("*")
      .eq("project_id", project_id)
      .single();

    if (error) throw error;

    res.json(data || {});
  } catch (error) {
    console.error("Get milestone summary error:", error);
    res.status(500).json({ error: "Failed to fetch milestone summary" });
  }
};
