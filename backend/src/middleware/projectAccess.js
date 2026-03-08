const { supabaseAdmin } = require('../config/supabase');

const getUserProjects = async (req, res, next) => {
  try {
    // Managers can access all projects
    if (req.user.role === 'manager') {
      req.userProjects = 'all';
      return next();
    }

    // Get projects user is assigned to
    const { data: projectMembers, error } = await supabaseAdmin
      .from('project_members')
      .select('project_id')
      .eq('user_id', req.user.id);

    if (error) throw error;

    req.userProjects = projectMembers.map(pm => pm.project_id);
    next();
  } catch (error) {
    console.error('Get user projects error:', error);
    req.userProjects = [];
    next();
  }
};

module.exports = getUserProjects;
