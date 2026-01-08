-- Migration: Add invoice_number column to existing sales table
-- This migration handles the case where sales table exists but invoice_number column is missing

-- Check if column exists, if not add it
DO $$ 
BEGIN
    -- Add invoice_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'invoice_number'
    ) THEN
        -- Add column as nullable first
        ALTER TABLE sales ADD COLUMN invoice_number VARCHAR(50);
        
        -- Generate unique invoice numbers for existing records
        UPDATE sales 
        SET invoice_number = 'INV-' || TO_CHAR(COALESCE(created_at, NOW()), 'YYYYMMDD') || '-' || LPAD(id::text, 3, '0')
        WHERE invoice_number IS NULL;
        
        -- Handle any potential duplicates by appending a suffix
        UPDATE sales s1
        SET invoice_number = invoice_number || '-' || s1.id
        WHERE EXISTS (
            SELECT 1 FROM sales s2 
            WHERE s2.invoice_number = s1.invoice_number 
            AND s2.id < s1.id
        );
        
        -- Make it NOT NULL after populating
        ALTER TABLE sales ALTER COLUMN invoice_number SET NOT NULL;
        
        -- Drop constraint if it exists, then add it
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'sales_invoice_number_unique'
        ) THEN
            ALTER TABLE sales DROP CONSTRAINT sales_invoice_number_unique;
        END IF;
        
        -- Add unique constraint
        ALTER TABLE sales ADD CONSTRAINT sales_invoice_number_unique UNIQUE (invoice_number);
        
        -- Create index if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number);
    END IF;
END $$;

