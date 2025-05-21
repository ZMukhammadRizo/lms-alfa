import { toast } from 'react-toastify'
import { hasPermission } from './authUtils'
import { checkUserPermission } from './permissionUtils'

/**
 * Middleware utility to check permissions before making API calls
 *
 * @param requiredPermission The permission required for the action
 * @param callback The function to execute if permission is granted
 * @param errorCallback Optional function to execute if permission is denied
 * @returns The result of the callback if permission granted, otherwise undefined
 */
export const withPermissionCheck = async <T>(
	requiredPermission: string,
	callback: () => Promise<T>,
	errorCallback?: () => void
): Promise<T | undefined> => {
	// First try the fast synchronous check
	const quickCheck = hasPermission(requiredPermission)

	if (quickCheck) {
		try {
			return await callback()
		} catch (error) {
			console.error(`Error executing action with permission ${requiredPermission}:`, error)
			toast.error('An error occurred while performing this action.')
		}
	} else {
		// If quick check fails, try the more comprehensive async check
		const hasPermission = await checkUserPermission(requiredPermission)

		if (hasPermission) {
			try {
				return await callback()
			} catch (error) {
				console.error(`Error executing action with permission ${requiredPermission}:`, error)
				toast.error('An error occurred while performing this action.')
			}
		} else {
			toast.error(`You don't have permission to perform this action.`)
			if (errorCallback) {
				errorCallback()
			}
		}
	}

	return undefined
}

/**
 * Similar to withPermissionCheck but checks for any of the provided permissions
 *
 * @param requiredPermissions Array of permissions, any of which grants access
 * @param callback The function to execute if any permission is granted
 * @param errorCallback Optional function to execute if all permissions are denied
 * @returns The result of the callback if any permission granted, otherwise undefined
 */
export const withAnyPermissionCheck = async <T>(
	requiredPermissions: string[],
	callback: () => Promise<T>,
	errorCallback?: () => void
): Promise<T | undefined> => {
	// Check if user has any of the required permissions using the faster check first
	const hasAny = requiredPermissions.some(permission => hasPermission(permission))

	if (hasAny) {
		try {
			return await callback()
		} catch (error) {
			console.error(
				`Error executing action with permissions ${requiredPermissions.join(', ')}:`,
				error
			)
			toast.error('An error occurred while performing this action.')
		}
	} else {
		// If quick check fails, try the async check
		for (const permission of requiredPermissions) {
			const hasPermission = await checkUserPermission(permission)
			if (hasPermission) {
				try {
					return await callback()
				} catch (error) {
					console.error(`Error executing action with permission ${permission}:`, error)
					toast.error('An error occurred while performing this action.')
				}
				// If we found a permission that works, no need to check others
				break
			}
		}

		// If we get here, user doesn't have any of the required permissions
		toast.error(`You don't have permission to perform this action.`)
		if (errorCallback) {
			errorCallback()
		}
	}

	return undefined
}
