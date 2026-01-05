export interface Store {
    id?: number;
    name: string;
    location: string;
    contact_phone?: string;
    is_active?: boolean;
    opening_hours?: string;
    store_code?: string;
    description?: string;
    contact_number?: string;
    status?: string;
    created_by?: number;
    updated_by?: number;
    deleted_at?: string;
    notes?: string;
}

export interface Customer {
    id?: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    credit_limit?: number;
    current_balance?: number;
    customer_code?: string;
    status?: string;
    created_by?: number;
    updated_by?: number;
    deleted_at?: string;
    notes?: string;
}

export interface Brand {
    id?: number;
    name: string;
    description?: string;
    website?: string;
    logo_url?: string;
    brand_code?: string;
    created_by?: number;
    updated_by?: number;
    deleted_at?: string;
    image?: string;
    notes?: string;
}

export interface Inventory {
    id?: number;
    sku?: string;
    stock?: number;
    price?: number;
    store_id?: number;
    description?: string;
    barcode?: string;
    category?: string;
    brand?: string;
    cost_price?: number;
    min_stock_level?: number;
    updated_at?: string;
    supplier_id?: number;
    item_name: string;
    item_code?: string;
    selling_price?: number;
    brand_id?: number;
    item_group_id?: number;
    unit?: string;
    tax_percentage?: number;
    discount?: number;
    image?: string;
    status?: string;
    created_by?: number;
    updated_by?: number;
    deleted_at?: string;
    notes?: string;
}

export interface ItemGroup {
    id?: number;
    group_name: string;
    group_code?: string;
    description?: string;
    status?: string;
    created_by?: number;
    updated_by?: number;
    deleted_at?: string;
    notes?: string;
}

export interface Supplier {
    id?: number;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    location?: string;
    supplier_code?: string;
    tax_id?: string;
    status?: string;
    created_by?: number;
    updated_by?: number;
    deleted_at?: string;
    notes?: string;
}

export interface User {
    id?: number;
    email: string;
    password: string;
    role?: string;
    full_name?: string;
    phone?: string;
    store_id?: number;
    is_verified?: boolean;
    verification_token?: string;
    password_reset_token?: string;
    first_name?: string;
    last_name?: string;
    address?: string;
    profile_image?: string;
    status?: string;
    last_login?: string;
    created_by?: number;
    updated_by?: number;
    deleted_at?: string;
    notes?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// POS (Point of Sale) Types
export interface SaleItem {
    id?: number;
    sale_id?: number;
    inventory_id: number;
    item_name?: string;
    item_code?: string;
    unit?: string;
    unit_price: number;
    quantity: number;
    tax_percentage?: number;
    discount_percentage?: number;
    subtotal?: number;
    tax_amount?: number;
    discount_amount?: number;
    total?: number;
    created_at?: string;
}

export interface Sale {
    id?: number;
    sale_number?: string;
    sale_date?: string;
    store_id: number;
    customer_id?: number;
    user_id?: number;
    subtotal: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount: number;
    payment_method?: 'cash' | 'card' | 'credit' | 'mixed';
    payment_status?: 'paid' | 'partial' | 'pending';
    amount_paid: number;
    amount_due?: number;
    notes?: string;
    status?: 'completed' | 'cancelled' | 'refunded';
    created_by?: number;
    updated_by?: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    // Related data (populated by joins)
    items?: SaleItem[];
    customer?: Customer;
    store?: Store;
    user?: User;
}

export interface CreateSaleRequest {
    store_id: number;
    customer_id?: number;
    items: Array<{
        inventory_id: number;
        quantity: number;
        unit_price?: number; // Optional, will use inventory price if not provided
        tax_percentage?: number;
        discount_percentage?: number;
    }>;
    payment_method?: 'cash' | 'card' | 'credit' | 'mixed';
    payment_status?: 'paid' | 'partial' | 'pending';
    amount_paid: number;
    discount_amount?: number;
    notes?: string;
}