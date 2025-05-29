import supabase from '../config/supabaseClient'

// Cache for role permissions to avoid repetitive database queries
const permissionsCache: Record<string, string[]> = {}
const directPermissionsCache: Record<string, string[]> = {}

/**
 * Gets all permissions for a role, including inherited permissions
 * from parent roles in the hierarchy.
 *
 * @param roleId The role ID to get permissions for
 * @param useCache Whether to use cached permissions (default: true)
 * @returns Array of permission names
 */
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

	// Recursive function to get permissions from a role and its parents
	const getPermissionsFromRole = async (currentRoleId: string) => {
		try {
			// Get role data including parent role
			const { data: roleData, error: roleError } = await supabase
				.from('roles')
				.select('id, parent_role')
				.eq('id', currentRoleId)
				.single()

			if (roleError || !roleData) {
				console.error('Error fetching role:', roleError)
				return
			}

			// Get direct permissions for this role from role_permissions table
			const { data: rolePermissions, error: permissionsError } = await supabase
				.from('role_permissions')
				.select(
					`
					permission_id,
					permissions:permission_id (name)
				`
				)
				.eq('role_id', currentRoleId)

			if (permissionsError) {
				console.error('Error fetching role permissions:', permissionsError)
			} else if (rolePermissions && rolePermissions.length > 0) {
				// Add permission names to set
				rolePermissions.forEach(item => {
					if (
						item.permissions &&
						typeof item.permissions === 'object' &&
						'name' in item.permissions
					) {
						const permName = item.permissions.name
						if (permName && typeof permName === 'string') {
							permissionNames.add(permName)
						}
					}
				})
			}

			// Recursively get permissions from parent role if it exists
			if (roleData.parent_role) {
				await getPermissionsFromRole(roleData.parent_role)
			}
		} catch (error) {
			console.error('Error in permission inheritance:', error)
		}
	}

	// Start the recursive process
	await getPermissionsFromRole(roleId)

	// Convert set to array
	const permissions = Array.from(permissionNames)

	// Cache the result
	if (useCache) {
		permissionsCache[roleId] = permissions
	}

	return permissions
}

/**
 * Gets ONLY the direct permissions for a role WITHOUT any inheritance from parent roles.
 * This ensures we only store the permissions directly assigned to a role.
 *
 * @param roleId The role ID to get direct permissions for
 * @param useCache Whether to use cached permissions (default: true)
 * @returns Array of direct permission names for this role only
 */
export const getDirectRolePermissions = async (
	roleId: string,
	useCache: boolean = true
): Promise<string[]> => {
	// Check cache first if enabled
	if (useCache && directPermissionsCache[roleId]) {
		return directPermissionsCache[roleId]
	}

	// Array to store permission names
	const permissionNames: string[] = []

	try {
		// Get direct permissions for this role from role_permissions table
		const { data: rolePermissions, error: permissionsError } = await supabase
			.from('role_permissions')
			.select(
				`
				permission_id,
				permissions:permission_id (name)
			`
			)
			.eq('role_id', roleId)

		if (permissionsError) {
			console.error('Error fetching direct role permissions:', permissionsError)
		} else if (rolePermissions && rolePermissions.length > 0) {
			// Add permission names to array
			rolePermissions.forEach(item => {
				if (
					item.permissions &&
					typeof item.permissions === 'object' &&
					'name' in item.permissions
				) {
					const permName = item.permissions.name
					if (permName && typeof permName === 'string') {
						permissionNames.push(permName)
					}
				}
			})
		}
	} catch (error) {
		console.error('Error fetching direct permissions:', error)
	}

	// Cache the result
	if (useCache) {
		directPermissionsCache[roleId] = permissionNames
	}

	return permissionNames
}

/**
 * Clears the permissions cache - call this when roles or permissions are updated
 */
export const clearPermissionsCache = () => {
	Object.keys(permissionsCache).forEach(key => {
		delete permissionsCache[key]
	})
	Object.keys(directPermissionsCache).forEach(key => {
		delete directPermissionsCache[key]
	})
}

/**
 * Gets the primary role ID for a user
 *
 * @param userId The user ID to get the role for
 * @returns The primary role ID or null if not found
 */
