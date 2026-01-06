# Frontend Implementation Prompt for Electric Store Management System

## Overview
Implement a complete frontend application for the Electric Store Management System with full CRUD operations, search functionality, and authentication. The backend API is fully functional and ready to use.

## Base API Configuration
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT tokens via Authorization header or HTTP-only cookies
- **Response Format**: All responses follow `{ success: boolean, data?: any, error?: string, pagination?: {...} }`

---

## 1. Authentication Module

### Endpoints to Implement:

#### POST `/api/auth/register`
- **Purpose**: User registration
- **Request Body**:
  ```json
  {
    "email": "string (optional)",
    "phone": "string (optional)",
    "password": "string (min 6 chars)",
    "role": "string (optional, default: 'staff')"
  }
  ```
- **Response**: Returns user object, token, refreshToken, and permissions
- **UI**: Registration form with email/phone, password, and role selection

#### POST `/api/auth/login`
- **Purpose**: User login
- **Request Body**:
  ```json
  {
    "identifier": "string (email or phone)",
    "password": "string"
  }
  ```
- **Response**: Returns user object, token, refreshToken, and permissions
- **UI**: Login form with identifier (email/phone) and password fields
- **Store**: Save token and user info in localStorage/sessionStorage or state management

#### POST `/api/auth/logout`
- **Purpose**: Logout user
- **Auth Required**: Yes
- **UI**: Clear tokens and redirect to login

#### GET `/api/auth/me`
- **Purpose**: Get current authenticated user
- **Auth Required**: Yes
- **UI**: Use for user profile display, dashboard user info

#### POST `/api/auth/refresh-token`
- **Purpose**: Refresh access token
- **Request Body**: `{ "refreshToken": "string" }`
- **Implementation**: Auto-refresh token before expiry or on 401 errors

---

## 2. Brands Module

### Endpoints to Implement:

#### GET `/api/brands`
- **Purpose**: Get paginated list of brands
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `search` (optional): Search in brand name
  - `sort` (optional, default: "name ASC"): Format "field:DIRECTION" (e.g., "name:DESC")
- **Response**: `{ success: true, data: [...], pagination: { total, page, limit, totalPages } }`
- **UI**: 
  - Table/list view with pagination
  - Search input field
  - Sortable columns (name, created_at)
  - Actions: Edit, Delete buttons

#### GET `/api/brands/dropdown`
- **Purpose**: Get brands for dropdown/select components
- **Response**: `{ success: true, data: [{ id, name }] }`
- **UI**: Use in forms where brand selection is needed

#### GET `/api/brands/:id`
- **Purpose**: Get single brand details
- **UI**: Brand detail view or pre-fill edit form

#### POST `/api/brands`
- **Purpose**: Create new brand
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)"
  }
  ```
- **UI**: Create brand form/modal with name and description fields

#### PUT `/api/brands/:id`
- **Purpose**: Update brand
- **Request Body**: Same as POST
- **UI**: Edit form/modal (pre-filled with existing data)

#### DELETE `/api/brands/:id`
- **Purpose**: Delete brand (soft delete)
- **UI**: Delete confirmation dialog, then remove from list

---

## 3. Stores Module

### Endpoints to Implement:

#### GET `/api/stores`
- **Purpose**: Get paginated list of stores
- **Query Parameters**: `page`, `limit`, `search`, `sort` (default: "name ASC")
- **Search**: Search in store name
- **UI**: Table with pagination, search, sortable columns

#### GET `/api/stores/dropdown`
- **Purpose**: Get stores for dropdown
- **UI**: Use in forms requiring store selection

#### GET `/api/stores/:id`
- **Purpose**: Get single store details
- **UI**: Store detail view

#### POST `/api/stores`
- **Purpose**: Create new store
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "address": "string (optional)",
    "phone": "string (optional)",
    "email": "string (optional)",
    "status": "string (optional, default: 'active')"
  }
  ```
- **UI**: Create store form

#### PUT `/api/stores/:id`
- **Purpose**: Update store
- **UI**: Edit form

#### DELETE `/api/stores/:id`
- **Purpose**: Delete store
- **UI**: Delete confirmation

---

## 4. Suppliers Module

### Endpoints to Implement:

#### GET `/api/suppliers`
- **Purpose**: Get paginated suppliers
- **Query Parameters**: `page`, `limit`, `search`, `sort` (default: "name ASC")
- **Search**: Search in supplier name, contact info
- **UI**: Table with pagination, search, sort

