const { supabaseAdmin } = require('../config/supabase');
const emailService = require('../services/emailService');
const path = require('path');
const fs = require('fs').promises;

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/messages');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

// Send a new message or reply
exports.sendMessage = async (req, res) => {
  try {
    const { project_id, receiver_id, subject, message, parent_id, priority } = req.body;

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

    // If this is a reply, get the parent message
    let replySubject = subject;
    if (parent_id) {
      const { data: parentMessage } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('id', parent_id)
        .single();
      
      if (parentMessage) {
        // Prefix subject with Re: if not already there
        replySubject = subject.startsWith('Re:') ? subject : `Re: ${parentMessage.subject}`;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        project_id: project_id || null,
        sender_id: req.user.id,
        receiver_id,
        subject: replySubject,
        message,
        parent_id: parent_id || null,
        priority: priority || 'normal'
      })
      .select(`
        *,
        sender:sender_id (full_name, email),
        receiver:receiver_id (full_name, email)
      `)
      .single();

    if (error) {
      console.error('Send message error:', error);
      return res.status(400).json({ error: 'Failed to send message. Please try again.' });
    }

    // Create notification for the receiver
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: receiver_id,
        title: `New Message: ${replySubject}`,
        message: `You have a new message from ${req.user.full_name}`,
        type: 'message',
        action_url: `/messages`
      });

    // Send email notification to receiver
    try {
      const { data: receiverData } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', receiver_id)
        .single();

      if (receiverData && receiverData.email) {
        const emailSubject = parent_id 
          ? `Re: ${subject}` 
          : `New Message: ${subject}`;
        
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">${parent_id ? '📩 Reply to Your Message' : '📩 New Message Received'}</h2>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${req.user.full_name || req.user.email}</p>
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${replySubject}</p>
              ${priority && priority !== 'normal' ? `<p style="margin: 0 0 10px 0;"><strong>Priority:</strong> <span style="color: ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#ea580c' : '#2563eb'};">${priority.toUpperCase()}</span></p>` : ''}
              <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 15px;">
                <p style="margin: 0; color: #374151;">${message}</p>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This is an automatic notification. Please login to your account to view the full conversation and reply.
            </p>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/messages" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Message
              </a>
            </div>
          </div>
        `;

        await emailService.sendEmail(receiverData.email, emailSubject, emailBody);
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the message send if email fails
    }

    res.status(201).json({ 
      ...data, 
      message: 'Message sent successfully',
      emailSent: true 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

// Get messages with threading support
exports.getMessages = async (req, res) => {
  try {
    const { project_id, type, parent_id } = req.query;
    let query = supabaseAdmin
      .from('messages')
      .select('*');

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (parent_id) {
      // Get replies to a specific message
      query = query.eq('parent_id', parent_id);
    } else if (type === 'sent') {
      query = query.eq('sender_id', req.user.id);
    } else if (type === 'received') {
      query = query.eq('receiver_id', req.user.id);
    } else {
      // Show all messages where user is sender or receiver
      query = query.or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`);
    }

    query = query.order('created_at', { ascending: true });

    const { data: messages, error } = await query;

    if (error) throw error;

    // Enrich with sender/receiver info and attachments
    const enrichedMessages = await Promise.all((messages || []).map(async (msg) => {
      const [senderData, receiverData, attachmentsData] = await Promise.all([
        supabaseAdmin.from('users').select('id, full_name, email, role').eq('id', msg.sender_id).single(),
        supabaseAdmin.from('users').select('id, full_name, email').eq('id', msg.receiver_id).single(),
        supabaseAdmin.from('message_attachments').select('*').eq('message_id', msg.id)
      ]);

      return {
        ...msg,
        sender: senderData.data,
        receiver: receiverData.data,
        attachments: attachmentsData.data || []
      };
    }));

    res.json(enrichedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Get conversation threads (grouped by subject/parent)
exports.getConversations = async (req, res) => {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with sender/receiver info
    const conversations = await Promise.all((messages || []).map(async (msg) => {
      const [senderData, receiverData] = await Promise.all([
        supabaseAdmin.from('users').select('full_name, email').eq('id', msg.sender_id).single(),
        supabaseAdmin.from('users').select('full_name').eq('id', msg.receiver_id).single()
      ]);

      return {
        ...msg,
        sender: senderData.data,
        receiver: receiverData.data,
        unread_count: 0,
        last_message: msg
      };
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (existing.sender_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        message,
        edited_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        sender:sender_id (full_name, email)
      `)
      .single();

    if (error) throw error;

    res.json({ ...data, message: 'Message edited successfully' });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== req.user.id && message.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete attachments from disk
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        try {
          const filePath = path.join(UPLOAD_DIR, path.basename(attachment.file_path));
          await fs.unlink(filePath);
        } catch (fileError) {
          console.error('Error deleting attachment:', fileError);
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Upload file attachment
exports.uploadAttachment = async (req, res) => {
  try {
    await ensureUploadDir();

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    const attachmentData = {
      file_name: file.originalname,
      file_path: `/uploads/messages/${fileName}`,
      file_size: file.size,
      file_type: file.mimetype
    };

    res.json({
      message: 'File uploaded successfully',
      attachment: attachmentData,
      url: `/uploads/messages/${fileName}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

// Add attachment to existing message
exports.addAttachmentToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_path, file_size, file_type } = req.body;

    if (!file_name || !file_path) {
      return res.status(400).json({ error: 'File information is required' });
    }

    // Verify message exists and user has access
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== req.user.id && message.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabaseAdmin
      .from('message_attachments')
      .insert({
        message_id: id,
        file_name,
        file_path,
        file_size,
        file_type,
        uploaded_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      message: 'Attachment added successfully',
      attachment: data 
    });
  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
};

// Get message attachments
exports.getMessageAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('message_attachments')
      .select('*')
      .eq('message_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

// Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: attachment } = await supabaseAdmin
      .from('message_attachments')
      .select('*')
      .eq('id', id)
      .single();

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Verify ownership
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', attachment.message_id)
      .single();

    if (!message || (message.sender_id !== req.user.id && message.receiver_id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from disk
    try {
      const filePath = path.join(UPLOAD_DIR, path.basename(attachment.file_path));
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }

    const { error } = await supabaseAdmin
      .from('message_attachments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

// Mark message as read
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

    res.json({ ...data, message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// Mark all messages as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Forward message
exports.forwardMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver_id, message: forwardNote } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ error: 'Recipient is required' });
    }

    const { data: originalMessage } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (!originalMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Create forwarded message
    const forwardedMessage = `
      ${forwardNote ? `${forwardNote}\n\n` : ''}
      ---------- Forwarded Message ----------
      From: ${originalMessage.sender_id}
      To: ${originalMessage.receiver_id}
      Date: ${new Date(originalMessage.created_at).toLocaleString()}
      Subject: ${originalMessage.subject}

      ${originalMessage.message}
    `;

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        project_id: originalMessage.project_id,
        sender_id: req.user.id,
        receiver_id,
        subject: `Fwd: ${originalMessage.subject}`,
        message: forwardedMessage
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: receiver_id,
        title: 'Forwarded Message',
        message: `You received a forwarded message from ${req.user.full_name}`,
        type: 'message'
      });

    res.status(201).json({ ...data, message: 'Message forwarded successfully' });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({ error: 'Failed to forward message' });
  }
};