export const getUserRoleId = async (userId: string): Promise<string | null> => {
	try {
		// Get user's role directly from the users table
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('role_id')
			.eq('id', userId)
			.single()

		if (userError) {
			console.error('Error fetching user role_id:', userError)

			// If no direct role_id, try to get role from the role name
			const { data: userWithRole, error: roleNameError } = await supabase
				.from('users')
				.select('role')
				.eq('id', userId)
				.single()

			if (roleNameError || !userWithRole || !userWithRole.role) {
				console.error('Error fetching user role name:', roleNameError)
				return null
			}

			// Get the role name (could be string or object)
			const roleName =
				typeof userWithRole.role === 'string'
					? userWithRole.role
					: typeof userWithRole.role === 'object' && userWithRole.role?.name
					? userWithRole.role.name
					: null

			if (!roleName) {
				console.error('Could not determine role name')
				return null
			}

			// Get the role_id from the roles table using the name
			const { data: roleData, error: roleError } = await supabase
				.from('roles')
				.select('id')
				.eq('name', roleName)
				.single()

			if (roleError) {
				console.error('Error fetching role by name:', roleError)
				return null
			}

			return roleData?.id || null
		}

		return userData?.role_id || null
	} catch (error) {
		console.error('Error getting user role ID:', error)
		return null
	}
}

/**
 * Checks if the user has the required permission,
 * including inherited permissions from their role hierarchy
 *
 * @param userId The user ID to check permissions for
 * @param requiredPermission The permission to check
 * @returns Boolean indicating if user has permission
 */
export const checkPermission = async (
	userId: string,
	requiredPermission: string
): Promise<boolean> => {
	try {
		// Get user's role ID
		const roleId = await getUserRoleId(userId)
		if (!roleId) return false

		// Get all permissions for this role including inherited ones
		const permissions = await getRolePermissionsWithInheritance(roleId)

		// Check if the required permission is in the list
		return permissions.includes(requiredPermission)
	} catch (error) {
		console.error('Error checking permission:', error)
		return false
	}
}

/**
 * Gets all permissions for a user, including permissions
 * inherited from parent roles in the hierarchy
 *
 * @param userId The user ID to get permissions for
 * @returns Array of permission names the user has
 */
export const getUserPermissions = async (userId: string): Promise<string[]> => {
	try {
		// Get user's role ID
		const roleId = await getUserRoleId(userId)
		if (!roleId) return []

		// Get all permissions for this role including inherited ones
		return await getRolePermissionsWithInheritance(roleId)
	} catch (error) {
		console.error('Error getting user permissions:', error)
		return []
	}
}

/**
 * Checks if the current authenticated user has the required permission
 * based on their role's assigned permissions
 *
 * @param requiredPermission The permission to check
 * @returns Boolean indicating if user has permission
 */
export const checkUserPermission = async (requiredPermission: string): Promise<boolean> => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) return false

	try {
		const parsedInfo = JSON.parse(userInfo)

		// Get user's role ID - either from cache or fetch it
		let roleId = parsedInfo.role_id
		if (!roleId) {
			// Fetch role ID if not available
			const fetchedRoleId = await getUserRoleId(parsedInfo.id)
			if (!fetchedRoleId) return false
			roleId = fetchedRoleId

			// Update local storage with role ID
			parsedInfo.role_id = roleId
			localStorage.setItem('lms_user', JSON.stringify(parsedInfo))
		}

		// Check cached permissions first
		if (parsedInfo.permissions && Array.isArray(parsedInfo.permissions)) {
			const hasPermission = parsedInfo.permissions.includes(requiredPermission)
			console.log(
				`Permission check for "${requiredPermission}": ${
					hasPermission ? 'Granted' : 'Denied'
				} (from cached direct role permissions)`
			)
			return hasPermission
		}

		// If no cached permissions, fetch them from the database
		// Get ONLY direct permissions specific to this role WITHOUT inheritance
		const permissions = await getDirectRolePermissions(roleId)

		// Update local storage with permissions
		parsedInfo.permissions = permissions
		localStorage.setItem('lms_user', JSON.stringify(parsedInfo))

		const hasPermission = permissions.includes(requiredPermission)
		console.log(
			`Permission check for "${requiredPermission}": ${
				hasPermission ? 'Granted' : 'Denied'
			} (from freshly fetched direct role permissions)`
		)
		return hasPermission
	} catch (error) {
		console.error('Error checking user permission:', error)
		return false
	}
}

/**
 * Gets all permissions for the current authenticated user
 * Only fetches direct permissions specific to the user's role WITHOUT inheritance
 *
 * @returns Array of permission names the user has
 */
export const getCurrentUserPermissions = async (): Promise<string[]> => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) return []

	try {
		const parsedInfo = JSON.parse(userInfo)

		// Get user's role ID - either from cache or fetch it
		let roleId = parsedInfo.role_id
		if (!roleId) {
			// Fetch role ID if not available
			const fetchedRoleId = await getUserRoleId(parsedInfo.id)
			if (!fetchedRoleId) return []
			roleId = fetchedRoleId

			// Update local storage with role ID
			parsedInfo.role_id = roleId
			localStorage.setItem('lms_user', JSON.stringify(parsedInfo))
		}

		// Get ONLY the direct permissions specifically assigned to this role WITHOUT inheritance
		return await getDirectRolePermissions(roleId)
	} catch (error) {
		console.error('Error getting user permissions:', error)
		return []
	}
}

