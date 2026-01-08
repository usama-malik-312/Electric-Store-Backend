# Frontend Inventory Tab Implementation Guide

## Overview
This document provides detailed instructions for implementing the Inventory tab in the frontend application. The inventory system allows users to manage items across multiple stores with optional filtering by store and item groups.

---

## API Endpoints

### Base URL
All endpoints are under `/api/inventory`

### Authentication
All endpoints require authentication. Include the authentication token in the request headers.

---

## 1. Get All Inventory Items

**Endpoint:** `GET /api/inventory`

**Query Parameters (All Optional):**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 10) - Items per page
- `search` (string) - Search term (searches item_name, item_code, sku)
- `sort` (string, default: "item_name ASC") - Sort field and direction
- `store_id` (number, **OPTIONAL**) - Filter by store ID
- `item_group_id` (number, **OPTIONAL**) - Filter by item group ID
- `status` (string) - Filter by status (e.g., "active", "inactive")
- `brand_id` (number) - Filter by brand ID
- `supplier_id` (number) - Filter by supplier ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item_name": "LED Bulb 10W",
      "item_code": "LED-001",
      "sku": "SKU-001",
      "stock": 50,
      "price": 150.00,
      "selling_price": 150.00,
      "cost_price": 100.00,
      "store_id": 1,
      "store_name": "Main Store",
      "store_location": "Downtown",
      "brand_id": 1,
      "brand_name": "Philips",
      "supplier_id": 1,
      "supplier_name": "ABC Suppliers",
      "item_group_id": 1,
      "group_name": "Lighting",
      "unit": "piece",
      "status": "active",
      "description": "Energy efficient LED bulb",
      "barcode": "1234567890",
      "min_stock_level": 10,
      "tax_percentage": 5,
      "discount": 0,
      "image": "url_to_image",
      "notes": "Popular item"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

**Key Changes:**
- `store_id` is now **OPTIONAL** - items can be fetched without specifying a store
- `item_group_id` can be used to filter items by group
- If no filters are provided, all items from all stores are returned

---

## 2. Create Inventory Item

**Endpoint:** `POST /api/inventory`

**Request Body:**
```json
{
  "item_name": "LED Bulb 10W",
  "item_code": "LED-001",
  "store_id": 1,  // OPTIONAL - if not provided, default store will be used
  "brand_id": 1,
  "supplier_id": 1,
  "item_group_id": 1,
  "selling_price": 150.00,
  "cost_price": 100.00,
  "stock": 50,
  "unit": "piece",
  "sku": "SKU-001",
  "status": "active",
  "description": "Energy efficient LED bulb",
  "barcode": "1234567890",
  "min_stock_level": 10,
  "tax_percentage": 5,
  "discount": 0,
  "image": "url_to_image",
  "notes": "Popular item"
}
```

**Important Notes:**
- `store_id` is **OPTIONAL** in the request
- If `store_id` is not provided, the system will automatically assign the item to the **default store** (first active store)
- If no stores exist, the API will return an error

**Response:**
```json
{
  "success": true,
  "data": {
    // Created item object
  }
}
```

---

## 3. Other Endpoints

### Get Single Item
**Endpoint:** `GET /api/inventory/:id`

### Update Item
**Endpoint:** `PUT /api/inventory/:id`

### Delete Item
**Endpoint:** `DELETE /api/inventory/:id`

### Get Items Dropdown
**Endpoint:** `GET /api/inventory/dropdown?store_id=1` (store_id is optional)

### Get Low Stock Items
**Endpoint:** `GET /api/inventory/low-stock?store_id=1&threshold=10` (store_id is optional)

---

## Frontend Implementation Requirements

### 1. Inventory Tab Layout

Create a comprehensive inventory management page with the following sections:

#### A. Header Section
- **Page Title:** "Inventory Management"
- **Action Buttons:**
  - "Add New Item" button (opens create/edit modal)
  - "Low Stock Alert" button/link (navigates to low stock view)

#### B. Filter Section
Create a filter bar with the following components:

