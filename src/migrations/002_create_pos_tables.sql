-- Migration: Create POS (Point of Sale) tables
-- Run this migration to set up the sales and sale_items tables

-- 1. Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., "SALE-2024-001"
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Cashier/salesperson
    
    -- Financial fields
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Payment information
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash', -- cash, card, credit, mixed
    payment_status VARCHAR(50) NOT NULL DEFAULT 'paid', -- paid, partial, pending
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Additional fields
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- completed, cancelled, refunded
    
    -- Audit fields
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 2. Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    
    -- Item details at time of sale (for historical accuracy)
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    unit VARCHAR(50),
    
    -- Pricing
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Calculated fields
    subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL, -- subtotal + tax - discount
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_inventory_id ON sale_items(inventory_id);

-- Create function to generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
DECLARE
    new_number VARCHAR(50);
    year_part VARCHAR(4);
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM sales
    WHERE sale_number LIKE 'SALE-' || year_part || '-%';
    
    new_number := 'SALE-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
    NEW.sale_number := new_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate sale number
CREATE TRIGGER trigger_generate_sale_number
    BEFORE INSERT ON sales
    FOR EACH ROW
    WHEN (NEW.sale_number IS NULL OR NEW.sale_number = '')
    EXECUTE FUNCTION generate_sale_number();

-- Create trigger to update updated_at
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE sales IS 'Stores sales/transactions from POS system';
COMMENT ON TABLE sale_items IS 'Stores line items for each sale';
COMMENT ON COLUMN sales.sale_number IS 'Unique sale identifier (auto-generated)';
COMMENT ON COLUMN sales.payment_method IS 'Payment method: cash, card, credit, mixed';
COMMENT ON COLUMN sales.payment_status IS 'Payment status: paid, partial, pending';

