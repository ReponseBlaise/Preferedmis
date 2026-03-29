const jwt = require("jsonwebtoken");
const { supabaseAdmin } = require("../config/supabase");

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone, role, project_ids } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res
        .status(400)
        .json({ error: "Email, password, full name and role are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    if (!["manager", "employee", "storeman"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be manager, employee, or storeman",
      });
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // For public registration (register-admin endpoint), only allow if no users exist yet
    // This prevents unauthorized user creation after initial setup
    if (req.path === "/auth/register-admin") {
      const { data: allUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .limit(1);

      if (allUsers && allUsers.length > 0) {
        return res.status(403).json({
          error: "Registration is now closed. Contact an administrator.",
        });
      }

      // Public registration only allows manager role for safety
      if (role !== "manager") {
        return res.status(400).json({ error: "First user must be a manager" });
      }
    }

    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw authError;

    // Create user profile
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        full_name,
        phone,
        role,
      })
      .select()
      .single();

    if (userError) throw userError;

    // Assign to projects (if not manager)
    if (role !== "manager" && project_ids && project_ids.length > 0) {
      const projectMembers = project_ids.map((project_id) => ({
        project_id,
        user_id: authData.user.id,
      }));

      await supabaseAdmin.from("project_members").insert(projectMembers);
    }

    // Send welcome email (non-blocking)
    const emailService = require("../services/emailService");
    emailService.sendWelcomeEmail(email, full_name).catch((err) => {
      console.error("Welcome email failed (non-blocking):", err.message);
    });

    res.status(201).json({ user: userData });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("[LOGIN] Attempting login for email:", email);

    if (!email || !password) {
      console.error("[LOGIN] Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user from database — only safe fields
    console.log("[LOGIN] Querying user from database...");
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, phone, role, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (userError) {
      console.error("[LOGIN] Database error:", userError.message);
    }
    if (!user) {
      console.error("[LOGIN] User not found or inactive for email:", email);
    }

    if (userError || !user) {
      console.error("[LOGIN] User not found, returning 401");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password with Supabase Auth
    console.log("[LOGIN] Verifying password with Supabase...");
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[LOGIN] Password verification failed:", error.message);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("[LOGIN] Password verified, generating JWT...");
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    console.log("[LOGIN] Login successful for user:", user.email);
    res.json({ token, user });
  } catch (error) {
    console.error("[LOGIN] Unexpected error:", error.message);
    console.error("[LOGIN] Error details:", error);
    res.status(500).json({ error: "Login failed: " + error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, phone, role")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, phone, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { full_name, phone, role, is_active, project_ids, password } =
      req.body;
    const updates = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Update project assignments (if not manager)
    if (role !== "manager" && project_ids !== undefined) {
      // Remove existing assignments
      await supabaseAdmin
        .from("project_members")
        .delete()
        .eq("user_id", req.params.id);

      // Add new assignments
      if (project_ids.length > 0) {
        const projectMembers = project_ids.map((project_id) => ({
          project_id,
          user_id: req.params.id,
        }));

        await supabaseAdmin.from("project_members").insert(projectMembers);
      }
    }

    // Update password in Supabase Auth if provided
    if (password !== undefined) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
        req.params.id,
        { password },
      );
      if (pwError) throw pwError;
    }

    res.json(data);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user has any dependencies
    const tablesToCheck = [
      { table: "messages", column: "sender_id" },
      { table: "messages", column: "receiver_id" },
      { table: "project_members", column: "user_id" },
      { table: "attendance", column: "recorded_by" },
      { table: "inventory_items", column: "created_by" },
      { table: "expenses", column: "created_by" },
      { table: "documents", column: "owner_id" },
      { table: "document_shares", column: "shared_by" },
      { table: "document_shares", column: "shared_with" },
      { table: "public_updates", column: "author_id" },
    ];

    const dependencies = [];

    // Check for dependencies
    for (const { table, column } of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("id")
          .eq(column, userId)
          .limit(1);

        if (!error && data && data.length > 0) {
          dependencies.push(table);
        }
      } catch (err) {
        // Table might not exist or column might not exist, continue
      }
    }

    if (dependencies.length > 0) {
      // Instead of hard delete, deactivate the user
      // This is safer and maintains data integrity
      const { error: deactiveError } = await supabaseAdmin
        .from("users")
        .update({
          is_active: false,
          full_name: `[DELETED] ${userId.substring(0, 8)}`,
          phone: null,
        })
        .eq("id", userId);

      if (deactiveError) throw deactiveError;

      // Try to delete from Supabase Auth (might fail if user doesn't exist)
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (authErr) {
        console.log("Auth user deletion skipped or failed:", authErr.message);
      }

      return res.json({
        message:
          "User deactivated instead of deleted (user has data dependencies)",
        deactivated: true,
        dependencies: dependencies,
        note: "User data is preserved to maintain integrity of related records (messages, attendance, etc.)",
      });
    }

    // No dependencies, proceed with hard delete
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (authErr) {
      console.log("Auth user deletion skipped:", authErr.message);
    }

    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) throw error;

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      error: "Failed to delete user",
      details: error.message,
      code: error.code,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Update password in Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      req.params.id,
      { password },
    );

    if (error) throw error;

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_members")
      .select("project_id")
      .eq("user_id", req.params.id);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Get user projects error:", error);
    res.status(500).json({ error: "Failed to fetch user projects" });
  }
};
