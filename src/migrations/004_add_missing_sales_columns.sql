-- Migration: Add missing columns to sales table
-- This migration adds all columns that might be missing from the sales table

DO $$ 
BEGIN
    -- Add discount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'discount'
    ) THEN
        ALTER TABLE sales ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add tax column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'tax'
    ) THEN
        ALTER TABLE sales ADD COLUMN tax DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add final_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'final_amount'
    ) THEN
        ALTER TABLE sales ADD COLUMN final_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE sales ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
    END IF;
    
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE sales ADD COLUMN payment_status VARCHAR(50) DEFAULT 'paid';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'status'
    ) THEN
        ALTER TABLE sales ADD COLUMN status VARCHAR(50) DEFAULT 'completed';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'notes'
    ) THEN
        ALTER TABLE sales ADD COLUMN notes TEXT;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE sales ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN deleted_at TIMESTAMP NULL;
    END IF;
    
    -- Add total_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE sales ADD COLUMN total_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
    
    -- Add store_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Update existing records to set default values for new columns
    UPDATE sales 
    SET discount = COALESCE(discount, 0),
        tax = COALESCE(tax, 0),
        final_amount = COALESCE(final_amount, COALESCE(total_amount, 0)),
        payment_method = COALESCE(payment_method, 'cash'),
        payment_status = COALESCE(payment_status, 'paid'),
        status = COALESCE(status, 'completed')
    WHERE discount IS NULL 
       OR tax IS NULL 
       OR final_amount IS NULL 
       OR payment_method IS NULL 
       OR payment_status IS NULL 
       OR status IS NULL;
    
    -- Make final_amount NOT NULL if it's not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'final_amount' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE sales ALTER COLUMN final_amount SET DEFAULT 0;
        UPDATE sales SET final_amount = COALESCE(final_amount, 0) WHERE final_amount IS NULL;
        ALTER TABLE sales ALTER COLUMN final_amount SET NOT NULL;
    END IF;
    
    -- Make total_amount NOT NULL if it's not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'total_amount' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE sales ALTER COLUMN total_amount SET DEFAULT 0;
        UPDATE sales SET total_amount = COALESCE(total_amount, 0) WHERE total_amount IS NULL;
        ALTER TABLE sales ALTER COLUMN total_amount SET NOT NULL;
    END IF;
    
END $$;

