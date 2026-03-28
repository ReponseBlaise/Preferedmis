const { supabaseAdmin } = require("../config/supabase");

exports.createWorker = async (req, res) => {
  try {
    const {
      project_id,
      full_name,
      phone,
      position,
      rate_per_day,
      payment_type,
      monthly_salary,
      start_date,
      end_date,
    } = req.body;

    // Validate required fields
    if (!project_id) {
      return res
        .status(400)
        .json({ error: "Please select a project before adding a worker" });
    }
    if (!full_name) {
      return res.status(400).json({ error: "Worker name is required" });
    }
    if (!position) {
      return res.status(400).json({ error: "Worker position is required" });
    }
    if (!rate_per_day && payment_type === "daily") {
      return res
        .status(400)
        .json({ error: "Daily rate is required for daily workers" });
    }
    if (!monthly_salary && payment_type === "monthly") {
      return res
        .status(400)
        .json({ error: "Monthly salary is required for monthly employees" });
    }

    const workerData = {
      project_id,
      full_name,
      phone,
      position,
      rate_per_day: payment_type === "daily" ? rate_per_day : null,
      payment_type: payment_type || "daily",
      monthly_salary: payment_type === "monthly" ? monthly_salary : null,
      start_date: start_date || new Date().toISOString().split("T")[0],
      end_date: end_date || null,
    };

    const { data, error } = await supabaseAdmin
      .from("workers")
      .insert(workerData)
      .select()
      .single();

    if (error) {
      console.error("Create worker error:", error);
      return res
        .status(400)
        .json({
          error:
            "Failed to create worker. Please check all fields are correct.",
        });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Create worker error:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again." });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const { project_id, is_active } = req.query;
    let query = supabaseAdmin.from("workers").select("*");

    // Filter by user's accessible projects
    if (req.userProjects !== "all") {
      if (req.userProjects.length === 0) {
        return res.json([]);
      }
      query = query.in("project_id", req.userProjects);
    }

    if (project_id) {
      // Check if user has access to this project
      if (
        req.userProjects !== "all" &&
        !req.userProjects.includes(project_id)
      ) {
        return res
          .status(403)
          .json({ error: "You do not have access to this project" });
      }
      query = query.eq("project_id", project_id);
    }

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active === "true");
    }

    if (req.query.search) {
      const s = req.query.search;
      query = query.or(
        `full_name.ilike.%${s}%,position.ilike.%${s}%,phone.ilike.%${s}%`,
      );
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Get workers error:", error);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
};

exports.getWorker = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("workers")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch worker" });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      position,
      rate_per_day,
      payment_type,
      monthly_salary,
      start_date,
      end_date,
      is_active,
    } = req.body;
    const workerId = req.params.id;

    if (!workerId) {
      return res.status(400).json({ error: "Worker ID is required" });
    }

    const updates = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (position !== undefined) updates.position = position;
    if (rate_per_day !== undefined) updates.rate_per_day = rate_per_day;
    if (payment_type !== undefined) updates.payment_type = payment_type;
    if (monthly_salary !== undefined) updates.monthly_salary = monthly_salary;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    console.log("Updating worker:", workerId, "with:", updates);

    const { data, error } = await supabaseAdmin
      .from("workers")
      .update(updates)
      .eq("id", workerId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Update worker error:", error.message, error);
    res.status(500).json({ error: error.message || "Failed to update worker" });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("workers")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete worker" });
  }
};
