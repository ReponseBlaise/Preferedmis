const { supabaseAdmin } = require("../config/supabase");
const emailService = require("../services/emailService");

const BUCKET = "message-attachments";

// Get all users for messaging
exports.getUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, role")
      .eq("is_active", true)
      .order("full_name");
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Send a new message or reply
exports.sendMessage = async (req, res) => {
  try {
    const { project_id, receiver_id, subject, message, parent_id, priority } =
      req.body;

    if (!receiver_id)
      return res.status(400).json({ error: "Please select a recipient" });
    if (!subject?.trim())
      return res.status(400).json({ error: "Message subject is required" });
    if (!message?.trim())
      return res.status(400).json({ error: "Message content is required" });

    let replySubject = subject;
    if (parent_id) {
      const { data: parentMessage } = await supabaseAdmin
        .from("messages")
        .select("subject")
        .eq("id", parent_id)
        .single();
      if (parentMessage) {
        replySubject = subject.startsWith("Re:")
          ? subject
          : `Re: ${parentMessage.subject}`;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert({
        project_id: project_id || null,
        sender_id: req.user.id,
        receiver_id,
        subject: replySubject,
        message,
        parent_id: parent_id || null,
        priority: priority || "normal",
      })
      .select(
        "*, sender:sender_id (full_name, email), receiver:receiver_id (full_name, email)",
      )
      .single();

    if (error) return res.status(400).json({ error: "Failed to send message" });

    await supabaseAdmin.from("notifications").insert({
      user_id: receiver_id,
      title: `New Message: ${replySubject}`,
      message: `You have a new message from ${req.user.full_name || req.user.email}`,
      type: "message",
      action_url: "/messages",
    });

    // Fire-and-forget email
    try {
      const { data: receiverData } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", receiver_id)
        .single();
      if (receiverData?.email) {
        const emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px">
          <h2 style="color:#2563eb">📩 ${parent_id ? "Reply to Your Message" : "New Message Received"}</h2>
          <p><strong>From:</strong> ${req.user.full_name || req.user.email}</p>
          <p><strong>Subject:</strong> ${replySubject}</p>
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin-top:10px">${message}</div>
          <p style="margin-top:20px"><a href="${process.env.FRONTEND_URL}/messages" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px">View Message</a></p>
        </div>`;
        emailService
          .sendEmail(
            receiverData.email,
            `${parent_id ? "Re: " : "New Message: "}${replySubject}`,
            emailBody,
          )
          .catch(() => {});
      }
    } catch {}

    res.status(201).json({ ...data, message: "Message sent successfully" });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

// Get messages
exports.getMessages = async (req, res) => {
  try {
    const { project_id, type, parent_id } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let query = supabaseAdmin.from("messages").select("*");

    if (project_id) query = query.eq("project_id", project_id);
    if (parent_id) {
      query = query.eq("parent_id", parent_id);
    } else if (type === "sent") {
      query = query.eq("sender_id", userId);
    } else if (type === "received") {
      query = query.eq("receiver_id", userId);
    } else {
      query = query.or(
        `sender_id.eq.${userId},receiver_id.eq.${userId}`,
      );
    }

    const { data: messages, error } = await query.order("created_at", {
      ascending: true,
    });
    
    if (error) {
      console.error("Supabase messages query error:", error);
      throw error;
    }

    if (!messages || messages.length === 0) {
      return res.json([]);
    }

    // Get unique user IDs
    const userIds = new Set();
    messages.forEach((msg) => {
      userIds.add(msg.sender_id);
      userIds.add(msg.receiver_id);
    });

    // Fetch all users at once
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, role")
      .in("id", Array.from(userIds));

    if (usersError) {
      console.error("Supabase users query error:", usersError);
      throw usersError;
    }

    const userMap = {};
    (users || []).forEach((user) => {
      userMap[user.id] = user;
    });

    // Get all attachments at once
    const messageIds = messages.map((m) => m.id);
    const { data: allAttachments, error: attachmentsError } = await supabaseAdmin
      .from("message_attachments")
      .select("id, message_id, file_name, file_path, file_size, file_type")
      .in("message_id", messageIds);

    if (attachmentsError) {
      console.error("Supabase attachments query error:", attachmentsError);
      throw attachmentsError;
    }

    const attachmentMap = {};
    (allAttachments || []).forEach((att) => {
      if (!attachmentMap[att.message_id]) {
        attachmentMap[att.message_id] = [];
      }
      attachmentMap[att.message_id].push(att);
    });

    // Enrich messages with cached data
    const enrichedMessages = messages.map((msg) => ({
      ...msg,
      sender: userMap[msg.sender_id] || {
        id: msg.sender_id,
        full_name: "Unknown",
      },
      receiver: userMap[msg.receiver_id] || {
        id: msg.receiver_id,
        full_name: "Unknown",
      },
      attachments: attachmentMap[msg.id] || [],
    }));

    res.json(enrichedMessages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch messages" });
  }
};

// Get conversation threads
exports.getConversations = async (req, res) => {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .is("parent_id", null)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const conversations = await Promise.all(
      (messages || []).map(async (msg) => {
        const [senderData, receiverData] = await Promise.all([
          supabaseAdmin
            .from("users")
            .select("full_name, email")
            .eq("id", msg.sender_id)
            .single(),
          supabaseAdmin
            .from("users")
            .select("full_name")
            .eq("id", msg.receiver_id)
            .single(),
        ]);
        return { ...msg, sender: senderData.data, receiver: receiverData.data };
      }),
    );

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ error: "Message content is required" });

    const { data: existing } = await supabaseAdmin
      .from("messages")
      .select("sender_id")
      .eq("id", id)
      .single();
    if (!existing) return res.status(404).json({ error: "Message not found" });
    if (existing.sender_id !== req.user.id)
      return res
        .status(403)
        .json({ error: "You can only edit your own messages" });

    const { data, error } = await supabaseAdmin
      .from("messages")
      .update({ message, edited_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, sender:sender_id (full_name, email)")
      .single();
    if (error) throw error;

    res.json({ ...data, message: "Message edited successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to edit message" });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: message } = await supabaseAdmin
      .from("messages")
      .select("sender_id, receiver_id")
      .eq("id", id)
      .single();
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.sender_id !== req.user.id)
      return res.status(403).json({ error: "Access denied" });

    // Delete attachments from Supabase Storage
    const { data: attachments } = await supabaseAdmin
      .from("message_attachments")
      .select("storage_path")
      .eq("message_id", id);
    if (attachments?.length) {
      const paths = attachments.map((a) => a.storage_path).filter(Boolean);
      if (paths.length) await supabaseAdmin.storage.from(BUCKET).remove(paths);
    }
    await supabaseAdmin
      .from("message_attachments")
      .delete()
      .eq("message_id", id);

    const { error } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("id", id);
    if (error) throw error;

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
};

// Upload file attachment to Supabase Storage
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { id } = req.params;

    // Verify message access
    const { data: message } = await supabaseAdmin
      .from("messages")
      .select("sender_id, receiver_id")
      .eq("id", id)
      .single();
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.sender_id !== req.user.id)
      return res.status(403).json({ error: "Access denied" });

    const file = req.file;
    const storagePath = `${id}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);

    const { data, error } = await supabaseAdmin
      .from("message_attachments")
      .insert({
        message_id: id,
        file_name: file.originalname,
        file_path: publicUrl,
        storage_path: storagePath,
        file_size: file.size,
        file_type: file.mimetype,
        uploaded_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res
      .status(201)
      .json({ message: "File uploaded successfully", attachment: data });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
};

// Get message attachments
exports.getMessageAttachments = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("message_attachments")
      .select("*")
      .eq("message_id", req.params.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
};

// Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { data: attachment } = await supabaseAdmin
      .from("message_attachments")
      .select("*")
      .eq("id", attachmentId)
      .single();
    if (!attachment)
      return res.status(404).json({ error: "Attachment not found" });

    const { data: message } = await supabaseAdmin
      .from("messages")
      .select("sender_id")
      .eq("id", attachment.message_id)
      .single();
    if (!message || message.sender_id !== req.user.id)
      return res.status(403).json({ error: "Access denied" });

    if (attachment.storage_path) {
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([attachment.storage_path]);
    }

    const { error } = await supabaseAdmin
      .from("message_attachments")
      .delete()
      .eq("id", attachmentId);
    if (error) throw error;

    res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("messages")
      .update({ is_read: true })
      .eq("id", req.params.id)
      .eq("receiver_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Message not found" });
    res.json({ ...data, message: "Message marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark message as read" });
  }
};

// Mark all messages as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", req.user.id)
      .eq("is_read", false);
    if (error) throw error;
    res.json({ message: "All messages marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", req.user.id)
      .eq("is_read", false);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

// Forward message
exports.forwardMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver_id, message: forwardNote } = req.body;
    if (!receiver_id)
      return res.status(400).json({ error: "Recipient is required" });

    const { data: orig } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();
    if (!orig) return res.status(404).json({ error: "Message not found" });

    const forwardedMessage = `${forwardNote ? forwardNote + "\n\n" : ""}---------- Forwarded Message ----------\nDate: ${new Date(orig.created_at).toLocaleString()}\nSubject: ${orig.subject}\n\n${orig.message}`;

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert({
        project_id: orig.project_id,
        sender_id: req.user.id,
        receiver_id,
        subject: `Fwd: ${orig.subject}`,
        message: forwardedMessage,
      })
      .select()
      .single();
    if (error) throw error;

    await supabaseAdmin.from("notifications").insert({
      user_id: receiver_id,
      title: "Forwarded Message",
      message: `You received a forwarded message from ${req.user.full_name}`,
      type: "message",
    });

    res
      .status(201)
      .json({ ...data, message: "Message forwarded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to forward message" });
  }
};
