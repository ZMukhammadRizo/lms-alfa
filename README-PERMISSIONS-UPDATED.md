# LMS Alfa - Updated Roles & Permissions System

## Overview

LMS Alfa uses a sophisticated role-based access control (RBAC) system with hierarchical permission inheritance. This guide explains how the system has been updated to correctly handle role inheritance in the Supabase database schema.

## Database Schema

### Roles Table

```sql
create table public.roles (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  name character varying null,
  description text null,
  parent_role uuid null,
  "isPrimary" boolean null,
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name),
  constraint roles_parent_role_fkey foreign key (parent_role) references roles(id) on update cascade on delete cascade
);
```

Key features:

- `parent_role` enables role inheritance via self-referential relationship
- `isPrimary` indicates a default/primary role for a user

### Permissions Table

```sql
create table public.permissions (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text null,
  constraint permissions_pkey primary key (id),
  constraint permissions_name_key unique (name)
);
```

### Role-Permissions Join Table

```sql
create table public.role_permissions (
  role_id uuid not null,
  permission_id uuid not null,
  constraint role_permissions_pkey primary key (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign key (permission_id) references permissions(id),
  constraint role_permissions_role_id_fkey foreign key (role_id) references roles(id)
);
```

## How Permission Inheritance Works

1. A role inherits all permissions from its parent role
2. Permissions are recursively gathered up the role hierarchy
3. Users have permissions from their assigned role(s) and all parent roles

### Example Role Hierarchy

```
SuperAdmin
├── Admin
│   ├── SchoolAdministrator
│   │   ├── DepartmentHead
│   │   │   └── Teacher
```

In this example:

- A user with the Teacher role will have:
  - Permissions directly assigned to Teacher
  - Plus all permissions from DepartmentHead
  - Plus all permissions from SchoolAdministrator
  - Plus all permissions from Admin
  - (But not permissions from SuperAdmin, as it's not in the inheritance chain)

## Key Functions

### `getRolePermissionsWithInheritance(roleId, useCache = true)`

Recursively gathers all permissions for a role, including those inherited from parent roles:

```typescript
export const getRolePermissionsWithInheritance = async (
	roleId: string,
	useCache: boolean = true
): Promise<string[]> => {
	// Check cache first if enabled
	if (useCache && permissionsCache[roleId]) {
		return permissionsCache[roleId]
	}

	// Set to store unique permission names
	const permissionNames = new Set<string>()

	// Recursive function
	const getPermissionsFromRole = async (currentRoleId: string) => {
		// Get current role's permissions
		// ...

		// Recursively get permissions from parent role if it exists
		if (roleData.parent_role) {
			await getPermissionsFromRole(roleData.parent_role)
		}
	}

	await getPermissionsFromRole(roleId)

	// Convert set to array and cache
	const permissions = Array.from(permissionNames)
	if (useCache) {
		permissionsCache[roleId] = permissions
	}

	return permissions
}
```

### `getUserRoleId(userId)`

Gets the primary role ID for a user:

```typescript
export const getUserRoleId = async (userId: string): Promise<string | null> => {
	// First try to get primary role
	const { data } = await supabase
		.from('user_roles')
		.select('role_id, roles!inner(id, "isPrimary")')
		.eq('user_id', userId)
		.eq('roles.isPrimary', true)
		.single()

	if (data) return data.role_id

	// If no primary role, get any role
	const { data: anyRole } = await supabase
		.from('user_roles')
		.select('role_id')
		.eq('user_id', userId)
		.single()

	return anyRole?.role_id || null
}
```

## Using the Permission System

### 1. Checking Permissions

```typescript
// For server-side
const hasPermission = await checkPermission(userId, 'update_classes')

// For client-side (using current user)
const hasPermission = await checkUserPermission('update_classes')
```

### 2. UI Components with Permission Checks

```tsx
// Conditionally render UI elements
<PermissionGuard permission="update_classes">
  <button>Edit Class</button>
</PermissionGuard>

// Support multiple permissions (any will allow access)
<PermissionGuard permission={['update_classes', 'admin_classes']}>
  <button>Edit Class</button>
</PermissionGuard>
```

### 3. Protected Routes/Pages

```tsx
// Protect entire pages/routes
<WithPermission permission='read_classes' redirectTo='/dashboard'>
	<ClassesPage />
</WithPermission>
```

### 4. Operation Guards

```typescript
// Protection for async operations
await withPermissionCheck(
	'delete_classes',
	async () => {
		// This code only runs if user has permission
		await supabase.from('classes').delete().eq('id', classId)
	},
	() => {
		// This runs if permission is denied
		toast.error('Permission denied')
	}
)
```

### 5. API Middleware

```typescript
// Express middleware for API routes
app.delete('/api/classes/:id', requirePermission('delete_classes'), handleDeleteClass)

// Check for multiple permissions (any one is sufficient)
app.get('/api/reports', requireAnyPermission(['view_reports', 'admin_reports']), handleGetReports)
```

## Performance Optimization

The system includes performance optimizations:

1. **Permission Caching**: Results of recursive permission lookups are cached
2. **Cache Invalidation**: The cache is cleared after role changes or permission updates
3. **SuperAdmin Fast Path**: SuperAdmin checks bypass the need for database queries
4. **Role ID Storage**: User's role_id is stored to reduce database lookups

## How to Add New Permissions

1. Add the permission to the database:

```sql
INSERT INTO public.permissions (name, description, category)
VALUES ('manage_calendar', 'Create and manage calendar events', 'calendar');
```

2. Assign the permission to roles:

```sql
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Teacher' AND p.name = 'manage_calendar';
```

## Best Practices

1. Use the `[action]_[resource]` naming convention for permissions
2. Assign permissions to roles, not directly to users
3. Follow the principle of least privilege
4. Use permission inheritance to simplify role management
5. Keep SuperAdmin access limited to trusted users
6. Clear the permissions cache when updating roles or permissions
7. Prefer using the component helpers over manual permission checks