/**
 * Syncs the user's permissions in local storage with the latest from the database
 * Call this after role changes or permission updates
 * Only stores direct permissions specific to the user's role WITHOUT inheritance
 *
 * @returns Updated array of user permissions
 */
export const syncUserPermissions = async (): Promise<string[]> => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) return []

	try {
		const parsedInfo = JSON.parse(userInfo)
		if (!parsedInfo.id) return []

		// Clear permissions cache to ensure fresh data
		clearPermissionsCache()

		// Get user's role ID
		const roleId = await getUserRoleId(parsedInfo.id)
		if (!roleId) return []

		// Get ONLY the direct permissions specific to this role WITHOUT inheritance
		const permissions = await getDirectRolePermissions(roleId, false)

		// Update local storage with role ID and direct role-specific permissions
		const updatedUserInfo = {
			...parsedInfo,
			role_id: roleId,
			permissions, // Store ONLY the direct permissions relevant to the user's role
		}

		localStorage.setItem('lms_user', JSON.stringify(updatedUserInfo))
		console.log(
			`Synced ${permissions.length} direct role-specific permissions for user with role ID ${roleId}`
		)

		return permissions
	} catch (error) {
		console.error('Error syncing user permissions:', error)
		return []
	}
}

/**
 * Wraps an operation with a permission check, only executing the operation
 * if the user has the required permission.
 *
 * @param requiredPermission Permission needed to perform the operation
 * @param operation Function to execute if permission check passes
 * @param onDenied Optional function to call if permission is denied
 * @returns Result of the operation or null if denied
 */
export const withPermissionCheck = async <T>(
	requiredPermission: string,
	operation: () => Promise<T>,
	onDenied?: () => void
): Promise<T | null> => {
	try {
		const hasPermission = await checkUserPermission(requiredPermission)

		if (hasPermission) {
			return await operation()
		} else {
			if (onDenied) {
				onDenied()
			}
			console.warn(`Permission denied: ${requiredPermission}`)
			return null
		}
	} catch (error) {
		console.error('Error in permission check:', error)
		throw error
	}
}

/**
 * Similar to withPermissionCheck but checks multiple permissions
 * The operation will be performed if ANY of the permissions pass
 *
 * @param requiredPermissions Array of permissions (any one is sufficient)
 * @param operation Function to execute if any permission check passes
 * @param onDenied Optional function to call if all permissions are denied
 * @returns Result of the operation or null if denied
 */
export const withAnyPermissionCheck = async <T>(
	requiredPermissions: string[],
	operation: () => Promise<T>,
	onDenied?: () => void
): Promise<T | null> => {
	try {
		const permissions = await getCurrentUserPermissions()
		const hasAnyPermission = requiredPermissions.some(perm => permissions.includes(perm))

		if (hasAnyPermission) {
			return await operation()
		} else {
			if (onDenied) {
				onDenied()
			}
			console.warn(`All permissions denied: ${requiredPermissions.join(', ')}`)
			return null
		}
	} catch (error) {
		console.error('Error in permission check:', error)
		throw error
	}
}

/**
 * Similar to withPermissionCheck but checks multiple permissions
 * The operation will be performed only if ALL of the permissions pass
 *
 * @param requiredPermissions Array of permissions (all are required)
 * @param operation Function to execute if all permission checks pass
 * @param onDenied Optional function to call if any permission is denied
 * @returns Result of the operation or null if denied
 */
export const withAllPermissionsCheck = async <T>(
	requiredPermissions: string[],
	operation: () => Promise<T>,
	onDenied?: () => void
): Promise<T | null> => {
	try {
		const permissions = await getCurrentUserPermissions()
		const hasAllPermissions = requiredPermissions.every(perm => permissions.includes(perm))

		if (hasAllPermissions) {
			return await operation()
		} else {
			if (onDenied) {
				onDenied()
			}
			console.warn(`Some permissions denied: ${requiredPermissions.join(', ')}`)
			return null
		}
	} catch (error) {
		console.error('Error in permission check:', error)
		throw error
	}
}

/**
 * Checks if a user has the required permission based on their role and permissions list
 *
 * @param currentUserRole The role of the current user
 * @param currentUserPermissions Array of permissions the current user has
 * @param requiredPermission The permission to check for
 * @returns Boolean indicating if the user has permission
 */
export function hasPermission({
	currentUserRole,
	currentUserPermissions,
	requiredPermission,
}: {
	currentUserRole: string
	currentUserPermissions: string[]
	requiredPermission: string
}): boolean {
	// Check if the user has the specific permission in their role-specific permissions
	return currentUserPermissions.includes(requiredPermission)
}
