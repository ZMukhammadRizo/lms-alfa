import { hasPermission } from './permissionUtils'

export const userCreationPermissionMap: Record<string, string> = {
	Teacher: 'create_teachers',
	Parent: 'create_parents',
	Student: 'create_students',
	Supervisor: 'create_supervisors',
	Admin: 'create_users',
}

/**
 * Checks if a user has permission to create a user with the specified role
 *
 * @param currentUserRole The role of the current user
 * @param currentUserPermissions Array of permissions the current user has
 * @param newUserRole The role of the user being created
 * @returns Boolean indicating if the user has permission
 */
export function canCreateUserWithRole({
	currentUserRole,
	currentUserPermissions,
	newUserRole,
}: {
	currentUserRole: string
	currentUserPermissions: string[]
	newUserRole: string
}): boolean {
	const requiredPermission = userCreationPermissionMap[newUserRole]

	return hasPermission({
		currentUserRole,
		currentUserPermissions,
		requiredPermission,
	})
}
