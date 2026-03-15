const { supabaseAdmin } = require('../config/supabase');
const path = require('path');
const fs = require('fs').promises;
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

// Upload a document
exports.uploadDocument = async (req, res) => {
  try {
    await ensureUploadDir();

    const { project_id, title, description, category, visibility, shared_with } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Document title is required' });
    }

    // Save file to disk
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    await fs.writeFile(filePath, file.buffer);

    // Insert document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        project_id: project_id || null,
        owner_id: req.user.id,
        title,
        description: description || null,
        file_name: file.originalname,
        file_path: `/uploads/${fileName}`,
        file_size: file.size,
        file_type: file.mimetype,
        category: category || 'general',
        visibility: visibility || 'private'
      })
      .select()
      .single();

    if (docError) throw docError;

    // Log activity
    await supabaseAdmin.from('document_activity').insert({
      document_id: document.id,
      user_id: req.user.id,
      activity_type: 'upload',
      details: { title, file_name: file.originalname }
    });

    // Share with users if specified
    if (shared_with && Array.isArray(shared_with) && shared_with.length > 0) {
      const shares = shared_with.map(userId => ({
        document_id: document.id,
        shared_by: req.user.id,
        shared_with: userId,
        permission: 'view'
      }));

      await supabaseAdmin.from('document_shares').insert(shares);

      // Send notifications to shared users
      for (const userId of shared_with) {
        await sendShareNotification(userId, document, req.user.id, 'share');
      }
    }

    // Update visibility to shared if shared_with is provided
    if (shared_with && shared_with.length > 0) {
      await supabaseAdmin
        .from('documents')
        .update({ visibility: 'shared' })
        .eq('id', document.id);
    }

    res.status(201).json({ document, message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

// Get all documents (based on permissions)
exports.getDocuments = async (req, res) => {
  try {
    const { project_id, category, visibility, search } = req.query;
    let query = supabaseAdmin
      .from('documents')
      .select('*');

    // Filter by project
    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by visibility
    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    // Search in title and description
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get documents based on permissions
    const { data: docs, error } = await query;

    if (error) throw error;

    // Enrich with owner and project info, and filter by permissions
    const accessibleDocs = [];
    for (const doc of docs || []) {
      // Check permissions first
      if (
        doc.visibility === 'public' ||
        doc.owner_id === req.user.id
      ) {
        const [ownerData, projectData] = await Promise.all([
          supabaseAdmin.from('users').select('full_name, email').eq('id', doc.owner_id).single(),
          doc.project_id ? supabaseAdmin.from('projects').select('name').eq('id', doc.project_id).single() : { data: null }
        ]);
        accessibleDocs.push({
          ...doc,
          owner: ownerData.data,
          project: projectData.data
        });
      } else if (doc.visibility === 'shared') {
        // Check if document is shared with this user
        const { data: share } = await supabaseAdmin
          .from('document_shares')
          .select('*')
          .eq('document_id', doc.id)
          .eq('shared_with', req.user.id)
          .single();

        if (share) {
          const [ownerData, projectData] = await Promise.all([
            supabaseAdmin.from('users').select('full_name, email').eq('id', doc.owner_id).single(),
            doc.project_id ? supabaseAdmin.from('projects').select('name').eq('id', doc.project_id).single() : { data: null }
          ]);
          accessibleDocs.push({
            ...doc,
            owner: ownerData.data,
            project: projectData.data,
            share_permission: share.permission
          });
        }
      }
    }

    res.json(accessibleDocs);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get single document
exports.getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check permissions
    const canAccess =
      document.visibility === 'public' ||
      document.owner_id === req.user.id;

    if (!canAccess && document.visibility === 'shared') {
      const { data: share } = await supabaseAdmin
        .from('document_shares')
        .select('*')
        .eq('document_id', id)
        .eq('shared_with', req.user.id)
        .single();

      if (!share) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Enrich with owner and project info
    const [ownerData, projectData] = await Promise.all([
      supabaseAdmin.from('users').select('full_name, email').eq('id', document.owner_id).single(),
      document.project_id ? supabaseAdmin.from('projects').select('name').eq('id', document.project_id).single() : { data: null }
    ]);

    // Log view activity
    await supabaseAdmin.from('document_activity').insert({
      document_id: id,
      user_id: req.user.id,
      activity_type: 'view'
    });

    res.json({
      ...document,
      owner: ownerData.data,
      project: projectData.data
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // First check permissions
    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const canAccess = 
      document.visibility === 'public' ||
      document.owner_id === req.user.id;

    if (!canAccess && document.visibility === 'shared') {
      const { data: share } = await supabaseAdmin
        .from('document_shares')
        .select('permission')
        .eq('document_id', id)
        .eq('shared_with', req.user.id)
        .single();
      
      if (!share || !['view', 'download'].includes(share.permission)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Increment download count
    await supabaseAdmin
      .from('documents')
      .update({ download_count: document.download_count + 1 })
      .eq('id', id);

    // Log download activity
    await supabaseAdmin.from('document_activity').insert({
      document_id: id,
      user_id: req.user.id,
      activity_type: 'download'
    });

    const filePath = path.join(UPLOAD_DIR, path.basename(document.file_path));
    
    try {
      await fs.access(filePath);
      res.download(filePath, document.file_name);
    } catch (fileError) {
      res.status(404).json({ error: 'File not found on server' });
    }
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

// Share document with users
exports.shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { shared_with, permission, message } = req.body;

    if (!shared_with || !Array.isArray(shared_with) || shared_with.length === 0) {
      return res.status(400).json({ error: 'Users to share with are required' });
    }

    // Verify ownership
    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can share this document' });
    }

    // Create or update shares
    const shares = shared_with.map(userId => ({
      document_id: id,
      shared_by: req.user.id,
      shared_with: userId,
      permission: permission || 'view',
      message: message || null
    }));

    // Use upsert to handle existing shares
    for (const share of shares) {
      await supabaseAdmin
        .from('document_shares')
        .upsert(share, { onConflict: 'document_id,shared_with' })
        .eq('document_id', id)
        .eq('shared_with', share.shared_with);
    }

    // Update document visibility
    await supabaseAdmin
      .from('documents')
      .update({ visibility: 'shared' })
      .eq('id', id);

    // Log activity
    await supabaseAdmin.from('document_activity').insert({
      document_id: id,
      user_id: req.user.id,
      activity_type: 'share',
      details: { shared_with }
    });

    // Send notifications
    for (const userId of shared_with) {
      await sendShareNotification(userId, document, req.user.id, 'share', message);
    }

    res.json({ message: 'Document shared successfully' });
  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
};

// Unshare document
exports.unshareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!document || document.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can unshare this document' });
    }

    const { error } = await supabaseAdmin
      .from('document_shares')
      .delete()
      .eq('document_id', id)
      .eq('shared_with', user_id);

    if (error) throw error;

    // Log activity
    await supabaseAdmin.from('document_activity').insert({
      document_id: id,
      user_id: req.user.id,
      activity_type: 'unshare',
      details: { user_id }
    });

    res.json({ message: 'Document unshared successfully' });
  } catch (error) {
    console.error('Unshare document error:', error);
    res.status(500).json({ error: 'Failed to unshare document' });
  }
};

// Get shared documents (documents shared with the current user)
exports.getSharedDocuments = async (req, res) => {
  try {
    const { data: shares, error } = await supabaseAdmin
      .from('document_shares')
      .select('*')
      .eq('shared_with', req.user.id)
      .order('shared_at', { ascending: false });

    if (error) throw error;

    // Enrich with document, owner, and sharedBy info
    const enrichedShares = await Promise.all((shares || []).map(async (share) => {
      const [docData, ownerData, sharedByData] = await Promise.all([
        supabaseAdmin.from('documents').select('*').eq('id', share.document_id).single(),
        supabaseAdmin.from('users').select('full_name, email').eq('id', share.document_id ? 
          (await supabaseAdmin.from('documents').select('owner_id').eq('id', share.document_id).single()).data?.owner_id : null).single(),
        supabaseAdmin.from('users').select('full_name, email').eq('id', share.shared_by).single()
      ]);

      return {
        ...share,
        document: docData.data,
        owner: ownerData.data,
        sharedBy: sharedByData.data
      };
    }));

    res.json(enrichedShares || []);
  } catch (error) {
    console.error('Get shared documents error:', error);
    res.status(500).json({ error: 'Failed to fetch shared documents' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can delete this document' });
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, path.basename(document.file_path));
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }

    // Delete document record
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log activity
    await supabaseAdmin.from('document_activity').insert({
      document_id: id,
      user_id: req.user.id,
      activity_type: 'delete'
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Helper function to send share notifications
async function sendShareNotification(userId, document, sharedBy, type, message) {
  try {
    // Get user details
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) return;

    const { data: sharer } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', sharedBy)
      .single();

    const title = `Document Shared: ${document.title}`;
    const notificationMessage = `${sharer?.full_name || 'Someone'} has shared a document with you: ${document.title}${message ? ` - ${message}` : ''}`;

    // Create notification
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title,
      message: notificationMessage,
      type: 'document_share',
      document_id: document.id,
      action_url: `/documents/${document.id}`,
      email_sent: false,
      sms_sent: false
    });

    // Send email
    await sendEmail(
      user.email,
      title,
      `
        <p>Hello ${user.full_name || 'there'},</p>
        <p>${sharer?.full_name || 'Someone'} has shared a document with you.</p>
        <h3>${document.title}</h3>
        ${document.description ? `<p>${document.description}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p>Login to your account to view the document.</p>
      `
    );

    // Send SMS if phone number exists
    if (user.phone) {
      const smsMessage = `${sharer?.full_name || 'Someone'} shared "${document.title}" with you. Login to view.`;
      await sendSMS(user.phone, smsMessage);
      
      // Update notification with SMS sent status
      await supabaseAdmin
        .from('notifications')
        .update({ sms_sent: true, email_sent: true })
        .eq('document_id', document.id)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Send share notification error:', error);
  }
}
