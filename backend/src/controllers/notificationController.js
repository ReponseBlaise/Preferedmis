const emailService = require('../services/emailService');
const { systemUpdateTemplate, projectUpdateTemplate, taskAssignmentTemplate, genericTemplate } = require('../utils/emailTemplates');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Send system update notification to all users
 */
exports.sendSystemUpdateToAll = async (req, res) => {
  try {
    const { title, details } = req.body;

    if (!title || !details) {
      return res.status(400).json({ error: 'Title and details are required' });
    }

    // Get all users with emails
    const result = await pool.query(
      'SELECT email, name FROM users WHERE email IS NOT NULL AND email != \'\' '
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No users with email addresses found' });
    }

    const emails = result.rows.map(row => row.email);
    const results = [];

    for (const user of result.rows) {
      try {
        const html = systemUpdateTemplate(title, details, user.name);
        await emailService.sendEmail(user.email, `System Update: ${title}`, html);
        results.push({ email: user.email, success: true });
      } catch (error) {
        results.push({ email: user.email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      message: 'System update notifications sent',
      total: emails.length,
      successful: successCount,
      failed: failCount,
      results
    });
  } catch (error) {
    console.error('Send system update error:', error);
    res.status(500).json({ error: 'Failed to send system update notifications' });
  }
};

/**
 * Send project update to project members
 */
exports.sendProjectUpdate = async (req, res) => {
  try {
    const { projectId, updateType, details } = req.body;
    const userId = req.user?.id;

    if (!projectId || !updateType || !details) {
      return res.status(400).json({ error: 'Project ID, update type, and details are required' });
    }

    // Get project name and members
    const projectResult = await pool.query(
      'SELECT project_name FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectName = projectResult.rows[0].project_name;

    // Get project members with emails
    const membersResult = await pool.query(`
      SELECT u.email, u.name 
      FROM users u
      INNER JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = $1 AND u.email IS NOT NULL
    `, [projectId]);

    if (membersResult.rows.length === 0) {
      return res.status(404).json({ error: 'No project members with email addresses found' });
    }

    const results = [];

    for (const member of membersResult.rows) {
      try {
        const html = projectUpdateTemplate(projectName, updateType, details, member.name);
        await emailService.sendEmail(member.email, `Project Update: ${projectName}`, html);
        results.push({ email: member.email, success: true });
      } catch (error) {
        results.push({ email: member.email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      message: 'Project update notifications sent',
      project: projectName,
      total: membersResult.rows.length,
      successful: successCount,
      results
    });
  } catch (error) {
    console.error('Send project update error:', error);
    res.status(500).json({ error: 'Failed to send project update notifications' });
  }
};

/**
 * Send task assignment notification
 */
exports.sendTaskAssignment = async (req, res) => {
  try {
    const { userId, taskName, projectName, dueDate } = req.body;

    if (!userId || !taskName || !projectName || !dueDate) {
      return res.status(400).json({ error: 'User ID, task name, project name, and due date are required' });
    }

    // Get user email
    const userResult = await pool.query(
      'SELECT email, name FROM users WHERE id = $1 AND email IS NOT NULL',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or has no email' });
    }

    const user = userResult.rows[0];
    const html = taskAssignmentTemplate(taskName, projectName, dueDate, user.name);

    await emailService.sendEmail(user.email, 'New Task Assigned', html);

    res.json({
      message: 'Task assignment notification sent',
      email: user.email
    });
  } catch (error) {
    console.error('Send task assignment error:', error);
    res.status(500).json({ error: 'Failed to send task assignment notification' });
  }
};

/**
 * Send custom notification to specific users
 */
exports.sendCustomNotification = async (req, res) => {
  try {
    const { recipientEmails, title, message } = req.body;

    if (!recipientEmails || !Array.isArray(recipientEmails) || !title || !message) {
      return res.status(400).json({ error: 'recipientEmails (array), title, and message are required' });
    }

    const results = [];

    for (const email of recipientEmails) {
      try {
        const html = genericTemplate(title, message);
        await emailService.sendEmail(email, title, html);
        results.push({ email, success: true });
      } catch (error) {
        results.push({ email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      message: 'Custom notifications processed',
      total: recipientEmails.length,
      successful: successCount,
      failed: recipientEmails.length - successCount,
      results
    });
  } catch (error) {
    console.error('Send custom notification error:', error);
    res.status(500).json({ error: 'Failed to send custom notifications' });
  }
};

/**
 * Test email configuration
 */
exports.testEmailConfig = async (req, res) => {
  try {
    const { email } = req.body;
    const testEmail = email || process.env.SMTP_USER;

    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address required' });
    }

    const html = genericTemplate('Email Configuration Test', 'This is a test email to verify your SMTP configuration is working correctly.');
    await emailService.sendEmail(testEmail, 'Email Configuration Test', html);

    res.json({
      message: 'Test email sent successfully',
      email: testEmail
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      details: error.message
    });
  }
};

/**
 * Get user notifications
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const { unread_only, limit = 50 } = req.query;
    
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

/**
 * Mark notification as read
 */
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};
