const { supabaseAdmin } = require('../config/supabase');

exports.createWorker = async (req, res) => {
  try {
    const { project_id, full_name, phone, position, rate_per_day, payment_type } = req.body;

    // Validate required fields
    if (!project_id) {
      return res.status(400).json({ error: 'Please select a project before adding a worker' });
    }
    if (!full_name) {
      return res.status(400).json({ error: 'Worker name is required' });
    }
    if (!position) {
      return res.status(400).json({ error: 'Worker position is required' });
    }
    if (!rate_per_day) {
      return res.status(400).json({ error: 'Daily/Monthly rate is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('workers')
      .insert({
        project_id,
        full_name,
        phone,
        position,
        rate_per_day,
        payment_type: payment_type || 'daily'
      })
      .select()
      .single();

    if (error) {
      console.error('Create worker error:', error);
      return res.status(400).json({ error: 'Failed to create worker. Please check all fields are correct.' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const { project_id, is_active } = req.query;
    let query = supabaseAdmin.from('workers').select('*');

    // Filter by user's accessible projects
    if (req.userProjects !== 'all') {
      if (req.userProjects.length === 0) {
        return res.json([]);
      }
      query = query.in('project_id', req.userProjects);
    }

    if (project_id) {
      // Check if user has access to this project
      if (req.userProjects !== 'all' && !req.userProjects.includes(project_id)) {
        return res.status(403).json({ error: 'You do not have access to this project' });
      }
      query = query.eq('project_id', project_id);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
};

exports.getWorker = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { full_name, phone, position, rate_per_day, payment_type, is_active } = req.body;
    const updates = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (position !== undefined) updates.position = position;
    if (rate_per_day !== undefined) updates.rate_per_day = rate_per_day;
    if (payment_type !== undefined) updates.payment_type = payment_type;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('workers')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update worker' });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('workers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete worker' });
  }
};
