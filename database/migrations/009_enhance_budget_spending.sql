-- Enhanced Budget Spending with proper references to Workers, Inventory, and Expenses
-- This migration improves data integrity for spending tracking

-- Add columns for specific foreign key references
ALTER TABLE budget_spending
ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_spending_worker ON budget_spending(worker_id);
CREATE INDEX IF NOT EXISTS idx_spending_inventory ON budget_spending(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_spending_expense ON budget_spending(expense_id);
CREATE INDEX IF NOT EXISTS idx_spending_category_date ON budget_spending(category, spending_date);

-- =========================================
-- AUTO-CALCULATE COSTS FROM VARIOUS SOURCES
-- =========================================

-- View 1: Calculate labor costs from attendance (payroll records)
CREATE OR REPLACE VIEW attendance_labor_cost AS
SELECT 
    a.project_id,
    w.id as worker_id,
    w.full_name as worker_name,
    'labor' as category,
    SUM(a.days_worked * w.rate_per_day) as amount,
    CURRENT_DATE as spending_date,
    'Auto-calculated from attendance' as description
FROM attendance a
JOIN workers w ON a.worker_id = w.id
GROUP BY a.project_id, w.id, w.full_name;

-- View 2: Calculate materials/equipment costs from inventory outflow (stock movements)
CREATE OR REPLACE VIEW inventory_usage_cost AS
SELECT 
    sm.project_id,
    ii.id as inventory_item_id,
    ii.name as inventory_name,
    'materials' as category,
    SUM(sm.quantity * COALESCE(sm.unit_price, ii.unit_price, 0)) as amount,
    CURRENT_DATE as spending_date,
    'From stock movements (outflow)' as description
FROM stock_movements sm
JOIN inventory_items ii ON sm.inventory_item_id = ii.id
WHERE sm.movement_type = 'out'
GROUP BY sm.project_id, ii.id, ii.name;

-- View 3: Get other/miscellaneous expenses
CREATE OR REPLACE VIEW expenses_cost AS
SELECT 
    e.project_id,
    e.id as expense_id,
    'other' as category,
    e.amount,
    e.expense_date as spending_date,
    e.description
FROM expenses e;

-- Create view to get spending with detailed references
CREATE OR REPLACE VIEW budget_spending_detail AS
SELECT 
    bs.id,
    bs.project_id,
    bs.category,
    bs.amount,
    bs.spending_date,
    bs.description,
    bs.recorded_by,
    bs.created_at,
    -- Worker details for labor costs
    CASE 
        WHEN bs.category = 'labor' AND bs.worker_id IS NOT NULL
        THEN w.full_name 
        ELSE NULL 
    END as worker_name,
    CASE 
        WHEN bs.category = 'labor' AND bs.worker_id IS NOT NULL
        THEN w.position 
        ELSE NULL 
    END as worker_position,
    w.id as worker_id_detail,
    -- Inventory details for materials/equipment
    CASE 
        WHEN bs.category IN ('materials', 'equipment') AND bs.inventory_item_id IS NOT NULL
        THEN ii.name 
        ELSE NULL 
    END as inventory_name,
    CASE 
        WHEN bs.category IN ('materials', 'equipment') AND bs.inventory_item_id IS NOT NULL
        THEN ii.quantity 
        ELSE NULL 
    END as inventory_quantity,
    ii.id as inventory_id_detail,
    -- Expense details for other costs
    CASE 
        WHEN bs.category = 'other' AND bs.expense_id IS NOT NULL
        THEN e.expense_type 
        ELSE NULL 
    END as expense_type,
    e.id as expense_id_detail,
    -- User who recorded the spending
    u.full_name as recorded_by_name
FROM budget_spending bs
LEFT JOIN workers w ON bs.worker_id = w.id
LEFT JOIN inventory_items ii ON bs.inventory_item_id = ii.id
LEFT JOIN expenses e ON bs.expense_id = e.id
LEFT JOIN users u ON bs.recorded_by = u.id;

-- Create function to validate spending references
CREATE OR REPLACE FUNCTION validate_spending_reference()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that spending has appropriate reference based on category
    IF NEW.category = 'labor' THEN
        IF NEW.worker_id IS NULL THEN
            RAISE EXCEPTION 'Labor spending must reference a worker';
        END IF;
    ELSIF NEW.category IN ('materials', 'equipment') THEN
        IF NEW.inventory_item_id IS NULL THEN
            RAISE EXCEPTION 'Materials and equipment spending must reference an inventory item';
        END IF;
    ELSIF NEW.category = 'other' THEN
        -- Other category can be an expense or just a description
        IF NEW.expense_id IS NULL AND NEW.description IS NULL THEN
            RAISE EXCEPTION 'Other spending must have either an expense reference or description';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate spending references
DROP TRIGGER IF EXISTS validate_spending_ref_trigger ON budget_spending;
CREATE TRIGGER validate_spending_ref_trigger
BEFORE INSERT OR UPDATE ON budget_spending
FOR EACH ROW
EXECUTE FUNCTION validate_spending_reference();

-- Update existing budget_spending records to maintain compatibility
-- For any labor spending without worker_id, try to infer from description
UPDATE budget_spending bs
SET worker_id = (
    SELECT w.id 
    FROM workers w 
    WHERE w.project_id = bs.project_id 
    AND w.full_name ILIKE '%' || bs.description || '%'
    LIMIT 1
)
WHERE bs.category = 'labor' AND bs.worker_id IS NULL AND bs.description IS NOT NULL;

-- For materials/equipment spending, try to infer inventory_item_id
UPDATE budget_spending bs
SET inventory_item_id = (
    SELECT ii.id 
    FROM inventory_items ii 
    WHERE ii.project_id = bs.project_id 
    AND ii.name ILIKE '%' || bs.description || '%'
    LIMIT 1
)
WHERE bs.category IN ('materials', 'equipment') AND bs.inventory_item_id IS NULL AND bs.description IS NOT NULL;

-- For other spending, try to link to expenses
UPDATE budget_spending bs
SET expense_id = (
    SELECT e.id 
    FROM expenses e 
    WHERE e.project_id = bs.project_id 
    AND e.expense_type ILIKE '%' || bs.description || '%'
    LIMIT 1
)
WHERE bs.category = 'other' AND bs.expense_id IS NULL AND bs.description IS NOT NULL;

-- Create view for quick spending summary by reference type
CREATE OR REPLACE VIEW spending_by_source AS
SELECT 
    bs.project_id,
    'labor' as source_type,
    w.id as source_id,
    w.full_name as source_name,
    COUNT(bs.id) as transaction_count,
    SUM(bs.amount) as total_amount
FROM budget_spending bs
JOIN workers w ON bs.worker_id = w.id
WHERE bs.category = 'labor'
GROUP BY bs.project_id, w.id, w.full_name

UNION ALL

SELECT 
    bs.project_id,
    'inventory' as source_type,
    ii.id as source_id,
    ii.name as source_name,
    COUNT(bs.id) as transaction_count,
    SUM(bs.amount) as total_amount
FROM budget_spending bs
JOIN inventory_items ii ON bs.inventory_item_id = ii.id
WHERE bs.category IN ('materials', 'equipment')
GROUP BY bs.project_id, ii.id, ii.name

UNION ALL

SELECT 
    bs.project_id,
    'expense' as source_type,
    e.id as source_id,
    e.expense_type as source_name,
    COUNT(bs.id) as transaction_count,
    SUM(bs.amount) as total_amount
FROM budget_spending bs
JOIN expenses e ON bs.expense_id = e.id
WHERE bs.category = 'other'
GROUP BY bs.project_id, e.id, e.expense_type;
