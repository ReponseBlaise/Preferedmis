-- Add Salary History Table to track worker rate changes
-- This ensures payroll calculations use historical rates, not current ones

CREATE TABLE worker_salary_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rate_per_day DECIMAL(10, 2),
    monthly_salary DECIMAL(12, 2),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('daily', 'monthly')),
    effective_date DATE NOT NULL,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_salary_history_worker_date 
ON worker_salary_history(worker_id, effective_date);

-- Create index for effective date range queries
CREATE INDEX idx_salary_history_effective_range 
ON worker_salary_history(effective_date, end_date);

-- Add trigger to automatically create history entries when worker rates change
CREATE OR REPLACE FUNCTION record_worker_salary_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if rates actually changed
  IF (OLD.rate_per_day IS DISTINCT FROM NEW.rate_per_day) OR 
     (OLD.monthly_salary IS DISTINCT FROM NEW.monthly_salary) OR
     (OLD.payment_type IS DISTINCT FROM NEW.payment_type) THEN
    
    -- End the previous salary record
    UPDATE worker_salary_history
    SET end_date = CURRENT_DATE - interval '1 day'
    WHERE worker_id = NEW.id 
    AND end_date IS NULL;
    
    -- Create new salary history record
    INSERT INTO worker_salary_history (
      worker_id,
      project_id,
      rate_per_day,
      monthly_salary,
      payment_type,
      effective_date,
      created_by
    ) VALUES (
      NEW.id,
      NEW.project_id,
      NEW.rate_per_day,
      NEW.monthly_salary,
      NEW.payment_type,
      CURRENT_DATE,
      NEW.id -- You might want to track who made the change
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS worker_salary_history_trigger ON workers;
CREATE TRIGGER worker_salary_history_trigger
AFTER UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION record_worker_salary_change();

-- Populate history with current worker data for existing workers
-- This creates a starting point for all existing workers
INSERT INTO worker_salary_history (
  worker_id,
  project_id,
  rate_per_day,
  monthly_salary,
  payment_type,
  effective_date,
  created_at
)
SELECT 
  id,
  project_id,
  rate_per_day,
  monthly_salary,
  payment_type,
  created_at::date,
  created_at
FROM workers
WHERE id NOT IN (
  SELECT DISTINCT worker_id FROM worker_salary_history
)
ON CONFLICT DO NOTHING;
