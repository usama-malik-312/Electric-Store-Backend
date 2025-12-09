import { Request } from 'express';

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginationResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Extract pagination parameters from request query
 */
export const getPaginationParams = (req: Request): PaginationParams => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

/**
 * Build pagination response
 */
export const buildPaginationResponse = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginationResponse<T> => {
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Validate and extract sort parameters
 */
export const getSortParams = (req: Request, defaultSort: string = 'created_at DESC'): string => {
    const sort = req.query.sort as string;
    
    if (!sort) {
        return defaultSort;
    }

    // Validate sort format: "field:direction" or just "field"
    const sortParts = sort.split(':');
    const field = sortParts[0];
    const direction = sortParts[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Basic SQL injection prevention - only allow alphanumeric and underscore
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
        return defaultSort;
    }

    return `${field} ${direction}`;
};

/**
 * Build search query condition
 */
export const buildSearchCondition = (
    searchTerm: string | undefined,
    searchFields: string[],
    paramIndex: number = 1
): { condition: string; value: string; nextParamIndex: number } => {
    if (!searchTerm || searchFields.length === 0) {
        return { condition: '', value: '', nextParamIndex: paramIndex };
    }

    const conditions = searchFields.map(field => {
        // Validate field name to prevent SQL injection
        if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(field)) {
            return null;
        }
        return `${field} ILIKE $${paramIndex}`;
    }).filter(Boolean) as string[];

    if (conditions.length === 0) {
        return { condition: '', value: '', nextParamIndex: paramIndex };
    }

    return {
        condition: `(${conditions.join(' OR ')})`,
        value: `%${searchTerm}%`,
        nextParamIndex: paramIndex + 1
    };
};

/**
 * Validate mandatory filters
 */
export const validateMandatoryFilters = (
    req: Request,
    requiredFilters: string[]
): { isValid: boolean; missing: string[] } => {
    const missing = requiredFilters.filter(filter => !req.query[filter]);

    return {
        isValid: missing.length === 0,
        missing
    };
};

