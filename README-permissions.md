# Enhanced Permissions System Guide for LMS Alfa

## Overview

LMS Alfa uses a sophisticated role-based access control (RBAC) system with permission inheritance. This system provides:

1. **Fine-grained access control** using specific permissions
2. **Role hierarchy** where permissions are inherited from parent roles
3. **Permission-based UI components** for conditional rendering
4. **Permission middleware** for securing API calls

## Permission Structure

Permissions follow the `[action]_[resource]` naming pattern:

- **Actions**: `read`, `create`, `update`, `delete`, etc.
- **Resources**: `classes`, `students`, `teachers`, etc.

For example:

- `read_classes`: Permission to view classes
- `update_scores`: Permission to modify student scores
- `delete_submissions`: Permission to remove student submissions

## Role Hierarchy

Roles are organized in a hierarchical structure where child roles inherit permissions from their parents:

```
SuperAdmin
├── Admin
│   ├── RoleManager
│   ├── SchoolAdministrator
│   │   ├── DepartmentHead
│   │   │   ├── Teacher
│   │   │   │   ├── AssistantTeacher
│   │   │   │   └── SubstituteTeacher
│   │   ├── Counselor
│   │   └── OfficeStaff
│   └── SystemAdministrator
└── Parent
    └── Student
```

## Database Schema

The permissions system uses the following tables:

1. `roles`: Defines roles with a parent-child relationship
2. `permissions`: Lists all available permissions
3. `role_permissions`: Maps permissions to roles
4. `user_roles`: Maps users to roles

The SQL schema files are in:

- `sql/roles_permissions_schema.sql`: Database structure
- `sql/default_permissions.sql`: Default permission definitions
- `sql/default_roles.sql`: Default role hierarchy and role-permission mapping

## How to Use in Components

### 1. Simple Permission Check (Synchronous)

Use this method for quick permission checks without inheritance:

```tsx
import { hasPermission } from '../utils/authUtils'

// In a component
if (hasPermission('create_classes')) {
	// User has permission
}
```

### 2. Advanced Permission Check (Asynchronous with Inheritance)

For more comprehensive checks including inheritance:

```tsx
import { checkUserPermission } from '../utils/permissionUtils'

// In an async function or useEffect
const hasAccess = await checkUserPermission('update_classes')
if (hasAccess) {
	// User has permission (including inherited permissions)
}
```

### 3. Permission Guard Component

For conditional rendering based on permissions:

```tsx
import { PermissionGuard } from '../components/permissions'

// In your JSX
;<PermissionGuard permission='create_classes'>
	<button className='btn btn-primary'>Add New Class</button>
</PermissionGuard>
```

With fallback content:

```tsx
<PermissionGuard
	permission='generate_reports'
	fallback={<p>You don't have permission to view reports</p>}
>
	<ReportComponent />
</PermissionGuard>
```

### 4. WithPermission Component (Advanced)

For page-level protection with redirection:

```tsx
import { WithPermission } from '../components/permissions'

// In your JSX
;<WithPermission requiredPermission='read_classes' redirectTo='/dashboard' showToast={true}>
	<ClassManagementPage />
</WithPermission>
```

### 5. Permission Button

For buttons that are conditionally enabled:

```tsx
import { PermissionButton } from '../components/permissions'
;<PermissionButton
	permission='delete_classes'
	className='btn btn-danger'
	onClick={handleDelete}
	fallbackTooltip="You don't have permission to delete classes"
>
	Delete Class
</PermissionButton>
```

### 6. API Call Protection

To secure API calls:

```tsx
import { withPermissionCheck } from '../utils/permissionMiddleware'

const deleteClass = async (classId: string) => {
	await withPermissionCheck(
		'delete_classes',
		async () => {
			// This only runs if user has permission
			const { error } = await supabase.from('classes').delete().eq('id', classId)

			if (!error) {
				toast.success('Class deleted successfully')
			}
		},
		() => {
			// Optional: This runs if permission is denied
			console.log('Permission denied')
		}
	)
}
```

## Adding New Permissions

To add new permissions:

1. Define the permission with a clear `[action]_[resource]` name
2. Add the permission to `sql/default_permissions.sql`
3. Assign the permission to appropriate roles in `sql/default_roles.sql`
4. Run the SQL scripts to update the database

