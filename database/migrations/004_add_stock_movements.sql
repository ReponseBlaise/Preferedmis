-- Add Stock Movements Table for tracking stock in/out

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out')),
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    reference_number VARCHAR(100),
    notes TEXT,
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add remaining_stock column to inventory_items (computed from movements)
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS remaining_stock DECIMAL(10, 2) DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_project ON stock_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);

-- Function to calculate remaining stock
CREATE OR REPLACE FUNCTION calculate_remaining_stock(item_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    stock_in DECIMAL(10, 2);
    stock_out DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(quantity), 0) INTO stock_in
    FROM stock_movements
    WHERE inventory_item_id = item_id AND movement_type = 'in';
    
    SELECT COALESCE(SUM(quantity), 0) INTO stock_out
    FROM stock_movements
    WHERE inventory_item_id = item_id AND movement_type = 'out';
    
    RETURN stock_in - stock_out;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update remaining_stock after stock movement
CREATE OR REPLACE FUNCTION update_remaining_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET remaining_stock = calculate_remaining_stock(NEW.inventory_item_id)
    WHERE id = NEW.inventory_item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_remaining_stock ON stock_movements;
CREATE TRIGGER trigger_update_remaining_stock
AFTER INSERT OR UPDATE OR DELETE ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_remaining_stock();
