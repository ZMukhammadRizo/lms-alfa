/**
 * Authentication and Permission Utilities
 *
 * This file provides utilities for checking user permissions and roles
 * that can be reused throughout the application.
 */

import { checkUserPermission, getCurrentUserPermissions } from './permissionUtils'

/**
 * Check if the current user has a specific permission
 * This is a synchronous version that checks only local storage
 * For a more comprehensive check that includes permission inheritance, use checkUserPermission
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

		// SuperAdmin role always has all permissions
		if (hasRole('SuperAdmin')) {
			return true
		}

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

		// Check for RoleManager role first
		if (hasRole('RoleManager')) {
			return true
		}

		// Fallback to older isRoleManager flag
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

		// Direct string role
		if (parsedInfo.role && typeof parsedInfo.role === 'string') {
			return parsedInfo.role
		}

		// Object with name property
		if (parsedInfo.role && typeof parsedInfo.role === 'object') {
			// If the user is a RoleManager and has a parent role, return the parent role
			if (parsedInfo.isRoleManager && parsedInfo.role.parent && parsedInfo.role.parent.name) {
				return parsedInfo.role.parent.name
			}

			// Check if it has a name property
			if (parsedInfo.role.name && typeof parsedInfo.role.name === 'string') {
				return parsedInfo.role.name
			}

			// If it has a parent role with a name, use that
			if (
				parsedInfo.role.parent &&
				typeof parsedInfo.role.parent === 'object' &&
				parsedInfo.role.parent.name &&
				typeof parsedInfo.role.parent.name === 'string'
			) {
				return parsedInfo.role.parent.name
			}

			// If role is an object but doesn't have expected properties
			console.warn('Role object found but missing name property:', parsedInfo.role)
		}

		// Check if we have roleName as a backup
		if (parsedInfo.roleName && typeof parsedInfo.roleName === 'string') {
			return parsedInfo.roleName
		}

		// Fall back to a default role for safety
		console.warn('Could not determine user role from:', parsedInfo)
		return 'Student' // Default to Student as the safest option
	} catch (error) {
		console.error('Error parsing user info:', error)
		return 'Student' // Default to Student if there's an error
	}
}

/**
 * Get the current user's parent role
 *
 * @returns The user's parent role name or null if not found
 */
export const getUserParentRole = (): string | null => {
	const userInfo = localStorage.getItem('lms_user')
	if (!userInfo) {
		return null
	}

	try {
		const parsedInfo = JSON.parse(userInfo)

		if (parsedInfo.role && typeof parsedInfo.role === 'object') {
			// Check if role has a direct parent property that's an object with a name
			if (
				parsedInfo.role.parent &&
				typeof parsedInfo.role.parent === 'object' &&
				parsedInfo.role.parent.name &&
				typeof parsedInfo.role.parent.name === 'string'
			) {
				return parsedInfo.role.parent.name
			}

			// Check if role has a parentRole property that's a string
			if (parsedInfo.role.parentRole && typeof parsedInfo.role.parentRole === 'string') {
				return parsedInfo.role.parentRole
			}
		}

		// Check if there's a parentRole at the top level
		if (parsedInfo.parentRole && typeof parsedInfo.parentRole === 'string') {
			return parsedInfo.parentRole
		}

		// No parent role found
		return null
	} catch (error) {
		console.error('Error parsing user info:', error)
		return null
	}
}

/**
 * Wrapper for the async checkUserPermission function from permissionUtils.
 * Can be used in place of hasPermission when permission inheritance is needed.
 *
 * @param permissionName Permission to check
 * @param callback Function to call if permission granted
 * @param fallback Optional function to call if permission denied
 */
export const withPermission = async (
	permissionName: string,
	callback: () => void,
	fallback?: () => void
): Promise<void> => {
	const hasPermission = await checkUserPermission(permissionName)
	if (hasPermission) {
		callback()
	} else if (fallback) {
		fallback()
	}
}

/**
 * Get all permissions for the current user
 *
 * @returns Array of permission names
 */
export const getUserPermissions = async (): Promise<string[]> => {
	return await getCurrentUserPermissions()
}