#### GET `/api/suppliers/dropdown`
- **Purpose**: Get suppliers for dropdown
- **UI**: Use in inventory forms

#### GET `/api/suppliers/:id`
- **Purpose**: Get single supplier
- **UI**: Supplier detail view

#### POST `/api/suppliers`
- **Purpose**: Create supplier
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "contact_person": "string (optional)",
    "phone": "string (optional)",
    "email": "string (optional)",
    "address": "string (optional)"
  }
  ```
- **UI**: Create supplier form

#### PUT `/api/suppliers/:id`
- **Purpose**: Update supplier
- **UI**: Edit form

#### DELETE `/api/suppliers/:id`
- **Purpose**: Delete supplier
- **UI**: Delete confirmation

---

## 5. Item Groups Module

### Endpoints to Implement:

#### GET `/api/item-groups`
- **Purpose**: Get paginated item groups
- **Query Parameters**: `page`, `limit`, `search`, `sort` (default: "group_name ASC")
- **Search**: Search in group_name
- **UI**: Table with pagination, search, sort

#### GET `/api/item-groups/dropdown`
- **Purpose**: Get item groups for dropdown
- **UI**: Use in inventory forms

#### GET `/api/item-groups/:id`
- **Purpose**: Get single item group
- **UI**: Detail view

#### POST `/api/item-groups`
- **Purpose**: Create item group
- **Request Body**:
  ```json
  {
    "group_name": "string (required)",
    "description": "string (optional)"
  }
  ```
- **UI**: Create form

#### PUT `/api/item-groups/:id`
- **Purpose**: Update item group
- **UI**: Edit form

#### DELETE `/api/item-groups/:id`
- **Purpose**: Delete item group
- **UI**: Delete confirmation

---

## 6. Inventory Module

### Endpoints to Implement:

#### GET `/api/inventory`
- **Purpose**: Get paginated inventory items
- **Query Parameters**:
  - `store_id` (REQUIRED): Filter by store
  - `page`, `limit`: Pagination
  - `search`: Search in item_name, item_code, sku
  - `sort`: Sort field (default: "item_name ASC")
  - `status`: Filter by status (e.g., "active")
  - `brand_id`: Filter by brand
  - `supplier_id`: Filter by supplier
  - `item_group_id`: Filter by item group
- **UI**: 
  - **Store selector** (required filter) - dropdown at top
  - **Search bar** - search across item_name, item_code, sku
  - **Filter dropdowns** - Status, Brand, Supplier, Item Group
  - **Table** with columns: item_code, item_name, brand, stock, selling_price, cost_price, status
  - **Pagination** controls
  - **Sortable columns**
  - Actions: View, Edit, Delete

#### GET `/api/inventory/dropdown`
- **Purpose**: Get items for dropdown
- **Query Parameters**: `store_id` (optional)
- **UI**: Use in POS/invoice forms

#### GET `/api/inventory/:id`
- **Purpose**: Get single inventory item
- **UI**: Item detail view

#### GET `/api/inventory/low-stock`
- **Purpose**: Get low stock items
- **Query Parameters**:
  - `store_id` (REQUIRED)
  - `threshold` (optional, default: 5)
- **UI**: 
  - Separate page/section for low stock alerts
  - Display items with stock below threshold
  - Highlight in red/orange

#### POST `/api/inventory`
- **Purpose**: Create inventory item
- **Request Body**:
  ```json
  {
    "item_name": "string (required)",
    "item_code": "string (required)",
    "store_id": "number (required)",
    "brand_id": "number (optional)",
    "supplier_id": "number (optional)",
    "item_group_id": "number (optional)",
    "selling_price": "number (required)",
    "cost_price": "number (optional)",
    "stock": "number (default: 0)",
    "unit": "string (optional)",
    "sku": "string (optional)",
    "status": "string (default: 'active')"
  }
  ```
- **UI**: 
  - Create form with all fields
  - Dropdowns for: Store, Brand, Supplier, Item Group
  - Number inputs for prices and stock
  - Status selector

#### PUT `/api/inventory/:id`
- **Purpose**: Update inventory item
- **Request Body**: Same as POST (all fields optional)
- **UI**: Edit form (pre-filled)

#### DELETE `/api/inventory/:id`
- **Purpose**: Delete inventory item
- **UI**: Delete confirmation

---

## 7. Customers Module

### Endpoints to Implement:

#### GET `/api/customers`
- **Purpose**: Get paginated customers
- **Query Parameters**:
  - `status` (REQUIRED): "active" or "inactive"
  - `page`, `limit`: Pagination
  - `search`: Search in name, email, phone, customer_code
  - `sort`: Sort field (default: "name ASC")
- **UI**: 
  - **Status filter tabs/buttons** (Active/Inactive) - required
  - **Search bar** - search across name, email, phone, customer_code
  - **Table** with columns: customer_code, name, email, phone, status
  - **Pagination**
  - Actions: View, Edit, Delete

#### GET `/api/customers/dropdown`
- **Purpose**: Get customers for dropdown
- **UI**: Use in POS/invoice forms

#### GET `/api/customers/:id`
- **Purpose**: Get single customer
- **UI**: Customer detail view

#### POST `/api/customers`
- **Purpose**: Create customer
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "customer_code": "string (optional)",
    "email": "string (optional)",
    "phone": "string (optional)",
    "address": "string (optional)",
    "status": "string (default: 'active')"
  }
  ```
