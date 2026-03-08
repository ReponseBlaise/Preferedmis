const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone, role, project_ids } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Create user profile
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        phone,
        role
      })
      .select()
      .single();

    if (userError) throw userError;

    // Assign to projects (if not manager)
    if (role !== 'manager' && project_ids && project_ids.length > 0) {
      const projectMembers = project_ids.map(project_id => ({
        project_id,
        user_id: authData.user.id
      }));

      await supabaseAdmin
        .from('project_members')
        .insert(projectMembers);
    }

    res.status(201).json({ user: userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    delete user.password;

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { full_name, phone, role, is_active, project_ids } = req.body;
    const updates = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Update project assignments (if not manager)
    if (role !== 'manager' && project_ids !== undefined) {
      // Remove existing assignments
      await supabaseAdmin
        .from('project_members')
        .delete()
        .eq('user_id', req.params.id);

      // Add new assignments
      if (project_ids.length > 0) {
        const projectMembers = project_ids.map(project_id => ({
          project_id,
          user_id: req.params.id
        }));

        await supabaseAdmin
          .from('project_members')
          .insert(projectMembers);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Delete from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(req.params.id);

    // Delete from users table
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Update password in Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      req.params.id,
      { password }
    );

    if (error) throw error;

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('project_id')
      .eq('user_id', req.params.id);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: 'Failed to fetch user projects' });
  }
};
