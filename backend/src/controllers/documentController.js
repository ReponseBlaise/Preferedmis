const { supabaseAdmin } = require("../config/supabase");

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const { title, description, visibility, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!title) {
      return res.status(400).json({ error: "Document title is required" });
    }

    // Store file in Supabase storage
    const fileName = `${Date.now()}_${file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Create document record in database
    const { data: document, error: dbError } = await supabaseAdmin
      .from("documents")
      .insert({
        title,
        description: description || null,
        file_path: fileName,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        visibility: visibility || "private",
        category: category || "general",
        uploaded_by: req.user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json(document);
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
};

// Get documents
exports.getDocuments = async (req, res) => {
  try {
    const { category, visibility, search } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let query = supabaseAdmin
      .from("documents")
      .select("*")
      .eq("uploaded_by", userId);

    if (category) query = query.eq("category", category);
    if (visibility) query = query.eq("visibility", visibility);
    if (search) query = query.ilike("title", `%${search}%`);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Supabase documents query error:", error);
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error("Get documents error:", error.message, error);
    res.status(500).json({ error: error.message || "Failed to fetch documents" });
  }
};

// Get shared documents
exports.getSharedDocuments = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("document_shares")
      .select("documents(*)")
      .eq("shared_with_user_id", req.user.id)
      .eq("documents.visibility", "shared")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const documents = data.map((share) => share.documents);
    res.json(documents || []);
  } catch (error) {
    console.error("Get shared documents error:", error);
    res.status(500).json({ error: "Failed to fetch shared documents" });
  }
};

// Get single document
exports.getDocument = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (docError || !document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Download from storage
    const { data, error: downloadError } = await supabaseAdmin.storage
      .from("documents")
      .download(document.file_path);

    if (downloadError) throw downloadError;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.file_name}"`,
    );
    res.setHeader("Content-Type", document.file_type);
    res.send(data);
  } catch (error) {
    console.error("Download document error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
};

// Share document
exports.shareDocument = async (req, res) => {
  try {
    const { shared_with_user_ids } = req.body;
    const documentId = req.params.id;

    if (
      !Array.isArray(shared_with_user_ids) ||
      shared_with_user_ids.length === 0
    ) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    // Update document visibility
    const { error: updateError } = await supabaseAdmin
      .from("documents")
      .update({ visibility: "shared" })
      .eq("id", documentId);

    if (updateError) throw updateError;

    // Create share records
    const shares = shared_with_user_ids.map((userId) => ({
      document_id: documentId,
      shared_with_user_id: userId,
      shared_by_user_id: req.user.id,
    }));

    const { data, error } = await supabaseAdmin
      .from("document_shares")
      .insert(shares)
      .select();

    if (error) throw error;

    res.json({
      message: "Document shared successfully",
      shares: data,
    });
  } catch (error) {
    console.error("Share document error:", error);
    res.status(500).json({ error: "Failed to share document" });
  }
};

// Unshare document
exports.unshareDocument = async (req, res) => {
  try {
    const { shared_with_user_ids } = req.body;
    const documentId = req.params.id;

    if (
      !Array.isArray(shared_with_user_ids) ||
      shared_with_user_ids.length === 0
    ) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    // Delete share records
    const { error } = await supabaseAdmin
      .from("document_shares")
      .delete()
      .eq("document_id", documentId)
      .in("shared_with_user_id", shared_with_user_ids);

    if (error) throw error;

    res.json({ message: "Document unshared successfully" });
  } catch (error) {
    console.error("Unshare document error:", error);
    res.status(500).json({ error: "Failed to unshare document" });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("file_path")
      .eq("id", req.params.id)
      .single();

    if (docError || !document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete from storage
    await supabaseAdmin.storage.from("documents").remove([document.file_path]);

    // Delete database record
    const { error: deleteError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", req.params.id);

    if (deleteError) throw deleteError;

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};
