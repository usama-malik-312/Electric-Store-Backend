# POS (Point of Sale) Implementation Guide

## Overview

A complete Point of Sale (POS) system has been implemented for the Electric Store Backend. This system allows you to process sales, manage transactions, track inventory, and generate sales reports.

## Database Setup

### Step 1: Run the Migration

Execute the SQL migration file to create the necessary tables:

```bash
psql -U your_username -d electric_store -f src/migrations/002_create_pos_tables.sql
```

Or manually run the SQL in your PostgreSQL client.

This will create:
- `sales` table - Stores sales transactions
- `sale_items` table - Stores line items for each sale
- Auto-generation of sale numbers (format: `SALE-YYYY-000001`)
- Indexes for performance optimization

## API Endpoints

### 1. Create Sale
**POST** `/api/pos/sales`

Create a new sale transaction.

**Required Permission:** `pos.create`

**Request Body:**
```json
{
  "store_id": 1,
  "customer_id": 5,  // Optional
  "items": [
    {
      "inventory_id": 10,
      "quantity": 2,
      "unit_price": 150.00,  // Optional, uses inventory price if not provided
      "tax_percentage": 5.0,  // Optional
      "discount_percentage": 10.0  // Optional
    },
    {
      "inventory_id": 15,
      "quantity": 1
    }
  ],
  "payment_method": "cash",  // cash, card, credit, mixed
  "amount_paid": 500.00,
  "discount_amount": 0,  // Optional, additional discount on total
  "notes": "Customer requested receipt"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sale_number": "SALE-2024-000001",
    "sale_date": "2024-01-15T10:30:00Z",
    "store_id": 1,
    "customer_id": 5,
    "user_id": 2,
    "subtotal": 450.00,
    "tax_amount": 22.50,
    "discount_amount": 0,
    "total_amount": 472.50,
    "payment_method": "cash",
    "payment_status": "paid",
    "amount_paid": 500.00,
    "amount_due": 0,
    "status": "completed",
    "items": [
      {
        "id": 1,
        "sale_id": 1,
        "inventory_id": 10,
        "item_name": "LED Bulb 10W",
        "item_code": "BULB-001",
        "unit_price": 150.00,
        "quantity": 2,
        "subtotal": 300.00,
        "tax_amount": 15.00,
        "total": 315.00
      }
    ]
  }
}
```

**Features:**
- Automatically calculates subtotals, taxes, and totals
- Updates inventory stock automatically
- Validates stock availability before sale
- Generates unique sale numbers automatically
- Supports multiple payment methods

### 2. Get Sale by ID
**GET** `/api/pos/sales/:id`

Get details of a specific sale.

**Required Permission:** `pos.read`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sale_number": "SALE-2024-000001",
    "sale_date": "2024-01-15T10:30:00Z",
    "store_id": 1,
    "customer_id": 5,
    "subtotal": 450.00,
    "total_amount": 472.50,
    "items": [...],
    "customer_name": "John Doe",
    "store_name": "Main Store"
  }
}
```

### 3. Get Paginated Sales
**GET** `/api/pos/sales`

Get a paginated list of sales with filters.

**Required Permission:** `pos.read`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Search by sale number or customer name
- `sort` (default: "sale_date DESC")
- `store_id` - Filter by store
- `customer_id` - Filter by customer
- `user_id` - Filter by cashier/salesperson
- `payment_status` - Filter by payment status (paid, partial, pending)
- `status` - Filter by sale status (completed, cancelled, refunded)
- `start_date` - Filter from date (YYYY-MM-DD)
- `end_date` - Filter to date (YYYY-MM-DD)

**Example:**
```
GET /api/pos/sales?page=1&limit=20&store_id=1&start_date=2024-01-01&end_date=2024-01-31
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

### 4. Cancel Sale
**POST** `/api/pos/sales/:id/cancel`

Cancel a sale and restore inventory stock.

