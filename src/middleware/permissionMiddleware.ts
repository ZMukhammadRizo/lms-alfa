/**
 * React router middleware to protect routes based on permissions
 * Use with react-router-dom components
 *
 * @param requiredPermission Permission needed to access the route
 * @returns Boolean indicating if access is allowed
 */
export const usePermissionGuard = (requiredPermission: string): boolean => {
	// Get current user from localStorage
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) return false

	try {
		const user = JSON.parse(userInfo)

		// SuperAdmin bypass
		if (
			user.role === 'SuperAdmin' ||
			(typeof user.role === 'object' && user.role.name === 'SuperAdmin')
		) {
			return true
		}

		// Check cached permissions first (faster)
		if (user.permissions && Array.isArray(user.permissions)) {
			return user.permissions.includes(requiredPermission)
		}

		// Fallback: if permissions aren't cached, return false
		// The app should call syncUserPermissions() on login/refresh
		return false
	} catch (error) {
		console.error('Error in permission guard:', error)
		return false
	}
}

/**
 * React router middleware to check if user has any of the specified permissions
 *
 * @param permissions Array of permissions (any one is sufficient)
 * @returns Boolean indicating if access is allowed
 */
export const useAnyPermissionGuard = (permissions: string[]): boolean => {
	// Get current user from localStorage
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) return false

	try {
		const user = JSON.parse(userInfo)

		// SuperAdmin bypass
		if (
			user.role === 'SuperAdmin' ||
			(typeof user.role === 'object' && user.role.name === 'SuperAdmin')
		) {
			return true
		}

		// Check cached permissions first (faster)
		if (user.permissions && Array.isArray(user.permissions)) {
			return permissions.some(perm => user.permissions.includes(perm))
		}

		// Fallback: if permissions aren't cached, return false
		return false
	} catch (error) {
		console.error('Error in permission guard:', error)
		return false
	}
}

/**
 * React router middleware to check if user has all specified permissions
 *
 * @param permissions Array of permissions (all are required)
 * @returns Boolean indicating if access is allowed
 */
export const useAllPermissionsGuard = (permissions: string[]): boolean => {
	// Get current user from localStorage
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) return false

	try {
		const user = JSON.parse(userInfo)

		// SuperAdmin bypass
		if (
			user.role === 'SuperAdmin' ||
			(typeof user.role === 'object' && user.role.name === 'SuperAdmin')
		) {
			return true
		}

		// Check cached permissions first (faster)
		if (user.permissions && Array.isArray(user.permissions)) {
			return permissions.every(perm => user.permissions.includes(perm))
		}

		// Fallback: if permissions aren't cached, return false
		return false
	} catch (error) {
		console.error('Error in permission guard:', error)
		return false
	}
}

/**
 * Function to check permission before making API calls or performing protected operations
 * This is for synchronous, non-component code
 *
 * @param requiredPermission Permission needed for the operation
 * @returns Boolean indicating if operation is allowed
 */
export const checkPermissionSync = (requiredPermission: string): boolean => {
	// Reuse the usePermissionGuard logic
	return usePermissionGuard(requiredPermission)
}

/**
 * Function to check if user has any of the permissions before making API calls
 * This is for synchronous, non-component code
 *
 * @param permissions Array of permissions (any one is sufficient)
 * @returns Boolean indicating if operation is allowed
 */
export const checkAnyPermissionSync = (permissions: string[]): boolean => {
	// Reuse the useAnyPermissionGuard logic
	return useAnyPermissionGuard(permissions)
}

/**
 * Function to check if user has all permissions before making API calls
 * This is for synchronous, non-component code
 *
 * @param permissions Array of permissions (all are required)
 * @returns Boolean indicating if operation is allowed
 */
export const checkAllPermissionsSync = (permissions: string[]): boolean => {
	// Reuse the useAllPermissionsGuard logic
	return useAllPermissionsGuard(permissions)
}
