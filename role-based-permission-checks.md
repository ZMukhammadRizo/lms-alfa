✅ Guide: Role-Based Permission Checks (Reusable System)
🎯 Goal
Ensure that only users with the right permissions can perform actions like creating users — depending on their role and inherited permissions — using reusable, maintainable logic.

1. 📦 Create a hasPermission Utility Function
utils/permissions.ts

```ts
// utils/permissions.ts

export function hasPermission({
  currentUserRole,
  currentUserPermissions,
  requiredPermission,
}: {
  currentUserRole: string
  currentUserPermissions: string[]
  requiredPermission: string
}): boolean {
  const fullAccessRoles = ['Admin', 'SuperAdmin']
  if (fullAccessRoles.includes(currentUserRole)) return true
  return currentUserPermissions.includes(requiredPermission)
}
```
🧠 What it does:

Always allows Admin and SuperAdmin roles.

Otherwise, checks whether requiredPermission exists in the current user's permission list.

2. 🔁 Define Required Permissions Per Action
Create a centralized map of required permissions based on the role you're creating.

constants/permissionMap.ts
```ts
export const userCreationPermissionMap: Record<string, string> = {
  Teacher: 'create_teachers',
  Parent: 'create_parents',
  Student: 'create_students',
  Supervisor: 'create_supervisors',
}
```
3. 🧪 Use Permission Checks Before Supabase Requests
In your shared user creation logic:

services/userService.ts
```ts
import { hasPermission } from '@/utils/permissions'
import { userCreationPermissionMap } from '@/constants/permissionMap'
import { supabase } from '@/lib/supabase'

export async function createUserWithPermissionCheck({
  currentUserRole,
  currentUserPermissions,
  newUserRole,
  formData,
  showMessage,
}: {
  currentUserRole: string
  currentUserPermissions: string[]
  newUserRole: string
  formData: any
  showMessage: (msg: string) => void
}) {
  const requiredPermission = userCreationPermissionMap[newUserRole]

  if (!hasPermission({ currentUserRole, currentUserPermissions, requiredPermission })) {
    showMessage('❌ You do not have permission to create this type of user.')
    return
  }

  // ✅ Has permission – continue creating user
  const { data, error } = await supabase.from('users').insert([{ ...formData }])

  if (error) {
    showMessage('❌ Error creating user.')
    return
  }

  showMessage('✅ User created successfully!')
}
```

4. 📌 In Your Component (e.g. Admin User Management Page)
Wherever you call the user creation function, pass in the necessary data.

```ts
import { createUserWithPermissionCheck } from '@/services/userService'

await createUserWithPermissionCheck({
  currentUserRole: currentUser.role,
  currentUserPermissions: currentUser.permissions,
  newUserRole: form.role, // the role of the new user being created
  formData: form,         // form fields like name, email, etc.
  showMessage: (msg) => toast(msg), // or however you show messages
})
5. 📣 Telling Cursor or Future Devs
When using Cursor or working with collaborators, leave a comment like:
```
```ts
// ✅ Check permission before creating users
// This pattern uses `hasPermission()` utility — DO NOT duplicate logic.
✅ Benefits
🔁 Reusable: Use the same hasPermission function everywhere (delete, update, etc.)

🧩 Maintainable: Easy to add new permissions or roles.

🔒 Secure: Prevents unauthorized Supabase actions client-side.

```