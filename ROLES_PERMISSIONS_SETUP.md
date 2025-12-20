# Roles & Permissions System Setup Guide

## Overview

This document explains how to set up and use the complete roles and permissions system for the Electric Store backend.

## Database Setup

### Step 1: Run Migration

Execute the SQL migration file to create the necessary tables:

```bash
psql -U your_username -d electric_store -f src/migrations/001_create_roles_permissions.sql
```

Or manually run the SQL in your PostgreSQL client.

### Step 2: Seed Roles and Permissions

Run the seeding script to populate default roles and permissions:

```bash
npx ts-node src/scripts/seedRolesAndPermissions.ts
```

This will:
- Create 4 default roles: `owner`, `admin`, `manager`, `staff`
- Create permissions for all modules (users, brands, stores, inventory, suppliers, item_groups, customers, pos, invoices, roles)
- Assign all permissions to `owner` and `admin`
- Assign limited permissions to `staff` (read-only + POS/invoice create)
- Assign manager permissions (read/write, no delete for critical resources)

## Database Schema

### Tables Created

1. **roles**
   - `id` (PK)
   - `name` (unique)
   - `description`
   - `is_system` (boolean) - System roles cannot be deleted
   - `created_at`, `updated_at`

2. **permissions**
   - `id` (PK)
   - `module` (e.g., "brands", "users")
   - `action` (e.g., "create", "read", "update", "delete")
   - `code` (unique, e.g., "brands.create")
   - `description`
   - `created_at`, `updated_at`

3. **role_permissions**
   - `id` (PK)
   - `role_id` (FK → roles.id)
   - `permission_id` (FK → permissions.id)
   - Unique constraint on (role_id, permission_id)

4. **users** (updated)
   - Added `role_id` (FK → roles.id)

## API Endpoints

### Roles Management

#### GET `/api/roles`
Get all roles (paginated, searchable, sortable)

**Required Permission:** `roles.read`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (optional)
- `sort` (optional, default: "name ASC")

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 4,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### POST `/api/roles`
Create a new role

**Required Permission:** `roles.create`

**Request Body:**
```json
{
  "name": "custom_role",
  "description": "Custom role description"
}
```

#### PUT `/api/roles/:id`
Update role name or description

**Required Permission:** `roles.update`

**Request Body:**
```json
{
  "name": "updated_name",
  "description": "Updated description"
}
```

**Note:** Cannot update system roles (owner, admin)

#### DELETE `/api/roles/:id`
Delete a role

**Required Permission:** `roles.delete`

**Constraints:**
- Cannot delete system roles
- Cannot delete roles with assigned users

#### GET `/api/roles/:id/permissions`
Get all permissions with assignment status for a role

**Required Permission:** `roles.read`

**Response:**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 1,
      "name": "staff",
      "description": "Staff member"
    },
    "permissions": [
      {
        "id": 1,
        "module": "brands",
        "action": "create",
        "code": "brands.create",
        "assigned": false
      },
      {
        "id": 2,
        "module": "brands",
        "action": "read",
        "code": "brands.read",
        "assigned": true
      }
    ]
  }
}
```

#### POST `/api/roles/:id/permissions`
Update role permissions

**Required Permission:** `roles.update`

**Request Body:**
```json
{
  "permissions": [
    "brands.create",
    "brands.read",
    "brands.update",
    "users.read"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 1,
      "name": "staff"
    },
    "permissions": [
      {
        "code": "brands.create",
        "module": "brands",
        "action": "create"
      }
    ]
  },
  "message": "Role permissions updated successfully"
}
```

## Authentication & Permissions

### Login Response

When a user logs in, the response now includes permissions:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "staff",
      "role_id": 4,
      "full_name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "permissions": [
      "brands.read",
      "customers.read",
      "inventory.read",
      "pos.create",
      "invoices.create"
    ]
  }
}
```

### Permission Middleware

All routes now use permission-based middleware instead of role-based:

```typescript
import { checkPermission } from '../middleware/permissions';

// Single permission
router.post('/', checkPermission('brands.create'), controller.createBrand);

// Multiple permissions (any)
router.get('/', checkAnyPermission(['brands.read', 'brands.update']), controller.getBrands);

// Multiple permissions (all)
router.delete('/', checkAllPermissions(['brands.delete', 'brands.manage']), controller.deleteBrand);
```

## Route Protection

All CRUD routes are now protected with permission middleware:

| Route | Method | Permission Required |
|-------|--------|-------------------|
| `/api/brands` | POST | `brands.create` |
| `/api/brands` | GET | `brands.read` |
| `/api/brands/:id` | GET | `brands.read` |
| `/api/brands/:id` | PUT | `brands.update` |
| `/api/brands/:id` | DELETE | `brands.delete` |
| `/api/brands/dropdown` | GET | `brands.read` |

Same pattern applies to:
- `/api/inventory`
- `/api/customers`
- `/api/stores`
- `/api/suppliers`
- `/api/item-groups`
- `/api/users`
- `/api/roles`

## Default Permissions

### Owner & Admin
- All permissions (`*`)

### Manager
- Read all modules
- Create/Update most modules
- No delete permissions for critical resources
- No user/role management

### Staff
- Read-only for most modules
- Can create POS invoices
- Can create invoices

## Migration from Role String to Role ID

The seeding script automatically migrates existing users:

```sql
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE LOWER(u.role) = LOWER(r.name)
AND u.role_id IS NULL
```

## Updating User Roles

To assign a role to a user, update the `role_id` field:

```sql
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'manager')
WHERE id = 1;
```

Or via API (if you have a user update endpoint with proper permissions).

## Testing

1. **Run migration:**
   ```bash
   psql -U postgres -d electric_store -f src/migrations/001_create_roles_permissions.sql
   ```

2. **Seed data:**
   ```bash
   npx ts-node src/scripts/seedRolesAndPermissions.ts
   ```

3. **Test login:**
   - Login with a user
   - Verify permissions array in response
   - Verify JWT token contains permissions

4. **Test permissions:**
   - Try accessing routes with different user roles
   - Verify 403 Forbidden for unauthorized permissions
   - Verify 200 OK for authorized permissions

## Troubleshooting

### Issue: Users don't have role_id
**Solution:** Run the migration script or manually update:
```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'staff') WHERE role_id IS NULL;
```

### Issue: Permissions not in login response
**Solution:** Ensure user has a valid `role_id` and the role has permissions assigned.

### Issue: 403 Forbidden on all routes
**Solution:** Check that:
1. User has a role assigned (`role_id` is not NULL)
2. Role has permissions assigned
3. JWT token contains permissions (check token payload)

### Issue: Cannot delete role
**Solution:** Ensure:
1. Role is not a system role (`is_system = false`)
2. No users are assigned to the role

## Next Steps

1. Update frontend to use permissions instead of roles
2. Implement permission checks in frontend UI
3. Add permission management UI for admins
4. Consider adding permission inheritance or groups
5. Add audit logging for permission changes

