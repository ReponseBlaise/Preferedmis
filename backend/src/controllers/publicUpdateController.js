const { supabaseAdmin } = require('../config/supabase');
const { sendEmailNotification } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

// Create a public update
exports.createPublicUpdate = async (req, res) => {
  try {
    const { project_id, title, content, type, priority, is_pinned, expires_at } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const { data: update, error } = await supabaseAdmin
      .from('public_updates')
      .insert({
        project_id: project_id || null,
        author_id: req.user.id,
        title,
        content,
        type: type || 'announcement',
        priority: priority || 'normal',
        is_pinned: is_pinned || false,
        expires_at: expires_at || null
      })
      .select('*')
      .single();

    if (error) throw error;

    // Enrich with author and project info
    const [authorData, projectData] = await Promise.all([
      supabaseAdmin.from('users').select('full_name, email').eq('id', update.author_id).single(),
      update.project_id ? supabaseAdmin.from('projects').select('name').eq('id', update.project_id).single() : { data: null }
    ]);

    const completeUpdate = {
      ...update,
      author: authorData.data,
      project: projectData.data
    };

    // Send notifications to all users
    await notifyUsersAboutUpdate(completeUpdate);

    res.status(201).json({ update: completeUpdate, message: 'Public update created successfully' });
  } catch (error) {
    console.error('Create public update error:', error);
    res.status(500).json({ error: 'Failed to create public update' });
  }
};

// Get all public updates
exports.getPublicUpdates = async (req, res) => {
  try {
    const { project_id, type, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('public_updates')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Filter out expired updates
    query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    const { data: updates, error } = await query;

    if (error) {
      console.error('Get public updates query error:', error);
      throw error;
    }

    // Enrich with author and project info
    const enrichedUpdates = await Promise.all((updates || []).map(async (update) => {
      const [authorData, projectData] = await Promise.all([
        supabaseAdmin.from('users').select('full_name, email').eq('id', update.author_id).single(),
        update.project_id ? supabaseAdmin.from('projects').select('name').eq('id', update.project_id).single() : { data: null }
      ]);

      return {
        ...update,
        author: authorData.data,
        project: projectData.data
      };
    }));

    res.json(enrichedUpdates || []);
  } catch (error) {
    console.error('Get public updates error:', error);
    res.status(500).json({ error: 'Failed to fetch public updates' });
  }
};

// Get single public update
exports.getPublicUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: update, error } = await supabaseAdmin
      .from('public_updates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Enrich with author and project info
    const [authorData, projectData] = await Promise.all([
      supabaseAdmin.from('users').select('full_name, email').eq('id', update.author_id).single(),
      update.project_id ? supabaseAdmin.from('projects').select('name').eq('id', update.project_id).single() : { data: null }
    ]);

    res.json({
      ...update,
      author: authorData.data,
      project: projectData.data
    });
  } catch (error) {
    console.error('Get public update error:', error);
    res.status(500).json({ error: 'Failed to fetch public update' });
  }
};

// Update public update
exports.updatePublicUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, priority, is_pinned, expires_at } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('public_updates')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Update not found' });
    }

    // Only author or manager can update
    if (existing.author_id !== req.user.id && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized to update this' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (type !== undefined) updates.type = type;
    if (priority !== undefined) updates.priority = priority;
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;
    if (expires_at !== undefined) updates.expires_at = expires_at;

    const { data: update, error } = await supabaseAdmin
      .from('public_updates')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Enrich with author and project info
    const [authorData, projectData] = await Promise.all([
      supabaseAdmin.from('users').select('full_name, email').eq('id', update.author_id).single(),
      update.project_id ? supabaseAdmin.from('projects').select('name').eq('id', update.project_id).single() : { data: null }
    ]);

    res.json({ 
      update: {
        ...update,
        author: authorData.data,
        project: projectData.data
      }, 
      message: 'Update modified successfully' 
    });
  } catch (error) {
    console.error('Update public update error:', error);
    res.status(500).json({ error: 'Failed to update public update' });
  }
};

// Delete public update
exports.deletePublicUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('public_updates')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Update not found' });
    }

    // Only author or manager can delete
    if (existing.author_id !== req.user.id && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized to delete this' });
    }

    const { error } = await supabaseAdmin
      .from('public_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Delete public update error:', error);
    res.status(500).json({ error: 'Failed to delete public update' });
  }
};

// Helper function to notify users about updates
async function notifyUsersAboutUpdate(update) {
  try {
    // Get all active users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (!users || users.length === 0) return;

    const { data: author } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', update.author_id)
      .single();

    const title = `New ${update.type}: ${update.title}`;
    const priorityEmoji = {
      low: '📌',
      normal: '📢',
      high: '⚠️',
      urgent: '🚨'
    };

    for (const user of users) {
      // Skip notifying the author
      if (user.id === update.author_id) continue;

      // Create notification
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        title,
        message: `${priorityEmoji[update.priority] || '📢'} ${update.content.substring(0, 200)}${update.content.length > 200 ? '...' : ''}`,
        type: 'public_update',
        update_id: update.id,
        action_url: `/updates/${update.id}`,
        email_sent: false,
        sms_sent: false
      });

      // Send email for high/urgent priority
      if (['high', 'urgent'].includes(update.priority)) {
        await sendEmailNotification(
          user.email,
          title,
          `
            <p>Hello ${user.full_name || 'there'},</p>
            <p>${priorityEmoji[update.priority]} <strong>${author?.full_name || 'Someone'}</strong> posted an important update:</p>
            <h3>${update.title}</h3>
            <p>${update.content}</p>
            <p>Login to your account to view the full update.</p>
          `
        );

        // Update notification email status
        await supabaseAdmin
          .from('notifications')
          .update({ email_sent: true })
          .eq('update_id', update.id)
          .eq('user_id', user.id);
      }

      // Send SMS for urgent priority
      if (update.priority === 'urgent' && user.phone) {
        const smsMessage = `URGENT: ${update.title} - ${update.content.substring(0, 100)}...`;
        await sendSMS(user.phone, smsMessage);

        await supabaseAdmin
          .from('notifications')
          .update({ sms_sent: true })
          .eq('update_id', update.id)
          .eq('user_id', user.id);
      }
    }
  } catch (error) {
    console.error('Notify users error:', error);
  }
}
