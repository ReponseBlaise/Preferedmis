-- Monthly Employees Payroll Migration
-- Adds support for monthly employees with fixed salary

-- Add monthly_salary column to workers table
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(12, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;

-- Update payment_type constraint to include monthly explicitly
ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_payment_type_check;
ALTER TABLE workers ADD CONSTRAINT workers_payment_type_check 
CHECK (payment_type IN ('daily', 'monthly'));

-- Create index for active monthly employees
CREATE INDEX IF NOT EXISTS idx_workers_monthly_active 
ON workers(payment_type, is_active) 
WHERE payment_type = 'monthly' AND is_active = true;

-- Add comment
COMMENT ON COLUMN workers.monthly_salary IS 'Fixed monthly salary for monthly employees';
COMMENT ON COLUMN workers.start_date IS 'Employment start date';
COMMENT ON COLUMN workers.end_date IS 'Employment end date (NULL if still employed)';