## Authentication Integration

The permission system is integrated with the authentication system, so permissions are:

1. Loaded at login time
2. Stored in the user object
3. Available in localStorage for quick access
4. Can be refreshed using `syncUserPermissions()`

## Example Usage

For a complete example of how to use all permission components, see `src/examples/ClassManagementExample.tsx`.

## Best Practices

1. Always use the most appropriate permission check method for your use case
2. Use `PermissionGuard` for simple UI elements
3. Use `WithPermission` for page-level protection
4. Use `withPermissionCheck` for API calls
5. Keep permission names consistent with the `[action]_[resource]` pattern
6. Assign permissions to roles based on the principle of least privilege

## Troubleshooting

If permission checks aren't working as expected:

1. Check if the user has the role assigned correctly
2. Verify that the role has the required permission
3. Check if permission inheritance is working properly
4. Use `syncUserPermissions()` to refresh permissions
5. Check browser console for any permission-related errors

## Role Templates

Default role templates are defined in `src/data/roleTemplates.ts`, which can be used to:

1. Create new roles with predefined permissions
2. Reset roles to their default state
3. Understand the intended permission structure

## Enhanced Permission System Features

The enhanced permission system includes the following new features:

### 1. Fine-grained Permissions

We've added many new fine-grained permissions that allow for more granular access control:

- **Resource-specific permissions**: `read_own_submissions`, `read_class_scores`, etc.
- **Dashboard-specific permissions**: `access_admin_dashboard`, `access_teacher_dashboard`, etc.
- **Functional area permissions**: Added for calendars, messages, journals, resources, etc.

### 2. Permission Components

The system now includes React components for easy permission checks in UI:

- **PermissionGuard**: For conditional rendering of UI elements

  ```tsx
  <PermissionGuard permission='update_classes'>
  	<button>Edit Class</button>
  </PermissionGuard>
  ```

- **WithPermission**: Higher-order component for page-level protection
  ```tsx
  <WithPermission permission='read_classes' redirectTo='/dashboard'>
  	<ClassListPage />
  </WithPermission>
  ```

### 3. Permission Check Functions

New utility functions for wrapping operations with permission checks:

- **withPermissionCheck**: For single permission checks

  ```tsx
  await withPermissionCheck('delete_classes', async () => {
  	// Protected operation here
  })
  ```

- **withAnyPermissionCheck**: For checks where any permission is sufficient

  ```tsx
  await withAnyPermissionCheck(['export_data', 'generate_reports'], async () => {
  	// Protected operation here
  })
  ```

- **withAllPermissionsCheck**: For checks where all permissions are required
  ```tsx
  await withAllPermissionsCheck(['update_scores', 'update_attendance'], async () => {
  	// Protected operation here
  })
  ```

### 4. API Protection Middleware

Server-side middleware for protecting API endpoints:

- **requirePermission**: For single permission checks

  ```typescript
  app.get('/api/classes', requirePermission('read_classes'), handleGetClasses)
  ```

- **requireAnyPermission**: For checks where any permission is sufficient

  ```typescript
  app.post(
  	'/api/reports',
  	requireAnyPermission(['generate_grade_reports', 'export_data']),
  	handleCreateReport
  )
  ```

- **requireAllPermissions**: For checks where all permissions are required
  ```typescript
  app.put(
  	'/api/system/settings',
  	requireAllPermissions(['manage_school_settings', 'backup_data']),
  	handleUpdateSettings
  )
  ```

### 5. Example Components

The system includes example components that demonstrate best practices:

- **ClassManagementExample**: A full component showcasing permission-based UI and operations

## How to Use the Enhanced System

1. Choose the appropriate method based on your use case:

   - UI elements: Use `PermissionGuard`
   - Pages/routes: Use `WithPermission`
   - API calls: Use `withPermissionCheck`, `withAnyPermissionCheck`, or `withAllPermissionsCheck`
   - Backend routes: Use the middleware functions

2. Always specify the required permission(s) using the `[action]_[resource]` format

3. Provide appropriate fallback content or behavior when permission is denied

## Performance Considerations

The enhanced system has been optimized for performance:

- Permission inheritance is computed and cached
- SuperAdmin checks are fast-tracked
- Permissions are loaded at login and stored in localStorage
- Background refresh of permissions when roles change
