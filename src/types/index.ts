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

export interface SaleItem {
    id?: number;
    sale_id?: number;
    item_id: number;
    item_name?: string;
    item_code?: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax?: number;
    total_price: number;
}

export interface Sale {
    id?: number;
    invoice_number?: string;
    customer_id?: number;
    customer_name?: string;
    store_id: number;
    store_name?: string;
    total_amount: number;
    discount?: number;
    tax?: number;
    final_amount: number;
    payment_method?: string;
    payment_status?: string;
    status?: string;
    notes?: string;
    created_by?: number;
    user_id?: number;  // Support both user_id and created_by
    created_at?: string;
    items?: SaleItem[];
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}