- **UI**: Create customer form

#### PUT `/api/customers/:id`
- **Purpose**: Update customer
- **UI**: Edit form

#### DELETE `/api/customers/:id`
- **Purpose**: Delete customer
- **UI**: Delete confirmation

---

## 8. Users Module

### Endpoints to Implement:

#### GET `/api/users`
- **Purpose**: Get paginated users
- **Query Parameters**: `page`, `limit`, `search`, `sort` (default: "created_at DESC")
- **Search**: Search in email, phone, first_name, last_name
- **UI**: 
  - Table with user list
  - Search bar
  - Columns: email, phone, full_name, role, status, last_login
  - Actions: View, Edit, Delete

#### GET `/api/users/:id`
- **Purpose**: Get single user
- **UI**: User detail view or edit form

#### POST `/api/users`
- **Purpose**: Create user
- **Request Body**:
  ```json
  {
    "email": "string (optional)",
    "phone": "string (optional)",
    "password": "string (required, min 6 chars)",
    "first_name": "string (optional)",
    "last_name": "string (optional)",
    "role": "string (optional)",
    "role_id": "number (optional)",
    "store_id": "number (optional)",
    "status": "string (default: 'active')"
  }
  ```
- **UI**: Create user form with role dropdown

#### PUT `/api/users/:id`
- **Purpose**: Update user
- **Request Body**: Same as POST (password optional)
- **UI**: Edit form

#### DELETE `/api/users/:id`
- **Purpose**: Delete user
- **UI**: Delete confirmation

---

## 9. Roles Module

### Endpoints to Implement:

#### GET `/api/roles`
- **Purpose**: Get paginated roles
- **Query Parameters**: `page`, `limit`, `search`, `sort` (default: "name ASC")
- **Search**: Search in name, description
- **UI**: Table with roles list

#### GET `/api/roles/:id`
- **Purpose**: Get single role
- **UI**: Role detail view

#### GET `/api/roles/:id/permissions`
- **Purpose**: Get role permissions
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "role": { "id", "name", "description" },
      "permissions": [
        { "id", "module", "action", "code", "assigned": boolean }
      ]
    }
  }
  ```
- **UI**: Permission management interface (checkboxes for each permission)

#### POST `/api/roles`
- **Purpose**: Create role
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)"
  }
  ```
- **UI**: Create role form

#### PUT `/api/roles/:id`
- **Purpose**: Update role
- **UI**: Edit form

#### POST `/api/roles/:id/permissions`
- **Purpose**: Update role permissions
- **Request Body**:
  ```json
  {
    "permissions": ["brands.create", "brands.read", "users.update", ...]
  }
  ```
- **UI**: Permission assignment interface with checkboxes

#### DELETE `/api/roles/:id`
- **Purpose**: Delete role
- **UI**: Delete confirmation

---

## Implementation Requirements

### 1. API Service Layer
- Create a centralized API service/client
- Handle authentication tokens (store in localStorage/sessionStorage)
- Implement request interceptors for adding Authorization header
- Implement response interceptors for handling 401 errors (auto-logout or token refresh)
- Handle errors consistently

### 2. State Management
- Use Redux, Zustand, Context API, or similar
- Store: user info, auth token, selected store (for inventory)
- Cache dropdown data (brands, stores, suppliers, etc.)

### 3. Search Implementation
- **Real-time search**: Debounce search input (300-500ms delay)
- **Search fields by module**:
  - Brands: name
  - Stores: name
  - Suppliers: name, contact_person, phone, email
  - Item Groups: group_name
  - Inventory: item_name, item_code, sku
  - Customers: name, email, phone, customer_code
  - Users: email, phone, first_name, last_name
  - Roles: name, description
