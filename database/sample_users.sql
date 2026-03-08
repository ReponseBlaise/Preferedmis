-- Sample Test Users for Preferred Contractors Management System
-- Run this AFTER creating users in Supabase Authentication

-- INSTRUCTIONS:
-- 1. First create these users in Supabase Dashboard > Authentication > Users
-- 2. Copy each User ID after creation
-- 3. Replace the UUIDs below with actual User IDs from Supabase
-- 4. Run this script in Supabase SQL Editor

-- ============================================
-- MANAGER USER
-- ============================================
-- Supabase Auth: admin@preferred.rw / Admin@123
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  '8e5c6ad4-5558-459d-bc5a-ade06c15c1c4',
  'admin@preferred.rw',
  'John Doe',
  '+250788000000',
  'manager',
  true
);

-- ============================================
-- EMPLOYEE USER
-- ============================================
-- Supabase Auth: employee@preferred.rw / Employee@123
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  'REPLACE_WITH_EMPLOYEE_USER_ID',
  'employee@preferred.rw',
  'Jane Smith',
  '+250788000001',
  'employee',
  true
);

-- ============================================
-- STOREMAN USER
-- ============================================
-- Supabase Auth: storeman@preferred.rw / Storeman@123
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  'REPLACE_WITH_STOREMAN_USER_ID',
  'storeman@preferred.rw',
  'Bob Johnson',
  '+250788000002',
  'storeman',
  true
);

-- ============================================
-- SAMPLE PROJECT
-- ============================================
INSERT INTO projects (name, description, start_date, end_date, status, created_by)
VALUES (
  'Building Construction Project',
  'Construction of 5-story commercial building',
  '2024-01-01',
  '2024-12-31',
  'active',
  'REPLACE_WITH_MANAGER_USER_ID'
);

-- ============================================
-- SAMPLE WORKERS
-- ============================================
-- Get project_id from the project created above
INSERT INTO workers (project_id, full_name, phone, position, rate_per_day, payment_type, is_active)
SELECT 
  id,
  'Peter Mugisha',
  '+250788111111',
  'Mason',
  5000,
  'daily',
  true
FROM projects WHERE name = 'Building Construction Project';

INSERT INTO workers (project_id, full_name, phone, position, rate_per_day, payment_type, is_active)
SELECT 
  id,
  'Alice Uwase',
  '+250788222222',
  'Carpenter',
  6000,
  'daily',
  true
FROM projects WHERE name = 'Building Construction Project';

INSERT INTO workers (project_id, full_name, phone, position, rate_per_day, payment_type, is_active)
SELECT 
  id,
  'David Nkusi',
  '+250788333333',
  'Electrician',
  7000,
  'daily',
  true
FROM projects WHERE name = 'Building Construction Project';

INSERT INTO workers (project_id, full_name, phone, position, rate_per_day, payment_type, is_active)
SELECT 
  id,
  'Sarah Mutesi',
  '+250788444444',
  'Plumber',
  6500,
  'daily',
  true
FROM projects WHERE name = 'Building Construction Project';

INSERT INTO workers (project_id, full_name, phone, position, rate_per_day, payment_type, is_active)
SELECT 
  id,
  'Emmanuel Habimana',
  '+250788555555',
  'Site Supervisor',
  150000,
  'monthly',
  true
FROM projects WHERE name = 'Building Construction Project';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify data was inserted correctly

-- Check users
SELECT id, email, full_name, role FROM users ORDER BY role;

-- Check projects
SELECT id, name, status, created_at FROM projects;

-- Check workers
SELECT w.full_name, w.position, w.rate_per_day, w.payment_type, p.name as project_name
FROM workers w
JOIN projects p ON w.project_id = p.id
ORDER BY w.full_name;

-- ============================================
-- QUICK REFERENCE
-- ============================================
/*
TEST CREDENTIALS:

Manager:
  Email: admin@preferred.rw
  Password: Admin@123
  Access: Full system access, dashboard, reports

Employee:
  Email: employee@preferred.rw
  Password: Employee@123
  Access: Workers, attendance management

Storeman:
  Email: storeman@preferred.rw
  Password: Storeman@123
  Access: Inventory, expenses management
*/
