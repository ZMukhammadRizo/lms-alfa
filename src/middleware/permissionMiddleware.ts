import { NextFunction, Request, Response } from 'express'
import { getRolePermissionsWithInheritance, getUserRoleId } from '../utils/permissionUtils'

interface AuthenticatedRequest extends Request {
	user?: {
		id: string
		role?: string | { name: string }
	}
}

/**
 * Middleware to check if the requesting user has the required permission
 *
 * @param requiredPermission The permission to check for
 * @returns Express middleware function
 */
export const requirePermission = (requiredPermission: string) => {
	return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const user = req.user

			if (!user || !user.id) {
				return res.status(401).json({ error: 'Unauthorized - Not authenticated' })
			}

			// SuperAdmin bypass
			if (
				user.role === 'SuperAdmin' ||
				(typeof user.role === 'object' && user.role.name === 'SuperAdmin')
			) {
				return next()
			}

			// Get user's role ID
			const roleId = await getUserRoleId(user.id)
			if (!roleId) {
				return res.status(403).json({ error: 'Forbidden - No role assigned' })
			}

			// Get permissions including inherited ones
			const permissions = await getRolePermissionsWithInheritance(roleId)

			// Check if user has the required permission
			if (permissions.includes(requiredPermission)) {
				return next()
			}

			// Permission check failed
			return res.status(403).json({
				error: 'Forbidden - Insufficient permissions',
				required: requiredPermission,
			})
		} catch (error) {
			console.error('Error in permission middleware:', error)
			return res.status(500).json({ error: 'Internal server error' })
		}
	}
}

/**
 * Middleware to check if user has any of the specified permissions
 *
 * @param permissions Array of permissions (any one is sufficient)
 * @returns Express middleware function
 */
export const requireAnyPermission = (permissions: string[]) => {
	return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const user = req.user

			if (!user || !user.id) {
				return res.status(401).json({ error: 'Unauthorized - Not authenticated' })
			}

			// SuperAdmin bypass
			if (
				user.role === 'SuperAdmin' ||
				(typeof user.role === 'object' && user.role.name === 'SuperAdmin')
			) {
				return next()
			}

			// Get user's role ID
			const roleId = await getUserRoleId(user.id)
			if (!roleId) {
				return res.status(403).json({ error: 'Forbidden - No role assigned' })
			}

			// Get permissions including inherited ones
			const userPermissions = await getRolePermissionsWithInheritance(roleId)

			// Check if user has any of the required permissions
			if (permissions.some(perm => userPermissions.includes(perm))) {
				return next()
			}

			// Permission check failed
			return res.status(403).json({
				error: 'Forbidden - Insufficient permissions',
				required: `One of: ${permissions.join(', ')}`,
			})
		} catch (error) {
			console.error('Error in permission middleware:', error)
			return res.status(500).json({ error: 'Internal server error' })
		}
	}
}

/**
 * Middleware to check if user has all specified permissions
 *
 * @param permissions Array of permissions (all are required)
 * @returns Express middleware function
 */
export const requireAllPermissions = (permissions: string[]) => {
	return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const user = req.user

			if (!user || !user.id) {
				return res.status(401).json({ error: 'Unauthorized - Not authenticated' })
			}

			// SuperAdmin bypass
			if (
				user.role === 'SuperAdmin' ||
				(typeof user.role === 'object' && user.role.name === 'SuperAdmin')
			) {
				return next()
			}

			// Get user's role ID
			const roleId = await getUserRoleId(user.id)
			if (!roleId) {
				return res.status(403).json({ error: 'Forbidden - No role assigned' })
			}

			// Get permissions including inherited ones
			const userPermissions = await getRolePermissionsWithInheritance(roleId)

			// Check if user has all required permissions
			if (permissions.every(perm => userPermissions.includes(perm))) {
				return next()
			}

			// Permission check failed
			return res.status(403).json({
				error: 'Forbidden - Insufficient permissions',
				required: `All of: ${permissions.join(', ')}`,
			})
		} catch (error) {
			console.error('Error in permission middleware:', error)
			return res.status(500).json({ error: 'Internal server error' })
		}
	}
}
