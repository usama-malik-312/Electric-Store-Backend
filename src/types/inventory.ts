// src/types/inventory.ts
export interface InventoryItem {
    id?: number;
    name: string;
    description?: string;
    sku: string;
    barcode?: string;
    category?: string;
    brand?: string;
    stock: number;
    price: number;
    cost_price?: number;
    min_stock_level?: number;
    store_id: number;
    supplier_id?: number;
}
// src/types/inventory.ts
export interface InventoryItem {
    id?: number;
    name: string;
    // ... (keep your existing fields)
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}