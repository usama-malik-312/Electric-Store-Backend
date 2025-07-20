export interface Store {
    id?: number;
    name: string;
    location: string;
    contact_phone?: string;
    opening_hours?: string;
    is_active?: boolean;
}

export interface Customer {
    id?: number;
    name: string;
    email?: string;
    phone: string;
    address?: string;
    tax_id?: string;
    credit_limit?: number;
}

export interface Brand {
    id?: number;
    name: string;
    description?: string;
    website?: string;
    logo_url?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}