1. **Store Filter (OPTIONAL)**
   - Dropdown component labeled "Filter by Store"
   - First option: "All Stores" (value: empty/null)
   - Populate from `/api/stores/dropdown`
   - When "All Stores" is selected, don't send `store_id` parameter
   - When a specific store is selected, send `store_id` parameter
   - **Default:** "All Stores" (show all items)

2. **Item Group Filter (OPTIONAL)**
   - Dropdown component labeled "Filter by Group"
   - First option: "All Groups" (value: empty/null)
   - Populate from `/api/item-groups/dropdown`
   - When "All Groups" is selected, don't send `item_group_id` parameter
   - When a specific group is selected, send `item_group_id` parameter
   - **Default:** "All Groups" (show all items)

3. **Status Filter (OPTIONAL)**
   - Dropdown with options: "All", "Active", "Inactive"
   - Default: "All"

4. **Brand Filter (OPTIONAL)**
   - Dropdown populated from `/api/brands/dropdown`
   - First option: "All Brands"

5. **Supplier Filter (OPTIONAL)**
   - Dropdown populated from `/api/suppliers/dropdown`
   - First option: "All Suppliers"

6. **Search Bar**
   - Text input for searching item_name, item_code, or sku
   - Real-time search with debouncing (300-500ms delay)

#### C. Items Table
Display items in a table with the following columns:
- Item Code
- Item Name
- Group Name
- Store Name
- Brand Name
- Stock Quantity
- Selling Price
- Cost Price
- Status (with badge/color coding)
- Actions (Edit, Delete buttons)

**Features:**
- Clickable rows or edit button to open edit modal
- Sortable columns (click header to sort)
- Responsive design (mobile-friendly)
- Loading state while fetching data
- Empty state when no items found

#### D. Pagination
- Display pagination controls at the bottom
- Show: "Showing X to Y of Z items"
- Previous/Next buttons
- Page number buttons
- Items per page selector (10, 25, 50, 100)

---

### 2. Create/Edit Item Modal/Form

#### Form Fields:
1. **Item Name** (required) - Text input
2. **Item Code** (required) - Text input
3. **Store** (OPTIONAL) - Dropdown
   - Label: "Store"
   - First option: "Default Store" (value: empty/null)
   - Populate from `/api/stores/dropdown`
   - Helper text: "If not selected, item will be saved to default store"
   - **Default:** Empty (will use default store)

4. **Item Group** (optional) - Dropdown
   - Populate from `/api/item-groups/dropdown`
   - First option: "Select Group" (value: empty)

5. **Brand** (optional) - Dropdown
   - Populate from `/api/brands/dropdown`
   - First option: "Select Brand"

6. **Supplier** (optional) - Dropdown
   - Populate from `/api/suppliers/dropdown`
   - First option: "Select Supplier"

7. **Selling Price** (required) - Number input
8. **Cost Price** (optional) - Number input
9. **Stock Quantity** (optional) - Number input, default: 0
10. **Unit** (optional) - Text input (e.g., "piece", "kg", "liter")
11. **SKU** (optional) - Text input
12. **Status** (optional) - Dropdown: "Active", "Inactive", default: "Active"
13. **Description** (optional) - Textarea
14. **Barcode** (optional) - Text input
15. **Min Stock Level** (optional) - Number input, default: 5
16. **Tax Percentage** (optional) - Number input
17. **Discount** (optional) - Number input
18. **Image** (optional) - File upload or URL input
19. **Notes** (optional) - Textarea

#### Form Behavior:
- **Create Mode:**
  - If store is not selected, show a message: "Item will be saved to default store"
  - Submit without `store_id` if not selected
  - Show success message with store name where item was saved

- **Edit Mode:**
  - Pre-populate all fields
  - Allow changing store
  - If store is cleared, use default store

#### Validation:
- Item Name: Required, min 2 characters
- Item Code: Required, unique
- Selling Price: Required, must be > 0
- Stock Quantity: Must be >= 0
- Min Stock Level: Must be >= 0

---

### 3. State Management

