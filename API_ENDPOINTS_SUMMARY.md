# API Endpoints Quick Reference

## Base URL: `http://localhost:5000/api`

All endpoints require authentication except `/api/auth/*` and `/api/health`.

---

## Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/logout` | Logout user | Yes |
| GET | `/me` | Get current user | Yes |
| POST | `/refresh-token` | Refresh access token | No |

---

## Brands (`/api/brands`)

| Method | Endpoint | Description | Search | Write |
|--------|----------|-------------|---------|-------|
| GET | `/` | Get paginated brands | ✅ (name) | - |
| GET | `/dropdown` | Get brands for dropdown | - | - |
| GET | `/:id` | Get brand by ID | - | - |
| POST | `/` | Create brand | - | ✅ |
| PUT | `/:id` | Update brand | - | ✅ |
| DELETE | `/:id` | Delete brand | - | ✅ |

**Query Params**: `page`, `limit`, `search`, `sort` (default: "name ASC")

---

## Stores (`/api/stores`)

| Method | Endpoint | Description | Search | Write |
|--------|----------|-------------|---------|-------|
| GET | `/` | Get paginated stores | ✅ (name) | - |
| GET | `/dropdown` | Get stores for dropdown | - | - |
| GET | `/:id` | Get store by ID | - | - |
| POST | `/` | Create store | - | ✅ |
| PUT | `/:id` | Update store | - | ✅ |
| DELETE | `/:id` | Delete store | - | ✅ |

**Query Params**: `page`, `limit`, `search`, `sort` (default: "name ASC")

---

## Suppliers (`/api/suppliers`)

| Method | Endpoint | Description | Search | Write |
|--------|----------|-------------|---------|-------|
| GET | `/` | Get paginated suppliers | ✅ (name, contact) | - |
| GET | `/dropdown` | Get suppliers for dropdown | - | - |
| GET | `/:id` | Get supplier by ID | - | - |
| POST | `/` | Create supplier | - | ✅ |
| PUT | `/:id` | Update supplier | - | ✅ |
| DELETE | `/:id` | Delete supplier | - | ✅ |

**Query Params**: `page`, `limit`, `search`, `sort` (default: "name ASC")

---

## Item Groups (`/api/item-groups`)

| Method | Endpoint | Description | Search | Write |
|--------|----------|-------------|---------|-------|
| GET | `/` | Get paginated item groups | ✅ (group_name) | - |
| GET | `/dropdown` | Get item groups for dropdown | - | - |
| GET | `/:id` | Get item group by ID | - | - |
| POST | `/` | Create item group | - | ✅ |
| PUT | `/:id` | Update item group | - | ✅ |
| DELETE | `/:id` | Delete item group | - | ✅ |

**Query Params**: `page`, `limit`, `search`, `sort` (default: "group_name ASC")

---

## Inventory (`/api/inventory`)

| Method | Endpoint | Description | Search | Filters | Write |
|--------|----------|-------------|---------|---------|-------|
| GET | `/` | Get paginated items | ✅ (name, code, sku) | ✅ (store_id*, status, brand_id, supplier_id, item_group_id) | - |
| GET | `/dropdown` | Get items for dropdown | - | `store_id` (optional) | - |
| GET | `/low-stock` | Get low stock items | - | `store_id*`, `threshold` | - |
| GET | `/:id` | Get item by ID | - | - | - |
| POST | `/` | Create item | - | - | ✅ |
| PUT | `/:id` | Update item | - | - | ✅ |
| DELETE | `/:id` | Delete item | - | - | ✅ |

**Query Params**: 
- `store_id` (REQUIRED for GET `/` and `/low-stock`)
- `page`, `limit`, `search`, `sort` (default: "item_name ASC")
- `status`, `brand_id`, `supplier_id`, `item_group_id` (optional filters)
- `threshold` (optional, default: 5 for low-stock)

---

## Customers (`/api/customers`)

| Method | Endpoint | Description | Search | Filters | Write |
|--------|----------|-------------|---------|---------|-------|
| GET | `/` | Get paginated customers | ✅ (name, email, phone, code) | ✅ (status*) | - |
| GET | `/dropdown` | Get customers for dropdown | - | - | - |
| GET | `/:id` | Get customer by ID | - | - | - |
| POST | `/` | Create customer | - | - | ✅ |
| PUT | `/:id` | Update customer | - | - | ✅ |
| DELETE | `/:id` | Delete customer | - | - | ✅ |

**Query Params**: 
- `status` (REQUIRED for GET `/`)
- `page`, `limit`, `search`, `sort` (default: "name ASC")

---

## Users (`/api/users`)

| Method | Endpoint | Description | Search | Write |
|--------|----------|-------------|---------|-------|
| GET | `/` | Get paginated users | ✅ (email, phone, name) | - |
| GET | `/:id` | Get user by ID | - | - |
| POST | `/` | Create user | - | ✅ |
| PUT | `/:id` | Update user | - | ✅ |
| DELETE | `/:id` | Delete user | - | ✅ |

**Query Params**: `page`, `limit`, `search`, `sort` (default: "created_at DESC")

---

## Roles (`/api/roles`)

| Method | Endpoint | Description | Search | Write |
|--------|----------|-------------|---------|-------|
| GET | `/` | Get paginated roles | ✅ (name, description) | - |
| GET | `/:id` | Get role by ID | - | - |
| GET | `/:id/permissions` | Get role permissions | - | - |
| POST | `/` | Create role | - | ✅ |
| PUT | `/:id` | Update role | - | ✅ |
| POST | `/:id/permissions` | Update role permissions | - | ✅ |
| DELETE | `/:id` | Delete role | - | ✅ |

**Query Params**: `page`, `limit`, `search`, `sort` (default: "name ASC")

---

## Common Query Parameters

### Pagination
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 100) - Items per page

### Search
- `search` - Search term (searches relevant fields, case-insensitive)

### Sorting
- `sort` - Format: `"field:DIRECTION"` (e.g., `"name:DESC"`, `"created_at:ASC"`)
- Default sort varies by endpoint

### Response Format
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

- **Inventory GET `/`**: `store_id` (required)
- **Inventory GET `/low-stock`**: `store_id` (required)
- **Customers GET `/`**: `status` (required)

---

## Search Fields by Module

| Module | Search Fields |
|--------|---------------|
| Brands | name |
| Stores | name |
| Suppliers | name, contact_person, phone, email |
| Item Groups | group_name |
| Inventory | item_name, item_code, sku |
| Customers | name, email, phone, customer_code |
| Users | email, phone, first_name, last_name |
| Roles | name, description |

---

## Write Operations Summary

All modules support:
- ✅ **POST** - Create new record
- ✅ **PUT** - Update existing record
- ✅ **DELETE** - Soft delete record

**Note**: All write operations require authentication and return the created/updated record on success.







