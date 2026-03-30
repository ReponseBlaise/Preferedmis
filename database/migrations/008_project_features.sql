-- Project Progress Tracking, Worker Scheduling, and Project Budgeting
-- Three features in one migration

-- 1. PROJECT MILESTONES TABLE
-- Tracks project milestones and progress
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed', 'on_hold')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);

-- 2. WORKER SCHEDULES TABLE
-- Tracks when workers are scheduled to work on projects
CREATE TABLE worker_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    hours_assigned DECIMAL(5, 2) DEFAULT 8.0,
    assigned_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, schedule_date)
);

CREATE INDEX idx_schedules_worker ON worker_schedules(worker_id);
CREATE INDEX idx_schedules_project ON worker_schedules(project_id);
CREATE INDEX idx_schedules_date ON worker_schedules(schedule_date);

-- 3. PROJECT BUDGETS TABLE
-- Tracks project budgets and spending
CREATE TABLE project_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    total_budget DECIMAL(15, 2) NOT NULL,
    labor_budget DECIMAL(15, 2) NOT NULL,
    materials_budget DECIMAL(15, 2) NOT NULL,
    equipment_budget DECIMAL(15, 2) NOT NULL,
    contingency_budget DECIMAL(15, 2) DEFAULT 0,
    budget_status VARCHAR(50) DEFAULT 'active' CHECK (budget_status IN ('draft', 'active', 'closed', 'over_budget')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_project ON project_budgets(project_id);

-- 4. BUDGET TRACKING TABLE
-- Tracks spending against budget categories
CREATE TABLE budget_spending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('labor', 'materials', 'equipment', 'other')),
    description VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    spending_date DATE NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spending_project ON budget_spending(project_id);
CREATE INDEX idx_spending_category ON budget_spending(category);
CREATE INDEX idx_spending_date ON budget_spending(spending_date);

-- FUNCTIONS & TRIGGERS

-- Function to calculate project progress from milestones
CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id UUID)
RETURNS INT AS $$
DECLARE
    avg_completion INT;
BEGIN
    SELECT COALESCE(ROUND(AVG(completion_percentage)), 0)
    INTO avg_completion
    FROM project_milestones
    WHERE project_id = p_project_id;
    
    RETURN avg_completion;
END;
$$ LANGUAGE plpgsql;

-- Function to check budget status
CREATE OR REPLACE FUNCTION check_budget_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When budget spending is updated, check if over budget
    IF (SELECT (SELECT COALESCE(SUM(amount), 0) FROM budget_spending WHERE project_id = NEW.project_id) > 
        (SELECT total_budget FROM project_budgets WHERE project_id = NEW.project_id))
    THEN
        UPDATE project_budgets 
        SET budget_status = 'over_budget'
        WHERE project_id = NEW.project_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_status_trigger
AFTER INSERT OR UPDATE ON budget_spending
FOR EACH ROW
EXECUTE FUNCTION check_budget_status();

-- Function to check worker scheduling conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if worker already has schedule on this date
    IF (SELECT COUNT(*) FROM worker_schedules 
        WHERE worker_id = NEW.worker_id 
        AND schedule_date = NEW.schedule_date 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) > 0
    THEN
        RAISE NOTICE 'Worker already scheduled for this date';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_conflict_trigger
BEFORE INSERT OR UPDATE ON worker_schedules
FOR EACH ROW
EXECUTE FUNCTION check_schedule_conflicts();

-- Add progress field to projects (for easy access)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percentage INT DEFAULT 0;

-- Create view for easy project budget summary
CREATE OR REPLACE VIEW project_budget_summary AS
SELECT 
    pb.project_id,
    pb.total_budget,
    pb.labor_budget,
    pb.materials_budget,
    pb.equipment_budget,
    pb.contingency_budget,
    COALESCE(manual_spent, 0) + COALESCE(payroll_spent, 0) as total_spent,
    COALESCE(payroll_spent, 0) as labor_spent,
    COALESCE(SUM(CASE WHEN bs.category = 'materials' THEN bs.amount ELSE 0 END), 0) as materials_spent,
    COALESCE(SUM(CASE WHEN bs.category = 'equipment' THEN bs.amount ELSE 0 END), 0) as equipment_spent,
    COALESCE(SUM(CASE WHEN bs.category = 'other' THEN bs.amount ELSE 0 END), 0) as other_spent,
    (pb.total_budget - (COALESCE(manual_spent, 0) + COALESCE(payroll_spent, 0))) as remaining_budget,
    ROUND(100 * (COALESCE(manual_spent, 0) + COALESCE(payroll_spent, 0)) / NULLIF(pb.total_budget, 0), 2) as budget_utilization_percent,
    pb.budget_status
FROM project_budgets pb
LEFT JOIN (
    SELECT 
        project_id,
        SUM(amount) as manual_spent
    FROM budget_spending
    GROUP BY project_id
) manual ON pb.project_id = manual.project_id
LEFT JOIN (
    SELECT 
        project_id,
        SUM(amount) as payroll_spent
    FROM attendance_labor_cost
    GROUP BY project_id
) payroll ON pb.project_id = payroll.project_id
LEFT JOIN budget_spending bs ON pb.project_id = bs.project_id
GROUP BY pb.id, pb.project_id, pb.total_budget, pb.labor_budget, pb.materials_budget, 
         pb.equipment_budget, pb.contingency_budget, pb.budget_status, manual_spent, payroll_spent;

-- Create view for worker schedule summary
CREATE OR REPLACE VIEW worker_schedule_summary AS
SELECT 
    ws.worker_id,
    ws.project_id,
    w.full_name,
    COUNT(*) as days_scheduled,
    SUM(ws.hours_assigned) as total_hours_assigned,
    MIN(ws.schedule_date) as first_scheduled_date,
    MAX(ws.schedule_date) as last_scheduled_date
FROM worker_schedules ws
JOIN workers w ON ws.worker_id = w.id
GROUP BY ws.worker_id, ws.project_id, w.full_name;

-- Create view for project milestone summary
CREATE OR REPLACE VIEW project_milestone_summary AS
SELECT 
    project_id,
    COUNT(*) as total_milestones,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_milestones,
    COALESCE(SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END), 0) as delayed_milestones,
    ROUND(AVG(completion_percentage), 2) as avg_completion_percentage,
    MAX(due_date) as final_milestone_date
FROM project_milestones
GROUP BY project_id;
