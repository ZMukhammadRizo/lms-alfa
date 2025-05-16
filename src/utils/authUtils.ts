/**
 * Authentication and Permission Utilities
 *
 * This file provides utilities for checking user permissions and roles
 * that can be reused throughout the application.
 */

/**
 * Check if the current user has a specific permission
 *
 * @param permissionName The name of the permission to check
 * @returns true if the user has the permission, false otherwise
 */
export const hasPermission = (permissionName: string): boolean => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) {
		return false
	}

	try {
		const parsedInfo = JSON.parse(userInfo)

		// Check if permissions array exists and contains the permission
		if (parsedInfo.permissions && Array.isArray(parsedInfo.permissions)) {
			return parsedInfo.permissions.includes(permissionName)
		}

		// Check if role object has permissions
		if (
			parsedInfo.role &&
			parsedInfo.role.permissions &&
			Array.isArray(parsedInfo.role.permissions)
		) {
			return parsedInfo.role.permissions.includes(permissionName)
		}

		return false
	} catch (error) {
		console.error('Error parsing user info:', error)
		return false
	}
}

/**
 * Check if the current user has a specific role
 *
 * @param roleName The name of the role to check
 * @returns true if the user has the role, false otherwise
 */
export const hasRole = (roleName: string): boolean => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) {
		return false
	}

	try {
		const parsedInfo = JSON.parse(userInfo)

		if (parsedInfo.role && typeof parsedInfo.role === 'string') {
			return parsedInfo.role.toLowerCase() === roleName.toLowerCase()
		}

		if (parsedInfo.role && typeof parsedInfo.role === 'object' && parsedInfo.role.name) {
			return parsedInfo.role.name.toLowerCase() === roleName.toLowerCase()
		}

		return false
	} catch (error) {
		console.error('Error parsing user info:', error)
		return false
	}
}

/**
 * Check if the current user is a role manager
 *
 * @returns true if the user is a role manager, false otherwise
 */
export const isRoleManager = (): boolean => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) {
		return false
	}

	try {
		const parsedInfo = JSON.parse(userInfo)

		if (parsedInfo.isRoleManager) {
			return parsedInfo.isRoleManager || false
		}

		return false
	} catch (error) {
		console.error('Error parsing user info:', error)
		return false
	}
}

/**
 * Check if the current user is a module leader
 *
 * @returns true if the user is a module leader, false otherwise
 */
export const isModuleLeader = (): boolean => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) {
		return false
	}

	try {
		const parsedInfo = JSON.parse(userInfo)

		if (parsedInfo.role && typeof parsedInfo.role === 'object') {
			return parsedInfo.role.name === 'ModuleLeader' || false
		}

		if (parsedInfo.role && typeof parsedInfo.role === 'string') {
			return parsedInfo.role === 'ModuleLeader' || false
		}

		if (parsedInfo.isModuleLeader) {
			return parsedInfo.isModuleLeader || false
		}

		return false
	} catch (error) {
		console.error('Error parsing user info:', error)
		return false
	}
}

/**
 * Check if the current user has announcement permissions
 *
 * @param operation The operation to check (create, read, update, delete)
 * @returns true if the user has permission, false otherwise
 */
export const hasAnnouncementPermission = (
	operation: 'create' | 'read' | 'update' | 'delete'
): boolean => {
	// SuperAdmin and Admin always have all permissions
	if (hasRole('SuperAdmin') || hasRole('Admin')) {
		return true
	}

	// Check for specific permission
	return hasPermission(`${operation}_announcements`)
}

/**
 * Get the current user's roles
 *
 * @returns The user's role name or "Unknown" if not found
 */
export const getUserRole = (): string => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) {
		return 'Unknown'
	}

	try {
		const parsedInfo = JSON.parse(userInfo)

		if (parsedInfo.role && typeof parsedInfo.role === 'string') {
			return parsedInfo.role
		}

		if (parsedInfo.role && typeof parsedInfo.role === 'object' && parsedInfo.role.name) {
			return parsedInfo.role.name
		}

		return 'Unknown'
	} catch (error) {
		console.error('Error parsing user info:', error)
		return 'Unknown'
	}
}

/**
 * Get the current user's parent role
 *
 * @returns The user's parent role name or "Unknown" if not found
 */
export const getUserParentRole = (): string => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) {
		return 'Unknown'
	}

	try {
		const parsedInfo = JSON.parse(userInfo)

		if (parsedInfo.role && typeof parsedInfo.role === 'object' && parsedInfo.role.parent) {
			return parsedInfo.role.parent.name || 'Unknown'
		}

		return 'Unknown'
	} catch (error) {
		console.error('Error parsing user info:', error)
		return 'Unknown'
	}
}
