// src/types/inventory.ts
export interface InventoryItem {
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

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}