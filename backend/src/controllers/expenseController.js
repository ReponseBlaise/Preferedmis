const { supabaseAdmin } = require("../config/supabase");

// Expense Controller
exports.createExpense = async (req, res) => {
  try {
    const { project_id, expense_type, description, amount, expense_date } =
      req.body;

    // Validate required fields with clear messages
    if (!project_id) {
      return res
        .status(400)
        .json({ error: "Please select a project before adding expenses" });
    }
    if (!expense_type) {
      return res.status(400).json({ error: "Please select an expense type" });
    }
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Please enter a valid amount (greater than 0)" });
    }

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert({
        project_id,
        expense_type,
        description,
        amount,
        expense_date,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Create expense error:", error);
      return res
        .status(400)
        .json({
          error: "Failed to add expense. Please check all fields are correct.",
        });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Create expense error:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again." });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { project_id, start_date, end_date, expense_type } = req.query;
    let query = supabaseAdmin.from("expenses").select("*");

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    if (start_date) {
      query = query.gte("expense_date", start_date);
    }

    if (end_date) {
      query = query.lte("expense_date", end_date);
    }

    if (expense_type) {
      query = query.eq("expense_type", expense_type);
    }

    query = query.order("expense_date", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { expense_type, description, amount, expense_date } = req.body;
    const updates = {};

    if (expense_type !== undefined) updates.expense_type = expense_type;
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = amount;
    if (expense_date !== undefined) updates.expense_date = expense_date;

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("expenses")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
};
