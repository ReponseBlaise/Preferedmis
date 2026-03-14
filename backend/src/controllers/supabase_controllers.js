const { supabaseAdmin } = require('../config/supabase');

// Inventory Controller
exports.inventory = {
  createItem: async (req, res) => {
    try {
      const { project_id, category_id, name, description, quantity, unit, unit_price, purchase_date } = req.body;

      // Validate required fields with clear messages
      if (!project_id) {
        return res.status(400).json({ error: 'Please select a project before adding inventory items' });
      }
      if (!name) {
        return res.status(400).json({ error: 'Item name is required' });
      }
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Please enter a valid quantity (greater than 0)' });
      }
      if (!unit_price || unit_price <= 0) {
        return res.status(400).json({ error: 'Please enter a valid unit price (greater than 0)' });
      }

      const { data, error } = await supabaseAdmin
        .from('inventory_items')
        .insert({
          project_id,
          category_id: category_id || null,
          name,
          description,
          quantity,
          unit,
          unit_price,
          purchase_date,
          created_by: req.user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Create item error:', error);
        return res.status(400).json({ error: 'Failed to add inventory item. Please check all fields are correct.' });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Create item error:', error);
      res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
  },

  getItems: async (req, res) => {
    try {
      const { project_id, category_id, search } = req.query;
      let query = supabaseAdmin
        .from('inventory_items')
        .select('*, inventory_categories(name, type)');

      if (project_id) query = query.eq('project_id', project_id);
      if (category_id) query = query.eq('category_id', category_id);
      if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;

      // Fetch all stock movements for these items in one query
      const itemIds = (data || []).map(i => i.id);
      let movementsMap = {};
      if (itemIds.length > 0) {
        const { data: movements } = await supabaseAdmin
          .from('stock_movements')
          .select('inventory_item_id, movement_type, quantity')
          .in('inventory_item_id', itemIds);

        (movements || []).forEach(m => {
          if (!movementsMap[m.inventory_item_id]) movementsMap[m.inventory_item_id] = { in: 0, out: 0 };
          movementsMap[m.inventory_item_id][m.movement_type] += parseFloat(m.quantity || 0);
        });
      }

      const formattedData = (data || []).map(item => {
        const mv = movementsMap[item.id] || { in: 0, out: 0 };
        // remaining = initial quantity (stock in at creation) + additional stock in - stock out
        const remaining_stock = parseFloat(item.quantity || 0) + mv.in - mv.out;
        return {
          ...item,
          category_name: item.inventory_categories?.name || 'Uncategorized',
          total_in: mv.in,
          total_out: mv.out,
          remaining_stock: Math.max(0, remaining_stock)
        };
      });

      res.json(formattedData);
    } catch (error) {
      console.error('Get items error:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  },

  updateItem: async (req, res) => {
    try {
      const { name, description, quantity, unit, unit_price, category_id } = req.body;
      const updates = {};

      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (quantity !== undefined) updates.quantity = quantity;
      if (unit !== undefined) updates.unit = unit;
      if (unit_price !== undefined) updates.unit_price = unit_price;
      if (category_id !== undefined) updates.category_id = category_id;

      const { data, error } = await supabaseAdmin
        .from('inventory_items')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update item' });
    }
  },

  deleteItem: async (req, res) => {
    try {
      const { error } = await supabaseAdmin
        .from('inventory_items')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  },

  getInventoryReport: async (req, res) => {
    try {
      const { project_id, start_date, end_date } = req.query;
      let query = supabaseAdmin
        .from('inventory_items')
        .select(`
          total_price,
          inventory_categories (
            name
          )
        `)
        .eq('project_id', project_id);

      if (start_date) {
        query = query.gte('purchase_date', start_date);
      }

      if (end_date) {
        query = query.lte('purchase_date', end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by category
      const categories = {};
      data.forEach(item => {
        const catName = item.inventory_categories?.name || 'Uncategorized';
        if (!categories[catName]) {
          categories[catName] = { category: catName, item_count: 0, total_value: 0 };
        }
        categories[catName].item_count++;
        categories[catName].total_value += parseFloat(item.total_price || 0);
      });

      const categoryArray = Object.values(categories);
      const totalSpent = categoryArray.reduce((sum, cat) => sum + cat.total_value, 0);

      res.json({
        categories: categoryArray,
        total_spent: totalSpent
      });
    } catch (error) {
      console.error('Inventory report error:', error);
      res.status(500).json({ error: 'Failed to generate inventory report' });
    }
  },

  getTotalSpent: async (req, res) => {
    try {
      const { project_id } = req.query;

      const { data: items, error: itemsError } = await supabaseAdmin
        .from('inventory_items')
        .select('total_price')
        .eq('project_id', project_id);

      if (itemsError) throw itemsError;

      const { data: expenses, error: expensesError } = await supabaseAdmin
        .from('expenses')
        .select('amount')
        .eq('project_id', project_id);

      if (expensesError) throw expensesError;

      const itemsTotal = items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
      const expensesTotal = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

      res.json({ total_spent: itemsTotal + expensesTotal });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate total spent' });
    }
  }
};

// Expense Controller
exports.expense = {
  createExpense: async (req, res) => {
    try {
      const { project_id, expense_type, description, amount, expense_date } = req.body;

      // Validate required fields with clear messages
      if (!project_id) {
        return res.status(400).json({ error: 'Please select a project before adding expenses' });
      }
      if (!expense_type) {
        return res.status(400).json({ error: 'Please select an expense type' });
      }
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid amount (greater than 0)' });
      }

      const { data, error } = await supabaseAdmin
        .from('expenses')
        .insert({
          project_id,
          expense_type,
          description,
          amount,
          expense_date,
          created_by: req.user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Create expense error:', error);
        return res.status(400).json({ error: 'Failed to add expense. Please check all fields are correct.' });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
  },

  getExpenses: async (req, res) => {
    try {
      const { project_id, start_date, end_date, expense_type } = req.query;
      let query = supabaseAdmin.from('expenses').select('*');

      if (project_id) {
        query = query.eq('project_id', project_id);
      }

      if (start_date) {
        query = query.gte('expense_date', start_date);
      }

      if (end_date) {
        query = query.lte('expense_date', end_date);
      }

      if (expense_type) {
        query = query.eq('expense_type', expense_type);
      }

      query = query.order('expense_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      res.json(data);
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  },

  updateExpense: async (req, res) => {
    try {
      const { expense_type, description, amount, expense_date } = req.body;
      const updates = {};

      if (expense_type !== undefined) updates.expense_type = expense_type;
      if (description !== undefined) updates.description = description;
      if (amount !== undefined) updates.amount = amount;
      if (expense_date !== undefined) updates.expense_date = expense_date;

      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update expense' });
    }
  },

  deleteExpense: async (req, res) => {
    try {
      const { error } = await supabaseAdmin
        .from('expenses')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  }
};

// Dashboard Controller
exports.dashboard = {
  getDashboard: async (req, res) => {
    try {
      const { project_id } = req.query;

      // Determine which projects to query
      let projectIds = [];
      if (req.userProjects === 'all') {
        // Manager - if project_id specified, use it; otherwise get all
        if (project_id) {
          projectIds = [project_id];
        } else {
          const { data: allProjects } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('status', 'active');
          projectIds = allProjects?.map(p => p.id) || [];
        }
      } else {
        // Employee/Storeman - only their assigned projects
        projectIds = req.userProjects;
        if (projectIds.length === 0) {
          return res.json({
            stats: {
              active_projects: 0,
              active_workers: 0,
              today_attendance: 0,
              total_spent: 0,
              current_month_payroll: 0,
              unread_messages: 0
            },
            recent_activities: [],
            expenses_by_type: [],
            attendance_trend: []
          });
        }
      }

      // Get counts
      const { count: projectsCount } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .in('id', projectIds);

      const { count: workersCount } = await supabaseAdmin
        .from('workers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('project_id', projectIds);

      const today = new Date().toISOString().split('T')[0];
      const { count: todayAttendance } = await supabaseAdmin
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('attendance_date', today)
        .in('project_id', projectIds);

      // Get spending
      const { data: items } = await supabaseAdmin
        .from('inventory_items')
        .select('total_price')
        .in('project_id', projectIds);

      const { data: expenses } = await supabaseAdmin
        .from('expenses')
        .select('amount')
        .in('project_id', projectIds);

      const totalSpent =
        (items?.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0) || 0) +
        (expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0);

      // Get current month payroll
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

      const { data: monthAttendance } = await supabaseAdmin
        .from('attendance')
        .select(`
          days_worked,
          workers:worker_id (
            rate_per_day
          )
        `)
        .in('project_id', projectIds)
        .gte('attendance_date', monthStart);

      const currentMonthPayroll = monthAttendance?.reduce((sum, a) => {
        return sum + (parseFloat(a.days_worked) * parseFloat(a.workers?.rate_per_day || 0));
      }, 0) || 0;

      // Get unread messages
      const { count: unreadMessages } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', req.user.id)
        .eq('is_read', false);

      // Get recent activities from audit_logs (last 10)
      // Filter by relevant tables for the user's projects
      const { data: recentActivities } = await supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          users:user_id (
            full_name,
            email
          )
        `)
        .in('table_name', ['projects', 'workers', 'attendance', 'inventory_items', 'expenses', 'messages'])
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedActivities = recentActivities?.map(log => ({
        id: log.id,
        action: log.action,
        user_name: log.users?.full_name || log.users?.email || 'Unknown',
        table_name: log.table_name,
        created_at: log.created_at
      })) || [];

      // Get expenses by type
      const { data: allExpenses } = await supabaseAdmin
        .from('expenses')
        .select('expense_type, amount')
        .in('project_id', projectIds);

      const expensesByTypeMap = {};
      allExpenses?.forEach(exp => {
        const type = exp.expense_type || 'Uncategorized';
        if (!expensesByTypeMap[type]) {
          expensesByTypeMap[type] = { expense_type: type, total: 0 };
        }
        expensesByTypeMap[type].total += parseFloat(exp.amount || 0);
      });

      const expensesByType = Object.values(expensesByTypeMap);

      // Get attendance trend for last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
      }

      const { data: attendanceData } = await supabaseAdmin
        .from('attendance')
        .select('attendance_date, worker_id')
        .in('project_id', projectIds)
        .in('attendance_date', last7Days);

      const attendanceTrendMap = {};
      last7Days.forEach(dateStr => {
        attendanceTrendMap[dateStr] = { attendance_date: dateStr, workers_present: 0 };
      });

      attendanceData?.forEach(att => {
        if (attendanceTrendMap[att.attendance_date]) {
          attendanceTrendMap[att.attendance_date].workers_present++;
        }
      });

      const attendanceTrend = Object.values(attendanceTrendMap).sort(
        (a, b) => new Date(a.attendance_date) - new Date(b.attendance_date)
      );

      res.json({
        stats: {
          active_projects: projectsCount || 0,
          active_workers: workersCount || 0,
          today_attendance: todayAttendance || 0,
          total_spent: totalSpent,
          current_month_payroll: currentMonthPayroll,
          unread_messages: unreadMessages || 0
        },
        recent_activities: formattedActivities,
        expenses_by_type: expensesByType,
        attendance_trend: attendanceTrend
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
};
