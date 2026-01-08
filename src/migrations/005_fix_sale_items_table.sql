-- Migration: Fix sale_items table to have correct column names
-- This migration ensures sale_items has item_id column (or maps inventory_id to item_id)

DO $$ 
BEGIN
    -- Check if item_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'item_id'
    ) THEN
        -- Check if inventory_id exists instead
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sale_items' AND column_name = 'inventory_id'
        ) THEN
            -- Rename inventory_id to item_id
            ALTER TABLE sale_items RENAME COLUMN inventory_id TO item_id;
        ELSE
            -- Add item_id column if neither exists
            ALTER TABLE sale_items ADD COLUMN item_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT;
            
            -- If there are existing records, you might need to handle them
            -- For now, we'll just add the column and let the application handle it
        END IF;
    END IF;
    
    -- Ensure all required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN quantity INTEGER NOT NULL CHECK (quantity > 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN unit_price DECIMAL(10, 2) NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'discount'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'tax'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN tax DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'total_price'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN total_price DECIMAL(10, 2) NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sale_items ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id);
    
END $$;