**Required Permission:** `pos.update`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "cancelled",
    ...
  },
  "message": "Sale cancelled successfully"
}
```

**Note:** 
- Cannot cancel already cancelled or refunded sales
- Automatically restores stock to inventory

### 5. Get Sales Statistics
**GET** `/api/pos/statistics`

Get sales statistics and analytics.

**Required Permission:** `pos.read`

**Query Parameters:**
- `store_id` - Filter by store (optional)
- `start_date` - Filter from date (optional)
- `end_date` - Filter to date (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sales": "150",
    "total_revenue": "75000.00",
    "total_collected": "72000.00",
    "total_outstanding": "3000.00",
    "average_sale_amount": "500.00"
  }
}
```

## Features

### 1. Automatic Stock Management
- Stock is automatically deducted when a sale is created
- Stock is automatically restored when a sale is cancelled
- Validates stock availability before processing sale

### 2. Financial Calculations
- Automatic calculation of:
  - Item subtotals
  - Tax amounts (per item and total)
  - Discount amounts (per item and total)
  - Final totals
  - Amount due

### 3. Payment Handling
- Supports multiple payment methods: cash, card, credit, mixed
- Tracks payment status: paid, partial, pending
- Calculates amount due automatically

### 4. Sale Number Generation
- Automatic generation of unique sale numbers
- Format: `SALE-YYYY-000001`
- Sequential numbering per year

### 5. Historical Data Preservation
- Sale items store item details at time of sale
- Prices and item information are preserved even if inventory changes
- Complete audit trail with created_by, updated_by timestamps

## Permissions

The POS system uses the following permissions (already seeded in your system):

- `pos.create` - Create new sales
- `pos.read` - View sales and statistics
- `pos.update` - Cancel/update sales
- `pos.delete` - Delete sales (if needed in future)

**Default Role Permissions:**
- **Owner/Admin**: Full access (all permissions)
- **Manager**: Full access (all permissions)
- **Staff**: Can create and read sales (pos.create, pos.read)

## Error Handling

The system handles various error scenarios:

1. **Insufficient Stock**: Returns 400 error with message
2. **Invalid Item**: Returns 400 error if inventory item not found
3. **Invalid Sale**: Returns 404 error if sale not found
4. **Already Cancelled**: Returns 400 error if trying to cancel already cancelled sale
5. **Validation Errors**: Returns 400 error for missing/invalid required fields

## Integration with Existing Modules

The POS system integrates seamlessly with:

- **Inventory**: Uses inventory items, validates stock, updates stock
- **Customers**: Links sales to customers (optional)
- **Stores**: Associates sales with stores
- **Users**: Tracks which user/cashier processed the sale
- **Roles & Permissions**: Uses existing permission system

## Example Usage Flow

1. **Create a Sale:**
   ```bash
   POST /api/pos/sales
   {
     "store_id": 1,
     "customer_id": 5,
     "items": [
       {"inventory_id": 10, "quantity": 2},
       {"inventory_id": 15, "quantity": 1}
     ],
     "payment_method": "cash",
     "amount_paid": 500.00
   }
   ```

2. **View Sales:**
   ```bash
   GET /api/pos/sales?store_id=1&page=1&limit=20
   ```

3. **Get Sale Details:**
   ```bash
   GET /api/pos/sales/1
   ```

4. **Cancel Sale (if needed):**
   ```bash
   POST /api/pos/sales/1/cancel
   ```

5. **View Statistics:**
   ```bash
   GET /api/pos/statistics?store_id=1&start_date=2024-01-01&end_date=2024-01-31
   ```

## Next Steps

1. Run the database migration
2. Test the endpoints using Postman or your frontend
3. Integrate with your frontend POS interface
4. Optionally add:
   - Receipt generation
   - Barcode scanning support
   - Print functionality
   - Refund functionality
   - Credit payment tracking

## Notes

- All sales are soft-deleted (deleted_at column) for audit purposes
- Sale items preserve historical pricing data
- The system uses database transactions to ensure data consistency
- Stock updates are atomic (all or nothing)

