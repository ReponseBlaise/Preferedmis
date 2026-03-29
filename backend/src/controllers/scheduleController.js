const { supabaseAdmin } = require("../config/supabase");

// Create worker schedule
exports.createSchedule = async (req, res) => {
  try {
    const { worker_id, project_id, schedule_date, hours_assigned, notes } =
      req.body;

    if (!worker_id || !project_id || !schedule_date) {
      return res.status(400).json({
        error: "Worker ID, project ID, and schedule date are required",
      });
    }

    // Check for existing schedule on same date
    const { data: existing } = await supabaseAdmin
      .from("worker_schedules")
      .select("id")
      .eq("worker_id", worker_id)
      .eq("schedule_date", schedule_date)
      .single();

    if (existing) {
      return res.status(400).json({
        error: "Worker already scheduled for this date",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("worker_schedules")
      .insert({
        worker_id,
        project_id,
        schedule_date,
        hours_assigned: hours_assigned || 8,
        notes,
        assigned_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({ error: "Failed to create schedule" });
  }
};

// Get schedules
exports.getSchedules = async (req, res) => {
  try {
    const { project_id, worker_id, start_date, end_date } = req.query;

    let query = supabaseAdmin.from("worker_schedules").select(
      `*,
        worker:worker_id(*),
        project:project_id(*)`,
    );

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    if (worker_id) {
      query = query.eq("worker_id", worker_id);
    }

    if (start_date) {
      query = query.gte("schedule_date", start_date);
    }

    if (end_date) {
      query = query.lte("schedule_date", end_date);
    }

    const { data, error } = await query.order("schedule_date", {
      ascending: true,
    });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours_assigned, notes } = req.body;

    const updates = {};
    if (hours_assigned !== undefined) updates.hours_assigned = hours_assigned;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabaseAdmin
      .from("worker_schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ error: "Failed to update schedule" });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("worker_schedules")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};

// Get worker schedule summary (days scheduled, total hours)
exports.getWorkerScheduleSummary = async (req, res) => {
  try {
    const { worker_id, project_id } = req.query;

    let query = supabaseAdmin.from("worker_schedule_summary").select("*");

    if (worker_id) {
      query = query.eq("worker_id", worker_id);
    }

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Get schedule summary error:", error);
    res.status(500).json({ error: "Failed to fetch schedule summary" });
  }
};

// Check for conflicts on a date for a worker
exports.checkScheduleConflict = async (req, res) => {
  try {
    const { worker_id, schedule_date } = req.query;

    if (!worker_id || !schedule_date) {
      return res.status(400).json({
        error: "Worker ID and schedule date are required",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("worker_schedules")
      .select("id")
      .eq("worker_id", worker_id)
      .eq("schedule_date", schedule_date)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found

    res.json({ conflict: !!data });
  } catch (error) {
    console.error("Check conflict error:", error);
    res.status(500).json({ error: "Failed to check conflicts" });
  }
};

// Bulk schedule workers
exports.bulkSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: "Schedules array is required" });
    }

    // Insert all schedules
    const { data, error } = await supabaseAdmin
      .from("worker_schedules")
      .insert(
        schedules.map((s) => ({
          worker_id: s.worker_id,
          project_id: s.project_id,
          schedule_date: s.schedule_date,
          hours_assigned: s.hours_assigned || 8,
          notes: s.notes,
          assigned_by: req.user.id,
        })),
      )
      .select();

    if (error) throw error;

    res.status(201).json(data || []);
  } catch (error) {
    console.error("Bulk schedule error:", error);
    res.status(500).json({ error: "Failed to bulk schedule workers" });
  }
};
