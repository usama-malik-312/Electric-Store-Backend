# Frontend CRUD Implementation Prompt

## Task
Implement complete CRUD (Create, Read, Update, Delete) operations with search functionality for all modules in the Electric Store Management System frontend.

## Base API Configuration
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT token in `Authorization: Bearer <token>` header
- **Response Format**: `{ success: boolean, data?: any, error?: string, pagination?: {...} }`

---

## Modules to Implement

### 1. Brands (`/api/brands`)
**Endpoints:**
- `GET /api/brands` - List with pagination, search (name), sort (default: "name ASC")
- `GET /api/brands/dropdown` - For dropdowns
- `GET /api/brands/:id` - Get single brand
- `POST /api/brands` - Create: `{ name: string, description?: string }`
- `PUT /api/brands/:id` - Update: `{ name?: string, description?: string }`
- `DELETE /api/brands/:id` - Delete

**UI Requirements:**
- Table/list view with pagination controls
- Search input (searches brand name)
- Sortable columns
- Create/Edit modal or form page
- Delete confirmation dialog
- Dropdown component for brand selection

---

### 2. Customers (`/api/customers`)
**Endpoints:**
- `GET /api/customers` - List with pagination, search (name, email, phone, customer_code), sort (default: "name ASC")
- **Required Query**: `status` (active/inactive) - Use tabs or filter buttons
- `GET /api/customers/dropdown` - For dropdowns
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create: `{ name: string, customer_code?: string, email?: string, phone?: string, address?: string, status?: string }`
- `PUT /api/customers/:id` - Update
- `DELETE /api/customers/:id` - Delete

**UI Requirements:**
- Status filter tabs/buttons (Active/Inactive) - REQUIRED
- Search bar (searches name, email, phone, customer_code)
- Table with pagination
- Create/Edit form
- Delete confirmation

---

### 3. Item Groups (`/api/item-groups`)
**Endpoints:**
- `GET /api/item-groups` - List with pagination, search (group_name), sort (default: "group_name ASC")
- `GET /api/item-groups/dropdown` - For dropdowns
- `GET /api/item-groups/:id` - Get single item group
- `POST /api/item-groups` - Create: `{ group_name: string, description?: string }`
- `PUT /api/item-groups/:id` - Update
- `DELETE /api/item-groups/:id` - Delete

**UI Requirements:**
- Table with search (group_name)
- Pagination
- Create/Edit form
- Delete confirmation
- Dropdown component

---

### 4. Inventory/Items (`/api/inventory`)
**Endpoints:**
- `GET /api/inventory` - List with pagination, search (item_name, item_code, sku), sort (default: "item_name ASC")
- **Required Query**: `store_id` - MUST be selected first
- **Optional Filters**: `status`, `brand_id`, `supplier_id`, `item_group_id`
- `GET /api/inventory/dropdown` - For dropdowns (optional: `store_id`)
- `GET /api/inventory/low-stock` - Low stock items (required: `store_id`, optional: `threshold`)
- `GET /api/inventory/:id` - Get single item
- `POST /api/inventory` - Create: `{ item_name: string, item_code: string, store_id: number, brand_id?: number, supplier_id?: number, item_group_id?: number, selling_price: number, cost_price?: number, stock?: number, unit?: string, sku?: string, status?: string }`
- `PUT /api/inventory/:id` - Update
- `DELETE /api/inventory/:id` - Delete

**UI Requirements:**
- **Store selector dropdown** at top (REQUIRED - must select before loading items)
- **Search bar** (searches item_name, item_code, sku)
- **Filter dropdowns**: Status, Brand, Supplier, Item Group
- Table with columns: item_code, item_name, brand, stock, selling_price, cost_price, status
- Pagination
- Create/Edit form with all fields and dropdowns for: Store, Brand, Supplier, Item Group
- Delete confirmation
- **Low Stock page/section** - Display items below threshold (highlight in red/orange)

---

### 5. Stores (`/api/stores`)
**Endpoints:**
- `GET /api/stores` - List with pagination, search (name), sort (default: "name ASC")
- `GET /api/stores/dropdown` - For dropdowns
- `GET /api/stores/:id` - Get single store
- `POST /api/stores` - Create: `{ name: string, address?: string, phone?: string, email?: string, status?: string }`
- `PUT /api/stores/:id` - Update
- `DELETE /api/stores/:id` - Delete