#### Recommended State Structure:
```typescript
interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  filters: {
    store_id: number | null;
    item_group_id: number | null;
    status: string | null;
    brand_id: number | null;
    supplier_id: number | null;
    search: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sort: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
}
```

#### API Call Example (React/TypeScript):
```typescript
const fetchInventoryItems = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    
    // Add pagination
    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());
    
    // Add filters (only if they have values)
    if (filters.store_id) {
      params.append('store_id', filters.store_id.toString());
    }
    if (filters.item_group_id) {
      params.append('item_group_id', filters.item_group_id.toString());
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.brand_id) {
      params.append('brand_id', filters.brand_id.toString());
    }
    if (filters.supplier_id) {
      params.append('supplier_id', filters.supplier_id.toString());
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    // Add sorting
    params.append('sort', `${sort.field} ${sort.direction}`);
    
    const response = await fetch(`/api/inventory?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      setItems(data.data);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: data.totalPages
      });
    }
  } catch (error) {
    setError('Failed to fetch inventory items');
  } finally {
    setLoading(false);
  }
};
```

---

### 4. User Experience Flow

#### Scenario 1: View All Items
1. User opens Inventory tab
2. Store filter shows "All Stores" (default)
3. Group filter shows "All Groups" (default)
4. All items from all stores are displayed
5. User can see store name in each row

#### Scenario 2: Filter by Store
1. User selects a specific store from dropdown
2. Only items from that store are displayed
3. Store name column shows the same store for all items

#### Scenario 3: Filter by Group
1. User selects a specific item group
2. Only items from that group are displayed
3. Group name column shows the same group for all items

#### Scenario 4: Filter by Store and Group
1. User selects both store and group
2. Items matching both filters are displayed

#### Scenario 5: Add New Item
1. User clicks "Add New Item" button
2. Modal/form opens
3. User fills required fields (item_name, item_code, selling_price)
4. User can optionally select a store (or leave empty for default)
5. User submits form
6. If store was not selected, show success message: "Item saved to [Default Store Name]"
7. Form closes, table refreshes

---

### 5. UI/UX Best Practices

1. **Loading States:**
   - Show skeleton loaders or spinner while fetching
   - Disable filters during loading

2. **Error Handling:**
   - Display user-friendly error messages
   - Show retry button on error
   - Handle network errors gracefully

3. **Empty States:**
   - Show helpful message when no items found
   - Provide action to clear filters or add new item

4. **Responsive Design:**
   - Mobile: Stack filters vertically, scrollable table
   - Tablet: 2-column filter layout
   - Desktop: Full horizontal layout

5. **Accessibility:**
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader friendly

6. **Performance:**
   - Debounce search input (300-500ms)
   - Implement virtual scrolling for large lists
   - Cache dropdown data

---

### 6. Additional Features to Consider

1. **Bulk Actions:**
   - Select multiple items
   - Bulk update status
   - Bulk delete

2. **Export:**
   - Export to CSV/Excel
   - Apply current filters to export

3. **Quick Actions:**
   - Quick edit inline
   - Duplicate item
   - View item history

4. **Visual Indicators:**
   - Low stock warning (red/orange badge)
   - Out of stock indicator
   - Status badges with colors

---

## Testing Checklist

- [ ] Load all items without filters
- [ ] Filter by store (single store)
- [ ] Filter by group (single group)
- [ ] Filter by store and group together
- [ ] Search functionality
- [ ] Pagination works correctly
- [ ] Sorting works on all columns
- [ ] Create item without store (uses default)
- [ ] Create item with store
- [ ] Edit item
- [ ] Delete item
- [ ] Low stock alert
- [ ] Responsive design on mobile/tablet
- [ ] Error handling
- [ ] Loading states

---

## Summary

**Key Points:**
1. **Store filter is OPTIONAL** - Users can view all items or filter by store
2. **Group filter is OPTIONAL** - Users can view all items or filter by group
3. **Store selection in create form is OPTIONAL** - Default store is used if not selected
4. **All items are visible by default** - No mandatory filters required
5. **Flexible filtering** - Combine multiple filters for precise results

This implementation provides maximum flexibility while maintaining a clean and intuitive user experience.



