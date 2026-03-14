const { supabaseAdmin } = require('../config/supabase');

exports.createProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    if (!start_date) {
      return res.status(400).json({ error: 'Start date is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        name,
        description,
        start_date,
        end_date,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return res.status(400).json({ error: 'Failed to create project. Please check all fields are correct.' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin.from('projects').select('*');

    // Filter by user's accessible projects
    if (req.userProjects !== 'all') {
      if (req.userProjects.length === 0) {
        return res.json([]);
      }
      query = query.in('id', req.userProjects);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (req.query.search) {
      const s = req.query.search;
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.getProject = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { user_id } = req.body;

    const { data, error } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: req.params.id,
        user_id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select(`
        user_id,
        joined_at,
        users:user_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('project_id', req.params.id);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};
