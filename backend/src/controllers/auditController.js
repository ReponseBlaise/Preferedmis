const { supabaseAdmin } = require('../config/supabase');

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, table_name, user_id, start_date, end_date } = req.query;
    
    let query = supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        users:user_id (
          full_name,
          email,
          role
        )
      `);

    if (action) {
      query = query.eq('action', action);
    }

    if (table_name) {
      query = query.eq('table_name', table_name);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date + 'T23:59:59');
    }

    query = query.order('created_at', { ascending: false }).limit(500);

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