- Clear search button
- Show "No results" message when search returns empty

### 4. Write Operations (POST/PUT/DELETE)

#### Form Validation
- Client-side validation before submission
- Show validation errors inline
- Required fields marked with asterisk (*)
- Email format validation
- Phone number validation
- Number fields (prices, stock) must be positive numbers

#### Success/Error Handling
- Show success toast/notification after create/update/delete
- Show error messages for API errors
- Handle 400 (validation), 401 (unauthorized), 404 (not found), 409 (conflict), 500 (server error)

#### Optimistic Updates
- Update UI immediately on success
- Refresh data after mutations
- Handle errors and rollback if needed

#### Delete Confirmations
- Show confirmation dialog before delete
- Display item name in confirmation message
- Handle soft deletes (items may still exist but marked as deleted)

### 5. UI/UX Requirements

#### Layout
- Responsive design (mobile, tablet, desktop)
- Sidebar navigation with menu items
- Header with user info and logout
- Breadcrumbs for navigation

#### Tables/Lists
- Pagination controls (Previous, Next, Page numbers)
- Items per page selector (10, 20, 50, 100)
- Loading states (skeletons or spinners)
- Empty states ("No data available")
- Row actions (Edit, Delete, View icons/buttons)

#### Forms
- Modal dialogs for create/edit
- Or dedicated form pages
- Form validation with error messages
- Cancel and Submit buttons
- Loading state during submission

#### Filters
- Store selector (for inventory) - required, prominent
- Status filters (for customers) - tabs or buttons
- Dropdown filters (brand, supplier, item group for inventory)
- Clear all filters button

#### Search
- Search input with icon
- Placeholder text indicating what can be searched
- Clear button (X) when search has value
- Debounced input (300-500ms)

### 6. Routing
- Protected routes (require authentication)
- Redirect to login if not authenticated
- Role-based route protection (if needed in future)
- 404 page for unknown routes

### 7. Error Handling
- Global error handler
- Network error handling
- API error message display
- Retry mechanism for failed requests

### 8. Loading States
- Show loading spinners during API calls
- Disable buttons during submission
- Skeleton loaders for better UX

### 9. Data Refresh
- Refresh data after create/update/delete
- Auto-refresh for real-time data (optional)
- Manual refresh button

### 10. Dropdown Data Management
- Fetch dropdown data on component mount
- Cache dropdown data to avoid repeated API calls
- Refresh dropdown data after create/update operations

---

## Technical Stack Recommendations

- **Framework**: React, Vue, or Angular
- **State Management**: Redux Toolkit, Zustand, or Context API
- **HTTP Client**: Axios or Fetch API
- **Form Handling**: React Hook Form, Formik, or native
- **UI Library**: Material-UI, Ant Design, Chakra UI, or Tailwind CSS
- **Routing**: React Router, Vue Router, or Angular Router
- **Notifications**: react-toastify, sonner, or similar
- **Date Handling**: date-fns or moment.js

---

## API Response Examples

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## Priority Implementation Order

1. **Authentication** (Login, Register, Logout, Token Management)
2. **Dashboard/Layout** (Navigation, Header, Sidebar)
3. **Brands Module** (Simplest CRUD, good starting point)
4. **Stores Module** (Needed for inventory filtering)
5. **Suppliers Module**
6. **Item Groups Module**
7. **Inventory Module** (Most complex, requires all above modules)
8. **Customers Module**
9. **Users Module**
10. **Roles Module** (Advanced feature)

---

## Notes

- All endpoints require authentication except `/api/auth/*` and `/api/health`
- Store JWT token in localStorage or sessionStorage
- Include token in Authorization header: `Authorization: Bearer <token>`
- Handle token expiry and refresh automatically
- All timestamps are in ISO 8601 format
- Soft deletes are used - deleted items have `deleted_at` set
- Mandatory filters: `store_id` for inventory, `status` for customers
- Search is case-insensitive
- Sort format: `"field:DIRECTION"` (e.g., `"name:DESC"`, `"created_at:ASC"`)

---

## Testing Checklist

- [ ] Login/Logout works
- [ ] All CRUD operations work for each module
- [ ] Search works for all modules
- [ ] Pagination works correctly
- [ ] Filters work (store_id, status, etc.)
- [ ] Form validation works
- [ ] Error handling works
- [ ] Loading states display correctly
- [ ] Responsive design works
- [ ] Token refresh works
- [ ] Dropdown data loads correctly





