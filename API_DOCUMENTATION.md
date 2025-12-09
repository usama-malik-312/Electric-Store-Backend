# Electric Store Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```
Or via HTTP-only cookie: `jwt`

---

## Authentication Endpoints

### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "staff"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "staff",
      "full_name": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/api/auth/login`
Login with email/phone and password.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "owner",
      "full_name": "John Doe",
      "store_id": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/api/auth/logout`
Logout (clears cookies).

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/me`
Get current user information.

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "owner",
    "full_name": "John Doe",
    "store_id": 1,
    "status": "active",
    "permissions": ["*"]
  }
}
```

---

### POST `/api/auth/refresh-token`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Inventory Endpoints

All inventory endpoints require authentication.

### GET `/api/inventory`
Get paginated inventory items.

**Query Parameters:**
- `store_id` (required): Filter by store ID
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `search` (optional): Search term (searches item_name, item_code, sku)
- `sort` (optional, default: "item_name ASC"): Sort field and direction (e.g., "item_name:DESC")
- `status` (optional): Filter by status (e.g., "active")
- `brand_id` (optional): Filter by brand ID
- `supplier_id` (optional): Filter by supplier ID
- `item_group_id` (optional): Filter by item group ID

**Example:**
```
GET /api/inventory?store_id=1&page=1&limit=20&search=wire&status=active
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### GET `/api/inventory/dropdown`
Get lightweight inventory items for dropdowns.

**Query Parameters:**
- `store_id` (optional): Filter by store ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item_code": "WIRE-001",
      "item_name": "Electrical Wire",
      "selling_price": 29.99,
      "stock": 100,
      "unit": "meter"
    }
  ]
}
```

---

### GET `/api/inventory/:id`
Get a single inventory item.

---

### POST `/api/inventory`
Create new inventory item.

**Required Roles:** owner, admin, manager

**Request Body:**
```json
{
  "item_name": "Electrical Wire",
  "item_code": "WIRE-001",
  "store_id": 1,
  "brand_id": 1,
  "selling_price": 29.99,
  "cost_price": 20.00,
  "stock": 100,
  "status": "active"
}
```

---

### PUT `/api/inventory/:id`
Update inventory item.

**Required Roles:** owner, admin, manager

---

### DELETE `/api/inventory/:id`
Delete inventory item (soft delete).

**Required Roles:** owner, admin

---

### GET `/api/inventory/low-stock`
Get low stock items.

**Query Parameters:**
- `store_id` (required): Filter by store ID
- `threshold` (optional, default: 5): Minimum stock threshold

---

## Customer Endpoints

### GET `/api/customers`
Get paginated customers.

**Query Parameters:**
- `status` (required): Filter by status (e.g., "active", "inactive")
- `page`, `limit`, `search`, `sort` (optional): Pagination and sorting

**Example:**
```
GET /api/customers?status=active&page=2&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 2,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET `/api/customers/dropdown`
Get lightweight customers for dropdowns.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "customer_code": "CUST-001"
    }
  ]
}
```

---

## Brand Endpoints

### GET `/api/brands`
Get paginated brands.

**Query Parameters:**
- `page`, `limit`, `search`, `sort` (optional)

---

### GET `/api/brands/dropdown`
Get lightweight brands for dropdowns.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Brand Name"
    }
  ]
}
```

---

## Store Endpoints

### GET `/api/stores`
Get paginated stores.

**Query Parameters:**
- `page`, `limit`, `search`, `sort` (optional)

---

### GET `/api/stores/dropdown`
Get lightweight stores for dropdowns.

---

## Supplier Endpoints

### GET `/api/suppliers`
Get paginated suppliers.

**Query Parameters:**
- `page`, `limit`, `search`, `sort` (optional)

---

### GET `/api/suppliers/dropdown`
Get lightweight suppliers for dropdowns.

---

## Item Group Endpoints

### GET `/api/item-groups`
Get paginated item groups.

**Query Parameters:**
- `page`, `limit`, `search`, `sort` (optional)

---

### GET `/api/item-groups/dropdown`
Get lightweight item groups for dropdowns.

---

## User Endpoints

### GET `/api/users`
Get paginated users.

**Required Roles:** owner, admin

**Query Parameters:**
- `page`, `limit`, `search` (optional)

---

### POST `/api/users`
Create new user.

**Required Roles:** owner

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Role-Based Access Control

### Roles Hierarchy:
1. **owner** - Full access to all operations
2. **admin** - Full CRUD access (can't delete some critical resources)
3. **manager** - Read and write access (no delete)
4. **staff** - Read-only access

### Route Protection Summary:

| Route | GET | POST | PUT | DELETE |
|-------|-----|------|-----|--------|
| Inventory | All | owner/admin/manager | owner/admin/manager | owner/admin |
| Customers | All | owner/admin/manager | owner/admin/manager | owner/admin |
| Brands | All | owner/admin/manager | owner/admin/manager | owner/admin |
| Suppliers | All | owner/admin/manager | owner/admin/manager | owner/admin |
| Item Groups | All | owner/admin/manager | owner/admin/manager | owner/admin |
| Stores | All | owner/admin | owner/admin | owner/admin |
| Users | owner/admin | owner | owner | owner |

---

## Pagination

All GET endpoints support pagination with these query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sort` - Sort field and direction (e.g., "name:DESC")
- `search` - Search term (searches relevant fields)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Mandatory Filters

Some endpoints require mandatory query parameters:

- **Inventory**: `store_id`
- **Customers**: `status`

Missing mandatory filters will return a `400 Bad Request` error.

---

## Notes

1. All timestamps are in ISO 8601 format
2. Soft deletes are used - deleted records have `deleted_at` set
3. All routes are authenticated by default except `/api/auth/*` and `/api/health`
4. Owner role has full access (`permissions: ["*"]`)
5. Refresh tokens are stored in HTTP-only cookies for security

