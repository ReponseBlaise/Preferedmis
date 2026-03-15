const { supabaseAdmin } = require('../config/supabase');

// Record stock movement (in or out)
exports.recordMovement = async (req, res) => {
  try {
    const { inventory_item_id, project_id, movement_type, quantity, unit_price, reference_number, notes, movement_date } = req.body;

    if (!inventory_item_id) return res.status(400).json({ error: 'Inventory item is required' });
    if (!movement_type || !['in', 'out'].includes(movement_type)) return res.status(400).json({ error: 'Movement type must be in or out' });
    if (!quantity || parseFloat(quantity) <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });

    const { data, error } = await supabaseAdmin
      .from('stock_movements')
      .insert({
        inventory_item_id,
        project_id: project_id || null,
        movement_type,
        quantity: parseFloat(quantity),
        unit_price: unit_price ? parseFloat(unit_price) : null,
        reference_number: reference_number || null,
        notes: notes || null,
        movement_date: movement_date || new Date().toISOString().split('T')[0],
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Record movement error:', error);
    res.status(500).json({ error: 'Failed to record stock movement' });
  }
};

// Get all movements for an inventory item
exports.getMovements = async (req, res) => {
  try {
    const { inventory_item_id } = req.params;
    const { start_date, end_date, movement_type } = req.query;

    let query = supabaseAdmin
      .from('stock_movements')
      .select('*, inventory_items(name, unit)')
      .eq('inventory_item_id', inventory_item_id)
      .order('movement_date', { ascending: false });

    if (start_date) {
      query = query.gte('movement_date', start_date);
    }
    if (end_date) {
      query = query.lte('movement_date', end_date);
    }
    if (movement_type) {
      query = query.eq('movement_type', movement_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
};

// Get stock summary for an item
exports.getStockSummary = async (req, res) => {
  try {
    const { inventory_item_id } = req.params;

    // Get total stock in
    const { data: stockIn, error: inError } = await supabaseAdmin
      .from('stock_movements')
      .select('quantity')
      .eq('inventory_item_id', inventory_item_id)
      .eq('movement_type', 'in');

    if (inError) throw inError;

    // Get total stock out
    const { data: stockOut, error: outError } = await supabaseAdmin
      .from('stock_movements')
      .select('quantity')
      .eq('inventory_item_id', inventory_item_id)
      .eq('movement_type', 'out');

    if (outError) throw outError;

    const totalIn = stockIn.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
    const totalOut = stockOut.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
    const remaining = totalIn - totalOut;

    res.json({
      total_in: totalIn,
      total_out: totalOut,
      remaining_stock: remaining
    });
  } catch (error) {
    console.error('Get stock summary error:', error);
    res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
};

// Get all movements for a project
exports.getProjectMovements = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { start_date, end_date, movement_type } = req.query;

    let query = supabaseAdmin
      .from('stock_movements')
      .select('*, inventory_items(name, unit)')
      .eq('project_id', project_id)
      .order('movement_date', { ascending: false });

    if (start_date) {
      query = query.gte('movement_date', start_date);
    }
    if (end_date) {
      query = query.lte('movement_date', end_date);
    }
    if (movement_type) {
      query = query.eq('movement_type', movement_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get project movements error:', error);
    res.status(500).json({ error: 'Failed to fetch project movements' });
  }
};

// Delete stock movement
exports.deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('stock_movements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Stock movement deleted successfully' });
  } catch (error) {
    console.error('Delete movement error:', error);
    res.status(500).json({ error: 'Failed to delete stock movement' });
  }
};

module.exports = exports;
