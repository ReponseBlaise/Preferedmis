const { supabaseAdmin } = require('../config/supabase');

// Inventory Controller
exports.createItem = async (req, res) => {
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
};

exports.getItems = async (req, res) => {
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
};

exports.updateItem = async (req, res) => {
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
};

exports.deleteItem = async (req, res) => {
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
};

exports.getInventoryReport = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;
    let query = supabaseAdmin
      .from('inventory_items')
      .select('quantity, unit_price, inventory_categories(name)')
      .eq('project_id', project_id);

    if (start_date) query = query.gte('purchase_date', start_date);
    if (end_date) query = query.lte('purchase_date', end_date);

    const { data, error } = await query;
    if (error) throw error;

    const categories = {};
    data.forEach(item => {
      const catName = item.inventory_categories?.name || 'Uncategorized';
      const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
      if (!categories[catName]) {
        categories[catName] = { category: catName, item_count: 0, total_value: 0 };
      }
      categories[catName].item_count++;
      categories[catName].total_value += itemTotal;
    });

    const categoryArray = Object.values(categories);
    const totalSpent = categoryArray.reduce((sum, cat) => sum + cat.total_value, 0);

    res.json({ categories: categoryArray, total_spent: totalSpent });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
};

exports.getTotalSpent = async (req, res) => {
  try {
    const { project_id } = req.query;

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('inventory_items')
      .select('quantity, unit_price')
      .eq('project_id', project_id);

    if (itemsError) throw itemsError;

    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('amount')
      .eq('project_id', project_id);

    if (expensesError) throw expensesError;

    const itemsTotal = items.reduce((sum, item) =>
      sum + parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0), 0);
    const expensesTotal = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    res.json({ total_spent: itemsTotal + expensesTotal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate total spent' });
  }
};
