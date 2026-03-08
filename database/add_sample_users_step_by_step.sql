-- ============================================
-- STEP-BY-STEP: Add Sample Test Users
-- ============================================

-- STEP 1: Create users in Supabase Authentication first
-- Go to: Supabase Dashboard > Authentication > Users > Add User

-- Create these 3 users (check "Auto Confirm User"):
-- 1. admin@preferred.rw / Admin@123
-- 2. employee@preferred.rw / Employee@123  
-- 3. storeman@preferred.rw / Storeman@123

-- STEP 2: After creating each user, COPY their User ID (UUID)
-- It looks like: a1b2c3d4-e5f6-7890-abcd-ef1234567890

-- STEP 3: Run the queries below ONE BY ONE
-- Replace YOUR_ACTUAL_UUID_HERE with the real UUID you copied

-- ============================================
-- INSERT MANAGER USER
-- ============================================
-- Replace YOUR_MANAGER_UUID_HERE with actual UUID from Supabase
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  'YOUR_MANAGER_UUID_HERE',
  'admin@preferred.rw',
  'John Doe',
  '+250788000000',
  'manager',
  true
);

-- ============================================
-- INSERT EMPLOYEE USER
-- ============================================
-- Replace YOUR_EMPLOYEE_UUID_HERE with actual UUID from Supabase
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  'YOUR_EMPLOYEE_UUID_HERE',
  'employee@preferred.rw',
  'Jane Smith',
  '+250788000001',
  'employee',
  true
);

-- ============================================
-- INSERT STOREMAN USER
-- ============================================
-- Replace YOUR_STOREMAN_UUID_HERE with actual UUID from Supabase
INSERT INTO users (id, email, full_name, phone, role, is_active)
VALUES (
  'YOUR_STOREMAN_UUID_HERE',
  'storeman@preferred.rw',
  'Bob Johnson',
  '+250788000002',
  'storeman',
  true
);

-- ============================================
-- VERIFY USERS WERE CREATED
-- ============================================
SELECT id, email, full_name, role FROM users ORDER BY role;

-- ============================================
-- CREATE SAMPLE PROJECT
-- ============================================
-- Replace YOUR_MANAGER_UUID_HERE with the manager's UUID
INSERT INTO projects (name, description, start_date, end_date, status, created_by)
VALUES (
  'Building Construction Project',
  'Construction of 5-story commercial building',
  '2024-01-01',
  '2024-12-31',
  'active',
  'YOUR_MANAGER_UUID_HERE'
);

-- ============================================
-- CREATE SAMPLE WORKERS
-- ============================================
-- These will automatically use the project created above

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
-- VERIFY ALL DATA
-- ============================================

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
-- TEST CREDENTIALS
-- ============================================
/*
Manager:
  Email: admin@preferred.rw
  Password: Admin@123
  
Employee:
  Email: employee@preferred.rw
  Password: Employee@123
  
Storeman:
  Email: storeman@preferred.rw
  Password: Storeman@123
*/