**UI Requirements:**
- Table with search (name)
- Pagination
- Create/Edit form
- Delete confirmation
- Dropdown component

---

### 6. Suppliers (`/api/suppliers`)
**Endpoints:**
- `GET /api/suppliers` - List with pagination, search (name, contact_person, phone, email), sort (default: "name ASC")
- `GET /api/suppliers/dropdown` - For dropdowns
- `GET /api/suppliers/:id` - Get single supplier
- `POST /api/suppliers` - Create: `{ name: string, contact_person?: string, phone?: string, email?: string, address?: string }`
- `PUT /api/suppliers/:id` - Update
- `DELETE /api/suppliers/:id` - Delete

**UI Requirements:**
- Table with search (name, contact, phone, email)
- Pagination
- Create/Edit form
- Delete confirmation
- Dropdown component

---

## Implementation Requirements

### API Service Layer
1. Create API client/service with:
   - Base URL configuration
   - Authorization header injection (Bearer token from localStorage/sessionStorage)
   - Request/response interceptors
   - Error handling (401 = logout, 400/404/500 = show error message)

### State Management
- Store authentication token and user info
- Cache dropdown data (brands, stores, suppliers, item groups)
- Manage selected store for inventory module

### Search Implementation
- **Debounce search input** (300-500ms delay)
- Search triggers API call with `search` query parameter
- Clear search button when search has value
- Show "No results" message when empty

### CRUD Operations

#### Create (POST)
- Form/modal with all required fields
- Client-side validation before submission
- Show loading state during submission
- On success: Show success message, close form, refresh list
- On error: Display error message

#### Read (GET)
- Table/list view with:
  - Pagination controls (Previous, Next, Page numbers, Items per page selector)
  - Search input
  - Sortable columns (click header to sort)
  - Loading skeleton/spinner
  - Empty state message
  - Row actions (Edit, Delete buttons/icons)

#### Update (PUT)
- Edit form/modal (pre-filled with existing data)
- Same validation as Create
- On success: Show success message, close form, refresh list

#### Delete (DELETE)
- Confirmation dialog before delete
- Show item name in confirmation message
- On success: Show success message, refresh list
- On error: Display error message

### Form Validation
- Required fields marked with asterisk (*)
- Email format validation
- Phone number validation
- Number fields (prices, stock) must be positive numbers
- Show validation errors inline below fields

### UI Components Needed
- Data table with pagination
- Search input with clear button
- Create/Edit modal or form page
- Delete confirmation dialog
- Dropdown/Select components
- Loading spinners/skeletons
- Success/Error toast notifications
- Form inputs (text, number, email, select, textarea)

### Error Handling
- Network errors: "Network error. Please check your connection."
- 400 Bad Request: Display API error message
- 401 Unauthorized: Clear token, redirect to login
- 404 Not Found: "Item not found"
- 500 Server Error: "Server error. Please try again later."
- Validation errors: Show inline in forms

### Success Feedback
- Toast notification on successful create/update/delete
- Auto-refresh data after mutations
- Optimistic UI updates (optional)

---

## Query Parameters Format

### Pagination
- `page=1` (default: 1)
- `limit=20` (default: 10, max: 100)

### Search
- `search=wire` (searches relevant fields, case-insensitive)

### Sorting
- `sort=name:DESC` or `sort=created_at:ASC`
- Format: `"field:DIRECTION"`

### Filters
- Inventory: `store_id=1&status=active&brand_id=2`
- Customers: `status=active` (REQUIRED)

---

## Response Format

### Success with Pagination
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

### Success Single Item
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Priority Order
1. Brands (simplest, good starting point)
2. Stores (needed for inventory)
3. Suppliers
4. Item Groups
5. Customers
6. Inventory (most complex, requires all above)

---

## Notes
- All endpoints require authentication (except `/api/auth/*`)
- Store JWT token: `localStorage.setItem('token', token)`
- Include in requests: `headers: { 'Authorization': 'Bearer ' + token }`
- Mandatory filters must be selected before API call
- All timestamps are ISO 8601 format
- Soft deletes are used (items marked as deleted, not removed)





