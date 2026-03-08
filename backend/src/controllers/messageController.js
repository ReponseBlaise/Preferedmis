const { supabaseAdmin } = require('../config/supabase');

exports.sendMessage = async (req, res) => {
  try {
    const { project_id, receiver_id, subject, message } = req.body;

    // Validate required fields
    if (!receiver_id) {
      return res.status(400).json({ error: 'Please select a recipient' });
    }
    if (!subject || subject.trim() === '') {
      return res.status(400).json({ error: 'Message subject is required' });
    }
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        project_id: project_id || null,
        sender_id: req.user.id,
        receiver_id,
        subject,
        message,
        attachment_url: req.body.attachment_url
      })
      .select()
      .single();

    if (error) {
      console.error('Send message error:', error);
      return res.status(400).json({ error: 'Failed to send message. Please try again.' });
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: receiver_id,
        title: 'New Message',
        message: `You have a new message: ${subject}`,
        type: 'message'
      });

    res.status(201).json(data);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { project_id, type } = req.query;
    let query = supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          full_name
        ),
        receiver:receiver_id (
          full_name
        )
      `);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (type === 'sent') {
      query = query.eq('sender_id', req.user.id);
    } else if (type === 'received') {
      query = query.eq('receiver_id', req.user.id);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('receiver_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const { data, error } = await supabaseAdmin.storage
      .from('attachments')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (error) throw error;

    const { data: urlData } = supabaseAdmin.storage
      .from('attachments')
      .getPublicUrl(fileName);

    res.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};
