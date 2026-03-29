const { supabaseAdmin } = require("../config/supabase");

// Create project budget
exports.createBudget = async (req, res) => {
  try {
    const {
      project_id,
      total_budget,
      labor_budget,
      materials_budget,
      equipment_budget,
      contingency_budget,
      notes,
    } = req.body;

    if (!project_id || !total_budget) {
      return res
        .status(400)
        .json({ error: "Project ID and total budget are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("project_budgets")
      .insert({
        project_id,
        total_budget,
        labor_budget: labor_budget || 0,
        materials_budget: materials_budget || 0,
        equipment_budget: equipment_budget || 0,
        contingency_budget: contingency_budget || 0,
        notes,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Create budget error:", error);
    res.status(500).json({ error: "Failed to create budget" });
  }
};

// Get project budget
exports.getBudget = async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("project_budgets")
      .select("*")
      .eq("project_id", project_id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    res.json(data || null);
  } catch (error) {
    console.error("Get budget error:", error);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
};

// Get budget summary
exports.getBudgetSummary = async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("project_budget_summary")
      .select("*")
      .eq("project_id", project_id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    res.json(data || null);
  } catch (error) {
    console.error("Get budget summary error:", error);
    res.status(500).json({ error: "Failed to fetch budget summary" });
  }
};

// Update budget
exports.updateBudget = async (req, res) => {
  try {
    const { project_id } = req.params;
    const {
      total_budget,
      labor_budget,
      materials_budget,
      equipment_budget,
      contingency_budget,
      budget_status,
      notes,
    } = req.body;

    const updates = {};
    if (total_budget !== undefined) updates.total_budget = total_budget;
    if (labor_budget !== undefined) updates.labor_budget = labor_budget;
    if (materials_budget !== undefined)
      updates.materials_budget = materials_budget;
    if (equipment_budget !== undefined)
      updates.equipment_budget = equipment_budget;
    if (contingency_budget !== undefined)
      updates.contingency_budget = contingency_budget;
    if (budget_status !== undefined) updates.budget_status = budget_status;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabaseAdmin
      .from("project_budgets")
      .update(updates)
      .eq("project_id", project_id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Update budget error:", error);
    res.status(500).json({ error: "Failed to update budget" });
  }
};

// Record spending
exports.recordSpending = async (req, res) => {
  try {
    const {
      project_id,
      category,
      description,
      amount,
      spending_date,
      reference_id,
      reference_type,
    } = req.body;

    if (!project_id || !category || !amount || !spending_date) {
      return res.status(400).json({
        error: "Project ID, category, amount, and spending date are required",
      });
    }

    if (!["labor", "materials", "equipment", "other"].includes(category)) {
      return res.status(400).json({
        error: "Category must be one of: labor, materials, equipment, other",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("budget_spending")
      .insert({
        project_id,
        category,
        description,
        amount,
        spending_date,
        reference_id,
        reference_type,
        recorded_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Record spending error:", error);
    res.status(500).json({ error: "Failed to record spending" });
  }
};

// Get spending records
exports.getSpending = async (req, res) => {
  try {
    const { project_id, category, start_date, end_date } = req.query;

    let query = supabaseAdmin.from("budget_spending").select("*");

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (start_date) {
      query = query.gte("spending_date", start_date);
    }

    if (end_date) {
      query = query.lte("spending_date", end_date);
    }

    const { data, error } = await query.order("spending_date", {
      ascending: false,
    });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Get spending error:", error);
    res.status(500).json({ error: "Failed to fetch spending records" });
  }
};

// Delete spending record
exports.deleteSpending = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("budget_spending")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Spending record deleted successfully" });
  } catch (error) {
    console.error("Delete spending error:", error);
    res.status(500).json({ error: "Failed to delete spending record" });
  }
};

// Get budget alerts (over budget, near limit, etc.)
exports.getBudgetAlerts = async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Get budget summary which has budget_utilization_percent
    const { data: summary, error: summaryErr } = await supabaseAdmin
      .from("project_budget_summary")
      .select("*")
      .eq("project_id", project_id)
      .single();

    if (summaryErr && summaryErr.code !== "PGRST116") throw summaryErr;

    if (!summary) {
      return res.json({ alerts: [] });
    }

    const alerts = [];

    if (summary.budget_utilization_percent > 100) {
      alerts.push({
        type: "over_budget",
        severity: "critical",
        message: `Project is over budget by ${(summary.budget_utilization_percent - 100).toFixed(2)}%`,
        remaining: summary.remaining_budget,
      });
    } else if (summary.budget_utilization_percent > 90) {
      alerts.push({
        type: "near_limit",
        severity: "warning",
        message: `Project is at ${summary.budget_utilization_percent.toFixed(2)}% of budget`,
        remaining: summary.remaining_budget,
      });
    }

    // Check category overages
    if (
      summary.labor_spent > summary.labor_budget &&
      summary.labor_budget > 0
    ) {
      alerts.push({
        type: "category_over",
        severity: "warning",
        category: "labor",
        message: `Labor budget exceeded`,
        spent: summary.labor_spent,
        budget: summary.labor_budget,
      });
    }

    if (
      summary.materials_spent > summary.materials_budget &&
      summary.materials_budget > 0
    ) {
      alerts.push({
        type: "category_over",
        severity: "warning",
        category: "materials",
        message: `Materials budget exceeded`,
        spent: summary.materials_spent,
        budget: summary.materials_budget,
      });
    }

    if (
      summary.equipment_spent > summary.equipment_budget &&
      summary.equipment_budget > 0
    ) {
      alerts.push({
        type: "category_over",
        severity: "warning",
        category: "equipment",
        message: `Equipment budget exceeded`,
        spent: summary.equipment_spent,
        budget: summary.equipment_budget,
      });
    }

    res.json({ alerts, summary });
  } catch (error) {
    console.error("Get budget alerts error:", error);
    res.status(500).json({ error: "Failed to fetch budget alerts" });
  }
};
